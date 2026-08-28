import User from "../../modules/users/user.model.js";
import Organization from "../../modules/organizations/organization.model.js";
import UserMembership from "../../modules/users/userMembership.model.js";
import Role from "../../modules/roles/role.model.js";
import { ORGANIZATION_ROLES, ROLE_SCOPES } from "../../constants/roles.js";
import { hashPassword } from "../../utils/password.js";
import { logger } from "../../config/logger.js";

export const seedDemoAccounts = async () => {
  logger.info("[Seeder] Seeding Demo Organization & Multi-Tenant Persona Accounts...");

  // Find Platform Owner user to set as creator
  const owner = await User.findOne({ email: "shaheer838838@gmail.com" });

  // 1. Create or Find Demo Organization
  let org = await Organization.findOne({ slug: "stanford-engineering" });
  if (!org) {
    org = await Organization.create({
      name: "Stanford Engineering",
      slug: "stanford-engineering",
      code: "STANFORD",
      type: "UNIVERSITY",
      status: "ACTIVE",
      description: "School of Engineering Assessment Workspace",
      createdBy: owner ? owner._id : null,
      contact: {
        email: "contact@stanford.edu",
        website: "https://engineering.stanford.edu",
      },
    });
    logger.info(`[Seeder] Created demo organization: ${org.name}`);
  } else {
    org.status = "ACTIVE";
    await org.save();
  }

  // 2. Fetch Organization Roles
  const roles = await Role.find({ scope: ROLE_SCOPES.ORGANIZATION });
  const roleMap = {};
  roles.forEach((r) => {
    roleMap[r.name] = r._id;
  });

  const demoAccounts = [
    {
      email: "dean@stanford.edu",
      password: "OrgAdmin@123",
      firstName: "Dr. Sarah",
      lastName: "Mitchell",
      roleName: ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
    },
    {
      email: "professor@stanford.edu",
      password: "Examiner@123",
      firstName: "Prof. Alan",
      lastName: "Turing",
      roleName: ORGANIZATION_ROLES.EXAMINER,
    },
    {
      email: "student@stanford.edu",
      password: "Student@123",
      firstName: "Alex",
      lastName: "Johnson",
      roleName: ORGANIZATION_ROLES.CANDIDATE,
    },
  ];

  for (const account of demoAccounts) {
    const passwordHash = await hashPassword(account.password);
    let user = await User.findOne({ email: account.email });

    if (!user) {
      user = await User.create({
        firstName: account.firstName,
        lastName: account.lastName,
        email: account.email,
        passwordHash,
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: "ACTIVE",
        platformRole: null,
      });
      logger.info(`[Seeder] Created demo user: ${account.email} (${account.firstName} ${account.lastName})`);
    } else {
      user.firstName = account.firstName;
      user.lastName = account.lastName;
      user.passwordHash = passwordHash;
      user.status = "ACTIVE";
      await user.save();
    }

    const targetRoleId = roleMap[account.roleName];
    if (targetRoleId) {
      let membership = await UserMembership.findOne({
        userId: user._id,
        organizationId: org._id,
      });

      if (!membership) {
        await UserMembership.create({
          userId: user._id,
          organizationId: org._id,
          roleId: targetRoleId,
          status: "ACTIVE",
        });
        logger.info(`[Seeder] Linked membership: ${account.email} -> ${account.roleName} in ${org.name}`);
      } else {
        membership.roleId = targetRoleId;
        membership.status = "ACTIVE";
        await membership.save();
      }
    }
  }

  logger.info("[Seeder] Demo accounts and memberships successfully populated.");
};
