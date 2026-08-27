 function _optionalChain(ops) { let lastAccessLHS = undefined; let value = ops[0]; let i = 1; while (i < ops.length) { const op = ops[i]; const fn = ops[i + 1]; i += 2; if ((op === 'optionalAccess' || op === 'optionalCall') && value == null) { return undefined; } if (op === 'access' || op === 'optionalAccess') { lastAccessLHS = value; value = fn(value); } else if (op === 'call' || op === 'optionalCall') { value = fn((...args) => value.call(lastAccessLHS, ...args)); lastAccessLHS = undefined; } } return value; }import { useState } from 'react';
import {
  Settings as SettingsIcon, Palette, Users, Shield, Bell, Database, Lock, Plug,
  Building2, FileText, Video, ChevronRight, Check,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, Input, Select, PageHeader,
} from '@/components/ui';






export function Settings({ onNavigate }) {
  const [activeSection, setActiveSection] = useState('organization');

  const sections = [
    { key: 'organization', label: 'Organization', icon: <Building2 size={18} /> },
    { key: 'branding', label: 'Branding', icon: <Palette size={18} /> },
    { key: 'users', label: 'Users', icon: <Users size={18} /> },
    { key: 'roles', label: 'Roles & Permissions', icon: <Shield size={18} /> },
    { key: 'assessment-policies', label: 'Assessment Policies', icon: <FileText size={18} /> },
    { key: 'interview-policies', label: 'Interview Policies', icon: <Video size={18} /> },
    { key: 'integrity-policies', label: 'Integrity Policies', icon: <Shield size={18} /> },
    { key: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { key: 'recording', label: 'Recording', icon: <Video size={18} /> },
    { key: 'retention', label: 'Data Retention', icon: <Database size={18} /> },
    { key: 'security', label: 'Security', icon: <Lock size={18} /> },
    { key: 'integrations', label: 'Integrations', icon: <Plug size={18} /> },
    { key: 'billing', label: 'Billing', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure your organization's workspace"
        icon={<SettingsIcon size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Settings' }]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Settings nav */}
        <Card className="lg:col-span-1 h-fit">
          <CardBody className="p-2 space-y-0.5">
            {sections.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                  activeSection === s.key ? 'bg-primary-50 text-primary-700' : 'text-accent-600 hover:bg-accent-50'
                }`}
              >
                {s.icon}
                <span className="flex-1">{s.label}</span>
                {activeSection === s.key && <ChevronRight size={14} />}
              </button>
            ))}
          </CardBody>
        </Card>

        {/* Settings content */}
        <div className="lg:col-span-3">
          {activeSection === 'organization' && (
            <Card className="animate-fade-in">
              <CardHeader title="Organization Information" subtitle="Basic details about your organization" />
              <CardBody className="space-y-4">
                <Input label="Organization Name" defaultValue="Virtual University" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Country" defaultValue="Pakistan" />
                  <Input label="Website" defaultValue="virtualuniversity.edu" />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input label="Contact Name" defaultValue="Dr. Imran Saleem" />
                  <Input label="Contact Email" defaultValue="imran.saleem@vu.edu" />
                </div>
                <Select label="Industry" options={[
                  { value: 'education', label: 'Education' },
                  { value: 'corporate', label: 'Corporate / Hiring' },
                  { value: 'aviation', label: 'Aviation' },
                ]} />
                <div className="flex justify-end">
                  <Button variant="primary" icon={<Check size={16} />}>Save Changes</Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection === 'branding' && (
            <Card className="animate-fade-in">
              <CardHeader title="Branding" subtitle="Customize your workspace appearance" icon={<Palette size={18} />} />
              <CardBody className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-2">Organization Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-xl">VU</div>
                    <Button variant="outline" size="sm">Upload New Logo</Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-2">Primary Brand Color</label>
                  <div className="flex flex-wrap gap-2">
                    {['#1d4ed8', '#0d9488', '#7c3aed', '#0f766e', '#1e3a8a', '#b45309', '#dc2626', '#475569'].map((c) => (
                      <button key={c} className={`w-10 h-10 rounded-lg transition-all hover:scale-105 ring-2 ring-offset-2 ring-accent-200`} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-accent-700 mb-2">Terminology</label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Participants" defaultValue="Students" />
                    <Input label="Assessments" defaultValue="Examinations" />
                    <Input label="Programs" defaultValue="Courses" />
                    <Input label="Results" defaultValue="Results" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="primary" icon={<Check size={16} />}>Save Branding</Button>
                </div>
              </CardBody>
            </Card>
          )}

          {activeSection === 'users' && (
            <Card className="animate-fade-in">
              <CardHeader title="Users" subtitle="Manage organization members" icon={<Users size={18} />} action={<Button variant="primary" size="sm">Invite User</Button>} />
              <CardBody className="p-0">
                <div className="divide-y divide-accent-50">
                  {[
                    { name: 'Sarah Mitchell', email: 'sarah@vu.edu', role: 'Organization Admin', status: 'Active' },
                    { name: 'Prof. Aisha Khan', email: 'aisha.khan@vu.edu', role: 'Examiner', status: 'Active' },
                    { name: 'Dr. Bilal Rahman', email: 'bilal@vu.edu', role: 'Teacher', status: 'Active' },
                    { name: 'Nadia Baig', email: 'nadia@vu.edu', role: 'Reviewer', status: 'Invited' },
                  ].map((u, i) => (
                    <div key={i} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm">
                        {u.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-accent-800">{u.name}</p>
                        <p className="text-xs text-accent-500">{u.email}</p>
                      </div>
                      <Badge variant="neutral">{u.role}</Badge>
                      <Badge variant={u.status === 'Active' ? 'success' : 'info'} dot>{u.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}

          {(activeSection === 'roles' || activeSection === 'assessment-policies' || activeSection === 'interview-policies' || activeSection === 'integrity-policies' || activeSection === 'notifications' || activeSection === 'recording' || activeSection === 'retention' || activeSection === 'security' || activeSection === 'integrations' || activeSection === 'billing') && (
            <Card className="animate-fade-in">
              <CardHeader title={_optionalChain([sections, 'access', _ => _.find, 'call', _2 => _2(s => s.key === activeSection), 'optionalAccess', _3 => _3.label]) || 'Settings'} subtitle="Configure your preferences" icon={_optionalChain([sections, 'access', _4 => _4.find, 'call', _5 => _5(s => s.key === activeSection), 'optionalAccess', _6 => _6.icon])} />
              <CardBody className="space-y-3">
                {[
                  { label: 'Enable feature', desc: 'Description of what this setting controls', checked: true },
                  { label: 'Enable feature', desc: 'Description of what this setting controls', checked: true },
                  { label: 'Enable feature', desc: 'Description of what this setting controls', checked: false },
                  { label: 'Enable feature', desc: 'Description of what this setting controls', checked: true },
                  { label: 'Enable feature', desc: 'Description of what this setting controls', checked: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-start justify-between p-3.5 bg-accent-50 rounded-lg">
                    <div className="flex-1 mr-4">
                      <p className="text-sm font-medium text-accent-800">{s.label}</p>
                      <p className="text-xs text-accent-500 mt-0.5">{s.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" defaultChecked={s.checked} className="sr-only peer" />
                      <div className="w-11 h-6 bg-accent-300 rounded-full peer peer-checked:bg-primary-500 transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button variant="primary" icon={<Check size={16} />}>Save Changes</Button>
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
