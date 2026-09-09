import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Security Route Wrappers & Role Constants
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';
import {
  ROLE_SCOPES,
  PLATFORM_ROLES,
  ORGANIZATION_ROLES,
} from '@/constants/roles';

// Layout Shell
import { AppShell } from '@/components/layout/AppShell';

// Auth Pages
import { Login } from '@/pages/auth/Login';

// Public Marketing & Demo
import { LandingPage } from '@/components/pages/LandingPage';
import { RequestDemo } from '@/components/pages/RequestDemo';

// Platform Super Admin Modular Views (PLATFORM Scope)
import { PlatformDashboard } from '@/pages/platform/PlatformDashboard';
import { OrganizationsList } from '@/pages/platform/OrganizationsList';
import { Onboarding } from '@/pages/platform/Onboarding';
import { SecurityCenter } from '@/pages/platform/SecurityCenter';
import { PlatformAuditLogs } from '@/pages/platform/PlatformAuditLogs';
import { PlatformAccess } from '@/pages/platform/PlatformAccess';
import { SystemMonitoring } from '@/pages/platform/SystemMonitoring';
import { ServiceHealth } from '@/pages/platform/ServiceHealth';
import { SubscriptionPlans } from '@/pages/platform/SubscriptionPlans';
import { PlatformBilling } from '@/pages/platform/PlatformBilling';
import { PlatformSettings } from '@/pages/platform/PlatformSettings';

// Organization Workspace Modular Views (ORGANIZATION Scope: Owner, Admin, Examiner)
import { OrgDashboard } from '@/pages/org/OrgDashboard';
import { AssessmentLibrary } from '@/pages/org/AssessmentLibrary';
import { AssessmentBuilder } from '@/pages/org/AssessmentBuilder';
import { QuestionBank } from '@/pages/org/QuestionBank';
import { ParticipantManagement } from '@/pages/org/ParticipantManagement';
import { ParticipantProfile } from '@/pages/org/ParticipantProfile';
import { OrgUsers } from '@/pages/org/OrgUsers';
import { Interviews } from '@/pages/org/Interviews';
import { Evaluations } from '@/pages/org/Evaluations';
import { Reports } from '@/pages/org/Reports';
import { Billing } from '@/pages/org/Billing';
import { Settings } from '@/pages/org/Settings';
import { OrgStructure } from '@/pages/org/OrgStructure';

// Proctoring & Integrity Modular Views (ORGANIZATION Scope: Proctor, Admin, Owner)
import { LiveMonitoring } from '@/pages/proctor/LiveMonitoring';
import { SessionReview } from '@/pages/proctor/SessionReview';
import { IntegrityEvidence } from '@/pages/proctor/IntegrityEvidence';
import { Sessions } from '@/pages/proctor/Sessions';

// Candidate Examination Modular Views (ORGANIZATION Scope: Candidate)
import { CandidateDashboard } from '@/pages/candidate/CandidateDashboard';
import { CandidateAssessmentsPage } from '@/pages/candidate/CandidateAssessmentsPage';
import { CandidateInterviewsPage } from '@/pages/candidate/CandidateInterviewsPage';
import { CandidateAssignedHub } from '@/pages/candidate/CandidateAssignedHub';
import { SystemCheck } from '@/pages/candidate/SystemCheck';
import { Consent } from '@/pages/candidate/Consent';
import { AssessmentExperience } from '@/pages/candidate/AssessmentExperience';
import { LiveInterview } from '@/pages/candidate/LiveInterview';
import { Evaluation } from '@/pages/candidate/Evaluation';

// Error Views
import { Forbidden } from '@/pages/errors/Forbidden';
import { NotFound } from '@/pages/errors/NotFound';

import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';

/**
 * Universal Navigation Wrapper injecting Layout Shell and context
 */
const NavWrapper = ({ Component, activeKey, layer = 'organization' }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentOrganization, organizations = [] } = useOrganization();

  const handleNavigate = (targetKey) => {
    const keyMap = {
      landing: '/',
      'request-demo': '/request-demo',
      'platform-dashboard': '/platform/dashboard',
      'platform-organizations': '/platform/organizations',
      'platform-onboarding': '/platform/onboarding',
      'platform-security': '/platform/security',
      'platform-audit-logs': '/platform/audit-logs',
      'platform-access': '/platform/access',
      'platform-monitoring': '/platform/monitoring',
      'platform-services': '/platform/services',
      'platform-plans': '/platform/plans',
      'platform-billing': '/platform/billing',
      'platform-settings': '/platform/settings',
      'org-dashboard': '/organization/dashboard',
      'org-assessments': '/organization/assessments',
      'org-assessment-builder': '/organization/builder',
      'org-question-bank': '/organization/question-bank',
      'org-participants': '/organization/participants',
      'org-participant-profile': '/organization/participants/profile',
      'org-structure': '/organization/structure',
      'org-academic-structure': '/organization/structure',
      'org-users': '/organization/users',
      'org-sessions': '/organization/sessions',
      'org-session-review': '/organization/sessions/review',
      'org-integrity': '/organization/integrity',
      'org-integrity-evidence': '/organization/integrity/evidence',
      'org-reports': '/organization/reports',
      'org-billing': '/organization/billing',
      'org-settings': '/organization/settings',
      'org-interviews': '/organization/interviews',
      'org-interview-room': '/organization/interviews/room',
      'org-evaluations': '/organization/evaluations',
      'candidate-dashboard': '/candidate/dashboard',
      'candidate-assessments': '/candidate/assessments',
      'candidate-interviews': '/candidate/interviews',
      'candidate-assigned': '/candidate/assigned',
      'participant-system-check': '/candidate/system-check',
      'participant-consent': '/candidate/consent',
      'participant-assessment': '/candidate/assessment',
      'participant-interview': '/candidate/interview',
      'participant-evaluation': '/candidate/evaluation',
    };

    if (keyMap[targetKey]) {
      navigate(keyMap[targetKey]);
    } else {
      console.warn(`Unmapped navigation target: ${targetKey}`);
    }
  };

  const org = currentOrganization || (Array.isArray(organizations) && organizations[0]) || {};

  return (
    <AppShell
      context={{ layer, orgId: org._id || org.id || null }}
      activeView={activeKey}
      onNavigate={handleNavigate}
      onExit={() => {
        logout();
        navigate('/');
      }}
      orgName={org.name || 'SecureAssess'}
      orgLogoText={org.logoText || 'SA'}
      orgBrandColor={org.brandColor || '#2563eb'}
    >
      <Component onNavigate={handleNavigate} />
    </AppShell>
  );
};

export const AppRoutes = () => {
  const navigate = useNavigate();

  const handleDirectNavigate = (targetKey) => {
    const keyMap = {
      landing: '/',
      'request-demo': '/request-demo',
      'platform-dashboard': '/platform/dashboard',
      'platform-organizations': '/platform/organizations',
      'platform-onboarding': '/platform/onboarding',
      'platform-security': '/platform/security',
      'platform-audit-logs': '/platform/audit-logs',
      'platform-access': '/platform/access',
      'platform-monitoring': '/platform/monitoring',
      'platform-services': '/platform/services',
      'platform-plans': '/platform/plans',
      'platform-billing': '/platform/billing',
      'platform-settings': '/platform/settings',
      'org-dashboard': '/organization/dashboard',
      'org-assessments': '/organization/assessments',
      'org-assessment-builder': '/organization/builder',
      'org-question-bank': '/organization/question-bank',
      'org-participants': '/organization/participants',
      'org-participant-profile': '/organization/participants/profile',
      'org-structure': '/organization/structure',
      'org-academic-structure': '/organization/structure',
      'org-users': '/organization/users',
      'org-sessions': '/organization/sessions',
      'org-session-review': '/organization/sessions/review',
      'org-integrity': '/organization/integrity',
      'org-integrity-evidence': '/organization/integrity/evidence',
      'org-reports': '/organization/reports',
      'org-billing': '/organization/billing',
      'org-settings': '/organization/settings',
      'org-interviews': '/organization/interviews',
      'org-interview-room': '/organization/interviews/room',
      'org-evaluations': '/organization/evaluations',
      'candidate-dashboard': '/candidate/dashboard',
      'candidate-assessments': '/candidate/assessments',
      'candidate-interviews': '/candidate/interviews',
      'candidate-assigned': '/candidate/assigned',
      'participant-system-check': '/candidate/system-check',
      'participant-consent': '/candidate/consent',
      'participant-assessment': '/candidate/assessment',
      'participant-interview': '/candidate/interview',
      'participant-evaluation': '/candidate/evaluation',
    };
    if (keyMap[targetKey]) {
      navigate(keyMap[targetKey]);
    }
  };

  return (
    <Routes>
      {/* ======================================================== */}
      {/* 1. PUBLIC MARKETING & AUTHENTICATION                     */}
      {/* ======================================================== */}
      <Route path="/" element={<LandingPage onNavigate={handleDirectNavigate} />} />
      <Route path="/request-demo" element={<RequestDemo onNavigate={handleDirectNavigate} />} />
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      {/* ======================================================== */}
      {/* 2. PLATFORM SUPER ADMIN PORTAL (SCOPE: PLATFORM)         */}
      {/* ======================================================== */}
      <Route
        element={
          <ProtectedRoute
            scope={ROLE_SCOPES.PLATFORM}
            allowedRoles={[
              PLATFORM_ROLES.PLATFORM_ADMIN,
              PLATFORM_ROLES.PLATFORM_OWNER,
            ]}
          />
        }
      >
        <Route path="/platform">
          <Route index element={<Navigate to="/platform/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <NavWrapper
                Component={PlatformDashboard}
                activeKey="platform-dashboard"
                layer="platform"
              />
            }
          />
          <Route
            path="organizations"
            element={
              <NavWrapper
                Component={OrganizationsList}
                activeKey="platform-organizations"
                layer="platform"
              />
            }
          />
          <Route
            path="onboarding"
            element={<Onboarding onNavigate={handleDirectNavigate} />}
          />
          <Route
            path="security"
            element={
              <NavWrapper
                Component={SecurityCenter}
                activeKey="platform-security"
                layer="platform"
              />
            }
          />
          <Route
            path="audit-logs"
            element={
              <NavWrapper
                Component={PlatformAuditLogs}
                activeKey="platform-audit-logs"
                layer="platform"
              />
            }
          />
          <Route
            path="access"
            element={
              <NavWrapper
                Component={PlatformAccess}
                activeKey="platform-access"
                layer="platform"
              />
            }
          />
          <Route
            path="monitoring"
            element={
              <NavWrapper
                Component={SystemMonitoring}
                activeKey="platform-monitoring"
                layer="platform"
              />
            }
          />
          <Route
            path="services"
            element={
              <NavWrapper
                Component={ServiceHealth}
                activeKey="platform-services"
                layer="platform"
              />
            }
          />
          <Route
            path="plans"
            element={
              <NavWrapper
                Component={SubscriptionPlans}
                activeKey="platform-plans"
                layer="platform"
              />
            }
          />
          <Route
            path="billing"
            element={
              <NavWrapper
                Component={PlatformBilling}
                activeKey="platform-billing"
                layer="platform"
              />
            }
          />
          <Route
            path="settings"
            element={
              <NavWrapper
                Component={PlatformSettings}
                activeKey="platform-settings"
                layer="platform"
              />
            }
          />
        </Route>
      </Route>

      {/* ======================================================== */}
      {/* 3. ORGANIZATION WORKSPACE (SCOPE: ORGANIZATION)          */}
      {/* ======================================================== */}
      <Route
        element={
          <ProtectedRoute
            scope={ROLE_SCOPES.ORGANIZATION}
            allowedRoles={[
              ORGANIZATION_ROLES.ORGANIZATION_OWNER,
              ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
              ORGANIZATION_ROLES.EXAMINER,
              ORGANIZATION_ROLES.PROCTOR,
            ]}
          />
        }
      >
        <Route path="/organization">
          <Route index element={<Navigate to="/organization/dashboard" replace />} />
          
          {/* Shared Workspace Views (All Staff Roles) */}
          <Route
            path="dashboard"
            element={
              <NavWrapper
                Component={OrgDashboard}
                activeKey="org-dashboard"
                layer="organization"
              />
            }
          />
          <Route
            path="reports"
            element={
              <NavWrapper
                Component={Reports}
                activeKey="org-reports"
                layer="organization"
              />
            }
          />
          <Route
            path="interviews"
            element={
              <NavWrapper
                Component={Interviews}
                activeKey="org-interviews"
                layer="organization"
              />
            }
          />
          <Route
            path="interviews/room"
            element={<LiveInterview onNavigate={handleDirectNavigate} />}
          />

          {/* 3A. OWNER ONLY: Financial & Billing Governance */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[ORGANIZATION_ROLES.ORGANIZATION_OWNER]}
              />
            }
          >
            <Route
              path="billing"
              element={
                <NavWrapper
                  Component={Billing}
                  activeKey="org-billing"
                  layer="organization"
                />
              }
            />
          </Route>

          {/* 3B. OWNER & ADMIN: Staff, Structure & Workspace Settings */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  ORGANIZATION_ROLES.ORGANIZATION_OWNER,
                  ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
                ]}
              />
            }
          >
            <Route
              path="users"
              element={
                <NavWrapper
                  Component={OrgUsers}
                  activeKey="org-users"
                  layer="organization"
                />
              }
            />
            <Route
              path="structure"
              element={
                <NavWrapper
                  Component={OrgStructure}
                  activeKey="org-structure"
                  layer="organization"
                />
              }
            />
            <Route
              path="academic-structure"
              element={<Navigate to="/organization/structure" replace />}
            />
            <Route
              path="settings"
              element={
                <NavWrapper
                  Component={Settings}
                  activeKey="org-settings"
                  layer="organization"
                />
              }
            />
          </Route>

          {/* 3C. EXAMINER, ADMIN & OWNER: Assessments, Questions, Candidates, Evaluations */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  ORGANIZATION_ROLES.ORGANIZATION_OWNER,
                  ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
                  ORGANIZATION_ROLES.EXAMINER,
                ]}
              />
            }
          >
            <Route
              path="assessments"
              element={
                <NavWrapper
                  Component={AssessmentLibrary}
                  activeKey="org-assessments"
                  layer="organization"
                />
              }
            />
            <Route
              path="builder"
              element={
                <NavWrapper
                  Component={AssessmentBuilder}
                  activeKey="org-assessment-builder"
                  layer="organization"
                />
              }
            />
            <Route
              path="question-bank"
              element={
                <NavWrapper
                  Component={QuestionBank}
                  activeKey="org-question-bank"
                  layer="organization"
                />
              }
            />
            <Route
              path="participants"
              element={
                <NavWrapper
                  Component={ParticipantManagement}
                  activeKey="org-participants"
                  layer="organization"
                />
              }
            />
            <Route
              path="participants/profile"
              element={
                <NavWrapper
                  Component={ParticipantProfile}
                  activeKey="org-participant-profile"
                  layer="organization"
                />
              }
            />
            <Route
              path="evaluations"
              element={
                <NavWrapper
                  Component={Evaluations}
                  activeKey="org-evaluations"
                  layer="organization"
                />
              }
            />
          </Route>

          {/* 3D. PROCTOR, EXAMINER, ADMIN & OWNER: Proctoring, Live Telemetry & Session Archives */}
          <Route
            element={
              <ProtectedRoute
                allowedRoles={[
                  ORGANIZATION_ROLES.ORGANIZATION_OWNER,
                  ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
                  ORGANIZATION_ROLES.EXAMINER,
                  ORGANIZATION_ROLES.PROCTOR,
                ]}
              />
            }
          >
            <Route
              path="integrity"
              element={
                <NavWrapper
                  Component={LiveMonitoring}
                  activeKey="org-integrity"
                  layer="organization"
                />
              }
            />
            <Route
              path="integrity/evidence"
              element={
                <NavWrapper
                  Component={IntegrityEvidence}
                  activeKey="org-integrity-evidence"
                  layer="organization"
                />
              }
            />
            <Route
              path="sessions"
              element={
                <NavWrapper
                  Component={Sessions}
                  activeKey="org-sessions"
                  layer="organization"
                />
              }
            />
            <Route
              path="sessions/review"
              element={
                <NavWrapper
                  Component={SessionReview}
                  activeKey="org-session-review"
                  layer="organization"
                />
              }
            />
          </Route>
        </Route>
      </Route>

      {/* ======================================================== */}
      {/* 4. CANDIDATE PORTAL (SCOPE: ORGANIZATION, ROLE: CANDIDATE)*/}
      {/* ======================================================== */}
      <Route
        element={
          <ProtectedRoute
            scope={ROLE_SCOPES.ORGANIZATION}
            allowedRoles={[
              ORGANIZATION_ROLES.CANDIDATE,
              ORGANIZATION_ROLES.EXAMINER,
              ORGANIZATION_ROLES.PROCTOR,
              ORGANIZATION_ROLES.ORGANIZATION_OWNER,
              ORGANIZATION_ROLES.ORGANIZATION_ADMIN,
            ]}
          />
        }
      >
        <Route path="/candidate">
          <Route index element={<Navigate to="/candidate/dashboard" replace />} />
          <Route
            path="dashboard"
            element={
              <NavWrapper
                Component={CandidateDashboard}
                activeKey="candidate-dashboard"
                layer="candidate"
              />
            }
          />
          <Route
            path="assessments"
            element={
              <NavWrapper
                Component={CandidateAssessmentsPage}
                activeKey="candidate-assessments"
                layer="candidate"
              />
            }
          />
          <Route
            path="interviews"
            element={
              <NavWrapper
                Component={CandidateInterviewsPage}
                activeKey="candidate-interviews"
                layer="candidate"
              />
            }
          />
          <Route
            path="assigned"
            element={
              <NavWrapper
                Component={CandidateAssignedHub}
                activeKey="candidate-assigned"
                layer="candidate"
              />
            }
          />
          <Route
            path="system-check"
            element={<SystemCheck onNavigate={handleDirectNavigate} />}
          />
          <Route
            path="consent"
            element={<Consent onNavigate={handleDirectNavigate} />}
          />
          <Route
            path="assessment"
            element={<AssessmentExperience onNavigate={handleDirectNavigate} />}
          />
          <Route
            path="interview"
            element={<LiveInterview onNavigate={handleDirectNavigate} />}
          />
          <Route
            path="evaluation"
            element={
              <NavWrapper
                Component={Evaluation}
                activeKey="participant-evaluation"
                layer="candidate"
              />
            }
          />
        </Route>
      </Route>

      {/* ======================================================== */}
      {/* 5. GUEST ENTRY ROOMS & ACCESS POINT                      */}
      {/* ======================================================== */}
      <Route
        path="/interview/entry/:token"
        element={<LiveInterview onNavigate={handleDirectNavigate} />}
      />
      <Route
        path="/interview/entry"
        element={<LiveInterview onNavigate={handleDirectNavigate} />}
      />
      <Route
        path="/interview/room"
        element={<LiveInterview onNavigate={handleDirectNavigate} />}
      />

      {/* ======================================================== */}
      {/* 6. ERROR VIEWS                                           */}
      {/* ======================================================== */}
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
