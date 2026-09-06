import mongoose from "mongoose";
import Candidate from "../../modules/candidates/candidate.model.js";
import Department from "../../modules/departments/department.model.js";
import Program from "../../modules/programs/program.model.js";
import Subject from "../../modules/subjects/subject.model.js";
import CandidateGroup from "../../modules/candidateGroups/candidateGroup.model.js";
import Organization from "../../modules/organizations/organization.model.js";
import User from "../../modules/users/user.model.js";
import UserMembership from "../../modules/users/userMembership.model.js";
import Role from "../../modules/roles/role.model.js";
import { ORGANIZATION_ROLES } from "../../constants/roles.js";
import { hashPassword } from "../../utils/password.js";
import { logger } from "../../config/logger.js";

export const seedCandidatesAndAcademicStructure = async () => {
  logger.info("[Seeder] Seeding Academic Structure & Candidate Roster into Database...");

  const org = await Organization.findOne({ slug: "stanford-engineering" }) || await Organization.findOne({});
  if (!org) {
    logger.warn("[Seeder] No organization found to attach candidates.");
    return;
  }

  const candidateRole = await Role.findOne({ name: ORGANIZATION_ROLES.CANDIDATE });

  // 1. Seed Departments
  const deptData = [
    { name: "Computer Science & Software Engineering", code: "CSSE", description: "Computing, Artificial Intelligence, and Software Engineering Division" },
    { name: "Aviation & Aerospace Engineering", code: "AERO", description: "Aeronautics, Flight Operations, and Navigation Systems" },
    { name: "Clinical Medicine & Health Sciences", code: "MED", description: "Medical Diagnostics, Pharmacology, and Nursing" },
    { name: "Business Administration & Finance", code: "BAF", description: "Corporate Finance, Accounting, and Strategic Management" },
    { name: "Electrical & Computer Engineering", code: "ECE", description: "Circuits, Embedded Systems, and Signal Processing" },
  ];

  const departmentMap = {};
  for (const d of deptData) {
    let dept = await Department.findOne({ organizationId: org._id, code: d.code });
    if (!dept) {
      dept = await Department.create({ ...d, organizationId: org._id, status: "ACTIVE" });
      logger.info(`[Seeder] Created department: ${dept.name} (${dept.code})`);
    }
    departmentMap[d.code] = dept._id;
  }

  // 2. Seed Degree Programs
  const programData = [
    { name: "Bachelor of Science in Computer Science", code: "BSCS", deptCode: "CSSE", level: "UNDERGRADUATE", duration: "4 Years" },
    { name: "Bachelor of Science in Software Engineering", code: "BSSE", deptCode: "CSSE", level: "UNDERGRADUATE", duration: "4 Years" },
    { name: "Commercial Pilot License & Flight Tech", code: "CPL", deptCode: "AERO", level: "CERTIFICATION", duration: "2 Years" },
    { name: "Bachelor of Medicine & Surgery", code: "MBBS", deptCode: "MED", level: "UNDERGRADUATE", duration: "5 Years" },
    { name: "Bachelor of Business Administration", code: "BBA", deptCode: "BAF", level: "UNDERGRADUATE", duration: "4 Years" },
  ];

  const programMap = {};
  for (const p of programData) {
    let prog = await Program.findOne({ organizationId: org._id, code: p.code });
    if (!prog) {
      prog = await Program.create({
        organizationId: org._id,
        departmentId: departmentMap[p.deptCode],
        name: p.name,
        code: p.code,
        level: p.level,
        duration: p.duration,
        status: "ACTIVE",
      });
      logger.info(`[Seeder] Created program: ${prog.name} (${prog.code})`);
    }
    programMap[p.code] = prog._id;
  }

  // 3. Seed Subjects / Courses
  const subjectData = [
    { name: "Data Structures & Algorithms", code: "CS-201", progCode: "BSCS", credits: 4 },
    { name: "Full-Stack Web Architecture", code: "CS-305", progCode: "BSSE", credits: 3 },
    { name: "Flight Dynamics & Aerodynamics", code: "AV-101", progCode: "CPL", credits: 4 },
    { name: "Clinical Pharmacology & Therapeutics", code: "MED-402", progCode: "MBBS", credits: 5 },
    { name: "Financial Risk & Corporate Valuation", code: "FIN-301", progCode: "BBA", credits: 3 },
    { name: "Applied Artificial Intelligence & ML", code: "CS-401", progCode: "BSCS", credits: 4 },
  ];

  for (const s of subjectData) {
    let subj = await Subject.findOne({ organizationId: org._id, code: s.code });
    if (!subj) {
      subj = await Subject.create({
        organizationId: org._id,
        programId: programMap[s.progCode],
        name: s.name,
        code: s.code,
        credits: s.credits,
        status: "ACTIVE",
      });
      logger.info(`[Seeder] Created subject: ${subj.name} (${subj.code})`);
    }
  }

  // 4. Seed Candidate Groups / Cohorts
  const groupData = [
    { name: "Fall 2026 - CS Senior Cohort", code: "CS-2026-SR", description: "Senior Year Computer Science examinees" },
    { name: "Aviation Cadet Flight Squadron 12", code: "CADET-12", description: "Cadet pilots undergoing licensing exams" },
    { name: "Medical Interns - Clinical Rotation", code: "MED-ROT-B", description: "Final year hospital clinical batch" },
    { name: "Engineering FastTrack Bootcamp", code: "FASTTRACK-01", description: "Accelerated software engineering cohort" },
  ];

  const groupMap = {};
  for (const g of groupData) {
    let grp = await CandidateGroup.findOne({ organizationId: org._id, code: g.code });
    if (!grp) {
      grp = await CandidateGroup.create({
        organizationId: org._id,
        name: g.name,
        code: g.code,
        description: g.description,
        status: "ACTIVE",
      });
      logger.info(`[Seeder] Created candidate group: ${grp.name} (${grp.code})`);
    }
    groupMap[g.code] = grp._id;
  }

  // 5. Seed Real Candidate Roster
  const candidatesData = [
    {
      firstName: "Alex",
      lastName: "Johnson",
      email: "student@stanford.edu",
      candidateCode: "CAND-100101",
      phone: "+1 (555) 234-5678",
      deptCode: "CSSE",
      progCode: "BSCS",
      groupCode: "CS-2026-SR",
      status: "ACTIVE",
    },
    {
      firstName: "Ahmed",
      lastName: "Khan",
      email: "ahmed.khan@student.edu",
      candidateCode: "CAND-100102",
      phone: "+92 300 1234567",
      deptCode: "CSSE",
      progCode: "BSCS",
      groupCode: "CS-2026-SR",
      status: "ACTIVE",
    },
    {
      firstName: "Sarah",
      lastName: "Williams",
      email: "sarah.w@applicant.aero",
      candidateCode: "CAND-100103",
      phone: "+971 50 9876543",
      deptCode: "AERO",
      progCode: "CPL",
      groupCode: "CADET-12",
      status: "ACTIVE",
    },
    {
      firstName: "Maria",
      lastName: "Johnson",
      email: "maria.j@techcorp.pk",
      candidateCode: "CAND-100104",
      phone: "+92 321 8765432",
      deptCode: "CSSE",
      progCode: "BSSE",
      groupCode: "FASTTRACK-01",
      status: "ACTIVE",
    },
    {
      firstName: "Daniel",
      lastName: "Smith",
      email: "daniel.s@nhi.org.pk",
      candidateCode: "CAND-100105",
      phone: "+92 333 4567890",
      deptCode: "MED",
      progCode: "MBBS",
      groupCode: "MED-ROT-B",
      status: "ACTIVE",
    },
    {
      firstName: "Ayesha",
      lastName: "Malik",
      email: "ayesha.m@fcb.gov.pk",
      candidateCode: "CAND-100106",
      phone: "+92 345 6789012",
      deptCode: "BAF",
      progCode: "BBA",
      groupCode: "FASTTRACK-01",
      status: "ACTIVE",
    },
    {
      firstName: "Bilal",
      lastName: "Ahmed",
      email: "bilal.a@student.edu",
      candidateCode: "CAND-100107",
      phone: "+92 312 3456789",
      deptCode: "CSSE",
      progCode: "BSCS",
      groupCode: "CS-2026-SR",
      status: "INVITED",
    },
    {
      firstName: "Fatima",
      lastName: "Zahra",
      email: "fatima.z@applicant.aero",
      candidateCode: "CAND-100108",
      phone: "+971 55 1239876",
      deptCode: "AERO",
      progCode: "CPL",
      groupCode: "CADET-12",
      status: "ACTIVE",
    },
    {
      firstName: "James",
      lastName: "OConnor",
      email: "james.o@techcorp.pk",
      candidateCode: "CAND-100109",
      phone: "+92 301 9871234",
      deptCode: "CSSE",
      progCode: "BSSE",
      groupCode: "FASTTRACK-01",
      status: "ACTIVE",
    },
    {
      firstName: "Zainab",
      lastName: "Tariq",
      email: "zainab.t@student.edu",
      candidateCode: "CAND-100110",
      phone: "+92 305 5554321",
      deptCode: "CSSE",
      progCode: "BSCS",
      groupCode: "CS-2026-SR",
      status: "ACTIVE",
    },
  ];

  const defaultPasswordHash = await hashPassword("Candidate@123");

  for (const cand of candidatesData) {
    let user = await User.findOne({ email: cand.email });
    if (!user) {
      user = await User.create({
        firstName: cand.firstName,
        lastName: cand.lastName,
        email: cand.email,
        passwordHash: defaultPasswordHash,
        emailVerified: true,
        status: "ACTIVE",
      });
      logger.info(`[Seeder] Created user for candidate: ${cand.email}`);
    }

    if (candidateRole) {
      await UserMembership.findOneAndUpdate(
        { userId: user._id, organizationId: org._id },
        {
          userId: user._id,
          organizationId: org._id,
          roleId: candidateRole._id,
          status: "ACTIVE",
        },
        { upsert: true }
      );
    }

    let candidateDoc = await Candidate.findOne({
      organizationId: org._id,
      candidateCode: cand.candidateCode,
    });

    if (!candidateDoc) {
      candidateDoc = await Candidate.create({
        organizationId: org._id,
        userId: user._id,
        candidateCode: cand.candidateCode,
        firstName: cand.firstName,
        lastName: cand.lastName,
        email: cand.email,
        phone: cand.phone,
        phoneNumber: cand.phone,
        departmentId: departmentMap[cand.deptCode] || null,
        programId: programMap[cand.progCode] || null,
        candidateGroupId: groupMap[cand.groupCode] || null,
        status: cand.status,
      });
      logger.info(`[Seeder] Seeded candidate profile: ${cand.candidateCode} - ${cand.firstName} ${cand.lastName}`);
    } else {
      candidateDoc.departmentId = departmentMap[cand.deptCode] || candidateDoc.departmentId;
      candidateDoc.programId = programMap[cand.progCode] || candidateDoc.programId;
      candidateDoc.candidateGroupId = groupMap[cand.groupCode] || candidateDoc.candidateGroupId;
      await candidateDoc.save();
    }
  }

  logger.info("[Seeder] Candidate Roster and Academic Structure seeding complete.");
};

export default seedCandidatesAndAcademicStructure;
