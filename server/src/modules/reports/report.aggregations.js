import mongoose from "mongoose";
import Assessment from "../assessments/assessment.model.js";
import AssessmentAssignment from "../assessmentAssignments/assessmentAssignment.model.js";
import Attempt from "../attempts/attempt.model.js";
import AttemptQuestion from "../attemptQuestions/attemptQuestion.model.js";
import Result from "../results/result.model.js";
import Evaluation from "../evaluations/evaluation.model.js";
import Candidate from "../candidates/candidate.model.js";
import User from "../users/user.model.js";
import Organization from "../organizations/organization.model.js";
import ProctoringSession from "../proctoring/proctoringSession.model.js";
import ProctoringEvent from "../proctoring/proctoringEvent.model.js";

const toObjectId = (id) => (mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);
const safeFixed = (num, digits = 2) =>
  num !== null && num !== undefined && !isNaN(num) ? Number(Number(num).toFixed(digits)) : 0;

export class ReportAggregations {
  /**
   * 1. Assessment Statistics Aggregation
   */
  static async getAssessmentStatistics(organizationId, assessmentId, filters = {}) {
    const orgId = toObjectId(organizationId);
    const assId = toObjectId(assessmentId);

    const [assessment, assignmentsCount, attemptStats, resultStats] = await Promise.all([
      Assessment.findOne({ _id: assId, organizationId: orgId }).lean(),
      AssessmentAssignment.countDocuments({ assessmentId: assId, organizationId: orgId }),
      Attempt.aggregate([
        { $match: { assessmentId: assId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalStarted: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "EVALUATED"]] }, 1, 0] },
            },
            submitted: {
              $sum: { $cond: [{ $eq: ["$status", "SUBMITTED"] }, 1, 0] },
            },
            expired: {
              $sum: { $cond: [{ $eq: ["$status", "EXPIRED"] }, 1, 0] },
            },
            avgDurationSeconds: {
              $avg: {
                $cond: [
                  { $and: ["$submittedAt", "$startedAt"] },
                  { $divide: [{ $subtract: ["$submittedAt", "$startedAt"] }, 1000] },
                  null,
                ],
              },
            },
          },
        },
      ]),
      Result.aggregate([
        { $match: { assessmentId: assId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            avgScore: { $avg: "$earnedPoints" },
            avgPercentage: { $avg: "$percentage" },
            highestScore: { $max: "$earnedPoints" },
            lowestScore: { $min: "$earnedPoints" },
            passedCount: { $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const att = attemptStats[0] || {
      totalStarted: 0,
      completed: 0,
      submitted: 0,
      expired: 0,
      avgDurationSeconds: 0,
    };
    const res = resultStats[0] || {
      totalResults: 0,
      avgScore: 0,
      avgPercentage: 0,
      highestScore: 0,
      lowestScore: 0,
      passedCount: 0,
    };

    const completionRate = att.totalStarted > 0 ? (att.completed / att.totalStarted) * 100 : 0;
    const passRate = res.totalResults > 0 ? (res.passedCount / res.totalResults) * 100 : 0;

    return {
      assessment: assessment ? { id: assessment._id, title: assessment.title, code: assessment.code } : null,
      totalAssignments: assignmentsCount,
      totalStarted: att.totalStarted,
      completedAttempts: att.completed,
      submittedAttempts: att.submitted,
      expiredAttempts: att.expired,
      averageScore: safeFixed(res.avgScore),
      averagePercentage: safeFixed(res.avgPercentage),
      highestScore: res.highestScore ?? 0,
      lowestScore: res.lowestScore ?? 0,
      passRate: safeFixed(passRate),
      completionRate: safeFixed(completionRate),
      averageDurationSeconds: Math.round(att.avgDurationSeconds || 0),
    };
  }

  /**
   * 2. Candidate Statistics Aggregation
   */
  static async getCandidateStatistics(organizationId, candidateId, filters = {}) {
    const orgId = toObjectId(organizationId);
    const candId = toObjectId(candidateId);

    const [candidate, assignmentsCount, attemptStats, resultStats, proctoringStats] = await Promise.all([
      Candidate.findOne({ _id: candId, organizationId: orgId }).lean(),
      AssessmentAssignment.countDocuments({ candidateId: candId, organizationId: orgId }),
      Attempt.aggregate([
        { $match: { candidateId: candId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "EVALUATED"]] }, 1, 0] },
            },
            avgDuration: {
              $avg: {
                $cond: [
                  { $and: ["$submittedAt", "$startedAt"] },
                  { $divide: [{ $subtract: ["$submittedAt", "$startedAt"] }, 1000] },
                  null,
                ],
              },
            },
          },
        },
      ]),
      Result.aggregate([
        { $match: { candidateId: candId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            avgScore: { $avg: "$earnedPoints" },
            avgPercentage: { $avg: "$percentage" },
            highestScore: { $max: "$earnedPoints" },
            lowestScore: { $min: "$earnedPoints" },
            passedCount: { $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] } },
          },
        },
      ]),
      ProctoringSession.aggregate([
        { $match: { candidateId: candId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalViolations: { $sum: "$violationCount" },
            avgRiskScore: { $avg: "$riskScore" },
          },
        },
      ]),
    ]);

    const att = attemptStats[0] || { totalAttempts: 0, completed: 0, avgDuration: 0 };
    const res = resultStats[0] || { totalResults: 0, avgScore: 0, avgPercentage: 0, highestScore: 0, lowestScore: 0, passedCount: 0 };
    const proc = proctoringStats[0] || { totalViolations: 0, avgRiskScore: 0 };

    const passRate = res.totalResults > 0 ? (res.passedCount / res.totalResults) * 100 : 0;

    return {
      candidate: candidate ? { id: candidate._id, name: `${candidate.firstName} ${candidate.lastName}`, email: candidate.email, code: candidate.candidateCode } : null,
      assessmentsAssigned: assignmentsCount,
      attemptsStarted: att.totalAttempts,
      attemptsCompleted: att.completed,
      averageScore: safeFixed(res.avgScore),
      averagePercentage: safeFixed(res.avgPercentage),
      highestScore: res.highestScore ?? 0,
      lowestScore: res.lowestScore ?? 0,
      passedCount: res.passedCount,
      failedCount: res.totalResults - res.passedCount,
      passRate: safeFixed(passRate),
      averageDurationSeconds: Math.round(att.avgDuration || 0),
      totalProctoringViolations: proc.totalViolations,
      averageRiskScore: safeFixed(proc.avgRiskScore),
    };
  }

  /**
   * 3. Attempt Statistics Aggregation
   */
  static async getAttemptStatistics(organizationId, attemptId) {
    const orgId = toObjectId(organizationId);
    const attId = toObjectId(attemptId);

    const [attempt, result, proctoringSession, questions] = await Promise.all([
      Attempt.findOne({ _id: attId, organizationId: orgId }).populate("assessmentId", "title code type passingScore").populate("candidateId", "firstName lastName email candidateCode").lean(),
      Result.findOne({ attemptId: attId, organizationId: orgId }).lean(),
      ProctoringSession.findOne({ attemptId: attId, organizationId: orgId }).lean(),
      AttemptQuestion.find({ attemptId: attId, organizationId: orgId }).lean(),
    ]);

    return {
      attempt: attempt ? {
        id: attempt._id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        durationSeconds: attempt.startedAt && attempt.submittedAt ? Math.round((new Date(attempt.submittedAt) - new Date(attempt.startedAt)) / 1000) : 0,
        assessment: attempt.assessmentId,
        candidate: attempt.candidateId,
      } : null,
      result: result ? {
        totalScore: result.totalScore,
        percentage: result.percentage,
        grade: result.grade,
        passed: result.passed,
        published: result.published,
      } : null,
      proctoring: proctoringSession ? {
        riskScore: proctoringSession.riskScore,
        riskLevel: proctoringSession.riskLevel,
        violationCount: proctoringSession.violationCount,
      } : null,
      totalQuestions: questions.length,
      answeredQuestions: questions.filter((q) => q.isAnswered).length,
    };
  }

  /**
   * 4. Proctoring Analytics Aggregation
   */
  static async getProctoringStatistics(organizationId, filters = {}) {
    const orgId = toObjectId(organizationId);

    const [sessionStats, eventStats] = await Promise.all([
      ProctoringSession.aggregate([
        { $match: { organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            lowRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "LOW"] }, 1, 0] } },
            mediumRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "MEDIUM"] }, 1, 0] } },
            highRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } },
            criticalRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "CRITICAL"] }, 1, 0] } },
            totalViolations: { $sum: "$violationCount" },
            avgRiskScore: { $avg: "$riskScore" },
          },
        },
      ]),
      ProctoringEvent.aggregate([
        { $match: { organizationId: orgId } },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const sess = sessionStats[0] || {
      totalSessions: 0,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      criticalRisk: 0,
      totalViolations: 0,
      avgRiskScore: 0,
    };

    const eventBreakdown = {};
    for (const ev of eventStats) {
      eventBreakdown[ev._id] = ev.count;
    }

    return {
      totalProctoredAttempts: sess.totalSessions,
      lowRiskAttempts: sess.lowRisk,
      mediumRiskAttempts: sess.mediumRisk,
      highRiskAttempts: sess.highRisk,
      criticalRiskAttempts: sess.criticalRisk,
      totalViolations: sess.totalViolations,
      averageRiskScore: safeFixed(sess.avgRiskScore),
      eventsByType: eventBreakdown,
    };
  }

  /**
   * 5. Question Analytics Aggregation
   */
  static async getQuestionStatistics(organizationId, questionId, filters = {}) {
    const orgId = toObjectId(organizationId);
    const qId = toObjectId(questionId);

    const stats = await AttemptQuestion.aggregate([
      { $match: { questionId: qId, organizationId: orgId } },
      {
        $group: {
          _id: null,
          totalAttempts: { $sum: 1 },
          answered: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "ANSWERED"] },
                    { $eq: ["$isAnswered", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          skipped: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$status", "ANSWERED"] },
                    { $eq: ["$isAnswered", true] },
                  ],
                },
                0,
                1,
              ],
            },
          },
          earnedPoints: {
            $avg: {
              $ifNull: ["$metadata.earnedPoints", { $ifNull: ["$earnedPoints", "$points"] }],
            },
          },
          isCorrectCount: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $eq: ["$metadata.isCorrect", true] },
                    { $eq: ["$isCorrect", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const st = stats[0] || {
      totalAttempts: 0,
      answered: 0,
      skipped: 0,
      earnedPoints: 0,
      isCorrectCount: 0,
    };

    const successRate = st.totalAttempts > 0 ? (st.isCorrectCount / st.totalAttempts) * 100 : 0;
    let difficultyRating = "MEDIUM";
    if (successRate > 80) difficultyRating = "EASY";
    else if (successRate < 40) difficultyRating = "HARD";

    return {
      questionId,
      totalAttempts: st.totalAttempts,
      answered: st.answered,
      skipped: st.skipped,
      correctCount: st.isCorrectCount,
      incorrectCount: st.totalAttempts - st.isCorrectCount - st.skipped,
      successRate: safeFixed(successRate),
      averageScore: safeFixed(st.earnedPoints),
      difficultyRating,
    };
  }

  /**
   * 6. Organization Dashboard Metrics
   */
  static async getOrganizationStatistics(organizationId, filters = {}) {
    const orgId = toObjectId(organizationId);

    const [assessmentsCount, candidatesCount, attemptStats, resultStats, proctoringCount, pendingEvalCount] = await Promise.all([
      Assessment.countDocuments({ organizationId: orgId }),
      Candidate.countDocuments({ organizationId: orgId, status: "ACTIVE" }),
      Attempt.aggregate([
        { $match: { organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            completedAttempts: { $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "EVALUATED"]] }, 1, 0] } },
          },
        },
      ]),
      Result.aggregate([
        { $match: { organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            avgScore: { $avg: "$percentage" },
            passedCount: { $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] } },
          },
        },
      ]),
      ProctoringSession.countDocuments({ organizationId: orgId }),
      Evaluation.countDocuments({ organizationId: orgId, status: "PENDING" }),
    ]);

    const att = attemptStats[0] || { totalAttempts: 0, completedAttempts: 0 };
    const res = resultStats[0] || { totalResults: 0, avgScore: 0, passedCount: 0 };
    const passRate = res.totalResults > 0 ? (res.passedCount / res.totalResults) * 100 : 0;

    return {
      totalAssessments: assessmentsCount,
      candidates: candidatesCount,
      attempts: att.totalAttempts,
      completedAttempts: att.completedAttempts,
      averageScore: safeFixed(res.avgScore),
      passRate: safeFixed(passRate),
      proctoredExams: proctoringCount,
      pendingEvaluations: pendingEvalCount,
    };
  }

  /**
   * 7. Platform Owner Dashboard Metrics
   */
  static async getPlatformStatistics() {
    const [orgsCount, activeOrgsCount, usersCount, candidatesCount, assessmentsCount, attemptStats, resultStats] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: "ACTIVE" }),
      User.countDocuments(),
      Candidate.countDocuments(),
      Assessment.countDocuments(),
      Attempt.aggregate([
        {
          $group: {
            _id: null,
            totalAttempts: { $sum: 1 },
            completedAttempts: { $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "EVALUATED"]] }, 1, 0] } },
          },
        },
      ]),
      Result.aggregate([
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            passedCount: { $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const att = attemptStats[0] || { totalAttempts: 0, completedAttempts: 0 };
    const res = resultStats[0] || { totalResults: 0, passedCount: 0 };
    const platformPassRate = res.totalResults > 0 ? (res.passedCount / res.totalResults) * 100 : 0;

    return {
      totalOrganizations: orgsCount,
      activeOrganizations: activeOrgsCount,
      totalUsers: usersCount,
      totalCandidates: candidatesCount,
      totalAssessments: assessmentsCount,
      totalAttempts: att.totalAttempts,
      completedAttempts: att.completedAttempts,
      platformPassRate: safeFixed(platformPassRate),
    };
  }

  /**
   * 8. Assessment Summary (Step 32)
   */
  static async getAssessmentSummary(organizationId, assessmentId, filters = {}) {
    const orgId = toObjectId(organizationId);
    const assId = toObjectId(assessmentId);

    const [assessment, assignmentsCount, attemptStats, resultStats, pendingEvalCount] = await Promise.all([
      Assessment.findOne({ _id: assId, organizationId: orgId }).lean(),
      AssessmentAssignment.countDocuments({ assessmentId: assId, organizationId: orgId }),
      Attempt.aggregate([
        { $match: { assessmentId: assId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalStarted: { $sum: 1 },
            submitted: { $sum: { $cond: [{ $in: ["$status", ["SUBMITTED", "AUTO_SUBMITTED", "COMPLETED", "EVALUATED"]] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $in: ["$status", ["COMPLETED", "EVALUATED"]] }, 1, 0] } },
            avgDurationSeconds: {
              $avg: {
                $cond: [
                  { $and: ["$submittedAt", "$startedAt"] },
                  { $divide: [{ $subtract: ["$submittedAt", "$startedAt"] }, 1000] },
                  null,
                ],
              },
            },
          },
        },
      ]),
      Result.aggregate([
        { $match: { assessmentId: assId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            avgScore: { $avg: "$percentage" },
            highestScore: { $max: "$percentage" },
            lowestScore: { $min: "$percentage" },
            passedCount: { $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] } },
            failedCount: { $sum: { $cond: [{ $eq: ["$passed", false] }, 1, 0] } },
          },
        },
      ]),
      Evaluation.countDocuments({ assessmentId: assId, organizationId: orgId, status: "PENDING" }),
    ]);

    const att = attemptStats[0] || { totalStarted: 0, submitted: 0, completed: 0, avgDurationSeconds: 0 };
    const res = resultStats[0] || { totalResults: 0, avgScore: 0, highestScore: 0, lowestScore: 0, passedCount: 0, failedCount: 0 };
    const passRate = res.totalResults > 0 ? (res.passedCount / res.totalResults) * 100 : 0;

    return {
      assessment: assessment ? { id: assessment._id, title: assessment.title, code: assessment.code } : null,
      totalCandidates: assignmentsCount,
      assigned: assignmentsCount,
      started: att.totalStarted,
      submitted: att.submitted,
      completed: att.completed,
      passed: res.passedCount,
      failed: res.failedCount,
      pendingEvaluation: pendingEvalCount,
      passRate: safeFixed(passRate),
      averageScore: safeFixed(res.avgScore),
      highestScore: res.highestScore ?? 0,
      lowestScore: res.lowestScore ?? 0,
      averageCompletionTime: Math.round(att.avgDurationSeconds || 0),
    };
  }

  /**
   * 9. Assessment Question Analytics Breakdown (Step 32)
   */
  static async getAssessmentQuestionBreakdown(organizationId, assessmentId) {
    const orgId = toObjectId(organizationId);
    const assId = toObjectId(assessmentId);

    const attempts = await Attempt.find({ assessmentId: assId, organizationId: orgId }).select("_id");
    const attemptIds = attempts.map((a) => a._id);

    const questions = await AttemptQuestion.aggregate([
      {
        $match: {
          $or: [
            { assessmentId: assId, organizationId: orgId },
            { attemptId: { $in: attemptIds }, organizationId: orgId },
          ],
        },
      },
      {
        $group: {
          _id: "$questionId",
          totalAttempts: { $sum: 1 },
          correctCount: { $sum: { $cond: [{ $or: [{ $eq: ["$isCorrect", true] }, { $eq: ["$metadata.isCorrect", true] }] }, 1, 0] } },
          skippedCount: { $sum: { $cond: [{ $and: [{ $ne: ["$isAnswered", true] }, { $ne: ["$metadata.isAnswered", true] }] }, 1, 0] } },
          avgMarks: { $avg: { $ifNull: ["$metadata.earnedPoints", "$earnedPoints"] } },
        },
      },
    ]);

    let totalEasy = 0, easyCount = 0;
    let totalMed = 0, medCount = 0;
    let totalHard = 0, hardCount = 0;

    const questionsAnalytics = questions.map((q) => {
      const incorrectCount = Math.max(0, q.totalAttempts - q.correctCount - q.skippedCount);
      const accuracy = q.totalAttempts > 0 ? (q.correctCount / q.totalAttempts) * 100 : 0;

      let difficulty = "MEDIUM";
      if (accuracy >= 80) {
        difficulty = "EASY";
        totalEasy += accuracy;
        easyCount++;
      } else if (accuracy < 50) {
        difficulty = "HARD";
        totalHard += accuracy;
        hardCount++;
      } else {
        totalMed += accuracy;
        medCount++;
      }

      return {
        questionId: q._id,
        attempts: q.totalAttempts,
        correct: q.correctCount,
        incorrect: incorrectCount,
        skipped: q.skippedCount,
        accuracy: safeFixed(accuracy),
        averageMarks: safeFixed(q.avgMarks),
        difficulty,
      };
    });

    return {
      assessmentId,
      totalQuestions: questionsAnalytics.length,
      questions: questionsAnalytics,
      difficultySummary: {
        easyAverage: easyCount > 0 ? safeFixed(totalEasy / easyCount) : 0,
        mediumAverage: medCount > 0 ? safeFixed(totalMed / medCount) : 0,
        hardAverage: hardCount > 0 ? safeFixed(totalHard / hardCount) : 0,
      },
    };
  }

  /**
   * 10. Assessment Result Analytics & Score Distribution (Step 32)
   */
  static async getAssessmentResultStats(organizationId, assessmentId) {
    const orgId = toObjectId(organizationId);
    const assId = toObjectId(assessmentId);

    const [stats, distribution] = await Promise.all([
      Result.aggregate([
        { $match: { assessmentId: assId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalResults: { $sum: 1 },
            passed: { $sum: { $cond: [{ $eq: ["$passed", true] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ["$passed", false] }, 1, 0] } },
            average: { $avg: "$percentage" },
            highest: { $max: "$percentage" },
            lowest: { $min: "$percentage" },
          },
        },
      ]),
      Result.aggregate([
        { $match: { assessmentId: assId, organizationId: orgId } },
        {
          $bucket: {
            groupBy: "$percentage",
            boundaries: [0, 60, 70, 80, 90, 101],
            default: "other",
            output: { count: { $sum: 1 } },
          },
        },
      ]),
    ]);

    const st = stats[0] || { totalResults: 0, passed: 0, failed: 0, average: 0, highest: 0, lowest: 0 };
    const passRate = st.totalResults > 0 ? (st.passed / st.totalResults) * 100 : 0;

    const scoreDistribution = {
      "90-100": 0,
      "80-89": 0,
      "70-79": 0,
      "60-69": 0,
      "<60": 0,
    };

    for (const b of distribution) {
      if (b._id === 90) scoreDistribution["90-100"] = b.count;
      else if (b._id === 80) scoreDistribution["80-89"] = b.count;
      else if (b._id === 70) scoreDistribution["70-79"] = b.count;
      else if (b._id === 60) scoreDistribution["60-69"] = b.count;
      else if (b._id === 0) scoreDistribution["<60"] = b.count;
    }

    return {
      assessmentId,
      totalResults: st.totalResults,
      passed: st.passed,
      failed: st.failed,
      passRate: safeFixed(passRate),
      average: safeFixed(st.average),
      highest: st.highest ?? 0,
      lowest: st.lowest ?? 0,
      scoreDistribution,
    };
  }

  /**
   * 11. Assessment Proctoring Analytics (Step 32)
   */
  static async getAssessmentProctoringStats(organizationId, assessmentId) {
    const orgId = toObjectId(organizationId);
    const assId = toObjectId(assessmentId);

    const sessions = await ProctoringSession.find({ assessmentId: assId, organizationId: orgId }).select("_id");
    const sessionIds = sessions.map((s) => s._id);

    const [sessionStats, warningsCount] = await Promise.all([
      ProctoringSession.aggregate([
        { $match: { assessmentId: assId, organizationId: orgId } },
        {
          $group: {
            _id: null,
            totalProctored: { $sum: 1 },
            lowRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "LOW"] }, 1, 0] } },
            mediumRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "MEDIUM"] }, 1, 0] } },
            highRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "HIGH"] }, 1, 0] } },
            criticalRisk: { $sum: { $cond: [{ $eq: ["$riskLevel", "CRITICAL"] }, 1, 0] } },
            totalViolations: { $sum: "$violationCount" },
            confirmedViolations: { $sum: { $cond: [{ $eq: ["$integrityStatus", "CONFIRMED_VIOLATION"] }, 1, 0] } },
            terminations: { $sum: { $cond: [{ $eq: ["$status", "TERMINATED"] }, 1, 0] } },
          },
        },
      ]),
      ProctoringEvent.countDocuments({
        proctoringSessionId: { $in: sessionIds },
        organizationId: orgId,
        type: "PROCTOR_WARNING",
      }),
    ]);

    const sess = sessionStats[0] || {
      totalProctored: 0,
      lowRisk: 0,
      mediumRisk: 0,
      highRisk: 0,
      criticalRisk: 0,
      totalViolations: 0,
      confirmedViolations: 0,
      terminations: 0,
    };

    return {
      assessmentId,
      totalProctoredAttempts: sess.totalProctored,
      lowRisk: sess.lowRisk,
      mediumRisk: sess.mediumRisk,
      highRisk: sess.highRisk,
      criticalRisk: sess.criticalRisk,
      totalViolations: sess.totalViolations,
      confirmedViolations: sess.confirmedViolations,
      warnings: warningsCount,
      terminations: sess.terminations,
    };
  }
}
