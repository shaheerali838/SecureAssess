import React, { useState, useEffect } from 'react';
import {
  CreditCard, Download, ArrowUpRight, Check, Package, Users,
  MonitorPlay, Clock, HardDrive, Shield, RefreshCw
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, ProgressBar, PageHeader, Toast
} from '@/components/ui';
import { plans } from '@/data';
import subscriptionService from '@/services/subscription.service';

export function Billing({ onNavigate }) {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const data = await subscriptionService.getCurrentSubscription();
      setSubscription(data?.data || data);
    } catch (err) {
      console.warn('Subscription fetch fallback note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleUpgrade = async (planKey) => {
    try {
      await subscriptionService.changePlan(planKey);
      setToastMessage({ type: 'success', text: `Upgraded to ${planKey} successfully!` });
      fetchSubscription();
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Upgrade failed: ' + err.message });
    }
  };

  const planName = subscription?.plan || 'ENTERPRISE';
  const limits = subscription?.limits || {
    maxAssessments: 1000,
    maxCandidates: 10000,
    maxConcurrentAttempts: 500,
    maxProctoringHoursPerMonth: 500,
    maxStorageGB: 100,
  };

  const usage = [
    { label: 'Max Assessments Allowed', value: limits.maxAssessments || 50, max: limits.maxAssessments || 50, icon: <MonitorPlay size={18} />, color: 'primary' },
    { label: 'Max Candidates Limit', value: limits.maxCandidates || 500, max: limits.maxCandidates || 500, icon: <Users size={18} />, color: 'secondary' },
    { label: 'Proctoring Monthly Hours', value: limits.maxProctoringHoursPerMonth || 100, max: limits.maxProctoringHoursPerMonth || 100, icon: <Clock size={18} />, color: 'primary' },
    { label: 'Evidence Cloud Storage', value: limits.maxStorageGB || 50, max: limits.maxStorageGB || 50, unit: 'GB', icon: <HardDrive size={18} />, color: 'warning' },
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
        title="Subscription & Resource Billing"
        subtitle="Manage your tenant subscription tier, examinee quotas, and invoice receipts."
        icon={<CreditCard size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Billing' }]}
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={fetchSubscription}>
            Refresh
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
                  <h2 className="text-lg font-bold font-display text-accent-900 dark:text-white">{planName} Tier License</h2>
                  <Badge variant="primary" dot>{subscription?.status || 'Active'}</Badge>
                </div>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">Authoritative Cloud Subscription · SecureAssess SaaS</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="md" icon={<ArrowUpRight size={15} />} onClick={() => handleUpgrade('PROFESSIONAL')}>
                Change Tier
              </Button>
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
                  <span className="text-xs font-bold text-accent-900 dark:text-white font-mono">100%</span>
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
          {plans.map((plan, i) => {
            const isCurrent = plan.name.toUpperCase() === planName.toUpperCase();
            return (
              <Card key={i} className={`p-5 relative ${isCurrent ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
                {isCurrent && (
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
                  variant={isCurrent ? 'outline' : 'primary'}
                  fullWidth
                  size="sm"
                  disabled={isCurrent}
                  onClick={() => handleUpgrade(plan.name === 'Starter' ? 'STARTER' : plan.name === 'Professional' ? 'PROFESSIONAL' : 'ENTERPRISE')}
                >
                  {isCurrent ? 'Current Tier' : plan.cta}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Billing;
