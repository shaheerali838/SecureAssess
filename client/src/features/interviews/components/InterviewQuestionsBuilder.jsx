import React, { useState } from 'react';
import {
  HelpCircle, Plus, Trash2, Edit3, Sparkles, Check,
  BookOpen, ListPlus, Tag, Layers, RefreshCw, X, CheckCircle2
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';

export const PRESET_TEMPLATES = [
  {
    title: 'Architectural Decisions & Design Patterns',
    prompt: 'Explain the core distributed architectural decisions, design patterns, and trade-offs made in your implementation.',
    category: 'TECHNICAL',
  },
  {
    title: 'Real-time WebSockets & State Reconciliation',
    prompt: 'How do you handle peer-to-peer disconnects, network degradation, packet loss, and state reconciliation?',
    category: 'TECHNICAL',
  },
  {
    title: 'Data Consistency, Transactions & Concurrency',
    prompt: 'Describe your database transaction boundaries, concurrency lock strategies, and isolation levels under load.',
    category: 'SYSTEM_DESIGN',
  },
  {
    title: 'Authentication, Token Lifecycle & Zero-Trust Security',
    prompt: 'Walk through authentication token lifecycle, encryption at rest and in transit, and role-based access control.',
    category: 'TECHNICAL',
  },
  {
    title: 'Live Algorithmic Challenge & Complexity',
    prompt: 'Implement the requested data structure / algorithmic logic and analyze its worst-case time and space complexity.',
    category: 'CODING',
  },
  {
    title: 'Critical Incident Response & Failure Modes',
    prompt: 'Walk through a scenario where a critical subsystem fails during peak proctoring load. How does the system degrade gracefully?',
    category: 'PROBLEM_SOLVING',
  },
  {
    title: 'Behavioral: Ownership & Technical Disagreements',
    prompt: 'Describe a situation where you had a major technical disagreement with a teammate and how you resolved it constructively.',
    category: 'BEHAVIORAL',
  },
];

export const CATEGORY_COLORS = {
  TECHNICAL: 'bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800',
  CODING: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
  SYSTEM_DESIGN: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  PROBLEM_SOLVING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  BEHAVIORAL: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

export function InterviewQuestionsBuilder({
  questions = [],
  onChange = () => {},
  interviewType = 'TECHNICAL',
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newCategory, setNewCategory] = useState(
    interviewType === 'CODING' ? 'CODING' :
    interviewType === 'BEHAVIORAL' ? 'BEHAVIORAL' : 'TECHNICAL'
  );

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [editCategory, setEditCategory] = useState('TECHNICAL');

  const handleAddQuestion = (e) => {
    e?.preventDefault?.();
    if (!newTitle.trim()) return;

    const newQ = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      prompt: newPrompt.trim() || 'Evaluate candidate clarity, technical accuracy, and depth of response.',
      category: newCategory,
      rating: 0,
      notes: '',
      completed: false,
    };

    onChange([...questions, newQ]);
    setNewTitle('');
    setNewPrompt('');
    setShowAddForm(false);
  };

  const handleAddPreset = (preset) => {
    const newQ = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: preset.title,
      prompt: preset.prompt,
      category: preset.category,
      rating: 0,
      notes: '',
      completed: false,
    };
    onChange([...questions, newQ]);
  };

  const handleLoadRecommended = () => {
    const recommended = PRESET_TEMPLATES.slice(0, 4).map((p, idx) => ({
      id: `q_rec_${idx + 1}_${Date.now()}`,
      title: p.title,
      prompt: p.prompt,
      category: p.category,
      rating: 0,
      notes: '',
      completed: false,
    }));
    onChange(recommended);
  };

  const handleDelete = (id) => {
    onChange(questions.filter((q) => q.id !== id));
  };

  const handleStartEdit = (q) => {
    setEditingId(q.id);
    setEditTitle(q.title);
    setEditPrompt(q.prompt || '');
    setEditCategory(q.category || 'TECHNICAL');
  };

  const handleSaveEdit = (id) => {
    onChange(
      questions.map((q) =>
        q.id === id
          ? {
              ...q,
              title: editTitle.trim() || q.title,
              prompt: editPrompt.trim() || q.prompt,
              category: editCategory,
            }
          : q
      )
    );
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar with Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen size={14} className="text-primary-500" />
            Interview Evaluation Questions & Rubrics ({questions.length})
          </label>
          <p className="text-[11px] text-accent-500 dark:text-accent-400 mt-0.5">
            Configure questions and criteria examiners will evaluate during the live room session.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {questions.length === 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              icon={<Sparkles size={13} className="text-amber-500" />}
              onClick={handleLoadRecommended}
              className="text-xs"
            >
              Load Recommended (4)
            </Button>
          )}

          <Button
            type="button"
            variant={showAddForm ? 'secondary' : 'primary'}
            size="sm"
            icon={showAddForm ? <X size={13} /> : <Plus size={13} />}
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-xs"
          >
            {showAddForm ? 'Close Form' : 'Add Custom Question'}
          </Button>
        </div>
      </div>

      {/* Quick Template Recommendation Pills */}
      <div className="p-3 rounded-xl bg-accent-50/70 dark:bg-accent-800/40 border border-accent-200 dark:border-accent-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-accent-700 dark:text-accent-300 flex items-center gap-1">
            <Sparkles size={12} className="text-primary-500" /> Quick Add from Recommended Question Library:
          </span>
          {questions.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[10px] text-danger-500 hover:underline font-semibold"
            >
              Clear All Questions
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {PRESET_TEMPLATES.map((preset, idx) => {
            const isAlreadyAdded = questions.some((q) => q.title === preset.title);
            return (
              <button
                key={idx}
                type="button"
                disabled={isAlreadyAdded}
                onClick={() => handleAddPreset(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAlreadyAdded
                    ? 'bg-accent-100 dark:bg-accent-800/80 border-accent-200 dark:border-accent-700 text-accent-400 cursor-not-allowed'
                    : 'bg-white dark:bg-accent-900 border-accent-200 dark:border-accent-700 text-accent-700 dark:text-accent-300 hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600'
                }`}
              >
                {isAlreadyAdded ? <Check size={11} className="text-success-500" /> : <Plus size={11} />}
                <span className="truncate max-w-[220px]">{preset.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add Custom Question Form */}
      {showAddForm && (
        <div className="p-4 rounded-xl bg-primary-50/60 dark:bg-primary-950/30 border border-primary-200 dark:border-primary-800 space-y-3 animate-scale-in">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-primary-900 dark:text-primary-200 flex items-center gap-1.5">
              <ListPlus size={14} /> Add New Evaluation Question / Rubric
            </h5>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-accent-400 hover:text-accent-600 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Question / Topic Title <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Distributed Consensus & Raft Protocol"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="w-full text-xs h-8 px-3 rounded-lg bg-white dark:bg-accent-900 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-accent-700 dark:text-accent-300 mb-1">
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="w-full text-xs h-8 px-2.5 rounded-lg bg-white dark:bg-accent-900 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              >
                <option value="TECHNICAL">Technical & Architecture</option>
                <option value="CODING">Live Coding & Algorithms</option>
                <option value="SYSTEM_DESIGN">System Design & Scale</option>
                <option value="PROBLEM_SOLVING">Problem Solving & Incidents</option>
                <option value="BEHAVIORAL">Behavioral & Collaboration</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-accent-700 dark:text-accent-300 mb-1">
              Rubric Prompt / Key Evaluation Criteria
            </label>
            <textarea
              rows={2}
              placeholder="Provide specific points or guidance for examiners to look for during candidate response..."
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg bg-white dark:bg-accent-900 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddForm(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Check size={13} />}
              onClick={handleAddQuestion}
              disabled={!newTitle.trim()}
              className="text-xs"
            >
              Add Question
            </Button>
          </div>
        </div>
      )}

      {/* Configured Questions List */}
      <div className="space-y-2">
        {questions.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-accent-300 dark:border-accent-700 text-center space-y-2 bg-accent-50/40 dark:bg-accent-900/20">
            <p className="text-xs font-semibold text-accent-700 dark:text-accent-300">
              No interview questions added yet
            </p>
            <p className="text-[11px] text-accent-500 max-w-sm mx-auto">
              Add custom questions or click "Load Recommended" to populate standard oral defense rubrics.
            </p>
            <div className="pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={<Sparkles size={13} className="text-amber-500" />}
                onClick={handleLoadRecommended}
                className="text-xs"
              >
                Load Recommended Technical Rubric
              </Button>
            </div>
          </div>
        ) : (
          questions.map((q, idx) => {
            const isEditing = editingId === q.id;
            const categoryBadgeStyle =
              CATEGORY_COLORS[q.category] || CATEGORY_COLORS.TECHNICAL;

            return (
              <div
                key={q.id || idx}
                className="p-3 rounded-xl bg-white dark:bg-accent-850 border border-accent-200 dark:border-accent-700 transition-all hover:border-accent-300 dark:hover:border-accent-600 space-y-2"
              >
                {isEditing ? (
                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full text-xs h-8 px-2.5 rounded-lg bg-accent-50 dark:bg-accent-900 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value)}
                          className="w-full text-xs h-8 px-2.5 rounded-lg bg-accent-50 dark:bg-accent-900 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white"
                        >
                          <option value="TECHNICAL">Technical & Architecture</option>
                          <option value="CODING">Live Coding & Algorithms</option>
                          <option value="SYSTEM_DESIGN">System Design & Scale</option>
                          <option value="PROBLEM_SOLVING">Problem Solving & Incidents</option>
                          <option value="BEHAVIORAL">Behavioral & Collaboration</option>
                        </select>
                      </div>
                    </div>
                    <textarea
                      rows={2}
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg bg-accent-50 dark:bg-accent-900 border border-accent-300 dark:border-accent-700 text-accent-900 dark:text-white resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="xs"
                        icon={<Check size={12} />}
                        onClick={() => handleSaveEdit(q.id)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-full bg-accent-100 dark:bg-accent-700 text-accent-700 dark:text-accent-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h6 className="text-xs font-bold text-accent-900 dark:text-white">
                            {q.title}
                          </h6>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${categoryBadgeStyle}`}
                          >
                            {q.category || 'TECHNICAL'}
                          </span>
                        </div>
                        {q.prompt && (
                          <p className="text-[11px] text-accent-600 dark:text-accent-400 line-clamp-2">
                            {q.prompt}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Edit question"
                        onClick={() => handleStartEdit(q)}
                        className="p-1.5 text-accent-400 hover:text-primary-600 dark:hover:text-primary-400 rounded-lg hover:bg-accent-100 dark:hover:bg-accent-800 transition-colors"
                      >
                        <Edit3 size={13} />
                      </button>
                      <button
                        type="button"
                        title="Delete question"
                        onClick={() => handleDelete(q.id)}
                        className="p-1.5 text-accent-400 hover:text-danger-500 rounded-lg hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default InterviewQuestionsBuilder;
