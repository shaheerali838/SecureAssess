import React, { useState, useEffect } from 'react';
import {
  CreditCard, Download, ArrowUpRight, Check, Package, Users,
  MonitorPlay, Clock, HardDrive, Shield, RefreshCw, FileText,
  AlertCircle, CheckCircle2, Zap
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Badge, Button, ProgressBar, PageHeader, Toast
} from '@/components/ui';
import billingService from '@/services/billing.service';
import { useOrganization } from '@/contexts/OrganizationContext';

export function Billing({ onNavigate }) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?._id || currentOrganization?.id;

  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchBillingData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const [fetchedPlans, fetchedSub, fetchedInvoices, fetchedSummary] = await Promise.allSettled([
        billingService.getPlans(),
        billingService.getCurrentSubscription(orgId),
        billingService.getInvoices(orgId),
        billingService.getBillingSummary(orgId),
      ]);

      if (fetchedPlans.status === 'fulfilled' && fetchedPlans.value) {
        setPlans(Array.isArray(fetchedPlans.value) ? fetchedPlans.value : fetchedPlans.value.items || []);
      }
      if (fetchedSub.status === 'fulfilled' && fetchedSub.value) {
        setSubscription(fetchedSub.value);
      }
      if (fetchedInvoices.status === 'fulfilled' && fetchedInvoices.value) {
        const invs = fetchedInvoices.value.items || (Array.isArray(fetchedInvoices.value) ? fetchedInvoices.value : []);
        setInvoices(invs);
      }
      if (fetchedSummary.status === 'fulfilled' && fetchedSummary.value) {
        setUsageData(fetchedSummary.value.usage || null);
      }
    } catch (err) {
      console.error('Error fetching billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [orgId]);

  const handleCheckout = async (plan) => {
    if (!orgId) return;
    setUpgrading(true);
    try {
      const result = await billingService.createCheckoutSession(orgId, {
        planId: plan._id || plan.id,
        planCode: plan.code || plan.name?.toUpperCase(),
        billingInterval: 'MONTHLY',
      });

      if (result?.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      } else {
        setToastMessage({ type: 'success', text: `Subscription successfully updated to ${plan.name}!` });
        fetchBillingData();
      }
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to initiate checkout: ' + err.message,
      });
    } finally {
      setUpgrading(false);
    }
  };

  const planCode = subscription?.planCode || subscription?.plan || 'STARTER';
  const planName = subscription?.planName || planCode;
  const limits = subscription?.limits || {
    maxAssessments: 100,
    maxCandidates: 2000,
    maxQuestions: 5000,
    maxStorage: 100,
  };

  const currentUsage = usageData || {
    assessmentsCount: 3,
    candidatesCount: 12,
    questionsCount: 45,
    storageUsedMB: 12,
  };

  const usageMeters = [
    {
      label: 'Assessments Created',
      value: currentUsage.assessmentsCount || 0,
      max: limits.maxAssessments || 100,
      icon: <MonitorPlay size={18} />,
      color: 'primary',
    },
    {
      label: 'Candidates Enrolled',
      value: currentUsage.candidatesCount || 0,
      max: limits.maxCandidates || 2000,
      icon: <Users size={18} />,
      color: 'secondary',
    },
    {
      label: 'Question Bank Items',
      value: currentUsage.questionsCount || 0,
      max: limits.maxQuestions || 5000,
      icon: <FileText size={18} />,
      color: 'primary',
    },
    {
      label: 'Cloud Evidence Storage (GB)',
      value: Math.round((currentUsage.storageUsedMB || 0) / 1024 * 10) / 10,
      max: limits.maxStorage || 100,
      unit: ' GB',
      icon: <HardDrive size={18} />,
      color: 'warning',
    },
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
        subtitle="Manage your tenant subscription tier, resource quotas, and invoice receipts."
        icon={<CreditCard size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Billing' }]}
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw size={15} />} onClick={fetchBillingData} loading={loading}>
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
                  <h2 className="text-lg font-bold font-display text-accent-900 dark:text-white">
                    {planName} License
                  </h2>
                  <Badge variant="primary" dot>
                    {subscription?.status || 'ACTIVE'}
                  </Badge>
                </div>
                <p className="text-xs text-accent-500 dark:text-accent-400 mt-0.5">
                  B2B SaaS Multi-Tenant Cloud License · SecureAssess
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-accent-900 dark:text-white">
                  ${subscription?.price || 0} / month
                </div>
                <div className="text-[11px] text-accent-500">Billed {subscription?.billingInterval || 'MONTHLY'}</div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Resource Quota Metering */}
      <div>
        <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-3">
          Authoritative Resource Quotas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {usageMeters.map((u, i) => {
            const percentage = Math.min(100, Math.round((u.value / (u.max || 1)) * 100));
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
                    <span className="text-xs font-bold text-accent-900 dark:text-white font-mono">{percentage}%</span>
                  </div>
                  <ProgressBar value={u.value} max={u.max} color={u.color} />
                </CardBody>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-3">
          Available Subscription Plans
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {plans.map((plan, i) => {
            const isCurrent = (plan.code || plan.name?.toUpperCase()) === planCode.toUpperCase();
            return (
              <Card key={i} className={`p-5 relative flex flex-col justify-between ${isCurrent ? 'ring-2 ring-primary-500 shadow-glow' : ''}`}>
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="primary">Current Plan</Badge>
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-accent-900 dark:text-white text-sm">{plan.name}</h4>
                  <p className="text-2xl font-bold font-display text-accent-900 dark:text-white mt-1">
                    ${plan.price} <span className="text-xs font-normal text-accent-500">/mo</span>
                  </p>
                  <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 mb-4">
                    {plan.description || `Includes up to ${plan.limits?.maxAssessments || 0} assessments & ${plan.limits?.maxCandidates || 0} candidates.`}
                  </p>
                  <ul className="space-y-1.5 mb-4">
                    <li className="flex items-start gap-2 text-xs text-accent-600 dark:text-accent-300">
                      <Check size={14} className="text-success-500 shrink-0 mt-0.5" />
                      <span>{plan.limits?.maxAssessments || 'Unlimited'} Assessments</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-accent-600 dark:text-accent-300">
                      <Check size={14} className="text-success-500 shrink-0 mt-0.5" />
                      <span>{plan.limits?.maxCandidates || 'Unlimited'} Candidates</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-accent-600 dark:text-accent-300">
                      <Check size={14} className="text-success-500 shrink-0 mt-0.5" />
                      <span>{plan.features?.proctoring ? 'AI Proctoring & Snapshots' : 'Basic Exam Delivery'}</span>
                    </li>
                    <li className="flex items-start gap-2 text-xs text-accent-600 dark:text-accent-300">
                      <Check size={14} className="text-success-500 shrink-0 mt-0.5" />
                      <span>{plan.features?.certificates ? 'Verifiable Certificates' : 'Standard Results'}</span>
                    </li>
                  </ul>
                </div>
                <Button
                  variant={isCurrent ? 'outline' : 'primary'}
                  fullWidth
                  size="sm"
                  disabled={isCurrent || upgrading}
                  onClick={() => handleCheckout(plan)}
                >
                  {isCurrent ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </Button>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing Invoices */}
      {invoices.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-3">
            Payment & Invoice History
          </h3>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-accent-50 dark:bg-accent-900/50 border-b border-accent-200 dark:border-accent-800 text-accent-600 dark:text-accent-400 font-semibold">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent-200 dark:divide-accent-800 text-accent-900 dark:text-white">
                  {invoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-accent-50/50 dark:hover:bg-accent-900/20">
                      <td className="p-3.5 font-mono">{inv.invoiceNumber || inv._id?.slice(-8)}</td>
                      <td className="p-3.5">{new Date(inv.createdAt || Date.now()).toLocaleDateString()}</td>
                      <td className="p-3.5 font-semibold">${((inv.amount || inv.amountPaid || 0) / (inv.currency === 'USD' ? 100 : 1)).toFixed(2)}</td>
                      <td className="p-3.5">
                        <Badge variant={inv.status === 'PAID' ? 'success' : 'primary'}>{inv.status}</Badge>
                      </td>
                      <td className="p-3.5 text-right">
                        {inv.receiptUrl ? (
                          <a href={inv.receiptUrl} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline inline-flex items-center gap-1">
                            <Download size={13} /> PDF
                          </a>
                        ) : (
                          <span className="text-accent-400 font-mono">Synced</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default Billing;
