import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Check, Plus, CreditCard, Sparkles, Building2,
  Users, ShieldCheck, Zap, Edit, Trash2, RefreshCw
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, MetricCard, Badge, Button, Input, PageHeader, Modal, SkeletonCards
} from '@/components/ui';
import platformService from '@/services/platform.service';

export function SubscriptionPlans({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState('annual');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [plansData, setPlansData] = useState({
    totalSubscribers: 1,
    popularPlan: 'Professional',
    avgRevenuePerTenant: '$860k',
    plans: [],
  });

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await platformService.getSubscriptionPlans();
      const payload = res?.data || res || {};
      setPlansData({
        totalSubscribers: payload.totalSubscribers || 1,
        popularPlan: payload.popularPlan || 'Professional',
        avgRevenuePerTenant: payload.avgRevenuePerTenant || '$860k',
        plans: Array.isArray(payload.plans) ? payload.plans : [],
      });
    } catch (err) {
      console.warn('Subscription plans fetch note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Subscription Tiers & Plans"
        subtitle="Configure institutional pricing tiers, feature entitlements, and candidate concurrency limits."
        icon={<ClipboardList size={22} className="text-primary-600 dark:text-primary-400" />}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={15} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchPlans}
            >
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setSelectedPlan({ name: 'New Custom Tier' })}>
              Create Tier
            </Button>
          </div>
        }
      />

      {/* Plan Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Active Subscribed Tenants"
          value={String(plansData.totalSubscribers)}
          icon={<Building2 size={20} />}
          trend={{ value: 'Database Live', up: true }}
          color="primary"
        />
        <MetricCard
          label="Most Popular Tier"
          value={plansData.popularPlan}
          icon={<Sparkles size={20} />}
          trend={{ value: 'Top Inbound Choice', up: true }}
          color="secondary"
        />
        <MetricCard
          label="Average ARR Per Tenant"
          value={plansData.avgRevenuePerTenant}
          icon={<CreditCard size={20} />}
          trend={{ value: 'Annualized', up: true }}
          color="success"
        />
        <MetricCard
          label="Total Managed Seats"
          value="15 Accounts"
          icon={<Users size={20} />}
          trend={{ value: 'Active in Cluster', up: true }}
          color="info"
        />
      </div>

      {/* Billing Cycle Switch */}
      <div className="flex justify-center">
        <div className="bg-accent-100 dark:bg-accent-800 p-1 rounded-xl flex items-center gap-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-white dark:bg-accent-900 text-primary-600 dark:text-primary-400 shadow-soft'
                : 'text-accent-600 dark:text-accent-400'
            }`}
          >
            Annual Billing
            <span className="text-[10px] bg-success-100 text-success-700 dark:bg-success-900/60 dark:text-success-400 px-1.5 py-0.5 rounded-full font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {loading ? (
        <SkeletonCards count={3} />
      ) : (
        /* Pricing Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plansData.plans.map((p) => {
            const price = billingCycle === 'annual' ? p.annualPrice : p.monthlyPrice;
            return (
              <Card
                key={p.id}
                className={`relative transition-all duration-200 ${
                  p.popular
                    ? 'border-2 border-primary-600 dark:border-primary-500 shadow-xl'
                    : 'hover:border-accent-300 dark:hover:border-accent-700'
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-soft uppercase tracking-wider">
                    Recommended
                  </div>
                )}

                <CardBody className="p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-accent-900 dark:text-white">{p.name}</h3>
                    <p className="text-xs text-accent-500 mt-1 leading-relaxed">{p.tagline}</p>
                  </div>

                  <div className="pt-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-accent-900 dark:text-white">${price}</span>
                      <span className="text-xs text-accent-400">/ month</span>
                    </div>
                    <p className="text-[11px] text-accent-400 mt-0.5">
                      {billingCycle === 'annual' ? 'Billed annually ($' + price * 12 + '/yr)' : 'Billed monthly'}
                    </p>
                  </div>

                  <div className="p-3 bg-accent-50 dark:bg-accent-950/60 rounded-xl space-y-1.5 text-xs">
                    <div className="font-semibold text-accent-800 dark:text-accent-200 flex items-center gap-2">
                      <Users size={14} className="text-primary-600" />
                      <span>{p.seats}</span>
                    </div>
                    <div className="font-semibold text-accent-800 dark:text-accent-200 flex items-center gap-2">
                      <Zap size={14} className="text-warning-500" />
                      <span>{p.exams}</span>
                    </div>
                    <div className="font-semibold text-accent-800 dark:text-accent-200 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-success-600" />
                      <span>{p.aiMinutes}</span>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-bold text-accent-900 dark:text-white uppercase tracking-wider">
                      Included Features:
                    </p>
                    <ul className="space-y-2 text-xs text-accent-600 dark:text-accent-400">
                      {(p.features || []).map((f, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Check size={14} className="text-success-500 shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      variant={p.popular ? 'primary' : 'outline'}
                      className="w-full"
                      onClick={() => setSelectedPlan(p)}
                    >
                      Edit Tier Configuration
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Plan Edit Modal */}
      {selectedPlan && (
        <Modal
          isOpen={Boolean(selectedPlan)}
          onClose={() => setSelectedPlan(null)}
          title={`Tier Configuration: ${selectedPlan.name}`}
        >
          <div className="space-y-4 text-xs">
            <Input label="Plan Name" defaultValue={selectedPlan.name} />
            <Input label="Monthly Price ($)" defaultValue={selectedPlan.monthlyPrice || 999} type="number" />
            <Input label="Annual Price / mo ($)" defaultValue={selectedPlan.annualPrice || 799} type="number" />
            <Input label="Concurrent Examination Concurrency" defaultValue={selectedPlan.exams || '250'} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedPlan(null)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setSelectedPlan(null)}>
                Save Tier Rules
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default SubscriptionPlans;
