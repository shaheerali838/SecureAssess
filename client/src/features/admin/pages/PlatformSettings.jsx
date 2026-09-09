import React, { useState, useEffect } from 'react';
import {
  Settings, Sliders, Shield, Mail, Server, Database, Save, CheckCircle2,
  RefreshCw, Globe, Lock, Cpu
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, Button, Input, Select, PageHeader, Textarea, SkeletonCards
} from '@/components/ui';
import platformService from '@/services/platform.service';

export function PlatformSettings({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  const [formData, setFormData] = useState({
    platformName: 'SecureAssess Enterprise Assessment Suite',
    supportEmail: 'support@secureassess.io',
    rootDomain: 'secureassess.io',
    complianceNotice: 'All assessment and video interview sessions conducted on this platform are monitored by anti-cheat telemetry and recorded for academic integrity compliance.',
    faceConfidenceThreshold: 85,
    multiplePresenceSensitivity: 'STANDARD',
    voiceActivityThreshold: 65,
    smtpHost: 'smtp.sendgrid.net',
    smtpPort: 587,
    smtpSenderEmail: 'noreply@secureassess.io',
    smtpSenderName: 'SecureAssess Academic Integrity',
    tokenExpiryMinutes: 60,
    gracePeriodSeconds: 30,
    strictIpBinding: true,
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await platformService.getPlatformSettings();
      const payload = res?.data || res || {};
      setFormData((prev) => ({ ...prev, ...payload }));
    } catch (err) {
      console.warn('Settings fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await platformService.updatePlatformSettings(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      console.error('Settings update error:', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Global Configuration"
        subtitle="Universal system defaults, AI proctoring inference thresholds, and cluster policies."
        icon={<Settings size={22} className="text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={saved ? <CheckCircle2 size={15} className="text-white" /> : <Save size={15} className={saving ? 'animate-spin' : ''} />}
              onClick={handleSave}
              disabled={saving}
            >
              {saved ? 'Settings Saved!' : saving ? 'Saving Changes...' : 'Save Platform Changes'}
            </Button>
          </div>
        }
      />

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-accent-200 dark:border-accent-800">
        {[
          { id: 'general', label: 'General & Branding' },
          { id: 'ai', label: 'AI Proctoring & Vision Models' },
          { id: 'smtp', label: 'SMTP & Mail Gateway' },
          { id: 'security', label: 'Security & Session Lifecycles' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-accent-500 hover:text-accent-800 dark:hover:text-accent-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonCards count={1} />
      ) : (
        <>
          {activeTab === 'general' && (
            <Card>
              <CardHeader title="Platform Master Identity" subtitle="Global domain mappings and institutional defaults" />
              <CardBody className="space-y-4 max-w-2xl">
                <Input
                  label="Platform Display Name"
                  value={formData.platformName}
                  onChange={(e) => handleChange('platformName', e.target.value)}
                />
                <Input
                  label="Primary Support Email"
                  value={formData.supportEmail}
                  onChange={(e) => handleChange('supportEmail', e.target.value)}
                />
                <Input
                  label="Root Platform Domain"
                  value={formData.rootDomain}
                  onChange={(e) => handleChange('rootDomain', e.target.value)}
                />
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                    Institutional Welcome Terms / Compliance Notice
                  </label>
                  <Textarea
                    rows={3}
                    value={formData.complianceNotice}
                    onChange={(e) => handleChange('complianceNotice', e.target.value)}
                  />
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'ai' && (
            <Card>
              <CardHeader title="AI Anti-Cheat Vision & Audio Thresholds" subtitle="Fine-tune confidence limits for automated anomaly detection" />
              <CardBody className="space-y-4 max-w-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                    Face Detection Confidence Threshold (%)
                  </label>
                  <Input
                    type="number"
                    value={formData.faceConfidenceThreshold}
                    onChange={(e) => handleChange('faceConfidenceThreshold', Number(e.target.value))}
                  />
                  <p className="text-[11px] text-accent-400">Minimum facial landmark probability before flagging 'No Face Detected'.</p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                    Multiple Presence Sensitivity
                  </label>
                  <Select
                    options={[
                      { value: 'HIGH', label: 'Strict (Flag immediately upon secondary face mesh)' },
                      { value: 'STANDARD', label: 'Standard (Flag after 3 consecutive frames)' },
                      { value: 'RELAXED', label: 'Relaxed (Log event without instant lockdown)' },
                    ]}
                    value={formData.multiplePresenceSensitivity}
                    onChange={(e) => handleChange('multiplePresenceSensitivity', e.target.value)}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                    Voice Activity Detection (VAD) Sensitivity Threshold
                  </label>
                  <Input
                    type="number"
                    value={formData.voiceActivityThreshold}
                    onChange={(e) => handleChange('voiceActivityThreshold', Number(e.target.value))}
                  />
                  <p className="text-[11px] text-accent-400">WebAudio RMS decibel threshold for detecting background whispering or verbal prompting.</p>
                </div>
              </CardBody>
            </Card>
          )}

          {activeTab === 'smtp' && (
            <Card>
              <CardHeader title="Global SMTP Mail Relay" subtitle="Universal transport for student invitations and password resets" />
              <CardBody className="space-y-4 max-w-2xl">
                <Input
                  label="SMTP Host Relay"
                  value={formData.smtpHost}
                  onChange={(e) => handleChange('smtpHost', e.target.value)}
                />
                <Input
                  label="SMTP Port"
                  type="number"
                  value={formData.smtpPort}
                  onChange={(e) => handleChange('smtpPort', Number(e.target.value))}
                />
                <Input
                  label="Sender Email Address"
                  value={formData.smtpSenderEmail}
                  onChange={(e) => handleChange('smtpSenderEmail', e.target.value)}
                />
                <Input
                  label="Sender Display Name"
                  value={formData.smtpSenderName}
                  onChange={(e) => handleChange('smtpSenderName', e.target.value)}
                />
                <Button variant="outline" size="sm" icon={<Mail size={14} />}>
                  Send Diagnostic Test Email
                </Button>
              </CardBody>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <CardHeader title="Global Security & Session Lifecycles" subtitle="Cross-tenant token expiry and strict access policies" />
              <CardBody className="space-y-4 max-w-2xl">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                    JWT Access Token Expiration (Minutes)
                  </label>
                  <Input
                    type="number"
                    value={formData.tokenExpiryMinutes}
                    onChange={(e) => handleChange('tokenExpiryMinutes', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-accent-700 dark:text-accent-300">
                    Candidate Examination Session Grace Period (Seconds)
                  </label>
                  <Input
                    type="number"
                    value={formData.gracePeriodSeconds}
                    onChange={(e) => handleChange('gracePeriodSeconds', Number(e.target.value))}
                  />
                  <p className="text-[11px] text-accent-400">Duration allowed for a candidate to recover connection before automatic session freeze.</p>
                </div>

                <div className="p-3 bg-accent-50 dark:bg-accent-950/60 rounded-xl border border-accent-100 dark:border-accent-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-accent-900 dark:text-white">Strict IP & Hardware Binding</p>
                    <p className="text-[11px] text-accent-400">Invalidate examination attempts if IP changes mid-test</p>
                  </div>
                  <Badge variant={formData.strictIpBinding ? 'success' : 'neutral'}>
                    {formData.strictIpBinding ? 'Enforced' : 'Disabled'}
                  </Badge>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default PlatformSettings;
