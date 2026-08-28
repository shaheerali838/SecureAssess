import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { GraduationCap, Clock, ShieldAlert, Award, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CandidateDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-900 to-accent-900 text-white border border-white/10 shadow-medium">
        <h1 className="text-2xl font-bold font-display">
          Welcome, {user?.firstName || 'Candidate'}!
        </h1>
        <p className="text-sm text-primary-200 mt-1 max-w-2xl">
          Welcome to your SecureAssess examination portal. Ensure you have a stable network connection, working webcam, and permitted environment before starting your tests.
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-accent-900 dark:text-white">
          Assigned Assessments
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-accent-900 border border-accent-200 dark:border-accent-800 shadow-soft">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-50 text-primary-700 border border-primary-200">
                  Ready to Start
                </span>
                <h3 className="text-base font-bold text-accent-900 dark:text-white mt-2">
                  CS401 — Advanced Operating Systems Final
                </h3>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-accent-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>90 mins</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-warning-500" />
                <span>Proctored</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-accent-100 dark:border-accent-800 flex items-center justify-between">
              <span className="text-[11px] text-accent-400">Attempts allowed: 1</span>
              <button className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-colors inline-flex items-center gap-1.5">
                <span>Start Assessment</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;
