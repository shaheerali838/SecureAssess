import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import { connectDatabase, disconnectDatabase } from "../../config/db.js";
import { seedRBAC } from "./rbac.seeder.js";
import User from "../../modules/users/user.model.js";
import Organization from "../../modules/organizations/organization.model.js";
import UserMembership from "../../modules/users/userMembership.model.js";
import Role from "../../modules/roles/role.model.js";
import Plan from "../../modules/subscriptions/plan.model.js";
import Subscription from "../../modules/subscriptions/subscription.model.js";
import Assessment from "../../modules/assessments/assessment.model.js";
import Question from "../../modules/questionBank/question.model.js";
import QuestionBank from "../../modules/questionBank/questionBank.model.js";
import QuestionCategory from "../../modules/questionCategories/questionCategory.model.js";
import QuestionTag from "../../modules/questionTags/questionTag.model.js";
import Attempt from "../../modules/attempts/attempt.model.js";
import Evaluation from "../../modules/evaluations/evaluation.model.js";
import Result from "../../modules/results/result.model.js";
import Certificate from "../../modules/certificates/certificate.model.js";
import AuditLog from "../../modules/auditLogs/auditLog.model.js";
import Interview from "../../modules/interviews/interview.model.js";
import Notification from "../../modules/notifications/notification.model.js";
import Candidate from "../../modules/candidates/candidate.model.js";
import CandidateGroup from "../../modules/candidateGroups/candidateGroup.model.js";
import Department from "../../modules/departments/department.model.js";
import Program from "../../modules/programs/program.model.js";
import Subject from "../../modules/subjects/subject.model.js";
import { DEFAULT_PLANS } from "../../modules/subscriptions/subscription.constants.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES, ROLE_SCOPES } from "../../constants/roles.js";
import { hashPassword } from "../../utils/password.js";
import { logger } from "../../config/logger.js";

export const resetAndSeedCleanUsers = async () => {
  try {
    logger.info("[ResetSeeder] Connecting to database...");
    await connectDatabase();

    // 1. Wipe all disk storage artifacts and evidence
    try {
      const storageDir = path.resolve(process.cwd(), "storage");
      if (fs.existsSync(storageDir)) {
        fs.rmSync(storageDir, { recursive: true, force: true });
        fs.mkdirSync(path.join(storageDir, "private"), { recursive: true });
        logger.info("[ResetSeeder] Storage artifacts & evidence files purged on disk.");
      }
    } catch (fsErr) {
      logger.warn(`[ResetSeeder] Disk cleanup note: ${fsErr.message}`);
    }

    // 2. Wipe every collection directly in MongoDB
    logger.info("[ResetSeeder] Emptying all database collections...");
    const allModels = [
      Assessment, Question, QuestionBank, QuestionCategory, QuestionTag,
      Attempt, Evaluation, Result, Certificate,
      AuditLog, Interview, Notification, Candidate, CandidateGroup,
      Department, Program, Subject, UserMembership, Subscription,
      Organization, User
    ];

    for (const model of allModels) {
      try {
        await model.deleteMany({});
        logger.info(`[ResetSeeder] Cleared model collection: ${model.modelName}`);
      } catch (mErr) {
        logger.warn(`[ResetSeeder] Model clear note: ${mErr.message}`);
      }
    }

    // Also purge any remaining raw collections
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        await collections[key].deleteMany({});
      } catch (colErr) {
        // ignore
      }
    }

    // 3. Synchronize full RBAC permissions and system roles
    logger.info("[ResetSeeder] Seeding clean RBAC catalog...");
    await seedRBAC();

    // 4. Seed SaaS Subscription Plans
    logger.info("[ResetSeeder] Seeding Default SaaS Plans...");
    const plansList = Object.values(DEFAULT_PLANS);
    for (const planData of plansList) {
      await Plan.create({
        ...planData,
        status: "ACTIVE",
      });
    }

    // 5. Create Platform Owner (Root Administrator)
    logger.info("[ResetSeeder] Creating Platform Owner Accounts...");
    const defaultPassword = "Password123!";
    const passwordHash = await hashPassword(defaultPassword);

    const platformOwner = await User.create({
      firstName: "Shaheer",
      lastName: "Ali",
      email: "shaheer838838@gmail.com",
      passwordHash,
      platformRole: PLATFORM_ROLES.PLATFORM_OWNER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: "ACTIVE",
    });

    await User.create({
      firstName: "Platform",
      lastName: "Owner",
      email: "owner@secureassess.io",
      passwordHash,
      platformRole: PLATFORM_ROLES.PLATFORM_OWNER,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      status: "ACTIVE",
    });

    // 6. Create 1 Main Demo Tenant Organization
    logger.info("[ResetSeeder] Creating Tenant Organization: Alpha Polytechnic Institute...");
    const demoOrg = await Organization.create({
      name: "Alpha Polytechnic Institute",
      slug: "alpha-polytechnic",
      code: "ALPHA-POLY",
      type: "UNIVERSITY",
      status: "ACTIVE",
      description: "Premier Engineering & High-Stakes Certification Center",
      createdBy: platformOwner._id,
      contact: {
        email: "admin@alpha.edu",
        website: "https://alpha.edu",
      },
    });

    // Assign Enterprise Plan to Demo Organization
    const enterprisePlan = await Plan.findOne({ code: "ENTERPRISE" });
    if (enterprisePlan) {
      await Subscription.create({
        organizationId: demoOrg._id,
        planId: enterprisePlan._id,
        planCode: enterprisePlan.code,
        planName: enterprisePlan.name,
        status: "ACTIVE",
        billingInterval: "MONTHLY",
        price: enterprisePlan.price,
        limits: enterprisePlan.limits,
        features: enterprisePlan.features,
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });
    }

    // 7. Fetch Organization Roles
    const orgRoles = await Role.find({ scope: ROLE_SCOPES.ORGANIZATION });
    const roleMap = {};
    orgRoles.forEach((r) => {
      roleMap[r.name] = r._id;
    });

    // 8. Seed Clean Persona Users
    const personas = [
      {
        firstName: "Dr. Sarah",
        lastName: "Mitchell",
        email: "admin@alpha.edu",
        roleName: ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
        title: "Organization Administrator",
      },
      {
        firstName: "Prof. Alan",
        lastName: "Turing",
        email: "examiner@alpha.edu",
        roleName: ORGANIZATION_ROLES.EXAMINER,
        title: "Faculty Examiner",
      },
      {
        firstName: "James",
        lastName: "Wilson",
        email: "proctor@alpha.edu",
        roleName: ORGANIZATION_ROLES.PROCTOR,
        title: "Proctor / Invigilator",
      },
      {
        firstName: "Alex",
        lastName: "Johnson",
        email: "candidate@alpha.edu",
        roleName: ORGANIZATION_ROLES.CANDIDATE,
        title: "Candidate / Examinee",
      },
    ];

    for (const p of personas) {
      const user = await User.create({
        firstName: p.firstName,
        lastName: p.lastName,
        email: p.email,
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: "ACTIVE",
        platformRole: null,
      });

      const roleId = roleMap[p.roleName];
      if (roleId) {
        await UserMembership.create({
          userId: user._id,
          organizationId: demoOrg._id,
          roleId,
          status: "ACTIVE",
        });
        logger.info(`[ResetSeeder] Seeded ${p.title} -> ${p.email} (${p.roleName})`);
      }
    }

    logger.info("==========================================================================");
    logger.info("✅ DATABASE & DISK PURGE COMPLETE! 100% CLEAN ENVIRONMENT");
    logger.info("==========================================================================");
    logger.info("All questions, assessments, attempts, answers & evidence have been deleted.");
    logger.info("Clean Accounts Ready (Password: Password123!):");
    logger.info("1. Platform Owner:      owner@secureassess.io  or  shaheer838838@gmail.com");
    logger.info("2. Organization Admin:  admin@alpha.edu");
    logger.info("3. Examiner / Faculty:  examiner@alpha.edu");
    logger.info("4. Proctor / Monitor:   proctor@alpha.edu");
    logger.info("5. Candidate / Student: candidate@alpha.edu");
    logger.info("==========================================================================");
  } catch (error) {
    logger.error(`[ResetSeeder] Fatal error during clean reset: ${error.message}`);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
};

resetAndSeedCleanUsers().then(() => process.exit(0));
