import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { LandingPage } from '@/components/pages/LandingPage';
import { RequestDemo } from '@/components/pages/RequestDemo';
import { PlatformDashboard } from '@/components/pages/platform/PlatformDashboard';
import { Organizations } from '@/components/pages/platform/Organizations';
import { Onboarding } from '@/components/pages/platform/Onboarding';
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
import { SystemCheck } from '@/components/pages/participant/SystemCheck';
import { Consent } from '@/components/pages/participant/Consent';
import { AssessmentExperience } from '@/components/pages/participant/AssessmentExperience';
import { LiveInterview } from '@/components/pages/participant/LiveInterview';
import { Evaluation } from '@/components/pages/participant/Evaluation';
import { organizations } from '@/data';


function App() {
  const [view, setView] = useState('landing');
  const [navContext, setNavContext] = useState({ layer: 'public' });

  const navigate = (v) => {
    if (v.startsWith('platform-')) {
      setNavContext({ layer: 'platform' });
    } else if (v.startsWith('org-')) {
      setNavContext({ layer: 'organization', orgId: 'org-vu' });
    } else if (v.startsWith('participant-')) {
      setNavContext({ layer: 'participant' });
    } else {
      setNavContext({ layer: 'public' });
    }
    setView(v);
    window.scrollTo(0, 0);
  };

  const exitToLanding = () => navigate('landing');

  // Participant experience pages (full screen, no sidebar)
  if (view === 'participant-system-check') return <SystemCheck onNavigate={navigate} />;
  if (view === 'participant-consent') return <Consent onNavigate={navigate} />;
  if (view === 'participant-assessment') return <AssessmentExperience onNavigate={navigate} />;
  if (view === 'participant-interview') return <LiveInterview onNavigate={navigate} />;
  if (view === 'participant-evaluation') return <Evaluation onNavigate={navigate} />;

  // Public pages (no sidebar)
  if (view === 'landing') return <LandingPage onNavigate={navigate} />;
  if (view === 'request-demo') return <RequestDemo onNavigate={navigate} />;

  // Onboarding (full screen)
  if (view === 'platform-onboarding') return <Onboarding onNavigate={navigate} />;

  // Platform admin pages (with sidebar)
  if (navContext.layer === 'platform') {
    return (
      <AppShell context={navContext} activeView={view} onNavigate={navigate} onExit={exitToLanding}>
        {view === 'platform-dashboard' && <PlatformDashboard onNavigate={navigate} />}
        {view === 'platform-organizations' && <Organizations onNavigate={navigate} />}
      </AppShell>
    );
  }

  // Organization pages (with sidebar)
  if (navContext.layer === 'organization') {
    const org = organizations.find(o => o.id === navContext.orgId) || organizations[0];
    return (
      <AppShell
        context={navContext}
        activeView={view}
        onNavigate={navigate}
        onExit={exitToLanding}
        orgName={org.name}
        orgLogoText={org.logoText}
        orgBrandColor={org.brandColor}
      >
        {view === 'org-dashboard' && <OrgDashboard onNavigate={navigate} />}
        {view === 'org-assessments' && <AssessmentLibrary onNavigate={navigate} />}
        {view === 'org-assessment-builder' && <AssessmentBuilder onNavigate={navigate} />}
        {view === 'org-question-bank' && <QuestionBank onNavigate={navigate} />}
        {view === 'org-participants' && <ParticipantManagement onNavigate={navigate} />}
        {view === 'org-participant-profile' && <ParticipantProfile onNavigate={navigate} />}
        {view === 'org-sessions' && <Sessions onNavigate={navigate} />}
        {view === 'org-session-review' && <SessionReview onNavigate={navigate} />}
        {view === 'org-integrity' && <IntegrityCenter onNavigate={navigate} />}
        {view === 'org-integrity-evidence' && <IntegrityEvidence onNavigate={navigate} />}
        {view === 'org-reports' && <Reports onNavigate={navigate} />}
        {view === 'org-billing' && <Billing onNavigate={navigate} />}
        {view === 'org-settings' && <Settings onNavigate={navigate} />}
        {view === 'org-users' && <OrgUsers onNavigate={navigate} />}
        {view === 'org-interviews' && <Interviews onNavigate={navigate} />}
        {view === 'org-evaluations' && <Evaluations onNavigate={navigate} />}
      </AppShell>
    );
  }

  return <LandingPage onNavigate={navigate} />;
}

export default App;
