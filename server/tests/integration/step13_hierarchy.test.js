import { connectDatabase, disconnectDatabase } from "../../src/config/db.js";
import app from "../../src/app.js";
import User from "../../src/modules/users/user.model.js";
import UserMembership from "../../src/modules/users/userMembership.model.js";
import Organization from "../../src/modules/organizations/organization.model.js";
import Role from "../../src/modules/roles/role.model.js";
import Department from "../../src/modules/departments/department.model.js";
import Program from "../../src/modules/programs/program.model.js";
import Subject from "../../src/modules/subjects/subject.model.js";
import { PLATFORM_ROLES, ORGANIZATION_ROLES } from "../../src/constants/roles.js";
import { generateAccessToken } from "../../src/utils/token.js";
import http from "http";

const request = (server, options, body = null) => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        host: "127.0.0.1",
        port: server.address().port,
        method: options.method || "GET",
        path: options.path,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = data ? JSON.parse(data) : {};
            resolve({ status: res.statusCode, body: parsed });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runStep13Tests = async () => {
  await connectDatabase();
  console.log("Connected to MongoDB for Step 13 Departments, Programs & Subjects Test Suite");

  const server = app.listen(0);
  await new Promise((res) => server.once("listening", res));
  console.log("Test HTTP Server running on port:", server.address().port);

  try {
    // 1. Roles & Platform Owner Setup
    const platformOwner = await User.findOne({ platformRole: PLATFORM_ROLES.PLATFORM_OWNER });
    const orgOwnerRole = await Role.findOne({ name: ORGANIZATION_ROLES.ORGANIZATION_OWNER });
    const examinerRole = await Role.findOne({ name: ORGANIZATION_ROLES.EXAMINER });

    // Clean up test collections
    await Organization.deleteMany({ slug: { $in: ["org-vu-13", "org-saylani-13"] } });
    await User.deleteMany({ email: { $in: ["vu.owner13@test.com", "saylani.owner13@test.com", "vu.examiner13@test.com"] } });

    // 2. Setup Organization A (Virtual University 13)
    const orgA = await Organization.create({
      name: "Virtual University 13",
      slug: "org-vu-13",
      code: "VU13",
      type: "UNIVERSITY",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const vuOwner = await User.create({
      firstName: "VU",
      lastName: "Owner",
      email: "vu.owner13@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const vuOwnerToken = generateAccessToken({ sub: vuOwner._id.toString() });

    await UserMembership.create({
      userId: vuOwner._id,
      organizationId: orgA._id,
      roleId: orgOwnerRole._id,
      status: "ACTIVE",
    });

    // 3. Setup Organization B (Saylani 13)
    const orgB = await Organization.create({
      name: "Saylani 13",
      slug: "org-saylani-13",
      code: "SAY13",
      type: "TRAINING_INSTITUTE",
      status: "ACTIVE",
      createdBy: platformOwner._id,
    });

    const saylaniOwner = await User.create({
      firstName: "Saylani",
      lastName: "Owner",
      email: "saylani.owner13@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const saylaniOwnerToken = generateAccessToken({ sub: saylaniOwner._id.toString() });

    await UserMembership.create({
      userId: saylaniOwner._id,
      organizationId: orgB._id,
      roleId: orgOwnerRole._id,
      status: "ACTIVE",
    });

    // 4. Setup Examiner in Org A
    const vuExaminer = await User.create({
      firstName: "VU",
      lastName: "Examiner",
      email: "vu.examiner13@test.com",
      passwordHash: "$2b$10$dummyHash123",
      status: "ACTIVE",
      emailVerified: true,
    });
    const vuExaminerToken = generateAccessToken({ sub: vuExaminer._id.toString() });

    await UserMembership.create({
      userId: vuExaminer._id,
      organizationId: orgA._id,
      roleId: examinerRole._id,
      status: "ACTIVE",
    });

    console.log("\n[TEST 1] Create Department 'CS' in Org A & Org B...");
    const createDeptARes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/departments`,
      headers: { Authorization: `Bearer ${vuOwnerToken}` },
    }, {
      name: "Computer Science",
      code: "CS",
      description: "Department of Computer Science",
    });
    console.log("Create Dept in Org A ->", createDeptARes.status, "(Expected: 201)");
    if (createDeptARes.status !== 201 || createDeptARes.body?.data?.code !== "CS") throw new Error("Test 1.1 Failed");
    const deptAId = createDeptARes.body.data._id;

    // Org B creates department with same code 'CS' -> allowed
    const createDeptBRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgB._id}/departments`,
      headers: { Authorization: `Bearer ${saylaniOwnerToken}` },
    }, {
      name: "Corporate Solutions",
      code: "CS",
    });
    console.log("Create Dept 'CS' in Org B ->", createDeptBRes.status, "(Expected: 201)");
    if (createDeptBRes.status !== 201) throw new Error("Test 1.2 Failed");
    const deptBId = createDeptBRes.body.data._id;

    // Duplicate code in same Org A -> rejected (409)
    const duplicateDeptRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/departments`,
      headers: { Authorization: `Bearer ${vuOwnerToken}` },
    }, {
      name: "Duplicate CS",
      code: "CS",
    });
    console.log("Duplicate Dept code in Org A ->", duplicateDeptRes.status, "(Expected: 409)");
    if (duplicateDeptRes.status !== 409) throw new Error("Test 1.3 Failed: Duplicate code was not rejected!");

    console.log("\n[TEST 2] Create Program & Cross-Tenant Department Isolation...");
    const createProgRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/programs`,
      headers: { Authorization: `Bearer ${vuOwnerToken}` },
    }, {
      name: "BS Computer Science",
      code: "BSCS",
      departmentId: deptAId,
      level: "UNDERGRADUATE",
      duration: "4 Years",
    });
    console.log("Create Program in Org A ->", createProgRes.status, "(Expected: 201)");
    if (createProgRes.status !== 201 || createProgRes.body?.data?.code !== "BSCS") throw new Error("Test 2.1 Failed");
    const progAId = createProgRes.body.data._id;

    // Cross-tenant attack: Org A attempts to attach to Org B's department
    const crossDeptProgRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/programs`,
      headers: { Authorization: `Bearer ${vuOwnerToken}` },
    }, {
      name: "Rogue Program",
      code: "ROGUE",
      departmentId: deptBId, // Org B's department!
    });
    console.log("Org A attaching to Org B's Dept ->", crossDeptProgRes.status, "(Expected: 400)");
    if (crossDeptProgRes.status !== 400) throw new Error("Test 2.2 Failed: Cross-tenant department was allowed!");

    console.log("\n[TEST 3] Create Subject & Cross-Tenant Program Isolation...");
    const createSubjRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/subjects`,
      headers: { Authorization: `Bearer ${vuOwnerToken}` },
    }, {
      name: "Web Engineering",
      code: "WEB-301",
      programId: progAId,
      credits: 3,
    });
    console.log("Create Subject in Org A ->", createSubjRes.status, "(Expected: 201)");
    if (createSubjRes.status !== 201 || createSubjRes.body?.data?.code !== "WEB-301") throw new Error("Test 3.1 Failed");
    const subjAId = createSubjRes.body.data._id;

    // Cross-tenant attack: Org B attempts to attach Subject to Org A's Program
    const crossSubjRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgB._id}/subjects`,
      headers: { Authorization: `Bearer ${saylaniOwnerToken}` },
    }, {
      name: "Saylani Rogue Subject",
      code: "ROGUE-SUBJ",
      programId: progAId, // Org A's program!
    });
    console.log("Org B attaching to Org A's Program ->", crossSubjRes.status, "(Expected: 400)");
    if (crossSubjRes.status !== 400) throw new Error("Test 3.2 Failed: Cross-tenant program was allowed!");

    console.log("\n[TEST 4] Cross-Tenant Access Boundary (403 Forbidden)...");
    const crossAccessRes = await request(server, {
      method: "GET",
      path: `/api/v1/organizations/${orgA._id}/departments`,
      headers: { Authorization: `Bearer ${saylaniOwnerToken}` }, // Org B Owner accessing Org A!
    });
    console.log("Org B accessing Org A departments ->", crossAccessRes.status, "(Expected: 403)");
    if (crossAccessRes.status !== 403) throw new Error("Test 4 Failed: Cross-tenant access was not blocked!");

    console.log("\n[TEST 5] Examiner Cannot Manage Departments/Programs/Subjects (403 Forbidden)...");
    const examinerCreateDeptRes = await request(server, {
      method: "POST",
      path: `/api/v1/organizations/${orgA._id}/departments`,
      headers: { Authorization: `Bearer ${vuExaminerToken}` },
    }, {
      name: "Examiner Department",
      code: "EXM",
    });
    console.log("Examiner creating department ->", examinerCreateDeptRes.status, "(Expected: 403)");
    if (examinerCreateDeptRes.status !== 403) throw new Error("Test 5 Failed: Examiner was not blocked!");

    console.log("\n[TEST 6] Archive / Status Updates for Hierarchy...");
    const archiveSubjRes = await request(server, {
      method: "DELETE",
      path: `/api/v1/organizations/${orgA._id}/subjects/${subjAId}`,
      headers: { Authorization: `Bearer ${vuOwnerToken}` },
    });
    console.log("Archive Subject ->", archiveSubjRes.status, "(Expected: 200)");
    const archivedSubj = await Subject.findById(subjAId);
    if (archiveSubjRes.status !== 200 || archivedSubj.status !== "ARCHIVED") throw new Error("Test 6 Failed");

    console.log("\n==========================================================================");
    console.log("✅ ALL STEP 13 DEPARTMENTS, PROGRAMS & SUBJECTS TESTS PASSED!");
    console.log("==========================================================================");
  } catch (err) {
    console.error("Step 13 Test Suite Failed:", err);
    process.exitCode = 1;
  } finally {
    server.close();
    await disconnectDatabase();
  }
};

runStep13Tests();
