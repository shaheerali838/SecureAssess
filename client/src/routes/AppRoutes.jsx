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
import { CertificateVerify } from '@/pages/public/CertificateVerify';

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
import { Notifications } from '@/modules/notifications/pages/Notifications';
import { AuditLogs } from '@/modules/auditLogs/pages/AuditLogs';
import { OrgStructure } from '@/components/pages/org/OrgStructure';
import { AcademicStructure } from '@/components/pages/org/AcademicStructure';
import { RubricsManager } from '@/components/pages/org/RubricsManager';

// Candidate Examination Views
import { SystemCheck } from '@/components/pages/participant/SystemCheck';
import { Consent } from '@/components/pages/participant/Consent';
import { AssessmentExperience } from '@/components/pages/participant/AssessmentExperience';
import { LiveInterview } from '@/components/pages/participant/LiveInterview';
import { Evaluation } from '@/components/pages/participant/Evaluation';
import { CandidatePortal } from '@/components/pages/participant/CandidatePortal';

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
      'platform-onboarding': '/platform/onboarding',
      'org-dashboard': '/organization/dashboard',
      'org-assessments': '/organization/assessments',
      'org-assessment-builder': '/organization/builder',
      'org-question-bank': '/organization/question-bank',
      'org-participants': '/organization/participants',
      'org-participant-profile': '/organization/participants/profile',
      'org-sessions': '/organization/sessions',
      'org-session-review': '/organization/sessions/review',
      'org-integrity': '/organization/integrity',
      'org-integrity-evidence': '/organization/integrity/evidence',
      'org-reports': '/organization/reports',
      'org-billing': '/organization/billing',
      'org-settings': '/organization/settings',
      'org-users': '/organization/users',
      'org-interviews': '/organization/interviews',
      'org-evaluations': '/organization/evaluations',
      'org-notifications': '/organization/notifications',
      'org-audit-logs': '/organization/audit-logs',
      'org-academic-structure': '/organization/academic-structure',
      'org-departments': '/organization/academic-structure',
      'org-rubrics': '/organization/rubrics',
      'platform-audit-logs': '/platform/audit-logs',
      'candidate-portal': '/candidate/portal',
      'candidate-dashboard': '/candidate/portal',
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
      'platform-onboarding': '/platform/onboarding',
      'platform-audit-logs': '/platform/audit-logs',
      'org-dashboard': '/organization/dashboard',
      'org-assessments': '/organization/assessments',
      'org-assessment-builder': '/organization/builder',
      'org-question-bank': '/organization/question-bank',
      'org-participants': '/organization/participants',
      'org-participant-profile': '/organization/participants/profile',
      'org-sessions': '/organization/sessions',
      'org-session-review': '/organization/sessions/review',
      'org-integrity': '/organization/integrity',
      'org-integrity-evidence': '/organization/integrity/evidence',
      'org-reports': '/organization/reports',
      'org-billing': '/organization/billing',
      'org-settings': '/organization/settings',
      'org-users': '/organization/users',
      'org-interviews': '/organization/interviews',
      'org-evaluations': '/organization/evaluations',
      'org-notifications': '/organization/notifications',
      'org-audit-logs': '/organization/audit-logs',
      'org-academic-structure': '/organization/academic-structure',
      'org-departments': '/organization/academic-structure',
      'org-rubrics': '/organization/rubrics',
      'candidate-portal': '/candidate/portal',
      'candidate-dashboard': '/candidate/portal',
      'participant-system-check': '/candidate/system-check',
      'participant-consent': '/candidate/consent',
      'participant-assessment': '/candidate/assessment',
      'participant-interview': '/candidate/interview',
      'participant-evaluation': '/candidate/evaluation',
    };
    if (keyMap[targetKey]) {
      navigate(keyMap[targetKey]);
    } else if (typeof targetKey === 'string' && targetKey.startsWith('/')) {
      navigate(targetKey);
    } else {
      navigate('/organization/dashboard');
    }
  };

  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage onNavigate={handleDirectNavigate} />} />
      <Route path="/request-demo" element={<RequestDemo onNavigate={handleDirectNavigate} />} />
      <Route path="/login" element={<Login />} />
      <Route path="/verify" element={<CertificateVerify />} />
      <Route path="/verify/:verificationCode" element={<CertificateVerify />} />
      <Route path="/certificates/verify" element={<CertificateVerify />} />
      <Route path="/certificates/verify/:verificationCode" element={<CertificateVerify />} />

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
            <Route
              path="audit-logs"
              element={<NavWrapper Component={AuditLogs} activeKey="platform-audit-logs" layer="platform" />}
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
              path="evaluations"
              element={<NavWrapper Component={Evaluations} activeKey="org-evaluations" layer="organization" />}
            />
            <Route
              path="notifications"
              element={<NavWrapper Component={Notifications} activeKey="org-notifications" layer="organization" />}
            />
            <Route
              path="audit-logs"
              element={<NavWrapper Component={AuditLogs} activeKey="org-audit-logs" layer="organization" />}
            />
            <Route
              path="structure"
              element={<NavWrapper Component={OrgStructure} activeKey="org-academic-structure" layer="organization" />}
            />
            <Route
              path="org-structure"
              element={<NavWrapper Component={OrgStructure} activeKey="org-academic-structure" layer="organization" />}
            />
            <Route
              path="academic-structure"
              element={<NavWrapper Component={OrgStructure} activeKey="org-academic-structure" layer="organization" />}
            />
            <Route
              path="departments"
              element={<NavWrapper Component={OrgStructure} activeKey="org-academic-structure" layer="organization" />}
            />
            <Route
              path="rubrics"
              element={<NavWrapper Component={RubricsManager} activeKey="org-rubrics" layer="organization" />}
            />
          </Route>
        </Route>
      </Route>

      {/* 3. Candidate / Participant Examination Portal */}
      <Route path="/candidate">
        <Route index element={<Navigate to="/candidate/portal" replace />} />
        <Route path="portal" element={<CandidatePortal onNavigate={handleDirectNavigate} />} />
        <Route path="dashboard" element={<CandidatePortal onNavigate={handleDirectNavigate} />} />
        <Route path="system-check" element={<SystemCheck onNavigate={handleDirectNavigate} />} />
        <Route path="consent" element={<Consent onNavigate={handleDirectNavigate} />} />
        <Route path="assessment" element={<AssessmentExperience onNavigate={handleDirectNavigate} />} />
        <Route path="interview" element={<LiveInterview onNavigate={handleDirectNavigate} />} />
        <Route path="evaluation" element={<Evaluation onNavigate={handleDirectNavigate} />} />
      </Route>

      {/* Errors */}
      <Route path="/forbidden" element={<Forbidden />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
