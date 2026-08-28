import React, { useState } from 'react';
import {
  ClipboardList, Plus, ChevronRight, Award
} from 'lucide-react';
import {
  Card, CardBody, Badge, Button, Avatar, SearchBar,
  PageHeader, Select, ProgressBar,
} from '@/components/ui';

export function Evaluations({ onNavigate }) {
  const [search, setSearch] = useState('');

  const evaluations = [
    { id: 'e1', participant: 'Sarah Williams', assessment: 'Flight Technical Test', interviewer: 'Captain Lara Hassan', overall: 84, recommendation: 'Strong', completed: true },
    { id: 'e2', participant: 'Maria Johnson', assessment: 'Full-Stack JavaScript Screening', interviewer: 'Hassan Raza', overall: 70, recommendation: 'Consider', completed: true },
    { id: 'e3', participant: 'Fatima Zahra', assessment: 'Algorithm Optimization Lab', interviewer: 'Captain Lara Hassan', overall: 75, recommendation: 'Consider', completed: true },
    { id: 'e4', participant: 'Ahmed Khan', assessment: 'Data Structures Midterm', interviewer: '—', overall: 78, recommendation: 'Positive', completed: false },
    { id: 'e5', participant: 'Daniel Smith', assessment: 'Clinical Competency Exam', interviewer: '—', overall: 81, recommendation: 'Positive', completed: false },
  ];

  const recColors = {
    Strong: 'success',
    Positive: 'primary',
    Consider: 'warning',
    'Not Recommended': 'danger',
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evaluations & Rubric Scoring"
        subtitle="Review, grade subjective questions, and compile final recommendation scores."
        icon={<ClipboardList size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Evaluations' }]}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />}>
            New Evaluation
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search evaluations..." className="flex-1" />
        <Select
          options={[
            { value: 'all', label: 'All Recommendations' },
            { value: 'strong', label: 'Strong' },
            { value: 'positive', label: 'Positive' },
            { value: 'consider', label: 'Consider' },
          ]}
          className="w-44"
        />
      </div>

      <div className="space-y-3">
        {evaluations.map((ev) => (
          <Card key={ev.id} hover>
            <CardBody className="flex items-center gap-4 p-4 sm:p-5">
              <Avatar name={ev.participant} color="#475569" size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-accent-900 dark:text-white truncate">{ev.participant}</p>
                <p className="text-[11px] text-accent-500 dark:text-accent-400 truncate">{ev.assessment}</p>
                {ev.interviewer !== '—' && (
                  <p className="text-[11px] text-accent-400 mt-0.5">Assigned evaluator: {ev.interviewer}</p>
                )}
              </div>
              <div className="hidden sm:block w-24">
                <div className="flex items-center gap-1 mb-1">
                  <Award size={13} className="text-primary-500" />
                  <span className="text-[10px] text-accent-500 dark:text-accent-400 uppercase tracking-wider">Overall</span>
                </div>
                <ProgressBar value={ev.overall} color="primary" size="sm" />
                <p className="text-xs font-bold text-accent-900 dark:text-white mt-1 font-mono">{ev.overall}%</p>
              </div>
              <Badge variant={recColors[ev.recommendation]} dot>{ev.recommendation}</Badge>
              {ev.completed ? (
                <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} onClick={() => onNavigate('participant-evaluation')}>
                  View
                </Button>
              ) : (
                <Button variant="outline" size="sm" icon={<ClipboardList size={13} />} onClick={() => onNavigate('participant-evaluation')}>
                  Score
                </Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Evaluations;
