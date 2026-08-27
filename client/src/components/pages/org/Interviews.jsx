import {
  Video, Plus, Calendar, Clock, Users, ChevronRight,
} from 'lucide-react';
import {
  Card, CardBody, StatusBadge, Button, Avatar,
  SearchBar, PageHeader, Select,
} from '@/components/ui';
import { useState } from 'react';






export function Interviews({ onNavigate }) {
  const [search, setSearch] = useState('');

  const interviews = [
    { id: 'i1', participant: 'Sarah Williams', role: 'Pilot Training Program', interviewer: 'Captain Lara Hassan', date: 'Aug 25, 2026', time: '11:00 AM', duration: '45 min', status: 'Completed' },
    { id: 'i2', participant: 'Maria Johnson', role: 'Senior Frontend Developer', interviewer: 'Hassan Raza', date: 'Aug 24, 2026', time: '4:00 PM', duration: '60 min', status: 'Completed' },
    { id: 'i3', participant: 'Fatima Zahra', role: 'Pilot Training Program', interviewer: 'Captain Lara Hassan', date: 'Aug 23, 2026', time: '1:30 PM', duration: '50 min', status: 'Completed' },
    { id: 'i4', participant: 'Ahmed Khan', role: 'Computer Science 101', interviewer: 'Prof. Aisha Khan', date: 'Aug 28, 2026', time: '10:00 AM', duration: '30 min', status: 'Scheduled' },
    { id: 'i5', participant: 'Daniel Smith', role: 'Nursing Certification', interviewer: 'Dr. Farah Siddiqui', date: 'Aug 29, 2026', time: '2:00 PM', duration: '45 min', status: 'Scheduled' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interviews"
        subtitle="Schedule and conduct live interview sessions"
        icon={<Video size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Interviews' }]}
        actions={<Button variant="primary" size="sm" icon={<Plus size={16} />}>Schedule Interview</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search interviews..." className="flex-1" />
        <Select options={[
          { value: 'all', label: 'All Status' },
          { value: 'completed', label: 'Completed' },
          { value: 'scheduled', label: 'Scheduled' },
        ]} className="w-36" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {interviews.map((iv) => (
          <Card key={iv.id} hover onClick={() => onNavigate('participant-interview')}>
            <CardBody>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar name={iv.participant} color="#475569" size="md" />
                  <div>
                    <p className="text-sm font-semibold text-accent-900">{iv.participant}</p>
                    <p className="text-xs text-accent-500">{iv.role}</p>
                  </div>
                </div>
                <StatusBadge status={iv.status} />
              </div>
              <div className="space-y-1.5 text-xs text-accent-500">
                <div className="flex items-center gap-2"><Users size={12} /> {iv.interviewer}</div>
                <div className="flex items-center gap-2"><Calendar size={12} /> {iv.date} at {iv.time}</div>
                <div className="flex items-center gap-2"><Clock size={12} /> {iv.duration}</div>
              </div>
              <div className="mt-3 pt-3 border-t border-accent-100 flex items-center justify-between">
                <Button variant="ghost" size="sm" iconRight={<ChevronRight size={14} />}>
                  {iv.status === 'Completed' ? 'View Recording' : 'Join Interview'}
                </Button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
