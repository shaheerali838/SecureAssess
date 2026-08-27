import { useState } from 'react';
import {
  FileText, Plus, Filter, Download,
  Clock, Users, Star, Pencil, Copy, Trash2, Eye,
} from 'lucide-react';
import {
  Card, Badge, StatusBadge, SecurityBadge, Button, SearchBar,
  PageHeader, Select, EmptyState,
} from '@/components/ui';
import { assessments } from '@/data';






export function AssessmentLibrary({ onNavigate }) {
  const [search, setSearch] = useState('');
  const filtered = assessments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assessments"
        subtitle="Create and manage your organization's assessment library"
        icon={<FileText size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Assessments' }]}
        actions={
          <>
            <Button variant="outline" size="sm" icon={<Download size={16} />}>Export</Button>
            <Button variant="primary" size="sm" icon={<Plus size={16} />} onClick={() => onNavigate('org-assessment-builder')}>Create Assessment</Button>
          </>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search assessments..." className="flex-1" />
        <div className="flex gap-2">
          <Select options={[
            { value: 'all', label: 'All Types' },
            { value: 'exam', label: 'Examination' },
            { value: 'mcq', label: 'MCQ Test' },
            { value: 'quiz', label: 'Quiz' },
            { value: 'skill', label: 'Skills Assessment' },
          ]} className="w-36" />
          <Select options={[
            { value: 'all', label: 'All Status' },
            { value: 'published', label: 'Published' },
            { value: 'draft', label: 'Draft' },
            { value: 'scheduled', label: 'Scheduled' },
          ]} className="w-36" />
          <Button variant="outline" size="md" icon={<Filter size={16} />} className="shrink-0">More</Button>
        </div>
      </div>

      {/* Grid view */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<FileText size={28} />}
            title="No assessments yet"
            description="Create your first assessment to begin evaluating participants."
            action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => onNavigate('org-assessment-builder')}>Create Assessment</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((a) => (
            <Card key={a.id} hover className="overflow-hidden" onClick={() => onNavigate('org-assessment-builder')}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <SecurityBadge level={a.securityLevel} />
                </div>
                <h3 className="font-semibold text-accent-900 mb-1 line-clamp-1">{a.title}</h3>
                <p className="text-xs text-accent-500 mb-3 line-clamp-2">{a.description}</p>
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="neutral">{a.type}</Badge>
                  <StatusBadge status={a.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-accent-100">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-accent-500"><FileText size={12} /><span className="text-xs">{a.questions}</span></div>
                    <p className="text-xs text-accent-400 mt-0.5">Questions</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-accent-500"><Clock size={12} /><span className="text-xs">{a.duration}m</span></div>
                    <p className="text-xs text-accent-400 mt-0.5">Duration</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-accent-500"><Star size={12} /><span className="text-xs">{a.avgScore}%</span></div>
                    <p className="text-xs text-accent-400 mt-0.5">Avg Score</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-2.5 bg-accent-50 border-t border-accent-100">
                <div className="flex items-center gap-1 text-xs text-accent-500">
                  <Users size={12} /> {a.attempts.toLocaleString()} attempts
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1.5 text-accent-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors" onClick={(e) => { e.stopPropagation(); onNavigate('org-assessment-builder'); }}><Pencil size={14} /></button>
                  <button className="p-1.5 text-accent-400 hover:text-info-600 hover:bg-info-50 rounded transition-colors"><Eye size={14} /></button>
                  <button className="p-1.5 text-accent-400 hover:text-accent-700 hover:bg-accent-100 rounded transition-colors"><Copy size={14} /></button>
                  <button className="p-1.5 text-accent-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
