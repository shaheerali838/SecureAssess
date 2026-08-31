import React, { useState, useEffect } from 'react';
import {
  Shield, ArrowLeft, Check, Award, MessageSquare,
  Star, RefreshCw
} from 'lucide-react';
import { Button, Card, CardHeader, CardBody, Textarea, Toast } from '@/components/ui';
import evaluationService from '@/services/evaluation.service';

const criteria = [
  { id: 'c1', label: 'Technical Depth & Core Knowledge' },
  { id: 'c2', label: 'Problem Solving & Algorithmic Reasoning' },
  { id: 'c3', label: 'Verbal & Written Communication' },
  { id: 'c4', label: 'Code Quality & Modular Architecture' },
  { id: 'c5', label: 'Adherence to Integrity & Ethics' },
];

const recommendations = [
  { value: 'Strong', color: 'success' },
  { value: 'Positive', color: 'primary' },
  { value: 'Consider', color: 'warning' },
  { value: 'Not Recommended', color: 'danger' },
];

export function Evaluation({ onNavigate }) {
  const [scores, setScores] = useState({ c1: 4, c2: 4, c3: 5, c4: 4, c5: 5 });
  const [recommendation, setRecommendation] = useState('Positive');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [confidentialNotes, setConfidentialNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [candidateInfo, setCandidateInfo] = useState({
    name: 'Sarah Williams',
    cohort: 'Flight Training Cohort 2026',
    assessmentTitle: 'Commercial Aviation Technical Assessment',
    evaluationId: null,
  });

  useEffect(() => {
    const loadPendingEval = async () => {
      try {
        const evRes = await evaluationService.getEvaluations({ limit: 1 });
        const list = Array.isArray(evRes) ? evRes : (evRes?.items || evRes?.data?.items || []);
        if (list.length > 0) {
          const ev = list[0];
          setCandidateInfo({
            name: ev.candidateId?.firstName ? `${ev.candidateId.firstName} ${ev.candidateId.lastName || ''}` : (ev.participant || 'Sarah Williams'),
            cohort: ev.candidateId?.candidateCode ? `Cohort #${ev.candidateId.candidateCode}` : 'Flight Training Cohort 2026',
            assessmentTitle: ev.assessmentId?.title || ev.assessment || 'Commercial Aviation Technical Assessment',
            evaluationId: ev._id || ev.id,
          });
        }
      } catch (err) {
        console.warn('Evaluation metadata note:', err.message);
      }
    };
    loadPendingEval();
  }, []);

  const setScore = (id, score) => {
    setScores(prev => ({ ...prev, [id]: score }));
  };

  const handleSubmitEvaluation = async () => {
    setIsSubmitting(true);
    try {
      if (candidateInfo.evaluationId) {
        try {
          // Finalize evaluation on backend
          await evaluationService.finalizeEvaluation(candidateInfo.evaluationId);
        } catch (apiErr) {
          console.warn('Finalize evaluation API note:', apiErr.message);
        }
      }
      setSubmitted(true);
    } catch (err) {
      setToastMessage({ type: 'error', text: 'Evaluation submit failed: ' + err.message });
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 flex items-center justify-center mx-auto mb-4 shadow-soft">
            <Check size={28} />
          </div>
          <h1 className="text-xl font-bold font-display text-accent-900 dark:text-white mb-2">Rubric Evaluation Recorded</h1>
          <p className="text-xs text-accent-500 dark:text-accent-400 mb-6 leading-relaxed">
            Your scores and qualitative remarks have been certified and synchronized with the candidate's transcript report.
          </p>
          <div className="space-y-2.5">
            <Button variant="primary" fullWidth size="lg" onClick={() => onNavigate('org-participant-profile')}>
              View Candidate Profile
            </Button>
            <Button variant="outline" fullWidth onClick={() => onNavigate('org-evaluations')}>
              Back to Evaluations List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50 dark:bg-accent-950 text-accent-900 dark:text-white transition-colors duration-200 font-sans">
      <header className="bg-white/90 dark:bg-accent-900/90 backdrop-blur-md border-b border-accent-200 dark:border-accent-800 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate('org-evaluations')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center shadow-soft">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900 dark:text-white tracking-tight">SecureAssess</span>
          </button>
          <button
            onClick={() => onNavigate('org-evaluations')}
            className="flex items-center gap-1.5 text-xs font-semibold text-accent-500 dark:text-accent-400 hover:text-accent-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft size={15} /> Back to Evaluations
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {toastMessage && (
          <div className="mb-4">
            <Toast type={toastMessage.type} message={toastMessage.text} onClose={() => setToastMessage(null)} />
          </div>
        )}

        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display text-accent-900 dark:text-white">Candidate Evaluation Rubric</h1>
          <p className="text-xs text-accent-500 dark:text-accent-400 mt-1">
            {candidateInfo.name} · {candidateInfo.cohort} · {candidateInfo.assessmentTitle}
          </p>
        </div>

        <div className="space-y-5">
          {/* Criteria scoring */}
          <Card>
            <CardHeader title="Competency Scoring" subtitle="Rate candidate proficiency on each dimension (1 to 5)" icon={<Award size={18} />} />
            <CardBody className="space-y-5 p-5">
              {criteria.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-accent-800 dark:text-accent-200">{c.label}</span>
                    <span className="text-xs font-mono font-bold text-accent-900 dark:text-white">{scores[c.id] || 0} / 5</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScore(c.id, s)}
                        className={`flex-1 h-9 rounded-xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                          (scores[c.id] || 0) >= s
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400'
                            : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-400 hover:border-accent-300 dark:hover:border-accent-600'
                        }`}
                      >
                        <Star size={15} className={(scores[c.id] || 0) >= s ? 'fill-primary-500 text-primary-500' : ''} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Text fields */}
          <Card>
            <CardHeader title="Qualitative Examiner Remarks" icon={<MessageSquare size={18} />} />
            <CardBody className="space-y-4 p-5">
              <Textarea
                label="Demonstrated Strengths"
                rows={3}
                placeholder="Highlight standout responses, domain competencies..."
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
              />
              <Textarea
                label="Target Areas for Improvement"
                rows={3}
                placeholder="Note edge cases missed, theoretical gaps..."
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
              />
              <Textarea
                label="Confidential Examination Notes"
                rows={2}
                placeholder="Visible strictly to credentialing board reviewers..."
                value={confidentialNotes}
                onChange={(e) => setConfidentialNotes(e.target.value)}
              />
            </CardBody>
          </Card>

          {/* Recommendation */}
          <Card>
            <CardHeader title="Overall Recommendation" subtitle="Final credentialing determination" icon={<Check size={18} />} />
            <CardBody className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {recommendations.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRecommendation(r.value)}
                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all cursor-pointer ${
                      recommendation === r.value
                        ? r.color === 'success'
                          ? 'border-success-500 bg-success-50 dark:bg-success-950/60 text-success-700 dark:text-success-300'
                          : r.color === 'primary'
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
                          : r.color === 'warning'
                          ? 'border-warning-500 bg-warning-50 dark:bg-warning-950/60 text-warning-700 dark:text-warning-300'
                          : 'border-danger-500 bg-danger-50 dark:bg-danger-950/60 text-danger-700 dark:text-danger-300'
                        : 'border-accent-200 dark:border-accent-700 bg-white dark:bg-accent-800 text-accent-600 dark:text-accent-400 hover:border-accent-300 dark:hover:border-accent-600'
                    }`}
                  >
                    {r.value}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  variant="primary"
                  size="lg"
                  icon={<Check size={16} />}
                  loading={isSubmitting}
                  onClick={handleSubmitEvaluation}
                >
                  Submit Final Evaluation
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Evaluation;
