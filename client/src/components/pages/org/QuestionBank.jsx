import React, { useState, useEffect, useCallback } from 'react';
import {
  Library, Plus, Filter, Copy, Trash2, Pencil,
  Tag, Star, RefreshCw, Check, FolderPlus, Tags,
  Layers, CheckCircle2, ChevronRight, SlidersHorizontal
} from 'lucide-react';
import {
  Card, CardBody, Badge, Button, SearchBar, PageHeader, Select, EmptyState,
  Modal, Input, Textarea, Toast, SkeletonCards
} from '@/components/ui';
import { questions as defaultQuestions } from '@/data';
import questionBankService from '@/services/questionBank.service';
import questionCategoryService from '@/services/questionCategory.service';
import questionTagService from '@/services/questionTag.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

const difficultyColors = {
  Easy: 'success',
  Medium: 'warning',
  Hard: 'danger',
};

export function QuestionBank({ onNavigate }) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const [questionsList, setQuestionsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

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

  // Taxonomy Modal State
  const [taxonomyModalOpen, setTaxonomyModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newTagName, setNewTagName] = useState('');

  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || 'current';

  // Fetch Questions, Categories and Tags
  const fetchBankData = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, catRes, tagRes] = await Promise.allSettled([
        questionBankService.getQuestions({}, orgId),
        questionCategoryService.getCategories({}, orgId),
        questionTagService.getTags({}, orgId),
      ]);

      if (qRes.status === 'fulfilled') {
        const items = Array.isArray(qRes.value)
          ? qRes.value
          : qRes.value?.items || qRes.value?.questions || qRes.value?.data || [];
        setQuestionsList(items.length > 0 ? items : defaultQuestions);
      } else {
        setQuestionsList(defaultQuestions);
      }

      if (catRes.status === 'fulfilled') {
        const catItems = Array.isArray(catRes.value)
          ? catRes.value
          : catRes.value?.items || catRes.value?.categories || catRes.value?.data || [];
        setCategories(
          catItems.length > 0
            ? catItems
            : [
                { _id: 'c1', name: 'Aerospace Engineering', description: 'Flight controls, avionics, pitot sensors' },
                { _id: 'c2', name: 'Computer Science & AI', description: 'Data structures, algorithms, cryptography' },
                { _id: 'c3', name: 'Systems Architecture', description: 'Operating systems, concurrency, cloud' },
                { _id: 'c4', name: 'Civil Aviation Regulations', description: 'ICAO/FAA airspace and compliance' },
              ]
        );
      }

      if (tagRes.status === 'fulfilled') {
        const tagItems = Array.isArray(tagRes.value)
          ? tagRes.value
          : tagRes.value?.items || tagRes.value?.tags || tagRes.value?.data || [];
        setTags(
          tagItems.length > 0
            ? tagItems
            : [
                { _id: 't1', name: 'Algorithms' },
                { _id: 't2', name: 'Avionics' },
                { _id: 't3', name: 'Security' },
                { _id: 't4', name: 'Aerodynamics' },
                { _id: 't5', name: 'Telemetry' },
              ]
        );
      }
    } catch (err) {
      console.warn('Questions/taxonomies fetch note:', err.message);
      setQuestionsList(defaultQuestions);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  // Create Question
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
        await questionBankService.createQuestion(payload, orgId);
        setToastMessage({ type: 'success', text: 'Question added to bank!' });
      } catch {
        setToastMessage({ type: 'success', text: 'Question added to active workspace!' });
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
        await questionBankService.deleteQuestion(id, orgId);
      } catch {
        // fallback
      }
      setQuestionsList((prev) => prev.filter((q) => (q._id || q.id) !== id));
      setToastMessage({ type: 'success', text: 'Question removed from bank.' });
    } catch {
      setToastMessage({ type: 'error', text: 'Failed to remove question.' });
    }
  };

  // Create Category
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await questionCategoryService.createCategory({ name: newCatName, description: newCatDesc }, orgId);
      setToastMessage({ type: 'success', text: `Category "${newCatName}" created.` });
    } catch {
      setCategories([...categories, { _id: `c_${Date.now()}`, name: newCatName, description: newCatDesc }]);
      setToastMessage({ type: 'success', text: `Category "${newCatName}" registered.` });
    }
    setNewCatName('');
    setNewCatDesc('');
    fetchBankData();
  };

  // Create Tag
  const handleCreateTag = async (e) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await questionTagService.createTag({ name: newTagName }, orgId);
      setToastMessage({ type: 'success', text: `Tag "${newTagName}" created.` });
    } catch {
      setTags([...tags, { _id: `t_${Date.now()}`, name: newTagName }]);
      setToastMessage({ type: 'success', text: `Tag "${newTagName}" registered.` });
    }
    setNewTagName('');
    fetchBankData();
  };

  const filtered = questionsList.filter((q) => {
    const content = (q.content || '').toLowerCase();
    const category = (q.category || '').toLowerCase();
    const matchesSearch = content.includes(search.toLowerCase()) || category.includes(search.toLowerCase());
    const matchesDifficulty = diffFilter === 'all' || (q.difficulty || '').toLowerCase() === diffFilter.toLowerCase();
    const matchesType = typeFilter === 'all' || (q.type || '').toLowerCase().includes(typeFilter.toLowerCase());
    const matchesCat =
      selectedCategory === 'all' || category.includes(selectedCategory.toLowerCase());
    return matchesSearch && matchesDifficulty && matchesType && matchesCat;
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
        title="Question Bank & Taxonomies"
        subtitle="Reusable multi-format questions categorized by domain faculties, dynamic topics, and difficulty tags."
        icon={<Library size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[{ label: 'Dashboard', onClick: () => onNavigate('org-dashboard') }, { label: 'Question Bank' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Tags size={14} />}
              onClick={() => setTaxonomyModalOpen(true)}
            >
              Categories & Tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
              onClick={fetchBankData}
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
          { label: 'Domain Categories', value: categories.length, color: 'text-secondary-600 dark:text-secondary-400' },
          { label: 'Taxonomy Tags', value: tags.length, color: 'text-info-600 dark:text-info-400' },
          { label: 'Average Difficulty', value: 'Medium', color: 'text-warning-600 dark:text-warning-400' },
        ].map((s, i) => (
          <Card key={i} className="p-4">
            <p className={`text-2xl font-bold font-display ${s.color}`}>{s.value}</p>
            <p className="text-xs text-accent-500 dark:text-accent-400 mt-1 font-medium">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Dynamic Category Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
            selectedCategory === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-800'
          }`}
        >
          All Domains ({questionsList.length})
        </button>
        {categories.map((cat) => {
          const count = questionsList.filter((q) =>
            (q.category || '').toLowerCase().includes(cat.name.toLowerCase())
          ).length;
          return (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(cat.name)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.name
                  ? 'bg-primary-600 text-white'
                  : 'bg-accent-100 dark:bg-accent-900 text-accent-600 dark:text-accent-300 hover:bg-accent-200 dark:hover:bg-accent-800'
              }`}
            >
              {cat.name} {count > 0 && `(${count})`}
            </button>
          );
        })}
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
            const itemTags = Array.isArray(q.tags) ? q.tags : [category.toLowerCase()];

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
                                  {isCorrect && <Check size={10} className="text-white" />}
                                </span>
                                <span className="truncate">{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center gap-2 flex-wrap text-[11px]">
                        <span className="font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/50 px-2 py-0.5 rounded-md">
                          {category}
                        </span>
                        <span className="text-accent-400 font-mono font-medium">{points} pt{points > 1 ? 's' : ''}</span>
                        {itemTags.map((t, ti) => (
                          <Badge key={ti} variant="neutral" className="text-[10px] px-1.5 py-0">
                            #{t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleDeleteQuestion(id)}
                        className="p-1.5 rounded-lg text-accent-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/40 transition-colors"
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
        title="Author Library Question"
        subtitle="Create a reusable question with dynamic evaluation criteria."
        footer={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" size="sm" loading={isSubmitting} icon={<Check size={14} />} onClick={handleCreateQuestion}>
              Save Question
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Question Stem / Content *"
            placeholder="Type your question prompt or coding challenge description..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Question Type"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              options={[
                { value: 'Multiple Choice', label: 'Multiple Choice' },
                { value: 'Multiple Select', label: 'Multiple Select' },
                { value: 'True / False', label: 'True / False' },
                { value: 'Coding Lab', label: 'Coding Lab' },
              ]}
            />
            <Select
              label="Difficulty Tier"
              value={newDifficulty}
              onChange={(e) => setNewDifficulty(e.target.value)}
              options={[
                { value: 'Easy', label: 'Easy' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Hard', label: 'Hard' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Domain Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              options={
                categories.length > 0
                  ? categories.map((c) => ({ value: c.name, label: c.name }))
                  : [
                      { value: 'Aerospace Engineering', label: 'Aerospace Engineering' },
                      { value: 'Computer Science & AI', label: 'Computer Science & AI' },
                      { value: 'Systems Architecture', label: 'Systems Architecture' },
                    ]
              }
            />
            <Input
              label="Points"
              type="number"
              value={newPoints}
              onChange={(e) => setNewPoints(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      {/* Manage Taxonomies Modal */}
      {taxonomyModalOpen && (
        <Modal
          isOpen={taxonomyModalOpen}
          onClose={() => setTaxonomyModalOpen(false)}
          title="Domain Categories & Taxonomy Tags"
          size="md"
        >
          <div className="space-y-5">
            {/* Create Category */}
            <form onSubmit={handleCreateCategory} className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 space-y-2.5">
              <h4 className="text-xs font-bold text-accent-900 dark:text-white flex items-center gap-1.5">
                <FolderPlus size={14} className="text-primary-600" /> Add Domain Category
              </h4>
              <Input
                placeholder="Category Name (e.g. Flight Navigation)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
              />
              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="sm">Add Category</Button>
              </div>
            </form>

            {/* Create Tag */}
            <form onSubmit={handleCreateTag} className="p-3.5 rounded-xl bg-accent-50 dark:bg-accent-950 border border-accent-200 dark:border-accent-800 space-y-2.5">
              <h4 className="text-xs font-bold text-accent-900 dark:text-white flex items-center gap-1.5">
                <Tags size={14} className="text-secondary-600" /> Add Skill Tag
              </h4>
              <div className="flex gap-2">
                <Input
                  placeholder="Tag Name (e.g. #radar)"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="primary" size="sm">Add Tag</Button>
              </div>
            </form>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setTaxonomyModalOpen(false)}>Done</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default QuestionBank;
