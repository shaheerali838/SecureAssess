import {
  CreditCard, Download, ArrowUpRight, Check, Package, Users,
  MonitorPlay, Clock, HardDrive,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, ProgressBar, PageHeader,
} from '@/components/ui';
import { plans } from '@/data';






export function Billing({ onNavigate }) {
  const usage = [
    { label: 'Assessment Sessions', value: 8420, max: 10000, icon: <MonitorPlay size={18} />, color: 'primary'  },
    { label: 'Active Users', value: 184, max: 250, icon: <Users size={18} />, color: 'secondary'  },
    { label: 'Interview Minutes', value: 1240, max: 2000, icon: <Clock size={18} />, color: 'primary'  },
    { label: 'Storage', value: 68, max: 100, unit: 'GB', icon: <HardDrive size={18} />, color: 'warning'  },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscription"
        subtitle="Manage your plan, usage, and billing"
        icon={<CreditCard size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Billing' }]}
        actions={<Button variant="outline" size="sm" icon={<Download size={16} />}>Download Invoices</Button>}
      />

      {/* Current plan */}
      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center">
                <Package size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold font-display text-accent-900">Professional Plan</h2>
                  <Badge variant="primary" dot>Active</Badge>
                </div>
                <p className="text-sm text-accent-500 mt-0.5">$899/month · Renews on Sep 15, 2026</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="md">Manage Subscription</Button>
              <Button variant="primary" size="md" icon={<ArrowUpRight size={16} />}>Upgrade Plan</Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Usage */}
      <div>
        <h3 className="text-sm font-semibold text-accent-700 mb-3">Current Usage</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {usage.map((u, i) => (
            <Card key={i}>
              <CardBody>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    u.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                    u.color === 'secondary' ? 'bg-secondary-50 text-secondary-600' :
                    u.color === 'warning' ? 'bg-warning-50 text-warning-600' : 'bg-accent-100 text-accent-600'
                  }`}>{u.icon}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-accent-700">{u.label}</p>
                    <p className="text-xs text-accent-400">{u.value.toLocaleString()} / {u.max.toLocaleString()}{u.unit || ''}</p>
                  </div>
                  <span className="text-sm font-bold text-accent-900">{Math.round((u.value / u.max) * 100)}%</span>
                </div>
                <ProgressBar value={u.value} max={u.max} color={u.color} />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Available plans */}
      <div>
        <h3 className="text-sm font-semibold text-accent-700 mb-3">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <Card key={i} className={`p-5 relative ${plan.name === 'Professional' ? 'ring-2 ring-primary-500' : ''}`}>
              {plan.name === 'Professional' && <div className="absolute -top-3 left-1/2 -translate-x-1/2"><Badge variant="primary">Current</Badge></div>}
              <h4 className="font-bold text-accent-900">{plan.name}</h4>
              <p className="text-2xl font-bold font-display text-accent-900 mt-1">{plan.price}</p>
              <p className="text-xs text-accent-500 mt-1 mb-4">{plan.description}</p>
              <ul className="space-y-1.5 mb-4">
                {plan.features.slice(0, 5).map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-xs text-accent-600">
                    <Check size={14} className="text-success-500 shrink-0 mt-0.5" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.name === 'Professional' ? 'outline' : plan.name === 'Enterprise' ? 'secondary' : 'primary'}
                fullWidth
                size="sm"
                disabled={plan.name === 'Professional'}
              >
                {plan.name === 'Professional' ? 'Current Plan' : plan.cta}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing history */}
      <Card>
        <CardHeader title="Billing History" subtitle="Recent invoices" icon={<CreditCard size={18} />} />
        <CardBody className="p-0">
          <div className="divide-y divide-accent-50">
            {[
              { date: 'Aug 15, 2026', amount: '$899.00', status: 'Paid', invoice: 'INV-2026-008' },
              { date: 'Jul 15, 2026', amount: '$899.00', status: 'Paid', invoice: 'INV-2026-007' },
              { date: 'Jun 15, 2026', amount: '$899.00', status: 'Paid', invoice: 'INV-2026-006' },
              { date: 'May 15, 2026', amount: '$299.00', status: 'Paid', invoice: 'INV-2026-005' },
            ].map((inv, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium text-accent-800">{inv.invoice}</p>
                  <p className="text-xs text-accent-500">{inv.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-accent-900">{inv.amount}</span>
                  <Badge variant="success" dot>{inv.status}</Badge>
                  <Button variant="ghost" size="sm" icon={<Download size={14} />}>PDF</Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
