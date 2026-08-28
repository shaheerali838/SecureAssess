import React from 'react';
import {
  CreditCard, Download, ArrowUpRight, Check, Package, Users,
  MonitorPlay, Clock, HardDrive, Shield
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, ProgressBar, PageHeader,
} from '@/components/ui';
import { plans } from '@/data';

export function Billing({ onNavigate }) {
  const usage = [
    { label: 'Assessment Sessions', value: 8420, max: 10000, icon: <MonitorPlay size={18} />, color: 'primary' },
    { label: 'Enrolled Candidates', value: 184, max: 250, icon: <Users size={18} />, color: 'secondary' },
    { label: 'WebRTC Proctoring Minutes', value: 1240, max: 2000, icon: <Clock size={18} />, color: 'primary' },
    { label: 'Evidence Cloud Storage', value: 68, max: 100, unit: 'GB', icon: <HardDrive size={18} />, color: 'warning' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription & Resource Billing"
        subtitle="Manage your tenant subscription tier, examinee quotas, and invoice receipts."
        icon={<CreditCard size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Billing' }]}
        actions={
          <Button variant="outline" size="sm" icon={<Download size={15} />}>
            Download Statements
          </Button>
        }
      />

      {/* Active Subscription Tier */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-soft">
                <Package size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold font-display text-accent-900 dark:text-white">Enterprise Tier License</h2>
                  <Badge variant="primary" dot>Active</Badge>
                </div>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">$899 / month · Auto-renews on Sep 15, 2026</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="md">Manage Seats</Button>
              <Button variant="primary" size="md" icon={<ArrowUpRight size={15} />}>Upgrade Quotas</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Resource Quota Metering */}
      <div>
        <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-3">Resource Quota Metering</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {usage.map((u, i) => (
            <Card key={i}>
              <CardBody className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-soft ${
                      u.color === 'primary' ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400' :
                      u.color === 'secondary' ? 'bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 dark:text-secondary-400' :
                      u.color === 'warning' ? 'bg-warning-50 dark:bg-warning-950/60 text-warning-600 dark:text-warning-400' : 'bg-accent-100 dark:bg-accent-800 text-accent-600'
                    }`}
                  >
                    {u.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">{u.label}</p>
                    <p className="text-[11px] text-accent-500 dark:text-accent-400 font-mono">
                      {u.value.toLocaleString()} / {u.max.toLocaleString()}{u.unit || ''}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-accent-900 dark:text-white font-mono">{Math.round((u.value / u.max) * 100)}%</span>
                </div>
                <ProgressBar value={u.value} max={u.max} color={u.color} />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Tier Plans */}
      <div>
        <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-3">Available Tenant Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <Card key={i} className={`p-5 relative ${plan.name === 'Enterprise' ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
              {plan.name === 'Enterprise' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="primary">Active Subscription</Badge>
                </div>
              )}
              <h4 className="font-bold text-accent-900 dark:text-white text-sm">{plan.name}</h4>
              <p className="text-2xl font-bold font-display text-accent-900 dark:text-white mt-1">{plan.price}</p>
              <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 mb-4">{plan.description}</p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.slice(0, 5).map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-accent-600 dark:text-accent-300">
                    <Check size={14} className="text-success-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.name === 'Enterprise' ? 'outline' : 'primary'}
                fullWidth
                size="sm"
                disabled={plan.name === 'Enterprise'}
              >
                {plan.name === 'Enterprise' ? 'Current Tier' : plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing Invoices */}
      <Card>
        <CardHeader title="Invoice Receipts" subtitle="VAT and downloadable tax invoices" icon={<CreditCard size={18} />} />
        <CardBody className="p-0">
          <div className="divide-y divide-accent-100 dark:divide-accent-800">
            {[
              { date: 'Aug 15, 2026', amount: '$899.00', status: 'Paid', invoice: 'INV-2026-008' },
              { date: 'Jul 15, 2026', amount: '$899.00', status: 'Paid', invoice: 'INV-2026-007' },
              { date: 'Jun 15, 2026', amount: '$899.00', status: 'Paid', invoice: 'INV-2026-006' },
              { date: 'May 15, 2026', amount: '$299.00', status: 'Paid', invoice: 'INV-2026-005' },
            ].map((inv, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3.5 hover:bg-accent-50/50 dark:hover:bg-accent-800/30 transition-colors">
                <div>
                  <p className="text-xs font-semibold text-accent-900 dark:text-white font-mono">{inv.invoice}</p>
                  <p className="text-[11px] text-accent-500 dark:text-accent-400">{inv.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold text-accent-900 dark:text-white font-mono">{inv.amount}</span>
                  <Badge variant="success" dot>{inv.status}</Badge>
                  <Button variant="ghost" size="sm" icon={<Download size={13} />}>PDF</Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Billing;
