import { useState } from 'react';
import {
  FileText, Plus, Trash2, Save, Eye, Settings2,
  Shield, ListChecks, ChevronUp, ChevronDown, GripVertical,
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, Button, Input, Select, Textarea, Badge,
  PageHeader,
} from '@/components/ui';
import { questions as defaultQuestions } from '@/data';






const questionTypes = ['Multiple Choice', 'Multiple Select', 'True / False', 'Short Answer', 'Long Answer', 'Numerical', 'Scenario', 'Coding', 'Custom'];
const securityLevels = ['Standard', 'Monitored', 'Secure'] ;
const assessmentTypes = ['Quiz', 'Examination', 'MCQ Test', 'Knowledge Assessment', 'Skills Assessment', 'Aptitude Test', 'Scenario Assessment', 'Interview Assessment', 'Custom Assessment'];

export function AssessmentBuilder({ onNavigate }) {
  const [questions, setQuestions] = useState(defaultQuestions.slice(0, 4));
  const [activeIdx, setActiveIdx] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const activeQuestion = questions[activeIdx];

  const addQuestion = () => {
    const newQ = {
      id: questions.length + 1,
      type: 'Multiple Choice',
      content: 'New question',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: '',
      points: 1,
      difficulty: 'Easy',
      category: '',
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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create Assessment"
        subtitle="Build your assessment with questions, rules, and policies"
        icon={<FileText size={22} />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Assessments', onClick: () => onNavigate('org-assessments') },
          { label: 'Builder' },
        ]}
        actions={
          <>
            <Button variant="ghost" size="sm" icon={<Eye size={16} />} onClick={() => setShowPreview(!showPreview)}>
              {showPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button variant="outline" size="sm" icon={<Save size={16} />}>Save Draft</Button>
            <Button variant="primary" size="sm">Publish</Button>
          </>
        }
      />

      {/* Assessment settings bar */}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input label="Title" placeholder="Assessment title" defaultValue="University Admission Test" />
          <Select label="Assessment Type" options={assessmentTypes.map(t => ({ value: t, label: t }))} />
          <Input label="Duration (minutes)" type="number" defaultValue={90} />
          <Input label="Passing Score (%)" type="number" defaultValue={60} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Question list */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader title="Questions" subtitle={`${questions.length} total`} icon={<ListChecks size={18} />} action={<Button variant="ghost" size="sm" icon={<Plus size={16} />} onClick={addQuestion}>Add</Button>} />
            <CardBody className="p-2 space-y-1">
              {questions.map((q, i) => (
                <div
                  key={q.id}
                  onClick={() => setActiveIdx(i)}
                  className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors ${activeIdx === i ? 'bg-primary-50 border border-primary-200' : 'hover:bg-accent-50'}`}
                >
                  <GripVertical size={14} className="text-accent-300 shrink-0" />
                  <span className={`text-xs font-bold w-5 text-center ${activeIdx === i ? 'text-primary-600' : 'text-accent-400'}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs truncate ${activeIdx === i ? 'text-primary-800' : 'text-accent-600'}`}>{q.content}</p>
                    <p className="text-xs text-accent-400">{q.type}</p>
                  </div>
                </div>
              ))}
              <button onClick={addQuestion} className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                <Plus size={14} /> Add Question
              </button>
            </CardBody>
          </Card>
        </div>

        {/* Center: Question editor */}
        <div className="lg:col-span-6">
          {activeQuestion && !showPreview && (
            <Card>
              <CardHeader
                title={`Question ${activeIdx + 1}`}
                subtitle={activeQuestion.type}
                icon={<FileText size={18} />}
                action={
                  <div className="flex items-center gap-1">
                    <button onClick={() => moveQuestion(activeIdx, 'up')} disabled={activeIdx === 0} className="p-1.5 text-accent-400 hover:text-accent-700 hover:bg-accent-100 rounded transition-colors disabled:opacity-30"><ChevronUp size={16} /></button>
                    <button onClick={() => moveQuestion(activeIdx, 'down')} disabled={activeIdx === questions.length - 1} className="p-1.5 text-accent-400 hover:text-accent-700 hover:bg-accent-100 rounded transition-colors disabled:opacity-30"><ChevronDown size={16} /></button>
                    <button onClick={() => deleteQuestion(activeIdx)} className="p-1.5 text-accent-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"><Trash2 size={16} /></button>
                  </div>
                }
              />
              <CardBody className="space-y-4">
                <Select
                  label="Question Type"
                  options={questionTypes.map(t => ({ value: t, label: t }))}
                  value={activeQuestion.type}
                  onChange={(e) => updateQuestion(activeIdx, { type: e.target.value  })}
                />
                <Textarea
                  label="Question Content"
                  rows={3}
                  value={activeQuestion.content}
                  onChange={(e) => updateQuestion(activeIdx, { content: e.target.value })}
                />

                {/* Options editor for choice-based questions */}
                {(activeQuestion.type === 'Multiple Choice' || activeQuestion.type === 'Multiple Select' || activeQuestion.type === 'True / False') && (
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">Answer Options</label>
                    <div className="space-y-2">
                      {activeQuestion.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuestion(activeIdx, { correctAnswer: oi })}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              (Array.isArray(activeQuestion.correctAnswer) ? activeQuestion.correctAnswer.includes(oi) : activeQuestion.correctAnswer === oi)
                                ? 'border-success-500 bg-success-500' : 'border-accent-300 hover:border-accent-400'
                            }`}
                          >
                            {(Array.isArray(activeQuestion.correctAnswer) ? activeQuestion.correctAnswer.includes(oi) : activeQuestion.correctAnswer === oi) && <span className="w-2 h-2 rounded-full bg-white" />}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const newOpts = [...activeQuestion.options];
                              newOpts[oi] = e.target.value;
                              updateQuestion(activeIdx, { options: newOpts });
                            }}
                            className="flex-1 h-9 px-3 text-sm rounded-lg border border-accent-300 bg-white text-accent-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          />
                          {activeQuestion.options.length > 2 && (
                            <button onClick={() => { const newOpts = activeQuestion.options.filter((_, i) => i !== oi); updateQuestion(activeIdx, { options: newOpts }); }} className="p-1.5 text-accent-400 hover:text-danger-600 rounded transition-colors">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {activeQuestion.type !== 'True / False' && (
                        <button
                          onClick={() => updateQuestion(activeIdx, { options: [...activeQuestion.options, `Option ${String.fromCharCode(65 + activeQuestion.options.length)}`] })}
                          className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <Plus size={14} /> Add Option
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <Textarea
                  label="Explanation"
                  rows={2}
                  placeholder="Explain the correct answer..."
                  value={activeQuestion.explanation}
                  onChange={(e) => updateQuestion(activeIdx, { explanation: e.target.value })}
                />

                <div className="grid grid-cols-3 gap-3">
                  <Input label="Points" type="number" value={activeQuestion.points} onChange={(e) => updateQuestion(activeIdx, { points: Number(e.target.value) })} />
                  <Select
                    label="Difficulty"
                    options={[{ value: 'Easy', label: 'Easy' }, { value: 'Medium', label: 'Medium' }, { value: 'Hard', label: 'Hard' }]}
                    value={activeQuestion.difficulty}
                    onChange={(e) => updateQuestion(activeIdx, { difficulty: e.target.value  })}
                  />
                  <Input label="Category" placeholder="e.g. Algorithms" value={activeQuestion.category} onChange={(e) => updateQuestion(activeIdx, { category: e.target.value })} />
                </div>
              </CardBody>
            </Card>
          )}

          {/* Preview mode */}
          {activeQuestion && showPreview && (
            <Card>
              <CardHeader title="Preview" subtitle="How participants will see this question" icon={<Eye size={18} />} />
              <CardBody>
                <div className="bg-accent-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="primary">Question {activeIdx + 1} of {questions.length}</Badge>
                    <Badge variant="neutral">{activeQuestion.points} points</Badge>
                  </div>
                  <p className="text-lg text-accent-900 mb-4">{activeQuestion.content}</p>
                  {(activeQuestion.type === 'Multiple Choice' || activeQuestion.type === 'True / False') && (
                    <div className="space-y-2">
                      {activeQuestion.options.map((opt, oi) => (
                        <div key={oi} className={`flex items-center gap-3 p-3 rounded-lg border-2 ${activeQuestion.correctAnswer === oi ? 'border-success-300 bg-success-50' : 'border-accent-200 bg-white'}`}>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activeQuestion.correctAnswer === oi ? 'border-success-500 bg-success-500' : 'border-accent-300'}`}>
                            {activeQuestion.correctAnswer === oi && <span className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                          <span className="text-sm text-accent-700">{opt}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {activeQuestion.explanation && (
                    <div className="mt-4 p-3 bg-primary-50 rounded-lg">
                      <p className="text-xs font-medium text-primary-700 mb-1">Explanation</p>
                      <p className="text-sm text-primary-600">{activeQuestion.explanation}</p>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right: Configuration */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader title="Configuration" icon={<Settings2 size={18} />} />
            <CardBody className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">Security Level</label>
                <div className="space-y-2">
                  {securityLevels.map((level) => (
                    <button
                      key={level}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border-2 transition-colors text-left ${level === 'Secure' ? 'border-success-300 bg-success-50' : level === 'Monitored' ? 'border-warning-300 bg-warning-50' : 'border-accent-200 bg-white'}`}
                    >
                      <div className="flex items-center gap-2">
                        <Shield size={16} className={level === 'Secure' ? 'text-success-600' : level === 'Monitored' ? 'text-warning-600' : 'text-accent-400'} />
                        <span className="text-sm font-medium text-accent-700">{level}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">Integrity Policies</label>
                <div className="space-y-2">
                  {['Require camera', 'Fullscreen mode', 'Tab change detection', 'Browser lockdown', 'Session recording'].map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm text-accent-600">
                      <input type="checkbox" defaultChecked className="rounded border-accent-300 text-primary-600 focus:ring-primary-500" />
                      {p}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">Schedule</label>
                <Input type="datetime-local" />
              </div>

              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">Instructions</label>
                <Textarea rows={3} placeholder="Instructions for participants..." defaultValue="Read each question carefully. You have 90 minutes to complete this assessment." />
              </div>

              <div className="pt-3 border-t border-accent-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-accent-600">Total Questions</span>
                  <span className="font-bold text-accent-900">{questions.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-accent-600">Total Points</span>
                  <span className="font-bold text-accent-900">{questions.reduce((s, q) => s + q.points, 0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span className="text-accent-600">Duration</span>
                  <span className="font-bold text-accent-900">90 min</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
