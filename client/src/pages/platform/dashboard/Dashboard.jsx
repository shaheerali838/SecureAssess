import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Building2, Users, ShieldCheck, Activity, Server, ArrowUpRight } from 'lucide-react';

export const PlatformDashboard = () => {
  const { user } = useAuth();

  const metrics = [
    { label: 'Total Organizations', value: '8', change: '+2 this month', icon: Building2, color: 'text-primary-500 bg-primary-50 dark:bg-primary-950/50' },
    { label: 'Active Candidates', value: '1,420', change: '+18% growth', icon: Users, color: 'text-secondary-500 bg-secondary-50 dark:bg-secondary-950/50' },
    { label: 'Concurrent Exams', value: '34', change: 'Live telemetry active', icon: Activity, color: 'text-success-500 bg-success-50 dark:bg-success-950/50' },
    { label: 'System Health', value: '99.98%', change: 'All services optimal', icon: Server, color: 'text-info-500 bg-info-50 dark:bg-info-950/50' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold font-display text-accent-900 dark:text-white">
          Platform Governance Console
        </h1>
        <p className="text-sm text-accent-500 dark:text-accent-400 mt-1">
          Welcome back, {user?.firstName || 'Administrator'}. Monitor global tenant metrics and system health.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="p-5 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft card-hover"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${m.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-accent-500 dark:text-accent-400">
                  {m.change}
                </span>
              </div>
              <p className="text-2xl font-bold font-display text-accent-900 dark:text-white mt-4">
                {m.value}
              </p>
              <p className="text-xs font-medium text-accent-500 dark:text-accent-400 mt-1">
                {m.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Governance Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft">
          <h2 className="text-base font-bold text-accent-900 dark:text-white mb-4">
            Tenant Organizations
          </h2>
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-accent-900 dark:text-white">Stanford Engineering</p>
                <p className="text-[11px] text-accent-500">Plan: Enterprise • 840 candidates</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-50 text-success-700 border border-success-200">
                Active
              </span>
            </div>
            <div className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700/50 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-accent-900 dark:text-white">TechCorp Talent Assessment</p>
                <p className="text-[11px] text-accent-500">Plan: Pro • 320 candidates</p>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success-50 text-success-700 border border-success-200">
                Active
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft">
          <h2 className="text-base font-bold text-accent-900 dark:text-white mb-4">
            Security & Real-Time Telemetry
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-xs text-accent-600 dark:text-accent-300">
              <ShieldCheck className="w-4 h-4 text-success-500 shrink-0" />
              <span>Multi-Tenant isolation rules validated on all database collections.</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-accent-600 dark:text-accent-300">
              <Activity className="w-4 h-4 text-primary-500 shrink-0" />
              <span>WebSockets & WebRTC Signaling server running on port 5000.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
