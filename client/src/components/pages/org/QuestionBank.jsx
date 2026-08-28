import React, { useState } from 'react';
import {
  Library, Plus, Filter, Copy, Trash2, Pencil,
  Tag, Star
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
        subtitle="Reusable multi-format questions categorized by topic, difficulty, and skill tags."
        icon={<Library size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Question Bank' }]}
        actions={
          <Button variant="primary" size="sm" icon={<Plus size={15} />}>
            Add Question
          </Button>
        }
      />

      {/* Metrics Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Questions', value: questions.length, color: 'text-primary-600 dark:text-primary-400' },
          { label: 'Domain Categories', value: 8, color: 'text-secondary-600 dark:text-secondary-400' },
          { label: 'Supported Formats', value: 9, color: 'text-info-600 dark:text-info-400' },
          { label: 'Average Difficulty', value: 'Medium', color: 'text-warning-600 dark:text-warning-400' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 font-medium">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <SearchBar value={search} onChange={setSearch} placeholder="Search questions by keyword or tag..." className="flex-1" />
        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          <Select
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'mc', label: 'Multiple Choice' },
              { value: 'ms', label: 'Multiple Select' },
              { value: 'tf', label: 'True / False' },
              { value: 'sa', label: 'Short Answer' },
              { value: 'la', label: 'Long Answer' },
              { value: 'code', label: 'Coding Lab' },
            ]}
            className="w-36"
          />
          <Select
            options={[
              { value: 'all', label: 'All Difficulty' },
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
            className="w-36"
          />
          <Button variant="outline" size="md" icon={<Filter size={15} />} className="shrink-0">
            Tags
          </Button>
        </div>
      </div>

      {/* Question Items */}
      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Library size={28} />}
            title="No questions found"
            description="Build your reusable question library for fast examination authoring."
            action={<Button variant="primary" icon={<Plus size={15} />}>Add Question</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <Card key={q.id} hover>
              <CardBody className="p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold font-mono text-accent-400 dark:text-accent-500">Q{q.id}</span>
                    <Badge variant={difficultyColors[q.difficulty]}>{q.difficulty}</Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-accent-900 dark:text-white mb-2 leading-relaxed">
                      {q.content}
                    </p>

                    {q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                        {q.options.map((opt, oi) => {
                          const isCorrect = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.includes(oi)
                            : q.correctAnswer === oi;
                          return (
                            <div
                              key={oi}
                              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                                isCorrect
                                  ? 'bg-success-50 dark:bg-success-950/40 text-success-700 dark:text-success-300 font-medium'
                                  : 'text-accent-600 dark:text-accent-400'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${
                                  isCorrect
                                    ? 'border-success-500 bg-success-500'
                                    : 'border-accent-300 dark:border-accent-600'
                                }`}
                              >
                                {isCorrect && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                              </span>
                              <span className="truncate">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-2 flex-wrap text-xs">
                      <Badge variant="neutral">{q.type}</Badge>
                      {q.category && <Badge variant="primary">{q.category}</Badge>}
                      {q.tags.map((t) => (
                        <span key={t} className="flex items-center gap-1 text-[11px] text-accent-400 dark:text-accent-500 font-medium">
                          <Tag size={10} /> {t}
                        </span>
                      ))}
                      <span className="flex items-center gap-1 text-[11px] text-accent-500 dark:text-accent-400 font-semibold ml-auto">
                        <Star size={11} className="text-warning-400" /> {q.points} pts
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-1.5 text-accent-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950/60 rounded-lg transition-colors cursor-pointer">
                      <Pencil size={14} />
                    </button>
                    <button className="p-1.5 text-accent-400 hover:text-accent-700 dark:hover:text-white hover:bg-accent-100 dark:hover:bg-accent-800 rounded-lg transition-colors cursor-pointer">
                      <Copy size={14} />
                    </button>
                    <button className="p-1.5 text-accent-400 hover:text-danger-600 dark:hover:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/60 rounded-lg transition-colors cursor-pointer">
                      <Trash2 size={14} />
                    </button>
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

export default QuestionBank;
