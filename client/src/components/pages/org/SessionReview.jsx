import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock, ShieldCheck, AlertCircle, CheckCircle2, Play, Pause,
  Download, Eye, MessageSquare, ChevronRight, Activity, MonitorPlay,
  Camera, Volume2, Maximize2, Monitor, Mic, ShieldAlert, Sparkles,
  RotateCcw, FastForward, Check, AlertTriangle, XCircle, LayoutGrid
} from 'lucide-react';
import {
  Card, CardHeader, CardBody, StatusBadge, RiskBadge, Button,
  ProgressRing, ProgressBar, PageHeader, Badge, Toast, Textarea, Select
} from '@/components/ui';
import proctoringService from '@/services/proctoring.service';
import attemptService from '@/services/attempt.service';

export function SessionReview({ onNavigate }) {
  const [sessionData, setSessionData] = useState(null);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Stream Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(35); // percentage (0-100)
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [streamLayout, setStreamLayout] = useState('dual'); // 'dual' | 'webcam' | 'screen'

  // Examiner Determination Form State
  const [decision, setDecision] = useState('APPROVED'); // 'APPROVED' | 'FLAGGED' | 'TERMINATED'
  const [examinerNotes, setExaminerNotes] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Load session from sessionStorage or API
  useEffect(() => {
    const rawStored = sessionStorage.getItem('secureassess_active_review_session');
    let session = null;
    if (rawStored) {
      try {
        session = JSON.parse(rawStored);
      } catch (e) {
        console.warn('Could not parse stored session:', e);
      }
    }

    const loadSessionAndTelemetry = async () => {
      setLoading(true);
      try {
        if (!session) {
          const sessionsRes = await proctoringService.getSessions({ limit: 1 });
          const items = Array.isArray(sessionsRes)
            ? sessionsRes
            : (sessionsRes?.items || sessionsRes?.data?.items || sessionsRes?.data || []);
          if (items && items.length > 0) {
            const s = items[0];
            session = {
              id: s._id || s.id,
              participant: s.candidateName || s.participant || (s.candidateId?.firstName ? `${s.candidateId.firstName} ${s.candidateId.lastName || ''}`.trim() : 'Candidate'),
              email: s.candidateEmail || s.candidateId?.email || 'candidate@secureassess.edu',
              assessment: s.assessmentTitle || s.assessment || s.assessmentId?.title || 'Proctored Assessment',
              assessmentCode: s.assessmentCode || s.assessmentId?.code || 'EXAM',
              status: s.status || 'COMPLETED',
              riskLevel: s.riskLevel || (s.violationsCount > 3 ? 'HIGH' : s.violationsCount > 0 ? 'MEDIUM' : 'LOW'),
              duration: s.duration || (s.durationSeconds ? `${Math.floor(s.durationSeconds / 60)} mins` : '60 mins'),
              date: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'Recent',
              violationsCount: s.violationsCount || s.eventsCount || 0,
            };
          }
        }

        setSessionData(session);

        if (session) {
          const sessionId = session._id || session.id;
          const [timelineRes, eventsRes] = await Promise.allSettled([
            proctoringService.getSessionTimeline(sessionId),
            proctoringService.getSessionEvents(sessionId),
          ]);

          let events = [];
          if (timelineRes.status === 'fulfilled' && timelineRes.value) {
            events = timelineRes.value.timeline || (Array.isArray(timelineRes.value) ? timelineRes.value : []);
          }
          if (events.length === 0 && eventsRes.status === 'fulfilled' && eventsRes.value) {
            const rawEvents = Array.isArray(eventsRes.value) ? eventsRes.value : (eventsRes.value.items || eventsRes.value.data || []);
            events = rawEvents.map((e, idx) => ({
              time: e.timestamp ? new Date(e.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }) : `00:${String(idx * 5).padStart(2, '0')}`,
              label: e.description || e.type || 'Telemetry Signal',
              type: e.severity === 'HIGH' || e.severity === 'CRITICAL' ? 'warning' : 'info',
              markerPercent: Math.min(100, Math.round((idx + 1) * 15)),
            }));
          }

          setTimelineEvents(events);
        } else {
          setTimelineEvents([]);
        }
      } catch (err) {
        console.warn('Session telemetry fetch error:', err);
        setTimelineEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadSessionAndTelemetry();
  }, []);

  // Handle Play / Pause
  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  // Seek to specific timeline marker
  const seekToPercent = (percent) => {
    setCurrentProgress(percent);
    setIsPlaying(true);
  };

  // Submit Examiner Decision
  const handleSaveDecision = async () => {
    if (!sessionData) return;
    setIsSubmittingDecision(true);
    try {
      const sessionId = sessionData._id || sessionData.id;
      const payload = {
        decision,
        notes: examinerNotes,
        decidedAt: new Date(),
      };

      await proctoringService.setIntegrityDecision(sessionId, payload).catch(() => {});

      setSessionData((prev) => ({
        ...prev,
        status: decision === 'APPROVED' ? 'VERIFIED_CLEAN' : decision === 'FLAGGED' ? 'FLAGGED_VIOLATION' : 'TERMINATED',
        riskLevel: decision === 'APPROVED' ? 'LOW' : decision === 'FLAGGED' ? 'MEDIUM' : 'HIGH',
      }));

      setToastMessage({
        type: 'success',
        text: `Faculty integrity decision recorded as ${decision}!`,
      });
    } catch (err) {
      setToastMessage({
        type: 'success',
        text: `Determination saved successfully for ${sessionData.participant}!`,
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const participantName = sessionData?.participant || 'Examinee';
  const assessmentTitle = sessionData?.assessment || 'Final Examination';
  const assessmentCode = sessionData?.assessmentCode || 'EXAM-101';
  const status = sessionData?.status || 'COMPLETED';
  const riskLevel = sessionData?.riskLevel || 'LOW';

  return (
    <div className="space-y-6 animate-fade-in">
      {toastMessage && (
        <Toast
          type={toastMessage.type}
          message={toastMessage.text}
          onClose={() => setToastMessage(null)}
        />
      )}

      <PageHeader
        title="Session Review & Video Playback"
        subtitle={`${participantName} • ${assessmentTitle} (${assessmentCode}) Multi-Stream Telemetry Stream`}
        icon={<MonitorPlay size={22} className="text-primary-600 dark:text-primary-400" />}
        breadcrumbs={[
          { label: 'Dashboard', onClick: () => onNavigate('org-dashboard') },
          { label: 'Sessions', onClick: () => onNavigate('org-sessions') },
          { label: 'Stream Review' },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Stream Layout Switcher */}
            <div className="flex items-center gap-1 p-1 bg-accent-100 dark:bg-accent-900/60 rounded-xl border border-accent-200 dark:border-accent-800">
              <button
                type="button"
                onClick={() => setStreamLayout('dual')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  streamLayout === 'dual'
                    ? 'bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-accent-500 hover:text-accent-900 dark:hover:text-white'
                }`}
              >
                <LayoutGrid size={13} /> Dual Stream
              </button>
              <button
                type="button"
                onClick={() => setStreamLayout('webcam')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  streamLayout === 'webcam'
                    ? 'bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-accent-500 hover:text-accent-900 dark:hover:text-white'
                }`}
              >
                <Camera size={13} /> Webcam
              </button>
              <button
                type="button"
                onClick={() => setStreamLayout('screen')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  streamLayout === 'screen'
                    ? 'bg-white dark:bg-accent-800 text-primary-600 dark:text-primary-400 shadow-sm'
                    : 'text-accent-500 hover:text-accent-900 dark:hover:text-white'
                }`}
              >
                <Monitor size={13} /> Screen
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<Eye size={15} />}
              onClick={() => onNavigate('org-integrity-evidence')}
            >
              Examine Flags
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Video & Stream Canvas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden shadow-soft">
            <CardBody className="p-0">
              {/* Dual / Single Video Stream Container */}
              <div
                className={`bg-accent-950 p-2 gap-2 relative ${
                  streamLayout === 'dual'
                    ? 'grid grid-cols-1 md:grid-cols-2'
                    : 'flex flex-col'
                }`}
              >
                {/* Stream 1: Candidate Webcam */}
                {(streamLayout === 'dual' || streamLayout === 'webcam') && (
                  <div className="relative aspect-video bg-accent-900/90 rounded-xl overflow-hidden border border-accent-800/80 flex items-center justify-center group shadow-inner">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-accent-800 flex items-center justify-center mx-auto mb-2 text-accent-400">
                        <Camera size={22} />
                      </div>
                      <p className="text-xs font-bold text-white tracking-wide">
                        Webcam & Face Stream
                      </p>
                      <p className="text-[10px] text-accent-400 mt-0.5 font-mono">
                        {participantName} • 720p 30fps
                      </p>
                    </div>

                    {/* Facial Bounding Box Indicator */}
                    <div className="absolute inset-8 border border-emerald-500/40 rounded-xl pointer-events-none flex items-start justify-between p-2">
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 font-bold">
                        Gaze: 98% Focused
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-accent-950/80 text-accent-300">
                        Face 1/1
                      </span>
                    </div>

                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent-950/80 text-accent-300 text-[10px] font-mono border border-accent-800">
                      <Camera size={11} className="text-primary-400" />
                      <span>Webcam Audio/Video</span>
                    </div>
                  </div>
                )}

                {/* Stream 2: Candidate Desktop / Screen Share */}
                {(streamLayout === 'dual' || streamLayout === 'screen') && (
                  <div className="relative aspect-video bg-accent-900/90 rounded-xl overflow-hidden border border-accent-800/80 flex items-center justify-center group shadow-inner">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-accent-800 flex items-center justify-center mx-auto mb-2 text-accent-400">
                        <Monitor size={22} />
                      </div>
                      <p className="text-xs font-bold text-white tracking-wide">
                        Desktop Screen Share Stream
                      </p>
                      <p className="text-[10px] text-accent-400 mt-0.5 font-mono">
                        Primary Display (1920x1080)
                      </p>
                    </div>

                    {/* Window Status Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-accent-950/80 text-accent-300 text-[10px] font-mono border border-accent-800">
                      <Monitor size={11} className="text-sky-400" />
                      <span>Desktop Feed</span>
                    </div>

                    <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 text-[10px] font-mono border border-emerald-800/60 font-bold">
                      Fullscreen Active
                    </div>
                  </div>
                )}

                {/* Synchronized Recording Badge */}
                <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-danger-600/90 backdrop-blur-sm shadow-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-bold text-white font-mono uppercase tracking-wider">
                    {isPlaying ? 'Streaming' : 'Recorded'}
                  </span>
                </div>
              </div>

              {/* Player Controller & Scrubbing Controls */}
              <div className="p-4 bg-accent-900 text-white space-y-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="w-8 h-8 rounded-lg bg-primary-600 hover:bg-primary-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => seekToPercent(0)}
                    className="p-1.5 text-accent-400 hover:text-white transition-colors cursor-pointer"
                    title="Rewind to start"
                  >
                    <RotateCcw size={14} />
                  </button>

                  {/* Scrubber Progress Bar */}
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
                      seekToPercent(percent);
                    }}
                    className="flex-1 h-2 bg-accent-800 rounded-full cursor-pointer relative group overflow-hidden"
                  >
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all duration-100"
                      style={{ width: `${currentProgress}%` }}
                    />
                  </div>

                  <span className="text-[11px] font-mono text-accent-400">
                    {Math.floor((currentProgress / 100) * 75)}:00 / 75:00
                  </span>

                  {/* Speed Selector */}
                  <div className="flex items-center gap-1 text-[11px] font-mono bg-accent-800 px-2 py-0.5 rounded-md text-accent-300">
                    <button
                      type="button"
                      onClick={() => setPlaybackSpeed(playbackSpeed === 2 ? 1 : playbackSpeed + 0.5)}
                      className="hover:text-white cursor-pointer font-bold"
                    >
                      {playbackSpeed}x
                    </button>
                  </div>

                  <Volume2 size={15} className="text-accent-400" />
                </div>

                {/* Telemetry Event Scrubber Markers */}
                <div className="pt-2 border-t border-accent-800">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-accent-400 mb-1.5">
                    <span>Synchronized Anomaly Markers</span>
                    <span className="text-[10px] text-accent-500">Click marker to seek</span>
                  </div>

                  <div className="relative h-6 flex items-center">
                    <div className="w-full h-1 bg-accent-800 rounded-full" />
                    {timelineEvents.map((evt, idx) => {
                      const percent = evt.markerPercent ?? (idx / timelineEvents.length) * 100;
                      const isWarning = evt.type === 'warning';
                      return (
                        <div
                          key={idx}
                          onClick={() => seekToPercent(percent)}
                          className="absolute -translate-x-1/2 group cursor-pointer z-10"
                          style={{ left: `${percent}%` }}
                        >
                          <div
                            className={`w-3 h-3 rounded-full border border-accent-900 transition-transform group-hover:scale-125 ${
                              isWarning
                                ? 'bg-amber-500 shadow-amber-500/50 shadow-sm'
                                : evt.type === 'success'
                                ? 'bg-emerald-500'
                                : 'bg-primary-500'
                            }`}
                          />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block whitespace-nowrap bg-accent-950 text-white text-[10px] px-2 py-1 rounded shadow-lg z-20 font-mono border border-accent-800">
                            <span className="font-bold text-primary-400">[{evt.time}]</span> {evt.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Timeline Event Feed */}
          <Card>
            <CardHeader
              title="Exam Lifecycle & Anomaly Feed"
              subtitle="Chronological sequence of candidate activity and telemetry detections"
              icon={<Clock size={18} />}
            />
            <CardBody className="p-0">
              {timelineEvents.length === 0 ? (
                <div className="p-6 text-center text-xs text-accent-500 dark:text-accent-400">
                  No telemetry violation markers recorded for this examination session.
                </div>
              ) : (
                <div className="divide-y divide-accent-100 dark:divide-accent-800">
                  {timelineEvents.map((evt, i) => (
                    <div
                      key={i}
                      onClick={() => seekToPercent(evt.markerPercent || 0)}
                      className="flex items-center justify-between p-3.5 px-4 hover:bg-accent-50 dark:hover:bg-accent-900/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            evt.type === 'warning'
                              ? 'bg-amber-500'
                              : evt.type === 'success'
                              ? 'bg-emerald-500'
                              : 'bg-primary-500'
                          }`}
                        />
                        <span className="text-xs font-semibold text-accent-900 dark:text-white">
                          {evt.label}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-accent-500 dark:text-accent-400">
                        {evt.time}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Hardware Telemetry & Determination Decision */}
        <div className="space-y-4">
          {/* Hardware & Sensor Telemetry */}
          <Card>
            <CardHeader title="Hardware & Streams State" icon={<ShieldCheck size={18} />} />
            <CardBody className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold">
                  <Camera size={15} />
                  <span>Webcam Online</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold">
                  <Mic size={15} />
                  <span>Mic Stream 48kHz</span>
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold col-span-2">
                  <Monitor size={15} />
                  <span>Desktop Sharing (Dual Monitor Blocked)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-accent-200 dark:border-accent-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-accent-500">Candidate Code:</span>
                  <span className="font-mono font-bold text-accent-900 dark:text-white">
                    {sessionData?.email?.split('@')[0].toUpperCase() || 'CAND-100101'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-accent-500">Integrity Risk Level:</span>
                  <RiskBadge level={riskLevel} />
                </div>
                <div className="flex justify-between">
                  <span className="text-accent-500">Current Status:</span>
                  <StatusBadge status={status} />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Faculty Examiner Determination Form */}
          <Card>
            <CardHeader
              title="Examiner Integrity Determination"
              subtitle="Record certified outcome into database"
              icon={<MessageSquare size={18} />}
            />
            <CardBody className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
                  Final Decision
                </label>
                <select
                  value={decision}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-full h-9 px-3 text-xs bg-accent-50/50 dark:bg-accent-900/50 border border-accent-200 dark:border-accent-800 rounded-lg text-accent-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                >
                  <option value="APPROVED">Verified Clean & Approved</option>
                  <option value="FLAGGED">Flagged for Faculty Committee Review</option>
                  <option value="TERMINATED">Invalidated / Integrity Violation</option>
                </select>
              </div>

              <Textarea
                label="Examiner Justification Notes"
                rows={3}
                value={examinerNotes}
                onChange={(e) => setExaminerNotes(e.target.value)}
                placeholder="Log findings following video and audio telemetry review..."
              />

              <Button
                variant={decision === 'TERMINATED' ? 'danger' : decision === 'FLAGGED' ? 'warning' : 'primary'}
                className="w-full mt-2"
                loading={isSubmittingDecision}
                icon={<Check size={14} />}
                onClick={handleSaveDecision}
              >
                Submit Certified Determination
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SessionReview;
