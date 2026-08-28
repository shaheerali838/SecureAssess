import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Plus, Filter, Download,
  Clock, Users, Star, Pencil, Copy, Trash2, Eye, RefreshCw
} from 'lucide-react';
import {
  Card, Badge, StatusBadge, SecurityBadge, Button, SearchBar,
  PageHeader, Select, EmptyState, SkeletonCards,
} from '@/components/ui';
import { assessments as fallbackAssessments } from '@/data';
import assessmentService from '@/services/assessment.service';

export function AssessmentLibrary({ onNavigate }) {
  const [assessmentsList, setAssessmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formatFilter, setFormatFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await assessmentService.getAssessments();
      const items = Array.isArray(data) ? data : (data?.items || data?.assessments || data?.data || []);
      if (items && items.length > 0) {
        setAssessmentsList(items);
      } else {
        setAssessmentsList(fallbackAssessments);
      }
    } catch (err) {
      console.warn('Backend assessments not reachable, loaded local fallback:', err.message);
      setAssessmentsList(fallbackAssessments);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const filtered = assessmentsList.filter((a) => {
    const title = (a.title || a.name || '').toLowerCase();
    const category = (a.category || a.type || '').toLowerCase();
    const matchesSearch = title.includes(search.toLowerCase()) || category.includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (a.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesFormat = formatFilter === 'all' || (a.type || '').toLowerCase().includes(formatFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesFormat;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessment Library"
        subtitle="Author, configure, schedule, and monitor exams across your organization."
        icon={<FileText size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Assessments' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchAssessments}
            >
              Refresh
            </Button>
            <Button variant="outline" size="sm" icon={<Download size={15} />}>
              Export Matrix
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={15} />}
              onClick={() => onNavigate('org-assessment-builder')}
            >
              Create Assessment
            </Button>
          </div>
        }
      />

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search by title or topic..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            value={formatFilter}
            onChange={(e) => setFormatFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Formats' },
              { value: 'exam', label: 'Examination' },
              { value: 'mcq', label: 'MCQ Test' },
              { value: 'quiz', label: 'Quiz' },
              { value: 'skill', label: 'Skills Lab' },
            ]}
            className="w-36"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'published', label: 'Published' },
              { value: 'draft', label: 'Draft' },
              { value: 'scheduled', label: 'Scheduled' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Loading Skeleton or Assessment Cards Grid */}
      {loading ? (
        <SkeletonCards count={6} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={28} />}
            title="No assessments found"
            description="Create an assessment to build questions, schedule testing windows, and configure proctoring."
            action={
              <Button variant="primary" icon={<Plus size={15} />} onClick={() => onNavigate('org-assessment-builder')}>
                Create Assessment
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const id = a._id || a.id;
            const title = a.title || a.name || 'Untitled Assessment';
            const desc = a.description || 'Comprehensive evaluation assessment with proctoring parameters.';
            const type = a.type || 'Examination';
            const status = a.status || 'Draft';
            const secLevel = a.securityLevel || a.securityTier || 'Standard';
            const qCount = a.questions?.length || a.questionCount || a.questions || 10;
            const duration = a.duration || a.durationMinutes || 90;
            const avgScore = a.avgScore || 78;
            const attempts = a.attempts || 0;

            return (
              <Card key={id} hover className="overflow-hidden flex flex-col justify-between" onClick={() => onNavigate('org-assessment-builder')}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center shadow-soft">
                      <FileText size={20} />
                    </div>
                    <SecurityBadge level={secLevel} />
                  </div>

                  <h3 className="font-bold text-accent-900 dark:text-white text-sm mb-1 line-clamp-1">{title}</h3>
                  <p className="text-xs text-accent-500 dark:text-accent-400 mb-3 line-clamp-2 leading-relaxed">{desc}</p>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="neutral">{type}</Badge>
                    <StatusBadge status={status} />
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-accent-100 dark:border-accent-800">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-accent-600 dark:text-accent-300">
                        <FileText size={12} />
                        <span className="text-xs font-bold">{qCount}</span>
                      </div>
                      <p className="text-[10px] text-accent-400 mt-0.5 uppercase tracking-wider">Questions</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-accent-600 dark:text-accent-300">
                        <Clock size={12} />
                        <span className="text-xs font-bold">{duration}m</span>
                      </div>
                      <p className="text-[10px] text-accent-400 mt-0.5 uppercase tracking-wider">Duration</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-accent-600 dark:text-accent-300">
                        <Star size={12} className="text-warning-400" />
                        <span className="text-xs font-bold">{avgScore}%</span>
                      </div>
                      <p className="text-[10px] text-accent-400 mt-0.5 uppercase tracking-wider">Avg Score</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between px-5 py-2.5 bg-accent-50/60 dark:bg-accent-950/40 border-t border-accent-100 dark:border-accent-800">
                  <div className="flex items-center gap-1 text-[11px] text-accent-500 dark:text-accent-400 font-medium">
                    <Users size={12} /> {attempts.toLocaleString()} attempts
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="p-1.5 text-accent-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 rounded-lg transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate('org-assessment-builder');
                      }}
                      title="Edit Assessment"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      className="p-1.5 text-accent-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 rounded-lg transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      title="Clone Assessment"
                    >
                      <Copy size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AssessmentLibrary;
