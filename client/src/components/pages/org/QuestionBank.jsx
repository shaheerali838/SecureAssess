import React, { useState, useEffect, useCallback } from 'react';
import {
  Library, Plus, Filter, Copy, Trash2, Pencil,
  Tag, Star, RefreshCw, Check
} from 'lucide-react';
import {
  Card, CardBody, Badge, Button, SearchBar, PageHeader, Select, EmptyState,
  Modal, Input, Textarea, Toast, SkeletonCards
} from '@/components/ui';
import { questions as defaultQuestions } from '@/data';
import questionBankService from '@/services/questionBank.service';

const difficultyColors = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger',
};

export function QuestionBank({ onNavigate }) {
  const [questionsList, setQuestionsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');

  // Modal State for Adding Question
  const [modalOpen, setModalOpen] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState('Multiple Choice');
  const [newDifficulty, setNewDifficulty] = useState('Medium');
  const [newCategory, setNewCategory] = useState('Algorithms');
  const [newPoints, setNewPoints] = useState(1);
  const [newOptions, setNewOptions] = useState(['Option A', 'Option B', 'Option C', 'Option D']);
  const [newCorrectAnswer, setNewCorrectAnswer] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await questionBankService.getQuestions();
      const items = Array.isArray(data) ? data : (data?.items || data?.questions || data?.data || []);
      if (items && items.length > 0) {
        setQuestionsList(items);
      } else {
        setQuestionsList(defaultQuestions);
      }
    } catch (err) {
      console.warn('Questions API fallback triggered:', err.message);
      setQuestionsList(defaultQuestions);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleCreateQuestion = async () => {
    if (!newContent.trim()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        content: newContent,
        type: newType,
        difficulty: newDifficulty,
        category: newCategory,
        points: Number(newPoints) || 1,
        options: newOptions,
        correctAnswer: newCorrectAnswer,
        tags: [newCategory.toLowerCase()],
      };

      try {
        await questionBankService.createQuestion(payload);
        setToastMessage({ type: 'success', text: 'Question added to bank!' });
      } catch (err) {
        console.warn('API error, saving locally:', err.message);
        setToastMessage({ type: 'success', text: 'Question added to local workspace!' });
      }

      setQuestionsList((prev) => [{ id: Date.now(), ...payload }, ...prev]);
      setModalOpen(false);
      setNewContent('');
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to add question: ' + err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    try {
      try {
        await questionBankService.deleteQuestion(id);
      } catch (e) {
        // fallback
      }
      setQuestionsList((prev) => prev.filter((q) => (q._id || q.id) !== id));
      setToastMessage({ type: 'success', text: 'Question removed from bank.' });
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Failed to remove question.' });
    }
  };

  const filtered = questionsList.filter((q) => {
    const content = (q.content || '').toLowerCase();
    const category = (q.category || '').toLowerCase();
    const matchesSearch = content.includes(search.toLowerCase()) || category.includes(search.toLowerCase());
    const matchesDifficulty = diffFilter === 'all' || (q.difficulty || '').toLowerCase() === diffFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || (q.type || '').toLowerCase().includes(typeFilter.toLowerCase());
    return matchesSearch && matchesDifficulty && matchesType;
  });

  return (
    <div className="space-y-6">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <PageHeader
        title="Question Bank"
        subtitle="Reusable multi-format questions categorized by topic, difficulty, and skill tags."
        icon={<Library size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Question Bank' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchQuestions}
            >
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>
              Add Question
            </Button>
          </div>
        }
      />

      {/* Metrics Header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Questions', value: questionsList.length, color: 'text-primary-600 dark:text-primary-400' },
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'multiple choice', label: 'Multiple Choice' },
              { value: 'multiple select', label: 'Multiple Select' },
              { value: 'true / false', label: 'True / False' },
              { value: 'short answer', label: 'Short Answer' },
              { value: 'coding', label: 'Coding Lab' },
            ]}
            className="w-36"
          />
          <Select
            value={diffFilter}
            onChange={(e) => setDiffFilter(e.target.value)}
            options={[
              { value: 'all', label: 'All Difficulty' },
              { value: 'easy', label: 'Easy' },
              { value: 'medium', label: 'Medium' },
              { value: 'hard', label: 'Hard' },
            ]}
            className="w-36"
          />
        </div>
      </div>

      {/* Loading Skeleton or Question Items */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Library size={28} />}
            title="No questions found"
            description="Build your reusable question library for fast examination authoring."
            action={<Button variant="primary" icon={<Plus size={15} />} onClick={() => setModalOpen(true)}>Add Question</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((q, idx) => {
            const id = q._id || q.id || idx + 1;
            const content = q.content || 'Untitled question stem';
            const difficulty = q.difficulty || 'Medium';
            const category = q.category || 'General';
            const points = q.points || 1;
            const options = Array.isArray(q.options) ? q.options : [];
            const correctAnswer = q.correctAnswer ?? 0;
            const tags = Array.isArray(q.tags) ? q.tags : [category.toLowerCase()];

            return (
              <Card key={id} hover>
                <CardBody className="p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center gap-1.5 shrink-0">
                      <span className="text-xs font-bold font-mono text-accent-400 dark:text-accent-500">#{idx + 1}</span>
                      <Badge variant={difficultyColors[difficulty] || 'neutral'}>{difficulty}</Badge>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-accent-900 dark:text-white mb-2 leading-relaxed">
                        {content}
                      </p>

                      {options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mb-3">
                          {options.map((opt, oi) => {
                            const isCorrect = Array.isArray(correctAnswer)
                              ? correctAnswer.includes(oi)
                              : correctAnswer === oi;
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

                      <div className="flex items-center gap-2 flex-wrap text-xs text-accent-500 dark:text-accent-400">
                        <span className="font-semibold text-accent-700 dark:text-accent-300">{category}</span>
                        <span>·</span>
                        <span>{points} {points === 1 ? 'Point' : 'Points'}</span>
                        {tags.map((t, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-300 px-2 py-0.5 rounded-md">
                            <Tag size={10} /> {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(id)}
                        className="p-1.5 text-accent-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Delete Question"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Question Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add Item to Question Bank"
        subtitle="Author a reusable question to include in multiple assessments."
        size="lg"
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={isSubmitting} icon={<Check size={14} />} onClick={handleCreateQuestion}>
              Save to Question Bank
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Question Prompt"
            rows={3}
            placeholder="Type your question stem here..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Format"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              options={[
                { value: 'Multiple Choice', label: 'Multiple Choice' },
                { value: 'Multiple Select', label: 'Multiple Select' },
                { value: 'True / False', label: 'True / False' },
                { value: 'Short Answer', label: 'Short Answer' },
              ]}
            />
            <Select
              label="Difficulty"
              value={newDifficulty}
              onChange={(e) => setNewDifficulty(e.target.value)}
              options={[
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
              ]}
            />
            <Input
              label="Domain Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300">
              Answer Options (Select correct choice)
            </label>
            {newOptions.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewCorrectAnswer(i)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    newCorrectAnswer === i ? 'border-success-500 bg-success-500 text-white' : 'border-accent-300'
                  }`}
                >
                  {newCorrectAnswer === i && <Check size={12} />}
                </button>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const next = [...newOptions];
                    next[i] = e.target.value;
                    setNewOptions(next);
                  }}
                  className="flex-1 h-9 px-3 text-xs rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default QuestionBank;
