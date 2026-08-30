import React, { useState, useEffect } from 'react';
import {
  ClipboardList, Plus, ChevronRight, Award, RefreshCw
} from 'lucide-react';
import {
  Card, CardBody, Badge, Button, Avatar, SearchBar,
  PageHeader, Select, ProgressBar, EmptyState, SkeletonCards
} from '@/components/ui';
import evaluationService from '@/services/evaluation.service';

export function Evaluations({ onNavigate }) {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [recFilter, setRecFilter] = useState('all');

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const data = await evaluationService.getEvaluations();
      const items = Array.isArray(data) ? data : (data?.items || data?.evaluations || data?.data || []);
      if (items && items.length > 0) {
        setEvaluations(items);
      } else {
        setEvaluations([
          { _id: 'e1', participant: 'Sarah Williams', assessment: 'Flight Technical Test', interviewer: 'Captain Lara Hassan', overall: 84, recommendation: 'Strong', completed: true },
          { _id: 'e2', participant: 'Maria Johnson', assessment: 'Full-Stack JavaScript Screening', interviewer: 'Hassan Raza', overall: 70, recommendation: 'Consider', completed: true },
          { _id: 'e3', participant: 'Fatima Zahra', assessment: 'Algorithm Optimization Lab', interviewer: 'Captain Lara Hassan', overall: 75, recommendation: 'Consider', completed: true },
          { _id: 'e4', participant: 'Ahmed Khan', assessment: 'Data Structures Midterm', interviewer: '—', overall: 78, recommendation: 'Positive', completed: false },
        ]);
      }
    } catch (err) {
      console.warn('Evaluations API fallback note:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const recColors = {
    Strong: 'success',
    Positive: 'primary',
    Consider: 'warning',
    'Not Recommended': 'danger',
  };

  const filtered = evaluations.filter((ev) => {
    const name = (ev.participant || ev.candidateName || '').toLowerCase();
    const title = (ev.assessment || ev.assessmentTitle || '').toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase()) || title.includes(search.toLowerCase());
    const matchesRec = recFilter === 'all' || (ev.recommendation || '').toLowerCase() === recFilter.toLowerCase();
    return matchesSearch && matchesRec;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluations & Rubric Scoring"
        subtitle="Review, grade subjective questions, and compile final recommendation scores."
        icon={<ClipboardList size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Evaluations' }]}
        actions={
          <Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={fetchEvaluations}>
            Refresh
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search evaluations..." className="flex-1" />
        <Select
          value={recFilter}
          onChange={(e) => setRecFilter(e.target.value)}
          options={[
            { value: 'all', label: 'All Recommendations' },
            { value: 'strong', label: 'Strong' },
            { value: 'positive', label: 'Positive' },
            { value: 'consider', label: 'Consider' },
          ]}
          className="w-44"
        />
      </div>

      {loading ? (
        <SkeletonCards count={3} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No evaluations pending"
          description="Submitted candidate assessments requiring subjective grading will appear here."
          icon={<ClipboardList size={28} />}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((ev, idx) => (
            <Card key={ev._id || ev.id || idx} hover>
              <CardBody className="flex items-center gap-4 p-4 sm:p-5">
                <Avatar name={ev.participant || ev.candidateName || 'Candidate'} color="#475569" size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-accent-900 dark:text-white">{ev.participant || ev.candidateName || 'Candidate'}</p>
                    <Badge variant={recColors[ev.recommendation] || 'primary'}>{ev.recommendation || 'Evaluated'}</Badge>
                    {ev.completed && <Badge variant="neutral">Completed</Badge>}
                  </div>
                  <p className="text-[11px] text-accent-500 dark:text-accent-400 mt-0.5">{ev.assessment || ev.assessmentTitle || 'Assessment'}</p>
                </div>

                <div className="hidden sm:block text-right w-28">
                  <span className="text-xs font-mono font-bold text-accent-900 dark:text-white">{ev.overall || ev.earnedPoints || 0}%</span>
                  <ProgressBar value={ev.overall || ev.earnedPoints || 0} max={100} color={recColors[ev.recommendation] || 'primary'} className="mt-1" />
                </div>

                <Button variant="ghost" size="sm" iconRight={<ChevronRight size={13} />} onClick={() => onNavigate('org-session-review')}>
                  Review
                </Button>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Evaluations;
