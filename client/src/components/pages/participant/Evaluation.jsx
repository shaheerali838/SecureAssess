import { useState } from 'react';
import {
  Shield, ArrowLeft, Check, Award, MessageSquare,
  Star,
} from 'lucide-react';
import { Button, Card, CardHeader, CardBody, Textarea } from '@/components/ui';






const criteria = [
  { id: 'c1', label: 'Communication' },
  { id: 'c2', label: 'Knowledge' },
  { id: 'c3', label: 'Problem Solving' },
  { id: 'c4', label: 'Decision Making' },
  { id: 'c5', label: 'Professionalism' },
];

const recommendations = [
  { value: 'Strong', color: 'success'  },
  { value: 'Positive', color: 'primary'  },
  { value: 'Consider', color: 'warning'  },
  { value: 'Not Recommended', color: 'danger'  },
];

export function Evaluation({ onNavigate }) {
  const [scores, setScores] = useState({});
  const [recommendation, setRecommendation] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const setScore = (id, score) => {
    setScores({ ...scores, [id]: score });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-accent-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full p-8 text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-success-100 text-success-600 flex items-center justify-center mx-auto mb-4">
            <Check size={32} />
          </div>
          <h1 className="text-2xl font-bold font-display text-accent-900 mb-2">Evaluation Submitted</h1>
          <p className="text-accent-600 mb-6">
            Your evaluation has been recorded. The results are now available in the participant's profile and reports.
          </p>
          <div className="space-y-3">
            <Button variant="primary" fullWidth size="lg" onClick={() => onNavigate('org-participant-profile')}>
              View Participant Profile
            </Button>
            <Button variant="outline" fullWidth onClick={() => onNavigate('org-evaluations')}>
              Back to Evaluations
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent-50">
      <header className="bg-white border-b border-accent-200">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => onNavigate('org-evaluations')} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
              <Shield size={18} className="text-white" />
            </div>
            <span className="font-bold text-accent-900">SecureAssess</span>
          </button>
          <button onClick={() => onNavigate('org-evaluations')} className="flex items-center gap-1.5 text-sm text-accent-500 hover:text-accent-800 transition-colors">
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold font-display text-accent-900">Participant Evaluation</h1>
          <p className="text-sm text-accent-500 mt-1">Sarah Williams · Pilot Training Program · Commercial Pilot Knowledge Assessment</p>
        </div>

        <div className="space-y-4">
          {/* Criteria scoring */}
          <Card>
            <CardHeader title="Evaluation Criteria" subtitle="Score each criterion from 1 to 5" icon={<Award size={18} />} />
            <CardBody className="space-y-5">
              {criteria.map((c) => (
                <div key={c.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-accent-700">{c.label}</span>
                    <span className="text-sm font-bold text-accent-900">{scores[c.id] || 0}/5</span>
                  </div>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setScore(c.id, s)}
                        className={`flex-1 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                          (scores[c.id] || 0) >= s
                            ? 'border-primary-500 bg-primary-50 text-primary-600'
                            : 'border-accent-200 text-accent-400 hover:border-accent-300'
                        }`}
                      >
                        <Star size={16} className={(scores[c.id] || 0) >= s ? 'fill-primary-500 text-primary-500' : ''} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Text fields */}
          <Card>
            <CardHeader title="Written Feedback" icon={<MessageSquare size={18} />} />
            <CardBody className="space-y-4">
              <Textarea label="Strengths" rows={3} placeholder="What did the participant do well?" />
              <Textarea label="Areas for Improvement" rows={3} placeholder="What could the participant improve?" />
              <Textarea label="Private Notes" rows={3} placeholder="Notes visible only to reviewers (not shared with participant)" />
            </CardBody>
          </Card>

          {/* Recommendation */}
          <Card>
            <CardHeader title="Recommendation" subtitle="Your overall recommendation" icon={<Check size={18} />} />
            <CardBody>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {recommendations.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRecommendation(r.value)}
                    className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      recommendation === r.value
                        ? r.color === 'success' ? 'border-success-500 bg-success-50 text-success-700'
                        : r.color === 'primary' ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : r.color === 'warning' ? 'border-warning-500 bg-warning-50 text-warning-700'
                        : 'border-danger-500 bg-danger-50 text-danger-700'
                        : 'border-accent-200 text-accent-600 hover:border-accent-300'
                    }`}
                  >
                    {r.value}
                  </button>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" size="lg" icon={<ArrowLeft size={18} />} onClick={() => onNavigate('org-evaluations')}>
              Cancel
            </Button>
            <Button variant="primary" size="lg" fullWidth icon={<Check size={18} />} disabled={!recommendation} onClick={() => setSubmitted(true)}>
              Submit Evaluation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
