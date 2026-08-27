import {
  ClipboardList, Plus, ChevronRight, Award,
} from 'lucide-react';
import {
  Card, CardBody, Badge, Button, Avatar, SearchBar,
  PageHeader, Select, ProgressBar,
} from '@/components/ui';
import { useState } from 'react';






export function Evaluations({ onNavigate }) {
  const [search, setSearch] = useState('');

  const evaluations = [
    { id: 'e1', participant: 'Sarah Williams', assessment: 'Commercial Pilot Knowledge', interviewer: 'Captain Lara Hassan', overall: 84, recommendation: 'Strong', completed: true },
    { id: 'e2', participant: 'Maria Johnson', assessment: 'MERN Engineering Assessment', interviewer: 'Hassan Raza', overall: 70, recommendation: 'Consider', completed: true },
    { id: 'e3', participant: 'Fatima Zahra', assessment: 'Aviation Safety Assessment', interviewer: 'Captain Lara Hassan', overall: 75, recommendation: 'Consider', completed: true },
    { id: 'e4', participant: 'Ahmed Khan', assessment: 'Online Midterm Examination', interviewer: '—', overall: 78, recommendation: 'Positive', completed: false },
    { id: 'e5', participant: 'Daniel Smith', assessment: 'Clinical Nursing Assessment', interviewer: '—', overall: 81, recommendation: 'Positive', completed: false },
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
        title="Evaluations"
        subtitle="Review and score participant evaluations"
        icon={<ClipboardList size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Evaluations' }]}
        actions={<Button variant="primary" size="sm" icon={<Plus size={16} />}>New Evaluation</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search evaluations..." className="flex-1" />
        <Select options={[
          { value: 'all', label: 'All Recommendations' },
          { value: 'strong', label: 'Strong' },
          { value: 'positive', label: 'Positive' },
          { value: 'consider', label: 'Consider' },
        ]} className="w-44" />
      </div>

      <div className="space-y-3">
        {evaluations.map((ev) => (
          <Card key={ev.id} hover>
            <CardBody className="flex items-center gap-4">
              <Avatar name={ev.participant} color="#475569" size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-accent-900">{ev.participant}</p>
                <p className="text-xs text-accent-500">{ev.assessment}</p>
                {ev.interviewer !== '—' && <p className="text-xs text-accent-400 mt-0.5">Interviewed by {ev.interviewer}</p>}
              </div>
              <div className="hidden sm:block w-24">
                <div className="flex items-center gap-1 mb-1">
                  <Award size={14} className="text-primary-500" />
                  <span className="text-xs text-accent-500">Overall</span>
                </div>
                <ProgressBar value={ev.overall} color="primary" size="sm" />
                <p className="text-xs font-bold text-accent-900 mt-1">{ev.overall}%</p>
              </div>
              <Badge variant={recColors[ev.recommendation]} dot>{ev.recommendation}</Badge>
              {ev.completed ? (
                <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />} onClick={() => onNavigate('participant-evaluation')}>View</Button>
              ) : (
                <Button variant="outline" size="sm" icon={<ClipboardList size={14} />} onClick={() => onNavigate('participant-evaluation')}>Evaluate</Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
