import mongoose from "mongoose";
import Assessment from "../../modules/assessments/assessment.model.js";
import Organization from "../../modules/organizations/organization.model.js";
import User from "../../modules/users/user.model.js";
import QuestionBank from "../../modules/questionBank/questionBank.model.js";
import Question from "../../modules/questionBank/question.model.js";
import { ASSESSMENT_TYPES } from "../../constants/assessmentTypes.js";
import { ASSESSMENT_STATUSES } from "../../constants/assessmentStatuses.js";
import { logger } from "../../config/logger.js";

export const seedAssessmentsAndQuestions = async () => {
  logger.info("[Seeder] Seeding Assessments and Question Bank items...");

  const org = await Organization.findOne({ slug: "stanford-engineering" });
  if (!org) {
    logger.warn("[Seeder] Stanford Engineering organization not found, skipping assessment seeding.");
    return;
  }

  const creator = await User.findOne({ email: "dean@stanford.edu" }) || await User.findOne();
  if (!creator) {
    logger.warn("[Seeder] Creator user not found, skipping assessment seeding.");
    return;
  }

  // 1. Create or fetch default QuestionBank
  let qb = await QuestionBank.findOne({ organizationId: org._id, code: "CS-MAIN-QB" });
  if (!qb) {
    qb = await QuestionBank.create({
      organizationId: org._id,
      name: "Computer Science Core Item Bank",
      code: "CS-MAIN-QB",
      description: "Standardized questions covering algorithms, data structures, databases, and software engineering.",
      ownerId: creator._id,
      status: "ACTIVE",
      visibility: "ORGANIZATION",
    });
    logger.info(`[Seeder] Created Question Bank: ${qb.name}`);
  }

  // 2. Seed Questions into Question Bank
  const questionsData = [
    {
      organizationId: org._id,
      questionBankId: qb._id,
      prompt: "What is the time complexity of binary search on a sorted array of n elements?",
      title: "Binary Search Complexity",
      type: "SINGLE_CHOICE",
      difficulty: "EASY",
      points: 2,
      options: [
        { id: "opt_1", text: "O(n)", isCorrect: false },
        { id: "opt_2", text: "O(log n)", isCorrect: true },
        { id: "opt_3", text: "O(n log n)", isCorrect: false },
        { id: "opt_4", text: "O(1)", isCorrect: false },
      ],
      explanation: "Binary search halves the search interval at each step, yielding logarithmic O(log n) time.",
      createdBy: creator._id,
    },
    {
      organizationId: org._id,
      questionBankId: qb._id,
      prompt: "Which data structure operates on a Last-In, First-Out (LIFO) basis?",
      title: "LIFO Data Structure",
      type: "SINGLE_CHOICE",
      difficulty: "EASY",
      points: 1,
      options: [
        { id: "opt_1", text: "Queue", isCorrect: false },
        { id: "opt_2", text: "Stack", isCorrect: true },
        { id: "opt_3", text: "Linked List", isCorrect: false },
        { id: "opt_4", text: "Tree", isCorrect: false },
      ],
      explanation: "A stack pushes and pops elements from the top, adhering to LIFO semantics.",
      createdBy: creator._id,
    },
    {
      organizationId: org._id,
      questionBankId: qb._id,
      prompt: "What does the ACID acronym guarantee in relational database management systems?",
      title: "ACID Database Properties",
      type: "SINGLE_CHOICE",
      difficulty: "MEDIUM",
      points: 2,
      options: [
        { id: "opt_1", text: "Atomic, Consistent, Isolated, Durable", isCorrect: true },
        { id: "opt_2", text: "Accurate, Correct, Isolated, Direct", isCorrect: false },
        { id: "opt_3", text: "Atomic, Correct, Indexed, Durable", isCorrect: false },
        { id: "opt_4", text: "Automated, Consistent, Isolated, Dynamic", isCorrect: false },
      ],
      explanation: "ACID properties ensure reliable processing of database transactions.",
      createdBy: creator._id,
    },
    {
      organizationId: org._id,
      questionBankId: qb._id,
      prompt: "Which sorting algorithm possesses the optimal average-case time complexity of O(n log n)?",
      title: "Sorting Algorithm Performance",
      type: "SINGLE_CHOICE",
      difficulty: "MEDIUM",
      points: 2,
      options: [
        { id: "opt_1", text: "Bubble Sort", isCorrect: false },
        { id: "opt_2", text: "Selection Sort", isCorrect: false },
        { id: "opt_3", text: "Quick Sort", isCorrect: true },
        { id: "opt_4", text: "Insertion Sort", isCorrect: false },
      ],
      explanation: "Quick sort and merge sort execute in O(n log n) average time.",
      createdBy: creator._id,
    },
  ];

  for (const q of questionsData) {
    const existing = await Question.findOne({ organizationId: org._id, prompt: q.prompt });
    if (!existing) {
      await Question.create(q);
    }
  }

  // 3. Seed Assessments
  const assessmentsData = [
    {
      organizationId: org._id,
      title: "University Admission Examination",
      code: "CS-ADM-2026",
      description: "Standardized undergraduate evaluation covering data structures, logical reasoning, and systems design.",
      type: ASSESSMENT_TYPES.MCQ,
      status: ASSESSMENT_STATUSES.PUBLISHED,
      durationSeconds: 5400,
      totalPoints: 100,
      passingScore: 60,
      createdBy: creator._id,
    },
    {
      organizationId: org._id,
      title: "Full-Stack Software Engineering Screening",
      code: "SWE-SCREEN-2026",
      description: "Comprehensive technical aptitude exam for intermediate and senior engineering candidates.",
      type: ASSESSMENT_TYPES.MCQ,
      status: ASSESSMENT_STATUSES.PUBLISHED,
      durationSeconds: 3600,
      totalPoints: 80,
      passingScore: 70,
      createdBy: creator._id,
    },
    {
      organizationId: org._id,
      title: "Clinical Knowledge & Aviation Safety Diagnostics",
      code: "AV-CLIN-2026",
      description: "Rigorous competency assessment testing situational decisions and protocol compliance.",
      type: ASSESSMENT_TYPES.MCQ,
      status: ASSESSMENT_STATUSES.PUBLISHED,
      durationSeconds: 7200,
      totalPoints: 120,
      passingScore: 75,
      createdBy: creator._id,
    },
  ];

  for (const a of assessmentsData) {
    const existing = await Assessment.findOne({ organizationId: org._id, code: a.code });
    if (!existing) {
      await Assessment.create(a);
      logger.info(`[Seeder] Created assessment: ${a.title} (${a.code})`);
    }
  }

  logger.info("[Seeder] Assessments and Question Bank seeded successfully.");
};
