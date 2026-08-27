import { useState } from 'react';
import {
  Library, Plus, Filter, Copy, Trash2, Pencil,
 Tag, Star,
} from 'lucide-react';
import {
  Card, CardBody, Badge, Button, SearchBar, PageHeader, Select, EmptyState,
} from '@/components/ui';
import { questions } from '@/data';






const difficultyColors = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger',
};

export function QuestionBank({ onNavigate }) {
  const [search, setSearch] = useState('');
  const filtered = questions.filter((q) =>
    q.content.toLowerCase().includes(search.toLowerCase()) ||
    q.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question Bank"
        subtitle="Reusable question library for your assessments"
        icon={<Library size={22} />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Question Bank' }]}
        actions={<Button variant="primary" size="sm" icon={<Plus size={16} />}>Add Question</Button>}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Questions', value: questions.length, color: 'text-primary-600' },
          { label: 'Categories', value: 8, color: 'text-secondary-600' },
          { label: 'Question Types', value: 9, color: 'text-info-600' },
          { label: 'Avg Difficulty', value: 'Medium', color: 'text-warning-600' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="text-sm text-accent-500 mt-1">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search questions..." className="flex-1" />
        <div className="flex gap-2">
          <Select options={[
            { value: 'all', label: 'All Types' },
            { value: 'mc', label: 'Multiple Choice' },
            { value: 'ms', label: 'Multiple Select' },
            { value: 'tf', label: 'True / False' },
            { value: 'sa', label: 'Short Answer' },
            { value: 'la', label: 'Long Answer' },
            { value: 'code', label: 'Coding' },
          ]} className="w-36" />
          <Select options={[
            { value: 'all', label: 'All Difficulty' },
            { value: 'easy', label: 'Easy' },
            { value: 'medium', label: 'Medium' },
            { value: 'hard', label: 'Hard' },
          ]} className="w-36" />
          <Button variant="outline" size="md" icon={<Filter size={16} />} className="shrink-0">Tags</Button>
        </div>
      </div>

      {/* Questions list */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Library size={28} />}
            title="No questions yet"
            description="Build your question library to reuse across assessments."
            action={<Button variant="primary" icon={<Plus size={16} />}>Add Question</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id} hover>
              <CardBody className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-xs font-bold text-accent-400">Q{q.id}</span>
                    <Badge variant={difficultyColors[q.difficulty]}>{q.difficulty}</Badge>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-accent-800 mb-2">{q.content}</p>
                    {q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mb-2">
                        {q.options.map((opt, oi) => (
                          <div key={oi} className="flex items-center gap-2 text-xs text-accent-500">
                            <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${(Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(oi) : q.correctAnswer === oi) ? 'border-success-500 bg-success-500' : 'border-accent-300'}`}>
                              {(Array.isArray(q.correctAnswer) ? q.correctAnswer.includes(oi) : q.correctAnswer === oi) && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </span>
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="neutral">{q.type}</Badge>
                      {q.category && <Badge variant="primary">{q.category}</Badge>}
                      {q.tags.map((t) => (
                        <span key={t} className="flex items-center gap-1 text-xs text-accent-400"><Tag size={10} /> {t}</span>
                      ))}
                      <span className="flex items-center gap-1 text-xs text-accent-400"><Star size={10} /> {q.points} pts</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1.5 text-accent-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"><Pencil size={14} /></button>
                    <button className="p-1.5 text-accent-400 hover:text-accent-700 hover:bg-accent-100 rounded transition-colors"><Copy size={14} /></button>
                    <button className="p-1.5 text-accent-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
