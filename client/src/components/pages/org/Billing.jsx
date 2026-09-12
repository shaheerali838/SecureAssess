import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard, Download, ArrowUpRight, Check, Package, Users,
  MonitorPlay, Clock, HardDrive, Shield, RefreshCw, Layers,
  Calendar, AlertCircle, FileText, CheckCircle2, ChevronRight,
  ExternalLink, Sparkles, AlertTriangle, Printer, Copy
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, ProgressBar, PageHeader, Toast,
  Modal, EmptyState, SkeletonCards, SkeletonTable
} from '@/components/ui';
import { useOrganization } from '@/contexts/OrganizationContext';
import subscriptionService from '@/services/subscription.service';

export function Billing({ onNavigate }) {
  const { currentOrganization, currentOrgId } = useOrganization();

  // State
  const [subscription, setSubscription] = useState(null);
  const [usageMetrics, setUsageMetrics] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [billingSummary, setBillingSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [accessForbidden, setAccessForbidden] = useState(false);
  const [forbiddenReason, setForbiddenReason] = useState('');

  // Upgrade Modal State
  const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Receipt Modal State
  const [selectedInvoiceForReceipt, setSelectedInvoiceForReceipt] = useState(null);
  const [copiedInvoiceId, setCopiedInvoiceId] = useState(false);

  // Fetch all live subscription and billing data from database
  const fetchSubscriptionAndBilling = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const orgId = currentOrgId || currentOrganization?._id || currentOrganization?.id;

      const [subRes, usageRes, plansRes, invoicesRes, summaryRes] = await Promise.allSettled([
        subscriptionService.getCurrentSubscription(orgId),
        subscriptionService.getUsageAndEntitlements(orgId),
        subscriptionService.getPlans(),
        subscriptionService.getInvoices({}, orgId),
        subscriptionService.getBillingSummary(orgId),
      ]);

      // Check if access was denied due to missing billing permissions
      const is403 = [subRes, usageRes].some(
        (r) =>
          r.status === 'rejected' &&
          (r.reason?.status === 403 ||
            r.reason?.message?.includes('Forbidden') ||
            r.reason?.response?.status === 403)
      );

      if (is403) {
        setAccessForbidden(true);
        const reasonMsg =
          subRes.reason?.message ||
          usageRes.reason?.message ||
          'You do not have permission to view institutional billing details.';
        setForbiddenReason(reasonMsg);
      } else {
        setAccessForbidden(false);
      }

      // 1. Current Subscription
      if (subRes.status === 'fulfilled' && subRes.value) {
        const subData = subRes.value.data || subRes.value;
        setSubscription(subData.subscription || subData);
      }

      // 2. Usage & Entitlements
      if (usageRes.status === 'fulfilled' && usageRes.value) {
        const usageData = usageRes.value.data || usageRes.value;
        setUsageMetrics(usageData);
        if (usageData.subscription && !subscription) {
          setSubscription(usageData.subscription);
        }
      }

      // 3. Platform Plans
      if (plansRes.status === 'fulfilled' && plansRes.value) {
        const pItems = Array.isArray(plansRes.value)
          ? plansRes.value
          : plansRes.value.items || plansRes.value.data?.items || plansRes.value.data || [];
        setAvailablePlans(pItems);
      }

      // 4. Invoices
      if (invoicesRes.status === 'fulfilled' && invoicesRes.value) {
        const invData = invoicesRes.value.data || invoicesRes.value;
        const invList = Array.isArray(invData)
          ? invData
          : invData.items || invData.invoices || [];
        setInvoices(invList);
      }

      // 5. Billing Summary
      if (summaryRes.status === 'fulfilled' && summaryRes.value) {
        const sumData = summaryRes.value.data || summaryRes.value;
        setBillingSummary(sumData);
        if (sumData.recentInvoices && (!invoices || invoices.length === 0)) {
          setInvoices(sumData.recentInvoices);
        }
      }

      if (isManualRefresh) {
        setToastMessage({ type: 'success', text: 'Billing & resource telemetry synchronized with database.' });
      }
    } catch (err) {
      console.warn('Billing sync warning:', err.message);
      if (isManualRefresh) {
        setToastMessage({ type: 'error', text: 'Failed to refresh billing data: ' + err.message });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionAndBilling();
  }, [currentOrgId]);

  // Handle Plan Upgrade / Transition
  const handleConfirmUpgrade = async () => {
    if (!selectedPlanForUpgrade) return;
    setIsUpgrading(true);

    try {
      const targetCode = (selectedPlanForUpgrade.code || selectedPlanForUpgrade.name || '').toUpperCase();
      const orgId = currentOrgId || currentOrganization?._id || currentOrganization?.id;

      await subscriptionService.changePlan(targetCode, orgId);

      setToastMessage({
        type: 'success',
        text: `Successfully upgraded to ${selectedPlanForUpgrade.name || targetCode} plan! New limits are active.`,
      });

      setSelectedPlanForUpgrade(null);
      await fetchSubscriptionAndBilling();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: 'Plan transition failed: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  // Copy Invoice ID helper
  const handleCopyInvoiceId = (id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedInvoiceId(true);
      setTimeout(() => setCopiedInvoiceId(false), 2000);
    }
  };

  // Formatting helpers
  const activePlanCode = (subscription?.planCode || subscription?.plan || 'STARTER').toUpperCase();
  const activePlanName = subscription?.planId?.name || (activePlanCode.charAt(0) + activePlanCode.slice(1).toLowerCase());
  const subscriptionStatus = (subscription?.status || 'ACTIVE').toUpperCase();

  const periodEndFormatted = useMemo(() => {
    if (!subscription?.currentPeriodEnd) return 'Ongoing';
    const d = new Date(subscription.currentPeriodEnd);
    return isNaN(d.getTime()) ? 'Ongoing' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [subscription]);

  const daysRemaining = useMemo(() => {
    if (!subscription?.currentPeriodEnd) return null;
    const diff = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  }, [subscription]);

  // Authoritative Limits & Usage
  const limits = usageMetrics?.limits || subscription?.limits || {
    maxAssessments: 100,
    maxCandidates: 500,
    maxQuestions: 500,
    maxUsers: 25,
    maxInterviews: 20,
    maxAttempts: 500,
  };

  const usageCounts = usageMetrics?.usage || {};

  // 6 Authoritative Live Resource Quota Meters
  const quotaMeters = [
    {
      label: 'Candidate Enrolments',
      sublabel: 'Active and invited examinees in roster',
      value: usageCounts.candidates?.used ?? 0,
      max: usageCounts.candidates?.limit ?? limits.maxCandidates ?? 500,
      icon: <Users size={18} />,
      color: 'secondary',
    },
    {
      label: 'Assessments Created',
      sublabel: 'Exams and tests published or in draft',
      value: usageCounts.assessments?.used ?? 0,
      max: usageCounts.assessments?.limit ?? limits.maxAssessments ?? 50,
      icon: <MonitorPlay size={18} />,
      color: 'primary',
    },
    {
      label: 'Question Bank Items',
      sublabel: 'Verified assessment items in bank',
      value: usageCounts.questions?.used ?? 0,
      max: usageCounts.questions?.limit ?? limits.maxQuestions ?? 500,
      icon: <Layers size={18} />,
      color: 'primary',
    },
    {
      label: 'Faculty & Proctor Seats',
      sublabel: 'Active organization staff memberships',
      value: usageCounts.users?.used ?? 0,
      max: usageCounts.users?.limit ?? limits.maxUsers ?? 25,
      icon: <Shield size={18} />,
      color: 'warning',
    },
    {
      label: 'Live Technical Interviews',
      sublabel: 'WebRTC interview sessions scheduled/conducted',
      value: usageCounts.interviews?.used ?? 0,
      max: usageCounts.interviews?.limit ?? limits.maxInterviews ?? 20,
      icon: <Clock size={18} />,
      color: 'secondary',
    },
    {
      label: 'Monthly Exam Attempts',
      sublabel: 'Completed assessment test sessions this month',
      value: usageCounts.attempts?.used ?? 0,
      max: usageCounts.attempts?.limit ?? limits.maxAttempts ?? 500,
      icon: <HardDrive size={18} />,
      color: 'primary',
    },
  ];

  // Default Plans Fallback if DB list is loading
  const defaultTiers = [
    {
      name: 'Free Starter',
      code: 'FREE',
      price: 0,
      description: 'Ideal for small departments running initial evaluation exams.',
      features: { assessmentBuilder: true, proctoring: false, liveInterviews: false, certificates: false, apiAccess: false },
      limits: { maxCandidates: 20, maxAssessments: 3, maxUsers: 2, maxInterviews: 2 },
    },
    {
      name: 'Starter Academic',
      code: 'STARTER',
      price: 49,
      description: 'Designed for classrooms, departments, and certified testing centers.',
      features: { assessmentBuilder: true, proctoring: false, liveInterviews: true, certificates: true, apiAccess: false },
      limits: { maxCandidates: 200, maxAssessments: 15, maxUsers: 5, maxInterviews: 20 },
    },
    {
      name: 'Professional Institution',
      code: 'PROFESSIONAL',
      price: 199,
      description: 'Comprehensive exam delivery with AI proctoring and WebRTC live interviews.',
      features: { assessmentBuilder: true, proctoring: true, liveInterviews: true, certificates: true, apiAccess: true },
      limits: { maxCandidates: 2000, maxAssessments: 100, maxUsers: 25, maxInterviews: 200 },
    },
    {
      name: 'Enterprise University / Corporate',
      code: 'ENTERPRISE',
      price: 999,
      description: 'Institutional-wide deployment with unlimited quotas and custom governance.',
      features: { assessmentBuilder: true, proctoring: true, liveInterviews: true, certificates: true, apiAccess: true },
      limits: { maxCandidates: -1, maxAssessments: -1, maxUsers: -1, maxInterviews: -1 },
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
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Billing' },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={15} className={refreshing || loading ? 'animate-spin' : ''} />}
            onClick={() => fetchSubscriptionAndBilling(true)}
            disabled={refreshing || loading}
          >
            Sync Database
          </Button>
        }
      />

      {accessForbidden ? (
        <Card className="border-amber-300 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/20 shadow-soft">
          <CardBody className="p-8 text-center max-w-2xl mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Shield size={32} />
            </div>
            <h3 className="text-xl font-bold font-display text-accent-900 dark:text-white">
              Billing Management Access Restricted (403)
            </h3>
            <p className="text-sm text-accent-600 dark:text-accent-400 leading-relaxed">
              {forbiddenReason ||
                'Your current membership role does not hold billing administration permissions (billing.view / subscriptions.view) for this organization.'}
            </p>
            <div className="p-4 rounded-xl bg-white dark:bg-accent-900/60 border border-amber-200 dark:border-amber-900/50 text-xs text-accent-500 text-left space-y-1.5">
              <div className="font-semibold text-accent-700 dark:text-accent-300">Administrative Access Required:</div>
              <div>• Institutional billing and tier management is restricted to <strong>Organization Owners</strong>, <strong>Admins</strong>, and <strong>Platform Staff</strong>.</div>
              <div>• Contact your tenant owner to elevate your role or grant the <code>billing.view</code> permission.</div>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="primary" onClick={() => onNavigate && onNavigate('org-dashboard')}>
                Return to Dashboard
              </Button>
            </div>
          </CardBody>
        </Card>
      ) : loading ? (
        <div className="space-y-6">
          <SkeletonCards count={1} />
          <SkeletonCards count={4} />
          <SkeletonTable rows={3} />
        </div>
      ) : (
        <>
          {/* Active Subscription Tier Hero Banner */}
          <Card className="border-primary-200/70 dark:border-primary-900/40 bg-gradient-to-r from-primary-50/50 via-white to-accent-50/30 dark:from-primary-950/20 dark:via-accent-900/40 dark:to-accent-950/30 shadow-soft">
            <CardBody className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center shadow-md shadow-primary-500/20 shrink-0">
                    <Package size={28} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-bold font-display text-accent-900 dark:text-white">
                        {activePlanName} Plan
                      </h2>
                      <Badge
                        variant={
                          subscriptionStatus === 'ACTIVE'
                            ? 'success'
                            : subscriptionStatus === 'TRIALING'
                            ? 'primary'
                            : subscriptionStatus === 'PAST_DUE'
                            ? 'warning'
                            : 'neutral'
                        }
                        dot
                      >
                        {subscriptionStatus}
                      </Badge>
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-medium bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300">
                        {subscription?.billingInterval || 'MONTHLY'}
                      </span>
                    </div>

                    <p className="text-xs text-accent-600 dark:text-accent-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>Organization: <strong className="text-accent-800 dark:text-accent-200">{currentOrganization?.name || 'Current Tenant'}</strong></span>
                      <span>·</span>
                      <span>Renews / Cycle End: <strong className="text-accent-800 dark:text-accent-200">{periodEndFormatted}</strong></span>
                      {daysRemaining !== null && (
                        <>
                          <span>·</span>
                          <span className="text-primary-600 dark:text-primary-400 font-medium">({daysRemaining} days remaining)</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                  <div className="text-left lg:text-right mr-2 hidden sm:block">
                    <p className="text-xs text-accent-500 dark:text-accent-400 font-medium">Current Investment</p>
                    <p className="text-2xl font-black font-display text-accent-900 dark:text-white">
                      ${subscription?.price ?? 0}
                      <span className="text-xs font-normal text-accent-500 dark:text-accent-400 ml-1">/ mo</span>
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    icon={<ArrowUpRight size={16} />}
                    onClick={() => {
                      const nextPlan = displayPlans.find(
                        (p) => (p.code || p.name).toUpperCase() !== activePlanCode
                      );
                      if (nextPlan) setSelectedPlanForUpgrade(nextPlan);
                    }}
                  >
                    Change Plan
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Authoritative Resource Quota Metering */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider">
                  Authoritative Resource Quota Metering
                </h3>
                <p className="text-xs text-accent-500 dark:text-accent-400">
                  Dynamic consumption metrics calculated directly from database records.
                </p>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
                Real-time MongoDB Sync
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotaMeters.map((u, i) => {
                const isUnlimited = u.max === -1;
                const pct = isUnlimited ? 0 : u.max > 0 ? Math.min(100, Math.round((u.value / u.max) * 100)) : 0;
                const isNearCapacity = !isUnlimited && pct >= 85;

                return (
                  <Card key={i} className="transition-all hover:shadow-soft">
                    <CardBody className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-soft ${
                            u.color === 'primary'
                              ? 'bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400'
                              : u.color === 'secondary'
                              ? 'bg-secondary-50 dark:bg-secondary-950/60 text-secondary-600 dark:text-secondary-400'
                              : 'bg-warning-50 dark:bg-warning-950/60 text-warning-600 dark:text-warning-400'
                          }`}
                        >
                          {u.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-accent-900 dark:text-white truncate">
                              {u.label}
                            </p>
                            {isUnlimited ? (
                              <Badge variant="primary" size="sm">Unlimited</Badge>
                            ) : (
                              <span className={`text-xs font-bold font-mono ${isNearCapacity ? 'text-danger-600 dark:text-danger-400' : 'text-accent-700 dark:text-accent-300'}`}>
                                {pct}%
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate mt-0.5">
                            {u.sublabel}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-mono text-accent-600 dark:text-accent-400">
                          <span>Used: <strong className="text-accent-900 dark:text-white">{u.value.toLocaleString()}</strong></span>
                          <span>Cap: <strong className="text-accent-900 dark:text-white">{isUnlimited ? '∞' : u.max.toLocaleString()}</strong></span>
                        </div>
                        <ProgressBar
                          value={isUnlimited ? 5 : u.value}
                          max={isUnlimited ? 100 : u.max}
                          color={isNearCapacity ? 'danger' : u.color}
                        />
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Available Tenant Tiers (From Database) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider">
                  Available Subscription Plans
                </h3>
                <p className="text-xs text-accent-500 dark:text-accent-400">
                  Select a tailored tier for your institution. All changes take effect immediately in the database.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayPlans.map((plan, i) => {
                const pCode = (plan.code || plan.name || '').toUpperCase();
                const isCurrent = pCode === activePlanCode;
                const featuresObj = plan.features || {};

                const featureList = [
                  { key: 'assessmentBuilder', label: 'Assessment Studio', active: featuresObj.assessmentBuilder !== false },
                  { key: 'proctoring', label: 'AI WebRTC Proctoring', active: Boolean(featuresObj.proctoring) },
                  { key: 'liveInterviews', label: 'Live Interview Rooms', active: Boolean(featuresObj.liveInterviews) },
                  { key: 'certificates', label: 'Verifiable Certificates', active: Boolean(featuresObj.certificates) },
                  { key: 'apiAccess', label: 'LMS & API Integrations', active: Boolean(featuresObj.apiAccess) },
                ];

                const candLimit = plan.limits?.maxCandidates === -1 ? 'Unlimited' : plan.limits?.maxCandidates ? `${plan.limits.maxCandidates} Candidates` : '20 Candidates';
                const examLimit = plan.limits?.maxAssessments === -1 ? 'Unlimited' : plan.limits?.maxAssessments ? `${plan.limits.maxAssessments} Exams` : '3 Exams';
                const staffLimit = plan.limits?.maxUsers === -1 ? 'Unlimited' : plan.limits?.maxUsers ? `${plan.limits.maxUsers} Staff Seats` : '2 Staff Seats';

                return (
                  <Card
                    key={i}
                    className={`flex flex-col relative transition-all ${
                      isCurrent
                        ? 'ring-2 ring-primary-500 dark:ring-primary-400 shadow-glow bg-primary-50/20 dark:bg-primary-950/10'
                        : 'hover:border-accent-300 dark:hover:border-accent-700'
                    }`}
                  >
                    {isCurrent && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge variant="primary" size="sm">Active Plan</Badge>
                      </div>
                    )}

                    <CardBody className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-bold text-accent-900 dark:text-white text-sm">
                            {plan.name || plan.code}
                          </h4>
                        </div>

                        <div className="mt-2 mb-3">
                          <p className="text-2xl font-black font-display text-accent-900 dark:text-white">
                            ${plan.price ?? 0}
                            <span className="text-xs font-normal text-accent-500 dark:text-accent-400 ml-1">
                              / month
                            </span>
                          </p>
                          <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 min-h-[32px] line-clamp-2">
                            {plan.description || 'Institutional examination plan'}
                          </p>
                        </div>

                        {/* Capacity Badges */}
                        <div className="space-y-1.5 py-3 border-y border-accent-100 dark:border-accent-800 text-[11px] font-medium text-accent-700 dark:text-accent-300">
                          <div className="flex items-center justify-between">
                            <span className="text-accent-500">Examinees:</span>
                            <span className="font-semibold">{candLimit}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-accent-500">Assessments:</span>
                            <span className="font-semibold">{examLimit}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-accent-500">Staff Seats:</span>
                            <span className="font-semibold">{staffLimit}</span>
                          </div>
                        </div>

                        {/* Feature Checklist */}
                        <ul className="space-y-2 my-4">
                          {featureList.map((f, j) => (
                            <li
                              key={j}
                              className={`flex items-start gap-2 text-xs ${
                                f.active
                                  ? 'text-accent-800 dark:text-accent-200'
                                  : 'text-accent-400 dark:text-accent-600 line-through'
                              }`}
                            >
                              <Check
                                size={14}
                                className={`shrink-0 mt-0.5 ${
                                  f.active ? 'text-success-500' : 'text-accent-300 dark:text-accent-700'
                                }`}
                              />
                              <span>{f.label}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant={isCurrent ? 'outline' : 'primary'}
                          fullWidth
                          size="sm"
                          disabled={isCurrent}
                          onClick={() => setSelectedPlanForUpgrade(plan)}
                          icon={isCurrent ? <Check size={14} /> : <ArrowUpRight size={14} />}
                        >
                          {isCurrent ? 'Current Plan' : `Switch to ${plan.name || plan.code}`}
                        </Button>
                      </div>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Invoices & Payment History Section */}
          <Card>
            <CardHeader className="p-5 border-b border-accent-100 dark:border-accent-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-accent-900 dark:text-white flex items-center gap-2">
                  <FileText size={18} className="text-primary-600 dark:text-primary-400" />
                  Invoices & Payment Receipts
                </h3>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">
                  Authoritative financial records generated for subscription cycles and plan changes.
                </p>
              </div>
              <Badge variant="outline" className="font-mono text-xs w-fit">
                {invoices.length} {invoices.length === 1 ? 'Record' : 'Records'}
              </Badge>
            </CardHeader>

            <CardBody className="p-0">
              {invoices.length === 0 ? (
                <div className="py-8">
                  <EmptyState
                    icon={<FileText size={28} className="text-accent-400" />}
                    title="No invoices generated yet"
                    description="Invoices will appear here automatically when subscription renewals or plan changes occur."
                  />
                </div>
              ) : (
                <div className="overflow-x-auto w-full no-scrollbar">
                  <table className="w-full min-w-[650px] text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-accent-100 dark:border-accent-800 bg-accent-50/50 dark:bg-accent-900/30 text-accent-500 dark:text-accent-400 font-semibold">
                        <th className="p-4 whitespace-nowrap min-w-[130px]">Invoice ID</th>
                        <th className="p-4 whitespace-nowrap min-w-[150px]">Billing Period</th>
                        <th className="p-4 whitespace-nowrap min-w-[100px]">Amount</th>
                        <th className="p-4 whitespace-nowrap min-w-[90px]">Status</th>
                        <th className="p-4 whitespace-nowrap min-w-[110px]">Date Issued</th>
                        <th className="p-4 text-right whitespace-nowrap min-w-[90px]">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                      {invoices.map((inv, idx) => {
                        const invId = inv.providerInvoiceId || inv._id || `inv_${idx}`;
                        const invStatus = (inv.status || 'PAID').toUpperCase();
                        const amount = inv.amount !== undefined ? inv.amount : ((inv.amountInCents || 0) / 100);
                        const currency = inv.currency || 'USD';

                        const dateStr = inv.paidAt || inv.createdAt;
                        const formattedDate = dateStr
                          ? new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                          : 'Recent';

                        const periodStart = inv.billingPeriodStart
                          ? new Date(inv.billingPeriodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'Start';
                        const periodEnd = inv.billingPeriodEnd
                          ? new Date(inv.billingPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                          : 'End';

                        return (
                          <tr key={inv._id || idx} className="hover:bg-accent-50/40 dark:hover:bg-accent-900/20 transition-colors">
                            <td className="p-4 font-mono font-medium text-accent-900 dark:text-white">
                              <span className="flex items-center gap-1.5">
                                {invId}
                              </span>
                            </td>
                            <td className="p-4 text-accent-600 dark:text-accent-300">
                              {periodStart} – {periodEnd}
                            </td>
                            <td className="p-4 font-mono font-bold text-accent-900 dark:text-white">
                              ${amount.toFixed(2)} {currency}
                            </td>
                            <td className="p-4">
                              <Badge
                                variant={
                                  invStatus === 'PAID'
                                    ? 'success'
                                    : invStatus === 'PENDING'
                                    ? 'warning'
                                    : 'danger'
                                }
                                dot
                              >
                                {invStatus}
                              </Badge>
                            </td>
                            <td className="p-4 text-accent-500 dark:text-accent-400">
                              {formattedDate}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<Download size={13} />}
                                onClick={() => setSelectedInvoiceForReceipt(inv)}
                              >
                                Receipt
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Tenant Billing Profile Card */}
          <Card>
            <CardBody className="p-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent-100 dark:bg-accent-800 text-accent-700 dark:text-accent-300 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-accent-900 dark:text-white">
                      Institutional Billing Profile & Governance
                    </h4>
                    <p className="text-[11px] text-accent-500 dark:text-accent-400">
                      Primary contact: <strong>{currentOrganization?.contact?.email || currentOrganization?.contactEmail || currentOrganization?.billingEmail || user?.email || 'N/A'}</strong> · Currency: <strong>USD ($)</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Gateway: Direct SaaS Invoicing
                  </Badge>
                </div>
              </div>
            </CardBody>
          </Card>
        </>
      )}

      {/* Plan Upgrade / Transition Confirmation Modal */}
      {selectedPlanForUpgrade && (
        <Modal
          isOpen={Boolean(selectedPlanForUpgrade)}
          onClose={() => !isUpgrading && setSelectedPlanForUpgrade(null)}
          title="Confirm Subscription Plan Transition"
          size="md"
        >
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-xl bg-primary-50 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/40 flex items-start gap-3">
              <Sparkles size={20} className="text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-primary-900 dark:text-primary-200">
                  Switch to {selectedPlanForUpgrade.name || selectedPlanForUpgrade.code}
                </h4>
                <p className="text-xs text-primary-700 dark:text-primary-300 mt-0.5">
                  Your tenant quotas will be upgraded immediately in the database and a new subscription period will begin.
                </p>
              </div>
            </div>

            <div className="space-y-2 border border-accent-100 dark:border-accent-800 rounded-xl p-4 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-accent-100 dark:border-accent-800">
                <span className="text-accent-500">Target Plan:</span>
                <span className="font-bold text-accent-900 dark:text-white font-display">
                  {selectedPlanForUpgrade.name || selectedPlanForUpgrade.code}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-accent-100 dark:border-accent-800">
                <span className="text-accent-500">Recurring Price:</span>
                <span className="font-bold text-accent-900 dark:text-white font-mono">
                  ${selectedPlanForUpgrade.price ?? 0} / month
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-accent-100 dark:border-accent-800">
                <span className="text-accent-500">Candidate Roster Quota:</span>
                <span className="font-bold text-accent-900 dark:text-white font-mono">
                  {selectedPlanForUpgrade.limits?.maxCandidates === -1 ? 'Unlimited' : selectedPlanForUpgrade.limits?.maxCandidates ?? 'Standard'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-accent-500">Assessment Creation Cap:</span>
                <span className="font-bold text-accent-900 dark:text-white font-mono">
                  {selectedPlanForUpgrade.limits?.maxAssessments === -1 ? 'Unlimited' : selectedPlanForUpgrade.limits?.maxAssessments ?? 'Standard'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-accent-100 dark:border-accent-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlanForUpgrade(null)}
                disabled={isUpgrading}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowUpRight size={15} />}
                onClick={handleConfirmUpgrade}
                loading={isUpgrading}
              >
                Confirm & Activate
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Invoice Receipt Modal */}
      {selectedInvoiceForReceipt && (
        <Modal
          isOpen={Boolean(selectedInvoiceForReceipt)}
          onClose={() => setSelectedInvoiceForReceipt(null)}
          title="Payment Receipt & Tax Invoice"
          size="md"
        >
          <div className="space-y-4 pt-2 print:p-0">
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-accent-200 dark:border-accent-700">
              <div>
                <h3 className="font-black text-base font-display text-accent-900 dark:text-white">
                  SecureAssess Platform
                </h3>
                <p className="text-[11px] text-accent-500 dark:text-accent-400">
                  Cloud Assessment & Proctoring Infrastructure
                </p>
                <p className="text-[11px] text-accent-500 dark:text-accent-400">
                  Tax ID: SA-SaaS-2026-US
                </p>
              </div>
              <Badge variant="success" size="md">PAID</Badge>
            </div>

            {/* Invoice Details */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-accent-500 text-[11px]">Billed To:</p>
                <p className="font-bold text-accent-900 dark:text-white">
                  {currentOrganization?.name || 'Institution Tenant'}
                </p>
                <p className="text-accent-600 dark:text-accent-400">
                  {currentOrganization?.contact?.email || currentOrganization?.contactEmail || currentOrganization?.billingEmail || user?.email || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-accent-500 text-[11px]">Invoice Reference:</p>
                <div className="flex items-center justify-end gap-1 font-mono font-bold text-accent-900 dark:text-white">
                  <span>{selectedInvoiceForReceipt.providerInvoiceId || selectedInvoiceForReceipt._id}</span>
                  <button
                    onClick={() => handleCopyInvoiceId(selectedInvoiceForReceipt.providerInvoiceId || selectedInvoiceForReceipt._id)}
                    className="p-1 hover:bg-accent-100 dark:hover:bg-accent-800 rounded cursor-pointer"
                    title="Copy Invoice ID"
                  >
                    {copiedInvoiceId ? <Check size={12} className="text-success-600" /> : <Copy size={12} className="text-accent-400" />}
                  </button>
                </div>
                <p className="text-accent-500 text-[11px] mt-1">
                  Date: {new Date(selectedInvoiceForReceipt.paidAt || selectedInvoiceForReceipt.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Line Items */}
            <div className="border border-accent-200 dark:border-accent-700 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-accent-50 dark:bg-accent-800 text-accent-600 dark:text-accent-300">
                  <tr>
                    <th className="p-3 text-left">Description</th>
                    <th className="p-3 text-right">Period</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-100 dark:divide-accent-800">
                  <tr>
                    <td className="p-3">
                      <p className="font-bold text-accent-900 dark:text-white">
                        {selectedInvoiceForReceipt.metadata?.planName || activePlanName} Subscription
                      </p>
                      <p className="text-[11px] text-accent-500">
                        Tier License & Proctoring Bandwidth
                      </p>
                    </td>
                    <td className="p-3 text-right text-accent-600 dark:text-accent-400">
                      30 Days
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-accent-900 dark:text-white">
                      ${(selectedInvoiceForReceipt.amount ?? 0).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-accent-50/50 dark:bg-accent-800/50 font-bold border-t border-accent-200 dark:border-accent-700">
                  <tr>
                    <td colSpan={2} className="p-3 text-right text-accent-700 dark:text-accent-300">
                      Total Paid:
                    </td>
                    <td className="p-3 text-right font-mono text-accent-900 dark:text-white">
                      ${(selectedInvoiceForReceipt.amount ?? 0).toFixed(2)} {selectedInvoiceForReceipt.currency || 'USD'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-accent-100 dark:border-accent-800">
              <p className="text-[11px] text-accent-400">
                Electronic receipt verified by SecureAssess Billing Engine.
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Printer size={14} />}
                  onClick={() => window.print()}
                >
                  Print Receipt
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedInvoiceForReceipt(null)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default Billing;
