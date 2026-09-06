import React from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Route Guards
import { PublicRoute } from './PublicRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { PlatformRoute } from './PlatformRoute';
import { OrganizationRoute } from './OrganizationRoute';
import { CandidateRoute } from './CandidateRoute';

// Layout Shell
import { AppShell } from '@/components/layout/AppShell';

// Auth Pages
import { Login } from '@/pages/auth/Login';

// Public Marketing & Demo
import { LandingPage } from '@/components/pages/LandingPage';
import { RequestDemo } from '@/components/pages/RequestDemo';

// Platform Super Admin Views
import { PlatformDashboard } from '@/components/pages/platform/PlatformDashboard';
import { Organizations } from '@/components/pages/platform/Organizations';
import { Onboarding } from '@/components/pages/platform/Onboarding';

// Organization Workspace Views
import { OrgDashboard } from '@/components/pages/org/OrgDashboard';
import { AssessmentLibrary } from '@/components/pages/org/AssessmentLibrary';
import { AssessmentBuilder } from '@/components/pages/org/AssessmentBuilder';
import { QuestionBank } from '@/components/pages/org/QuestionBank';
import { ParticipantManagement } from '@/components/pages/org/ParticipantManagement';
import { ParticipantProfile } from '@/components/pages/org/ParticipantProfile';
import { Sessions } from '@/components/pages/org/Sessions';
import { SessionReview } from '@/components/pages/org/SessionReview';
import { IntegrityCenter } from '@/components/pages/org/IntegrityCenter';
import { IntegrityEvidence } from '@/components/pages/org/IntegrityEvidence';
import { Reports } from '@/components/pages/org/Reports';
import { Billing } from '@/components/pages/org/Billing';
import { Settings } from '@/components/pages/org/Settings';
import { OrgUsers } from '@/components/pages/org/OrgUsers';
import { Interviews } from '@/components/pages/org/Interviews';
import { Evaluations } from '@/components/pages/org/Evaluations';

// Candidate Examination Views
import { CandidateDashboard } from '@/components/pages/participant/CandidateDashboard';
import { SystemCheck } from '@/components/pages/participant/SystemCheck';
import { Consent } from '@/components/pages/participant/Consent';
import { AssessmentExperience } from '@/components/pages/participant/AssessmentExperience';
import { LiveInterview } from '@/components/pages/participant/LiveInterview';
import { Evaluation } from '@/components/pages/participant/Evaluation';

// Error Views
import { Forbidden } from '@/pages/errors/Forbidden';
import { NotFound } from '@/pages/errors/NotFound';

import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { organizations } from '@/data';

// Helper Wrapper for Legacy onNavigate mapping
const NavWrapper = ({ Component, activeKey, layer = 'organization' }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { currentOrganization } = useOrganization();

  const handleNavigate = (targetKey) => {
    const keyMap = {
      landing: '/',
      'request-demo': '/request-demo',
      'platform-dashboard': '/platform/dashboard',
      'platform-organizations': '/platform/organizations',
      'platform-configuration': '/platform/dashboard',
      'platform-features': '/platform/dashboard',
      'platform-health': '/platform/dashboard',
      'platform-security': '/platform/dashboard',
      'platform-audit-logs': '/platform/dashboard',
      'platform-access-logs': '/platform/dashboard',
      'platform-system-events': '/platform/dashboard',
      'platform-roles': '/platform/dashboard',
      'platform-permissions': '/platform/dashboard',
      'platform-access': '/platform/dashboard',
      'platform-monitoring': '/platform/dashboard',
      'platform-services': '/platform/dashboard',
      'platform-activity': '/platform/dashboard',
      'platform-plans': '/platform/dashboard',
      'platform-subscriptions': '/platform/dashboard',
      'platform-billing': '/platform/dashboard',
      'platform-settings': '/platform/dashboard',
      'platform-onboarding': '/platform/onboarding',
      'org-dashboard': '/organization/dashboard',
      'org-assessments': '/organization/assessments',
      'org-assessments-drafts': '/organization/assessments',
      'org-assessment-builder': '/organization/builder',
      'org-question-bank': '/organization/question-bank',
      'org-templates': '/organization/assessments',
      'org-participants': '/organization/participants',
      'org-participants-groups': '/organization/participants',
      'org-participants-invitations': '/organization/participants',
      'org-participant-profile': '/organization/participants/profile',
      'org-users': '/organization/users',
      'org-users-admins': '/organization/users?role=admin',
      'org-users-examiners': '/organization/users?role=examiner',
      'org-users-proctors': '/organization/users?role=proctor',
      'org-sessions': '/organization/sessions',
      'org-sessions-history': '/organization/sessions',
      'org-session-review': '/organization/sessions/review',
      'org-proctor-assigned': '/organization/sessions',
      'org-proctor-sessions': '/organization/sessions',
      'org-proctor-reports': '/organization/reports',
      'org-incidents-active': '/organization/integrity/evidence',
      'org-incidents-report': '/organization/integrity/evidence',
      'org-incidents-history': '/organization/integrity/evidence',
      'org-integrity': '/organization/integrity',
      'org-integrity-evidence': '/organization/integrity/evidence',
      'org-reports': '/organization/reports',
      'org-reports-assessments': '/organization/reports',
      'org-reports-interviews': '/organization/reports',
      'org-reports-candidates': '/organization/reports',
      'org-reports-all': '/organization/reports',
      'org-analytics': '/organization/reports',
      'org-audit-logs': '/organization/sessions',
      'org-activity-logs': '/organization/sessions',
      'org-billing': '/organization/billing',
      'org-settings': '/organization/settings',
      'org-interviews': '/organization/interviews',
      'org-interviews-schedule': '/organization/interviews',
      'org-interviews-templates': '/organization/interviews',
      'org-interview-room': '/organization/interviews/room',
      'org-evaluations': '/organization/evaluations',
      'candidate-dashboard': '/candidate/dashboard',
      'candidate-assessments-upcoming': '/candidate/dashboard',
      'candidate-assessments-completed': '/candidate/dashboard',
      'candidate-interviews-upcoming': '/candidate/dashboard',
      'candidate-interviews-completed': '/candidate/dashboard',
      'participant-system-check': '/candidate/system-check',
      'participant-consent': '/candidate/consent',
      'participant-assessment': '/candidate/assessment',
      'participant-interview': '/candidate/interview',
      'participant-evaluation': '/candidate/evaluation',
      interviews: '/organization/interviews',
    };
    if (keyMap[targetKey]) {
      navigate(keyMap[targetKey]);
    } else {
      console.warn(`Unmapped navigation target: ${targetKey}`);
    }
  };

  const org = currentOrganization || organizations[0];

  return (
    <AppShell
      context={{ layer, orgId: org._id || org.id }}
      activeView={activeKey}
      onNavigate={handleNavigate}
      onExit={() => {
        logout();
        navigate('/');
      }}
      orgName={org.name}
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
      'platform-configuration': '/platform/dashboard',
      'platform-features': '/platform/dashboard',
      'platform-health': '/platform/dashboard',
      'platform-security': '/platform/dashboard',
      'platform-audit-logs': '/platform/dashboard',
      'platform-access-logs': '/platform/dashboard',
      'platform-system-events': '/platform/dashboard',
      'platform-roles': '/platform/dashboard',
      'platform-permissions': '/platform/dashboard',
      'platform-access': '/platform/dashboard',
      'platform-monitoring': '/platform/dashboard',
      'platform-services': '/platform/dashboard',
      'platform-activity': '/platform/dashboard',
      'platform-plans': '/platform/dashboard',
      'platform-subscriptions': '/platform/dashboard',
      'platform-billing': '/platform/dashboard',
      'platform-settings': '/platform/dashboard',
      'platform-onboarding': '/platform/onboarding',
      'org-dashboard': '/organization/dashboard',
      'org-assessments': '/organization/assessments',
      'org-assessments-drafts': '/organization/assessments',
      'org-assessment-builder': '/organization/builder',
      'org-question-bank': '/organization/question-bank',
      'org-templates': '/organization/assessments',
      'org-participants': '/organization/participants',
      'org-participants-groups': '/organization/participants',
      'org-participants-invitations': '/organization/participants',
      'org-participant-profile': '/organization/participants/profile',
      'org-users': '/organization/users',
      'org-users-admins': '/organization/users?role=admin',
      'org-users-examiners': '/organization/users?role=examiner',
      'org-users-proctors': '/organization/users?role=proctor',
      'org-sessions': '/organization/sessions',
      'org-sessions-history': '/organization/sessions',
      'org-session-review': '/organization/sessions/review',
      'org-proctor-assigned': '/organization/sessions',
      'org-proctor-sessions': '/organization/sessions',
      'org-proctor-reports': '/organization/reports',
      'org-incidents-active': '/organization/integrity/evidence',
      'org-incidents-report': '/organization/integrity/evidence',
      'org-incidents-history': '/organization/integrity/evidence',
      'org-integrity': '/organization/integrity',
      'org-integrity-evidence': '/organization/integrity/evidence',
      'org-reports': '/organization/reports',
      'org-reports-assessments': '/organization/reports',
      'org-reports-interviews': '/organization/reports',
      'org-reports-candidates': '/organization/reports',
      'org-reports-all': '/organization/reports',
      'org-analytics': '/organization/reports',
      'org-audit-logs': '/organization/sessions',
      'org-activity-logs': '/organization/sessions',
      'org-billing': '/organization/billing',
      'org-settings': '/organization/settings',
      'org-interviews': '/organization/interviews',
      'org-interviews-schedule': '/organization/interviews',
      'org-interviews-templates': '/organization/interviews',
      'org-interview-room': '/organization/interviews/room',
      'org-evaluations': '/organization/evaluations',
      'candidate-dashboard': '/candidate/dashboard',
      'candidate-assessments-upcoming': '/candidate/dashboard',
      'candidate-assessments-completed': '/candidate/dashboard',
      'candidate-interviews-upcoming': '/candidate/dashboard',
      'candidate-interviews-completed': '/candidate/dashboard',
      'participant-system-check': '/candidate/system-check',
      'participant-consent': '/candidate/consent',
      'participant-assessment': '/candidate/assessment',
      'participant-interview': '/candidate/interview',
      'participant-evaluation': '/candidate/evaluation',
      interviews: '/organization/interviews',
    };
    if (keyMap[targetKey]) {
      navigate(keyMap[targetKey]);
    }
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage onNavigate={handleDirectNavigate} />} />
      <Route path="/request-demo" element={<RequestDemo onNavigate={handleDirectNavigate} />} />
      <Route path="/login" element={<Login />} />

      {/* 1. Platform Super Admin Portal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<PlatformRoute />}>
          <Route path="/platform">
            <Route index element={<Navigate to="/platform/dashboard" replace />} />
            <Route
              path="dashboard"
              element={<NavWrapper Component={PlatformDashboard} activeKey="platform-dashboard" layer="platform" />}
            />
            <Route
              path="organizations"
              element={<NavWrapper Component={Organizations} activeKey="platform-organizations" layer="platform" />}
            />
            <Route
              path="onboarding"
              element={<Onboarding onNavigate={handleDirectNavigate} />}
            />
          </Route>
        </Route>
      </Route>

      {/* 2. Organization Portal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<OrganizationRoute />}>
          <Route path="/organization">
            <Route index element={<Navigate to="/organization/dashboard" replace />} />
            <Route
              path="dashboard"
              element={<NavWrapper Component={OrgDashboard} activeKey="org-dashboard" layer="organization" />}
            />
            <Route
              path="assessments"
              element={<NavWrapper Component={AssessmentLibrary} activeKey="org-assessments" layer="organization" />}
            />
            <Route
              path="builder"
              element={<NavWrapper Component={AssessmentBuilder} activeKey="org-assessment-builder" layer="organization" />}
            />
            <Route
              path="question-bank"
              element={<NavWrapper Component={QuestionBank} activeKey="org-question-bank" layer="organization" />}
            />
            <Route
              path="participants"
              element={<NavWrapper Component={ParticipantManagement} activeKey="org-participants" layer="organization" />}
            />
            <Route
              path="participants/profile"
              element={<NavWrapper Component={ParticipantProfile} activeKey="org-participant-profile" layer="organization" />}
            />
            <Route
              path="sessions"
              element={<NavWrapper Component={Sessions} activeKey="org-sessions" layer="organization" />}
            />
            <Route
              path="sessions/review"
              element={<NavWrapper Component={SessionReview} activeKey="org-session-review" layer="organization" />}
            />
            <Route
              path="integrity"
              element={<NavWrapper Component={IntegrityCenter} activeKey="org-integrity" layer="organization" />}
            />
            <Route
              path="integrity/evidence"
              element={<NavWrapper Component={IntegrityEvidence} activeKey="org-integrity-evidence" layer="organization" />}
            />
            <Route
              path="reports"
              element={<NavWrapper Component={Reports} activeKey="org-reports" layer="organization" />}
            />
            <Route
              path="billing"
              element={<NavWrapper Component={Billing} activeKey="org-billing" layer="organization" />}
            />
            <Route
              path="settings"
              element={<NavWrapper Component={Settings} activeKey="org-settings" layer="organization" />}
            />
            <Route
              path="users"
              element={<NavWrapper Component={OrgUsers} activeKey="org-users" layer="organization" />}
            />
            <Route
              path="interviews"
              element={<NavWrapper Component={Interviews} activeKey="org-interviews" layer="organization" />}
            />
            <Route
              path="interviews/room"
              element={<LiveInterview onNavigate={handleDirectNavigate} />}
            />
            <Route
              path="evaluations"
              element={<NavWrapper Component={Evaluations} activeKey="org-evaluations" layer="organization" />}
            />
          </Route>
        </Route>
      </Route>

      {/* 3. Candidate / Participant Examination Portal */}
      <Route element={<ProtectedRoute />}>
        <Route element={<CandidateRoute />}>
          <Route path="/candidate">
            <Route index element={<Navigate to="/candidate/dashboard" replace />} />
            <Route
              path="dashboard"
              element={<NavWrapper Component={CandidateDashboard} activeKey="candidate-dashboard" layer="candidate" />}
            />
            <Route path="system-check" element={<SystemCheck onNavigate={handleDirectNavigate} />} />
            <Route path="consent" element={<Consent onNavigate={handleDirectNavigate} />} />
            <Route path="assessment" element={<AssessmentExperience onNavigate={handleDirectNavigate} />} />
            <Route path="interview" element={<LiveInterview onNavigate={handleDirectNavigate} />} />
            <Route path="evaluation" element={<Evaluation onNavigate={handleDirectNavigate} />} />
          </Route>
        </Route>
      </Route>

      {/* 4. Direct 1-Time Guest & Live Interview Entry Rooms */}
      <Route path="/interview/entry/:token" element={<LiveInterview onNavigate={handleDirectNavigate} />} />
      <Route path="/interview/entry" element={<LiveInterview onNavigate={handleDirectNavigate} />} />
      <Route path="/interview/room" element={<LiveInterview onNavigate={handleDirectNavigate} />} />

      {/* Errors */}
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
