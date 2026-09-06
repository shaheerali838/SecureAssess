import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon, Palette, Users, Shield, Bell, Database, Lock, Plug,
  Building2, FileText, Video, ChevronRight, Check, RefreshCw
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, Input, Select, PageHeader, Toast
} from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import organizationService from '@/services/organization.service';

export function Settings({ onNavigate }) {
  const { currentOrganization, fetchMemberships } = useOrganization();
  const [activeSection, setActiveSection] = useState('organization');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [country, setCountry] = useState('United States');
  const [contactEmail, setContactEmail] = useState('');
  const [industry, setIndustry] = useState('education');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');

  useEffect(() => {
    if (currentOrganization) {
      setName(currentOrganization.name || '');
      setDomain(currentOrganization.domain || currentOrganization.website || '');
      setCountry(currentOrganization.country || 'United States');
      setContactEmail(currentOrganization.contactEmail || currentOrganization.billingEmail || '');
      setIndustry(currentOrganization.industry || currentOrganization.type || 'education');
      if (currentOrganization.branding?.primaryColor) {
        setPrimaryColor(currentOrganization.branding.primaryColor);
      }
    }
  }, [currentOrganization]);

  const handleSaveOrganization = async () => {
    const orgId = currentOrganization?._id || currentOrganization?.id;
    if (!orgId) {
      setToastMessage({ type: 'error', text: 'No active organization context found.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await organizationService.updateOrganization(orgId, {
        name,
        domain,
        country,
        contactEmail,
        industry,
        branding: {
          ...currentOrganization.branding,
          primaryColor,
        },
      });
      setToastMessage({ type: 'success', text: 'Organization profile updated successfully in database!' });
      if (typeof fetchMemberships === 'function') {
        fetchMemberships();
      }
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Update failed: ' + (err.response?.data?.message || err.message) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    { key: 'organization', label: 'Tenant Identity', icon: <Building2 size={16} /> },
    { key: 'branding', label: 'Brand & Portal Styling', icon: <Palette size={16} /> },
    { key: 'assessment-policies', label: 'Assessment Policies', icon: <FileText size={16} /> },
    { key: 'integrity-policies', label: 'Proctoring Parameters', icon: <Shield size={16} /> },
    { key: 'retention', label: 'GDPR & Data Retention', icon: <Database size={16} /> },
    { key: 'security', label: 'MFA & Authentication', icon: <Lock size={16} /> },
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <PageHeader
        title="Workspace Configuration"
        subtitle="Manage organization preferences, security thresholds, and brand identities."
        icon={<SettingsIcon size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-2 space-y-1">
            {sections.map((s) => {
              const isActive = activeSection === s.key;
              return (
                <button
                  key={s.key}
                  onClick={() => setActiveSection(s.key)}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/40'
                      : 'text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-800 hover:text-accent-900 dark:hover:text-white'
                  }`}
                >
                  {s.icon}
                  <span className="flex-1">{s.label}</span>
                  {isActive && <ChevronRight size={14} />}
                </button>
              );
            })}
          </CardBody>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          {activeSection === 'organization' && (
            <Card className="animate-fade-in">
              <CardHeader title="Organization Profile" subtitle="General institutional details and public contact channels" />
              <CardBody className="p-5 space-y-4">
                <Input
                  label="Organization Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stanford Engineering Faculty"
                />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Country / Region"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                  <Input
                    label="Domain Website"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="https://institution.edu"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Administrative Contact Email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="admin@institution.edu"
                  />
                  <Select
                    label="Accreditation Domain"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    options={[
                      { value: 'education', label: 'Higher Education / University' },
                      { value: 'corporate', label: 'Corporate / Technical Hiring' },
                      { value: 'aviation', label: 'Aviation & Defense Certification' },
                    ]}
                  />
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    icon={<Check size={16} />}
                    loading={isSubmitting}
                    onClick={handleSaveOrganization}
                  >
                    Save Profile
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection === 'branding' && (
            <Card className="animate-fade-in">
              <CardHeader title="Portal Branding & Theme" subtitle="Custom examinee workspace styling" icon={<Palette size={18} />} />
              <CardBody className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-2">Organization Monogram</label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-soft"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {name ? name.slice(0, 2).toUpperCase() : 'SA'}
                    </div>
                    <Button variant="outline" size="sm">Upload High-Res Vector SVG</Button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-2">Theme Accent Palette</label>
                  <div className="flex flex-wrap gap-2">
                    {['#2563eb', '#0d9488', '#7c3aed', '#059669', '#1e3a8a', '#d97706', '#dc2626', '#475569'].map((c) => (
                      <button
                        key={c}
                        onClick={() => setPrimaryColor(c)}
                        className={`w-9 h-9 rounded-xl transition-all hover:scale-105 ring-2 ring-offset-2 cursor-pointer ${
                          primaryColor === c ? 'ring-primary-600 scale-105' : 'ring-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="primary"
                    icon={<Check size={16} />}
                    loading={isSubmitting}
                    onClick={handleSaveOrganization}
                  >
                    Apply Styling
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection !== 'organization' && activeSection !== 'branding' && (
            <Card className="animate-fade-in">
              <CardHeader
                title={sections.find((s) => s.key === activeSection)?.label || 'Configuration'}
                subtitle="Fine-tune enforcement rules and security thresholds"
                icon={sections.find((s) => s.key === activeSection)?.icon}
              />
              <CardBody className="p-5 space-y-3">
                {[
                  { label: 'Require Dual-Camera Telemetry Feed', desc: 'Demands secondary mobile webcam for wide-room angle verification.', checked: true },
                  { label: 'Lock Active Window & Browser Tab Focus', desc: 'Enforces full-screen kiosk mode and alerts on blur events.', checked: true },
                  { label: 'Enforce Biometric Face Verification at Start', desc: 'Authenticates examinee identity against student ID database.', checked: true },
                  { label: 'Automated Audio Anomaly Flagging', desc: 'Highlights multi-speaker or speech noise during silent questions.', checked: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-start justify-between p-3.5 bg-accent-50/60 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700/60 rounded-xl">
                    <div className="flex-1 mr-4">
                      <p className="text-xs font-bold text-accent-900 dark:text-white">{s.label}</p>
                      <p className="text-[11px] text-accent-500 dark:text-accent-400 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input type="checkbox" defaultChecked={s.checked} className="sr-only peer" />
                      <div className="w-10 h-5 bg-accent-300 dark:bg-accent-700 rounded-full peer peer-checked:bg-primary-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
                <div className="flex justify-end pt-3">
                  <Button
                    variant="primary"
                    icon={<Check size={16} />}
                    loading={isSubmitting}
                    onClick={handleSaveOrganization}
                  >
                    Save Parameters
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
