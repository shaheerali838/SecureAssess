import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileText, Plus, Trash2, Save, Eye, Settings2,
  Shield, ListChecks, ChevronUp, ChevronDown, GripVertical, Check, AlertCircle,
  Library, Download
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Button, Input, Select, Textarea, Badge,
  PageHeader, Toast, Modal, SearchBar
} from '@/components/ui';
import { questions as defaultQuestions } from '@/data';
import assessmentService from '@/services/assessment.service';
import questionBankService from '@/services/questionBank.service';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useAuth } from '@/contexts/AuthContext';

const questionTypes = ['Multiple Choice', 'Multiple Select', 'True / False', 'Short Answer', 'Long Answer', 'Numerical', 'Scenario', 'Coding', 'Custom'];
const securityLevels = ['Standard', 'Monitored', 'Secure'];
const assessmentTypes = ['Quiz', 'Examination', 'MCQ Test', 'Knowledge Assessment', 'Skills Assessment', 'Aptitude Test', 'Scenario Assessment', 'Interview Assessment', 'Custom Assessment'];

const extractArray = (res) => {
  if (!res) return [];
  const val = res.status === 'fulfilled' ? res.value : res;
  if (Array.isArray(val)) return val;
  if (Array.isArray(val?.items)) return val.items;
  if (Array.isArray(val?.data?.items)) return val.data.items;
  if (Array.isArray(val?.questions)) return val.questions;
  if (Array.isArray(val?.data)) return val.data;
  return [];
};

const getQuestionPrompt = (q) => {
  if (!q) return '';
  if (typeof q.prompt === 'string') return q.prompt;
  if (typeof q.title === 'string') return q.title;
  if (typeof q.stem === 'string') return q.stem;
  if (typeof q.text === 'string') return q.text;
  if (typeof q.content === 'string') return q.content;
  if (typeof q.content?.text === 'string') return q.content.text;
  if (typeof q.snapshot?.prompt === 'string') return q.snapshot.prompt;
  if (typeof q.snapshot?.title === 'string') return q.snapshot.title;
  return '';
};

export function AssessmentBuilder({ onNavigate }) {
  const location = useLocation();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId = currentOrganization?._id || currentOrganization?.id || user?.organizationId || null;

  const editingAssessmentId = location?.state?.assessmentId || location?.state?.id || null;
  const initialAssessment = location?.state?.assessment || null;

  const [title, setTitle] = useState(initialAssessment?.title || 'Custom Assessment');
  const [assessmentType, setAssessmentType] = useState(initialAssessment?.type || 'Examination');
  const [duration, setDuration] = useState(
    initialAssessment?.duration?.value || (initialAssessment?.durationSeconds ? Math.round(initialAssessment.durationSeconds / 60) : 60)
  );
  const [passingScore, setPassingScore] = useState(initialAssessment?.passingScore || 60);
  const [securityTier, setSecurityTier] = useState(
    initialAssessment?.securitySettings?.proctoringEnabled ? 'Secure' : 'Standard'
  );

  const [questions, setQuestions] = useState([
    {
      id: Date.now(),
      type: 'Multiple Choice',
      content: 'Enter custom question prompt here...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: '',
      points: 1,
      difficulty: 'Medium',
      category: 'General',
      tags: [],
    },
  ]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Question Bank Picker Modal State
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [bankLoading, setBankLoading] = useState(false);

  const activeQuestion = questions[activeIdx] || questions[0];

  // Load existing assessment details and its questions from database if editing
  useEffect(() => {
    async function loadAssessmentFromDB() {
      if (!editingAssessmentId) return;

      try {
        const [assessRes, questionsRes] = await Promise.allSettled([
          assessmentService.getAssessmentById(editingAssessmentId, orgId),
          assessmentService.getAssessmentQuestions(editingAssessmentId, {}, orgId),
        ]);

        const aData = assessRes.status === 'fulfilled' ? (assessRes.value?.data || assessRes.value) : initialAssessment;
        if (aData) {
          if (aData.title) setTitle(aData.title);
          if (aData.type) setAssessmentType(aData.type);
          if (aData.duration?.value) setDuration(aData.duration.value);
          else if (aData.durationSeconds) setDuration(Math.round(aData.durationSeconds / 60));
          if (aData.passingScore) setPassingScore(aData.passingScore);
          if (aData.securitySettings) {
            setSecurityTier(aData.securitySettings.proctoringEnabled ? 'Secure' : 'Standard');
          }
        }

        const loadedQuestions = extractArray(questionsRes);
        if (loadedQuestions.length > 0) {
          const mapped = loadedQuestions.map((q) => {
            const prompt = getQuestionPrompt(q);
            const opts = Array.isArray(q.options || q.snapshot?.options)
              ? (q.options || q.snapshot.options).map((o) => (typeof o === 'string' ? o : o.text || ''))
              : ['Option A', 'Option B', 'Option C', 'Option D'];

            return {
              id: q._id || q.id || Date.now() + Math.random(),
              questionBankId: q.questionId || q.snapshot?._id || q._id,
              type: q.type || q.snapshot?.type || 'Multiple Choice',
              content: prompt,
              options: opts,
              correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : (typeof q.snapshot?.correctAnswer === 'number' ? q.snapshot.correctAnswer : 0),
              explanation: q.explanation || q.snapshot?.explanation || '',
              points: Number(q.points || q.marks || q.snapshot?.points) || 1,
              difficulty: q.difficulty || q.snapshot?.difficulty || 'Medium',
              category: q.category || q.snapshot?.category || 'General',
              tags: q.tags || q.snapshot?.tags || [],
            };
          });
          setQuestions(mapped);
          setActiveIdx(0);
        }
      } catch (err) {
        console.warn('Load assessment from DB note:', err.message);
      }
    }

    loadAssessmentFromDB();
  }, [editingAssessmentId, orgId]);

  const fetchBankQuestions = async () => {
    setBankLoading(true);
    try {
      const data = await questionBankService.getQuestions({}, orgId);
      const items = Array.isArray(data) ? data : (data?.items || data?.questions || data?.data || []);
      setBankQuestions(items.length > 0 ? items : defaultQuestions);
    } catch (err) {
      console.warn('Bank questions fetch note:', err.message);
      setBankQuestions(defaultQuestions);
    } finally {
      setBankLoading(false);
    }
  };

  const handleOpenBankModal = () => {
    setBankModalOpen(true);
    fetchBankQuestions();
  };

  const handleImportQuestion = (bankQ) => {
    const promptText = getQuestionPrompt(bankQ) || 'Question content';
    const newQ = {
      id: Date.now() + Math.random(),
      questionBankId: bankQ._id || bankQ.id,
      type: bankQ.type || 'Multiple Choice',
      content: promptText,
      options: Array.isArray(bankQ.options)
        ? bankQ.options.map(o => typeof o === 'string' ? o : (o.text || o.content || ''))
        : ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: typeof bankQ.correctAnswer === 'number' ? bankQ.correctAnswer : 0,
      explanation: bankQ.explanation || '',
      points: Number(bankQ.points || bankQ.marks) || 1,
      difficulty: bankQ.difficulty || 'Medium',
      category: bankQ.category || 'General',
      tags: bankQ.tags || [],
    };
    setQuestions(prev => [...prev, newQ]);
    setActiveIdx(questions.length);
    setToastMessage({ type: 'success', text: `Imported "${promptText.slice(0, 30)}..." to assessment` });
  };

  const addQuestion = () => {
    const newQ = {
      id: Date.now(),
      type: 'Multiple Choice',
      content: 'New question stem...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: '',
      points: 1,
      difficulty: 'Easy',
      category: 'General',
      tags: [],
    };
    setQuestions([...questions, newQ]);
    setActiveIdx(questions.length);
  };

  const updateQuestion = (idx, updates) => {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, ...updates } : q));
  };

  const deleteQuestion = (idx) => {
    if (questions.length > 1) {
      setQuestions(qs => qs.filter((_, i) => i !== idx));
      if (activeIdx >= idx && activeIdx > 0) setActiveIdx(activeIdx - 1);
    }
  };

  const moveQuestion = (idx, dir) => {
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const newQs = [...questions];
    [newQs[idx], newQs[newIdx]] = [newQs[newIdx], newQs[idx]];
    setQuestions(newQs);
    setActiveIdx(newIdx);
  };

  const handleSaveOrPublish = async (isPublish = false) => {
    if (!title.trim()) {
      setToastMessage({ type: 'error', text: 'Assessment title is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      const durationMins = Number(duration) || 60;
      const cleanCode = `ASM-${title.replace(/[^A-Za-z0-9]/g, '').slice(0, 6).toUpperCase() || 'EVAL'}-${Date.now().toString(36).toUpperCase()}`;

      const payload = {
        title: title.trim(),
        code: cleanCode,
        type: 'EXAMINATION',
        duration: {
          value: durationMins,
          unit: 'MINUTES',
        },
        durationSeconds: durationMins * 60,
        passingScore: Number(passingScore) || 60,
        securitySettings: {
          proctoringEnabled: securityTier !== 'Standard',
          proctoringMode: securityTier === 'Secure' ? 'AI_ASSISTED' : 'STANDARD',
          tabSwitchDetection: true,
          copyPasteBlocked: securityTier === 'Secure',
          cameraRequired: securityTier === 'Secure',
        },
        status: 'DRAFT',
      };

      let assessmentId = editingAssessmentId;

      if (editingAssessmentId) {
        await assessmentService.updateAssessment(editingAssessmentId, payload, orgId);
      } else {
        const res = await assessmentService.createAssessment(payload, orgId);
        const assessmentData = res?.data || res;
        assessmentId = assessmentData?._id || assessmentData?.id;
      }

      // Attach sections and all questions to database
      if (assessmentId && questions.length > 0) {
        try {
          const sectionRes = await assessmentService.createAssessmentSection(assessmentId, {
            title: 'General Section',
            order: 1,
          }, orgId);
          const sectionData = sectionRes?.data || sectionRes;
          const sectionId = sectionData?._id || sectionData?.id;

          if (sectionId) {
            for (const q of questions) {
              let targetQuestionId = q.questionBankId;

              // If it's a new question without bank ID, create it in Question Bank
              if (!targetQuestionId) {
                try {
                  const prompt = getQuestionPrompt(q) || 'Question stem';
                  const qPayload = {
                    prompt,
                    title: prompt.slice(0, 80),
                    type: q.type || 'Multiple Choice',
                    difficulty: (q.difficulty || 'Medium').toUpperCase(),
                    points: Number(q.points) || 1,
                    marks: Number(q.points) || 1,
                    options: Array.isArray(q.options)
                      ? q.options.map((opt, idx) => ({
                          id: String.fromCharCode(65 + idx),
                          text: typeof opt === 'string' ? opt : opt.text || '',
                        }))
                      : [],
                    correctAnswer: q.correctAnswer,
                    explanation: q.explanation || '',
                  };
                  const createdQRes = await questionBankService.createQuestion(qPayload, orgId);
                  const createdQData = createdQRes?.data || createdQRes;
                  targetQuestionId = createdQData?._id || createdQData?.id;
                } catch (cErr) {
                  console.warn('Auto create question note:', cErr.message);
                }
              }

              if (targetQuestionId) {
                await assessmentService.createAssessmentQuestion(assessmentId, {
                  sectionId,
                  questionId: targetQuestionId,
                  points: Number(q.points) || 1,
                }, orgId).catch(() => {});
              }
            }
          }
        } catch (attachErr) {
          console.warn('Questions attachment sub-step notice:', attachErr.message);
        }
      }

      // If publish was requested, transition status to PUBLISHED
      if (isPublish && assessmentId) {
        try {
          await assessmentService.publishAssessment(assessmentId, orgId);
        } catch (pubErr) {
          console.warn('Publish transition notice:', pubErr.message);
        }
      }

      setToastMessage({
        type: 'success',
        text: isPublish ? 'Assessment published successfully!' : 'Assessment draft saved successfully!',
      });

      setTimeout(() => {
        if (isPublish) {
          onNavigate('org-assessments');
        }
      }, 1200);
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: 'Could not save assessment: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
        title="Assessment Authoring Suite"
        subtitle="Configure evaluation structure, author item pools, and declare proctoring parameters."
        icon={<FileText size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Assessments', onClick: () => onNavigate('org-assessments') },
          { label: 'Builder' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye size={15} />}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Exit Preview' : 'Interactive Preview'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Save size={15} />}
              loading={isSubmitting}
              onClick={() => handleSaveOrPublish(false)}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Check size={15} />}
              loading={isSubmitting}
              onClick={() => handleSaveOrPublish(true)}
            >
              Publish Assessment
            </Button>
          </div>
        }
      />

      {/* Assessment Global Parameters */}
      <Card>
        <CardBody className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          <Input
            label="Assessment Title"
            placeholder="e.g. CS201 Midterm Examination"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Select
            label="Assessment Type"
            value={assessmentType}
            onChange={(e) => setAssessmentType(e.target.value)}
            options={assessmentTypes.map(t => ({ value: t, label: t }))}
          />
          <Input
            label="Duration (Minutes)"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
          />
          <Input
            label="Passing Score (%)"
            type="number"
            value={passingScore}
            onChange={(e) => setPassingScore(e.target.value)}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Question Navigator List */}
        <div className="lg:col-span-4 xl:col-span-3">
          <Card className="h-full flex flex-col">
            <CardHeader
              title="Question Pool"
              subtitle={`${questions.length} total items`}
              icon={<ListChecks size={18} />}
            />
            {/* Responsive Action Toolbar */}
            <div className="p-2.5 border-b border-accent-100 dark:border-accent-800/80 grid grid-cols-2 gap-2 bg-accent-50/50 dark:bg-accent-950/30">
              <Button
                variant="outline"
                size="sm"
                icon={<Library size={13} />}
                onClick={handleOpenBankModal}
                className="w-full justify-center text-xs py-1.5 h-8 font-semibold"
                title="Import from Question Bank"
              >
                Bank
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={addQuestion}
                className="w-full justify-center text-xs py-1.5 h-8 font-semibold"
                title="Add new question"
              >
                Add Item
              </Button>
            </div>
            <CardBody className="p-2 space-y-1.5 flex-1 max-h-[620px] overflow-y-auto">
              {questions.map((q, i) => {
                const isActive = activeIdx === i;
                return (
                  <div
                    key={q.id || i}
                    onClick={() => setActiveIdx(i)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-primary-50 dark:bg-primary-950/70 border border-primary-300 dark:border-primary-700/80 shadow-soft'
                        : 'hover:bg-accent-50 dark:hover:bg-accent-800/50 border border-transparent hover:border-accent-200 dark:hover:border-accent-700/60'
                    }`}
                  >
                    <GripVertical size={13} className="text-accent-400 shrink-0" />
                    <span className={`text-xs font-bold w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-soft'
                        : 'bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-400'
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${
                        isActive
                          ? 'text-primary-900 dark:text-primary-200'
                          : 'text-accent-800 dark:text-accent-200'
                      }`}>
                        {getQuestionPrompt(q) || 'New question stem...'}
                      </p>
                      <p className="text-[11px] text-accent-500 dark:text-accent-400">{q.type} · {q.points || 1} pt</p>
                    </div>
                  </div>
                );
              })}
            </CardBody>
          </Card>
        </div>

        {/* Center: Question Authoring Surface */}
        <div className="lg:col-span-8 xl:col-span-6">
          {activeQuestion && !showPreview && (
            <Card>
              <CardHeader
                title={`Item #${activeIdx + 1}`}
                subtitle={activeQuestion.type}
                icon={<FileText size={18} />}
                action={
                  <div className="flex items-center gap-1 bg-accent-100 dark:bg-accent-800/80 p-1 rounded-xl border border-accent-200 dark:border-accent-700/60">
                    <button
                      type="button"
                      onClick={() => moveQuestion(activeIdx, 'up')}
                      disabled={activeIdx === 0}
                      className="p-1.5 text-accent-500 hover:text-accent-900 dark:hover:text-white hover:bg-white dark:hover:bg-accent-700 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <ChevronUp size={15} />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveQuestion(activeIdx, 'down')}
                      disabled={activeIdx === questions.length - 1}
                      className="p-1.5 text-accent-500 hover:text-accent-900 dark:hover:text-white hover:bg-white dark:hover:bg-accent-700 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      <ChevronDown size={15} />
                    </button>
                    <div className="w-px h-4 bg-accent-300 dark:bg-accent-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => deleteQuestion(activeIdx)}
                      className="p-1.5 text-accent-500 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/50 rounded-lg transition-colors cursor-pointer"
                      title="Delete question"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                }
              />
              <CardBody className="p-5 space-y-5">
                <Select
                  label="Question Format"
                  options={questionTypes.map(t => ({ value: t, label: t }))}
                  value={activeQuestion.type}
                  onChange={(e) => updateQuestion(activeIdx, { type: e.target.value })}
                />
                <Textarea
                  label="Question Prompt / Problem Description"
                  rows={4}
                  value={getQuestionPrompt(activeQuestion)}
                  onChange={(e) => updateQuestion(activeIdx, { content: e.target.value, prompt: e.target.value })}
                  placeholder="Enter question text or stem..."
                />

                {/* Options editor for choice-based questions */}
                {(activeQuestion.type === 'Multiple Choice' || activeQuestion.type === 'Multiple Select' || activeQuestion.type === 'True / False') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300">
                        Answer Choices & Correct Key
                      </label>
                      <span className="text-[11px] text-accent-400">Click circle to mark correct key</span>
                    </div>
                    <div className="space-y-2.5">
                      {(activeQuestion.options || []).map((opt, oi) => {
                        const optText = typeof opt === 'string' ? opt : (opt?.text || '');
                        const isCorrect = Array.isArray(activeQuestion.correctAnswer)
                          ? activeQuestion.correctAnswer.includes(oi)
                          : activeQuestion.correctAnswer === oi;
                        return (
                          <div key={oi} className="flex items-center gap-2.5">
                            <button
                              type="button"
                              onClick={() => updateQuestion(activeIdx, { correctAnswer: oi })}
                              className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                isCorrect
                                  ? 'border-success-500 bg-success-500 text-white shadow-soft'
                                  : 'border-accent-300 dark:border-accent-700 hover:border-accent-400 bg-white dark:bg-accent-800 text-transparent hover:text-accent-300'
                              }`}
                              title={isCorrect ? 'Correct answer' : 'Set as correct'}
                            >
                              <Check size={14} className={isCorrect ? 'stroke-[3]' : 'opacity-30'} />
                            </button>
                            <input
                              type="text"
                              value={optText}
                              placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                              onChange={(e) => {
                                const newOpts = [...(activeQuestion.options || [])];
                                newOpts[oi] = e.target.value;
                                updateQuestion(activeIdx, { options: newOpts });
                              }}
                              className="flex-1 h-10 px-3.5 text-xs rounded-xl border border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            />
                            {activeQuestion.options && activeQuestion.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newOpts = activeQuestion.options.filter((_, i) => i !== oi);
                                  updateQuestion(activeIdx, { options: newOpts });
                                }}
                                className="p-2 text-accent-400 hover:text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-950/40 rounded-xl transition-colors cursor-pointer"
                                title="Remove choice"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                      {activeQuestion.type !== 'True / False' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Plus size={14} />}
                          onClick={() => updateQuestion(activeIdx, { options: [...(activeQuestion.options || []), `Option ${String.fromCharCode(65 + (activeQuestion.options?.length || 0))}`] })}
                          className="text-xs"
                        >
                          Add Option
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <Textarea
                  label="Explanation & Feedback Rationale"
                  rows={2}
                  placeholder="Provide guidance or hints displayed after review..."
                  value={activeQuestion.explanation || ''}
                  onChange={(e) => updateQuestion(activeIdx, { explanation: e.target.value })}
                />

                <div className="pt-4 border-t border-accent-100 dark:border-accent-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input label="Points Awarded" type="number" value={activeQuestion.points || 1} onChange={(e) => updateQuestion(activeIdx, { points: Number(e.target.value) })} />
                  <Select
                    label="Difficulty Level"
                    options={[{ value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }]}
                    value={activeQuestion.difficulty || 'Medium'}
                    onChange={(e) => updateQuestion(activeIdx, { difficulty: e.target.value })}
                  />
                  <Input label="Domain Category" placeholder="e.g. System Design" value={activeQuestion.category || ''} onChange={(e) => updateQuestion(activeIdx, { category: e.target.value })} />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Interactive Candidate View Preview */}
          {activeQuestion && showPreview && (
            <Card>
              <CardHeader title="Candidate View Preview" subtitle="Real-time rendering of participant experience" icon={<Eye size={18} />} />
              <CardBody className="p-5">
                <div className="bg-accent-50/70 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800 rounded-2xl p-6 space-y-5">
                  <div className="flex items-center justify-between">
                    <Badge variant="primary">Question {activeIdx + 1} of {questions.length}</Badge>
                    <Badge variant="neutral">{activeQuestion.points || 1} Points</Badge>
                  </div>
                  <p className="text-base font-semibold text-accent-900 dark:text-white leading-relaxed">{getQuestionPrompt(activeQuestion)}</p>

                  {(activeQuestion.type === 'Multiple Choice' || activeQuestion.type === 'True / False') && (
                    <div className="space-y-2.5">
                      {(activeQuestion.options || []).map((opt, oi) => {
                        const optText = typeof opt === 'string' ? opt : (opt?.text || '');
                        const isCorrect = activeQuestion.correctAnswer === oi;
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-3.5 p-4 rounded-xl border-2 transition-all ${
                              isCorrect
                                ? 'border-success-500 bg-success-50/60 dark:bg-success-950/30 text-success-900 dark:text-success-100'
                                : 'border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-900 text-accent-800 dark:text-accent-200'
                            }`}
                          >
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              isCorrect ? 'border-success-500 bg-success-500' : 'border-accent-300 dark:border-accent-700'
                            }`}>
                              {isCorrect && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <span className="text-xs font-semibold">{optText}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {activeQuestion.explanation && (
                    <div className="p-4 bg-primary-50/70 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800/40 rounded-xl space-y-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Explanation</p>
                      <p className="text-xs text-primary-900 dark:text-primary-200 leading-relaxed">{activeQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right: Security & Proctoring Configuration */}
        <div className="lg:col-span-12 xl:col-span-3">
          <Card>
            <CardHeader title="Security & Policies" icon={<Settings2 size={18} />} />
            <CardBody className="p-5 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-2.5">
                  Proctoring Tier
                </label>
                <div className="space-y-2">
                  {securityLevels.map((level) => {
                    const isSelected = securityTier === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSecurityTier(level)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left cursor-pointer ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50/60 dark:bg-primary-950/40 text-primary-900 dark:text-primary-100'
                            : 'border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-900/60 hover:border-accent-300 dark:hover:border-accent-700 text-accent-800 dark:text-accent-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Shield size={16} className={isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-accent-400'} />
                          <span className="text-xs font-bold">{level}</span>
                        </div>
                        {isSelected && <Check size={14} className="text-primary-600 dark:text-primary-400 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-2.5">
                  Anti-Cheat Telemetry
                </label>
                <div className="space-y-2">
                  {[
                    'Require Primary Webcam Feed',
                    'Enforce Fullscreen Kiosk Mode',
                    'Tab Blur & Window Loss Flagging',
                    'Continuous Screen Recording',
                    'AI Head Movement Tracking'
                  ].map((p) => (
                    <label
                      key={p}
                      className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent-50 dark:hover:bg-accent-800/40 text-xs font-medium text-accent-700 dark:text-accent-300 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        defaultChecked
                        className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 bg-white dark:bg-accent-800 border-accent-300 dark:border-accent-700 cursor-pointer"
                      />
                      <span>{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-accent-100 dark:border-accent-800">
                <div className="p-3.5 bg-accent-50 dark:bg-accent-950/60 border border-accent-200 dark:border-accent-800/80 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-accent-500 dark:text-accent-400 font-medium">Total Questions</span>
                    <span className="font-bold font-mono text-accent-900 dark:text-white">{questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-accent-500 dark:text-accent-400 font-medium">Total Points</span>
                    <span className="font-bold font-mono text-accent-900 dark:text-white">{questions.reduce((s, q) => s + (Number(q.points) || 1), 0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-accent-500 dark:text-accent-400 font-medium">Exam Window</span>
                    <span className="font-bold font-mono text-accent-900 dark:text-white">{duration} min</span>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Question Bank Import Modal */}
      <Modal
        open={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        title="Import from Question Bank"
        subtitle="Select certified questions from your organizational bank to include in this assessment"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setBankModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <SearchBar
            value={bankSearch}
            onChange={setBankSearch}
            placeholder="Search items by prompt, topic, or keyword..."
          />

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {bankLoading ? (
              <div className="p-8 text-center text-xs text-accent-500">Loading Question Bank items...</div>
            ) : bankQuestions.filter(q => {
              const str = getQuestionPrompt(q).toLowerCase();
              return str.includes(bankSearch.toLowerCase());
            }).length === 0 ? (
              <div className="p-6 text-center text-xs text-accent-500">No matching questions found in bank.</div>
            ) : (
              bankQuestions
                .filter(q => {
                  const str = getQuestionPrompt(q).toLowerCase();
                  return str.includes(bankSearch.toLowerCase());
                })
                .map((bq, idx) => {
                  const isAlreadyAdded = questions.some(q => q.questionBankId === (bq._id || bq.id));
                  const prompt = getQuestionPrompt(bq) || 'Untitled Question';
                  return (
                    <div
                      key={bq._id || bq.id || idx}
                      className="p-3.5 rounded-xl border border-accent-200 dark:border-accent-800 bg-white dark:bg-accent-800/60 flex items-center justify-between gap-3 hover:border-accent-300 dark:hover:border-accent-700 transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="primary">{bq.type || 'MCQ'}</Badge>
                          <Badge variant="neutral">{bq.points || bq.marks || 1} Pts</Badge>
                          {bq.difficulty && <Badge variant={bq.difficulty === 'Hard' ? 'danger' : bq.difficulty === 'Medium' ? 'warning' : 'success'}>{bq.difficulty}</Badge>}
                        </div>
                        <p className="text-xs font-semibold text-accent-900 dark:text-white truncate">
                          {prompt}
                        </p>
                      </div>
                      <Button
                        variant={isAlreadyAdded ? 'outline' : 'primary'}
                        size="sm"
                        icon={isAlreadyAdded ? <Check size={13} /> : <Plus size={13} />}
                        disabled={isAlreadyAdded}
                        onClick={() => handleImportQuestion(bq)}
                      >
                        {isAlreadyAdded ? 'Added' : 'Import'}
                      </Button>
                    </div>
                  );
                })
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default AssessmentBuilder;
