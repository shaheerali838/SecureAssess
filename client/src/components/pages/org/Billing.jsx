import React, { useState, useEffect } from 'react';
import {
  CreditCard, Download, ArrowUpRight, Check, Package, Users,
  MonitorPlay, Clock, HardDrive, Shield, RefreshCw, Layers
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, ProgressBar, PageHeader, Toast, EmptyState
} from '@/components/ui';
import subscriptionService from '@/services/subscription.service';

export function Billing({ onNavigate }) {
  const [subscription, setSubscription] = useState(null);
  const [usageMetrics, setUsageMetrics] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchSubscriptionAndUsage = async () => {
    setLoading(true);
    try {
      const [subRes, usageRes, plansRes] = await Promise.allSettled([
        subscriptionService.getCurrentSubscription(),
        subscriptionService.getUsageAndEntitlements(),
        subscriptionService.getPlans(),
      ]);

      if (subRes.status === 'fulfilled' && subRes.value) {
        setSubscription(subRes.value.data || subRes.value);
      }

      if (usageRes.status === 'fulfilled' && usageRes.value) {
        const usageData = usageRes.value.data || usageRes.value;
        setUsageMetrics(usageData);
      }

      if (plansRes.status === 'fulfilled' && plansRes.value) {
        const pItems = Array.isArray(plansRes.value)
          ? plansRes.value
          : plansRes.value.items || plansRes.value.data?.items || plansRes.value.data || [];
        setAvailablePlans(pItems);
      }
    } catch (err) {
      console.warn('Subscription fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionAndUsage();
  }, []);

  const handleUpgrade = async (planKey) => {
    try {
      await subscriptionService.changePlan(planKey);
      setToastMessage({ type: 'success', text: `Upgraded to ${planKey} successfully!` });
      fetchSubscriptionAndUsage();
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Upgrade failed: ' + (err.response?.data?.message || err.message) });
    }
  };

  const planName = subscription?.planCode || subscription?.plan || 'STARTER';
  const limits = usageMetrics?.limits || subscription?.limits || {
    maxAssessments: 100,
    maxCandidates: 500,
    maxQuestions: 500,
    maxUsers: 25,
  };

  const usageCounts = usageMetrics?.usage || {};

  const usage = [
    {
      label: 'Candidate Enrolments',
      value: usageCounts.candidates?.used ?? 0,
      max: usageCounts.candidates?.limit || limits.maxCandidates || 500,
      icon: <Users size={18} />,
      color: 'secondary'
    },
    {
      label: 'Assessments Created',
      value: usageCounts.assessments?.used ?? 0,
      max: usageCounts.assessments?.limit || limits.maxAssessments || 50,
      icon: <MonitorPlay size={18} />,
      color: 'primary'
    },
    {
      label: 'Question Bank Items',
      value: usageCounts.questions?.used ?? 0,
      max: usageCounts.questions?.limit || limits.maxQuestions || 500,
      icon: <Layers size={18} />,
      color: 'primary'
    },
    {
      label: 'Faculty & Proctor Seats',
      value: usageCounts.users?.used ?? 0,
      max: usageCounts.users?.limit || limits.maxUsers || 20,
      icon: <Shield size={18} />,
      color: 'warning'
    },
  ];

  const defaultTiers = [
    {
      name: 'Starter',
      code: 'STARTER',
      price: '$0 / mo',
      description: 'Ideal for departments running pilot examinations and quizzes.',
      features: ['Up to 50 Assessments', 'Up to 250 Candidates', 'Basic Browser Proctoring', 'CSV Gradebook Exports'],
    },
    {
      name: 'Professional',
      code: 'PROFESSIONAL',
      price: '$299 / mo',
      description: 'Full examination suite with live WebRTC interviews and AI anomaly detection.',
      features: ['Up to 500 Assessments', 'Up to 2,500 Candidates', 'Live Dual-Stream Telemetry', 'AI Gaze & Audio Detection', 'Priority Cloud Ingestion'],
    },
    {
      name: 'Enterprise',
      code: 'ENTERPRISE',
      price: 'Custom',
      description: 'Institutional-wide deployment with dedicated high-throughput cluster.',
      features: ['Unlimited Assessments', 'Unlimited Candidates', 'Forensic Timeline Scrubbing', 'Custom LMS Webhook Sync', '99.99% Guaranteed SLA'],
    },
  ];

  const displayPlans = availablePlans.length > 0 ? availablePlans : defaultTiers;

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
          <Button variant="outline" size="sm" icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />} onClick={fetchSubscriptionAndUsage}>
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
                  <Badge variant="primary" dot>{subscription?.status || 'ACTIVE'}</Badge>
                </div>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">Authoritative Cloud Subscription · SecureAssess Multi-Tenant SaaS</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="md" icon={<ArrowUpRight size={15} />} onClick={() => handleUpgrade('PROFESSIONAL')}>
                Upgrade Tier
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Resource Quota Metering */}
      <div>
        <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-3">Authoritative Resource Quota Metering</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {usage.map((u, i) => {
            const pct = u.max > 0 ? Math.min(100, Math.round((u.value / u.max) * 100)) : 0;
            return (
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
                    <span className="text-xs font-bold text-accent-900 dark:text-white font-mono">{pct}%</span>
                  </div>
                  <ProgressBar value={u.value} max={u.max} color={u.color} />
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Tier Plans */}
      <div>
        <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-3">Available Tenant Tiers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {displayPlans.map((plan, i) => {
            const pCode = (plan.code || plan.name || '').toUpperCase();
            const isCurrent = pCode === planName.toUpperCase();
            const planFeatures = Array.isArray(plan.features)
              ? plan.features
              : typeof plan.features === 'object' && plan.features !== null
              ? Object.entries(plan.features).filter(([, v]) => Boolean(v)).map(([k]) => k.replace(/([A-Z])/g, ' $1').trim())
              : ['Standard Testing Engine', 'Secure Proctoring'];

            return (
              <Card key={i} className={`p-5 relative ${isCurrent ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary">Active Subscription</Badge>
                  </div>
                )}
                <h4 className="font-bold text-accent-900 dark:text-white text-sm">{plan.name || plan.code}</h4>
                <p className="text-2xl font-bold font-display text-accent-900 dark:text-white mt-1">{plan.price || (plan.monthlyPrice ? `$${plan.monthlyPrice} / mo` : '$0 / mo')}</p>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 mb-4">{plan.description || 'Enterprise exam engine'}</p>
                <ul className="space-y-1.5 mb-4">
                  {planFeatures.slice(0, 5).map((f, j) => (
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
                  onClick={() => handleUpgrade(pCode)}
                >
                  {isCurrent ? 'Current Tier' : 'Switch to ' + (plan.name || plan.code)}
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
