import mongoose from "mongoose";
import Interview from "../../modules/interviews/interview.model.js";
import InterviewParticipant from "../../modules/interviews/interviewParticipant.model.js";
import InterviewEvent from "../../modules/interviews/interviewEvent.model.js";
import Candidate from "../../modules/candidates/candidate.model.js";
import Assessment from "../../modules/assessments/assessment.model.js";
import Organization from "../../modules/organizations/organization.model.js";
import User from "../../modules/users/user.model.js";
import { INTERVIEW_STATUSES, PARTICIPANT_ROLES, PARTICIPANT_STATUSES, INTERVIEW_EVENT_TYPES } from "../../modules/interviews/interview.constants.js";
import { logger } from "../../config/logger.js";

export const seedInterviews = async () => {
  logger.info("[Seeder] Seeding Live Technical & Panel Interviews into Database...");

  const org = await Organization.findOne({ slug: "stanford-engineering" }) || await Organization.findOne({});
  if (!org) {
    logger.warn("[Seeder] No organization found to attach interviews.");
    return;
  }



  // Find users & candidates
  const faculty = await User.findOne({ email: "professor@stanford.edu" }) || await User.findOne({ email: "dean@stanford.edu" }) || await User.findOne({});
  const candidates = await Candidate.find({ organizationId: org._id });
  const assessment = await Assessment.findOne({ organizationId: org._id });

  if (!candidates || candidates.length === 0) {
    logger.warn("[Seeder] No candidates found for seeding interviews.");
    return;
  }

  const sampleInterviews = [
    {
      title: "Flight Operations & Cockpit Readiness Oral Examination",
      description: "Comprehensive oral evaluation covering IFR procedures, emergency checklist drills, and CRM protocol.",
      type: "TECHNICAL",
      status: INTERVIEW_STATUSES.SCHEDULED,
      candidateEmail: "sarah.w@applicant.aero",
      scheduledStartAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // In 2 hours
      scheduledEndAt: new Date(Date.now() + 3 * 60 * 60 * 1000),
      settings: {
        maxParticipants: 4,
        waitingRoomEnabled: true,
        candidateCameraRequired: true,
        candidateMicrophoneRequired: true,
        screenSharingEnabled: true,
        recordingEnabled: true,
        chatEnabled: true,
      },
    },
    {
      title: "Senior Full-Stack & System Design Architecture Interview",
      description: "Distributed systems, caching layers, database indexing, and WebRTC streaming architecture technical defense.",
      type: "CODING",
      status: INTERVIEW_STATUSES.SCHEDULED,
      candidateEmail: "student@stanford.edu",
      scheduledStartAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      scheduledEndAt: new Date(Date.now() + 25 * 60 * 60 * 1000),
      settings: {
        maxParticipants: 3,
        waitingRoomEnabled: true,
        candidateCameraRequired: true,
        candidateMicrophoneRequired: true,
        screenSharingEnabled: true,
        recordingEnabled: true,
        chatEnabled: true,
      },
    },
    {
      title: "Data Structures & Algorithm Defense - CS Senior Cohort",
      description: "Live algorithm walkthrough and dynamic programming complexity analysis.",
      type: "TECHNICAL",
      status: INTERVIEW_STATUSES.COMPLETED,
      candidateEmail: "ahmed.khan@student.edu",
      scheduledStartAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      scheduledEndAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      settings: {
        recordingEnabled: true,
      },
    },
    {
      title: "Clinical Diagnostics Case Study & Patient Management Panel",
      description: "Differential diagnosis defense and pharmacology dosage assessment.",
      type: "PANEL",
      status: INTERVIEW_STATUSES.SCHEDULED,
      candidateEmail: "maria.j@techcorp.pk",
      scheduledStartAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // In 2 days
      scheduledEndAt: new Date(Date.now() + 49 * 60 * 60 * 1000),
      settings: {
        maxParticipants: 5,
        waitingRoomEnabled: true,
        recordingEnabled: true,
      },
    },
  ];

  for (const item of sampleInterviews) {
    let cand = candidates.find(c => c.email === item.candidateEmail) || candidates[0];

    let interview = await Interview.findOne({
      organizationId: org._id,
      title: item.title,
    });

    if (!interview) {
      interview = await Interview.create({
        organizationId: org._id,
        title: item.title,
        description: item.description,
        type: item.type,
        status: item.status,
        scheduledStartAt: item.scheduledStartAt,
        scheduledEndAt: item.scheduledEndAt,
        createdBy: faculty._id,
        assessmentId: assessment?._id || null,
        candidateId: cand._id,
        settings: item.settings,
      });
      logger.info(`[Seeder] Created interview: '${interview.title}' for candidate '${cand.firstName} ${cand.lastName}'`);
    } else {
      interview.createdBy = faculty._id;
      interview.candidateId = cand._id;
      interview.status = item.status;
      interview.scheduledStartAt = item.scheduledStartAt;
      interview.scheduledEndAt = item.scheduledEndAt;
      await interview.save();
    }

    // Register Candidate as Participant
    if (cand.userId) {
      await InterviewParticipant.findOneAndUpdate(
        { interviewId: interview._id, userId: cand.userId },
        {
          interviewId: interview._id,
          userId: cand.userId,
          organizationId: org._id,
          role: PARTICIPANT_ROLES.CANDIDATE,
          status: item.status === INTERVIEW_STATUSES.COMPLETED ? PARTICIPANT_STATUSES.JOINED : PARTICIPANT_STATUSES.INVITED,
        },
        { upsert: true }
      );
    }

    // Register Interviewer
    await InterviewParticipant.findOneAndUpdate(
      { interviewId: interview._id, userId: faculty._id },
      {
        interviewId: interview._id,
        userId: faculty._id,
        organizationId: org._id,
        role: PARTICIPANT_ROLES.INTERVIEWER,
        status: item.status === INTERVIEW_STATUSES.COMPLETED ? PARTICIPANT_STATUSES.JOINED : PARTICIPANT_STATUSES.INVITED,
      },
      { upsert: true }
    );
  }

  logger.info("[Seeder] Live interviews seeded successfully!");
};
