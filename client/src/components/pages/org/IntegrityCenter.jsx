import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  AlertCircle,
  Download,
  ChevronRight,
  Activity,
  Eye,
  Clock,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  X,
  CheckCircle,
  Filter,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardBody,
  MetricCard,
  Badge,
  RiskBadge,
  Button,
  SearchBar,
  PageHeader,
  Select,
  DonutChart,
  BarChart,
  Toast,
  SkeletonTable,
  EmptyState,
} from "@/components/ui";
import { integrityFlags as defaultFlags } from "@/data";
import socketService from "@/services/socketService";
import proctoringService from "@/services/proctoring.service";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { exportToCSV } from "@/utils/exportUtils";

export function IntegrityCenter({ onNavigate }) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  const orgId =
    currentOrganization?._id ||
    currentOrganization?.id ||
    user?.organizationId ||
    null;

  const [flags, setFlags] = useState([]);
  const [totalSessionsCount, setTotalSessionsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [liveIncidentToast, setLiveIncidentToast] = useState(null);
  const [liveSocketConnected, setLiveSocketConnected] = useState(false);
  const [resolvingId, setResolvingId] = useState(null);

  // 1. Fetch live flagged events and sessions from REST API
  const fetchFlaggedEvents = useCallback(async () => {
    setLoading(true);
    try {
      const [eventsRes, sessionsRes] = await Promise.allSettled([
        proctoringService.getEvents({ limit: 100 }, orgId),
        proctoringService.getSessions({ limit: 100 }, orgId),
      ]);

      let items = [];
      if (eventsRes.status === "fulfilled") {
        const val = eventsRes.value;
        items = Array.isArray(val)
          ? val
          : val?.items || val?.data?.items || val?.events || [];
      }

      let sessionsList = [];
      if (sessionsRes.status === "fulfilled") {
        const val = sessionsRes.value;
        sessionsList = Array.isArray(val)
          ? val
          : val?.items || val?.data?.items || val?.sessions || [];
        setTotalSessionsCount(sessionsList.length);
      }

      if (Array.isArray(items) && items.length > 0) {
        const mapped = items.map((ev, idx) => {
          const sess = ev.proctoringSessionId || {};
          const cand = sess.candidateId || {};
          const asm = sess.assessmentId || {};
          const candName = cand.firstName
            ? `${cand.firstName} ${cand.lastName || ""}`.trim()
            : ev.participant || `Examinee ${idx + 1}`;
          const candidateCode = cand.candidateCode || "";
          const asmTitle =
            asm.title ||
            (typeof sess.assessmentId === "string"
              ? sess.assessmentId
              : "Live Assessment");

          const rawDate =
            ev.serverOccurredAt || ev.occurredAt || ev.createdAt || new Date();
          const timeStr = new Date(rawDate).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          const sev = (ev.severity || "").toUpperCase();
          const riskLevel =
            sev === "CRITICAL" || sev === "HIGH"
              ? "High"
              : sev === "MEDIUM"
                ? "Medium"
                : "Low";

          let eventTitle = ev.description || ev.title;
          if (!eventTitle) {
            const evType = (ev.eventType || "").toUpperCase();
            if (evType.includes("BLUR") || evType.includes("TAB"))
              eventTitle = "Browser Tab Focus Loss";
            else if (evType.includes("FULLSCREEN"))
              eventTitle = "Fullscreen Security Violation";
            else if (evType.includes("FACE"))
              eventTitle = "Facial Recognition Anomaly";
            else if (evType.includes("AUDIO") || evType.includes("VOICE"))
              eventTitle = "Unauthorized Audio Telemetry";
            else eventTitle = "Proctoring Anomaly Event";
          }

          return {
            id: ev._id || ev.id || `flag_${idx}`,
            eventId: ev._id || ev.id,
            sessionId:
              sess._id ||
              sess.id ||
              ev.sessionId ||
              ev.proctoringSessionId?._id,
            participant: candName,
            candidateCode,
            assessment: asmTitle,
            type: ev.eventType || "TAB_BLUR",
            title: eventTitle,
            description:
              ev.details ||
              ev.description ||
              "Integrity anomaly recorded during live examination session.",
            riskLevel,
            timestamp: timeStr,
            status:
              ev.resolution || (ev.reviewed ? "Reviewed" : "Under Review"),
            reviewed: Boolean(ev.reviewed),
            rawEvent: ev,
          };
        });

        setFlags(mapped);
      } else {
        setFlags([]);
        setTotalSessionsCount(sessionsList.length || 0);
      }
    } catch (err) {
      console.warn("Flagged events fetch note:", err.message);
      setFlags([]);
      setTotalSessionsCount(0);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    fetchFlaggedEvents();
  }, [fetchFlaggedEvents]);

  // 2. Real-time Anomaly Socket Receiver
  useEffect(() => {
    const socket = socketService.connect();
    if (socket) {
      setLiveSocketConnected(true);
      socketService.joinRoom("org_proctoring_hub", "examiner_01", "proctor");

      const handleIncomingAnomaly = (data) => {
        const newFlag = {
          id: Date.now(),
          eventId: data._id || `live_${Date.now()}`,
          sessionId: data.sessionId || data.proctoringSessionId,
          participant:
            data.metadata?.participant || data.participant || "Candidate",
          candidateCode: data.metadata?.candidateCode || "",
          assessment: data.metadata?.assessment || "Live Assessment",
          type: data.eventType || "TAB_BLUR",
          title:
            data.eventType === "TAB_BLUR"
              ? "Browser Tab Focus Loss"
              : "Suspicious Exam Telemetry",
          description:
            data.metadata?.details ||
            "Live telemetry detected abnormal examinee window focus.",
          riskLevel:
            data.metadata?.riskLevel ||
            (data.severity === "HIGH" ? "High" : "Medium"),
          timestamp: "Just now",
          status: "Under Review",
          reviewed: false,
        };

        setFlags((prev) => [newFlag, ...prev]);
        setLiveIncidentToast({
          type: "warning",
          text: `🚨 Live Alert: ${newFlag.title} detected for ${newFlag.participant}`,
        });
      };

      socketService.on("candidate-anomaly", handleIncomingAnomaly);
      socketService.on("proctor-event", handleIncomingAnomaly);

      return () => {
        socketService.off("candidate-anomaly", handleIncomingAnomaly);
        socketService.off("proctor-event", handleIncomingAnomaly);
      };
    }
  }, []);

  // Review & Resolve Incident (Dismiss or Escalate)
  const handleReviewAction = async (flagId, resolution, e) => {
    if (e) e.stopPropagation();
    setResolvingId(flagId);
    try {
      if (flagId && typeof flagId === "string" && flagId.length === 24) {
        await proctoringService.reviewEvent(
          flagId,
          {
            resolution,
            reviewed: true,
            reviewerNote:
              resolution === "DISMISSED"
                ? "Dismissed by examiner as verified false positive."
                : "Escalated to board review.",
          },
          orgId,
        );
      }

      setFlags((prev) =>
        prev.map((f) =>
          f.id === flagId || f.eventId === flagId
            ? { ...f, status: resolution, reviewed: true }
            : f,
        ),
      );
      setLiveIncidentToast({
        type: resolution === "DISMISSED" ? "success" : "warning",
        text:
          resolution === "DISMISSED"
            ? "Incident dismissed as False Positive."
            : "Incident escalated to formal review.",
      });
    } catch (err) {
      setFlags((prev) =>
        prev.map((f) =>
          f.id === flagId || f.eventId === flagId
            ? { ...f, status: resolution, reviewed: true }
            : f,
        ),
      );
      setLiveIncidentToast({
        type: resolution === "DISMISSED" ? "success" : "warning",
        text: `Incident ${resolution === "DISMISSED" ? "dismissed" : "escalated"}.`,
      });
    } finally {
      setResolvingId(null);
    }
  };

  const handleExportCSV = () => {
    exportToCSV("SecureAssess_Integrity_Audit_Logs", filtered, [
      { key: "participant", label: "Participant" },
      { key: "candidateCode", label: "Student Code" },
      { key: "assessment", label: "Assessment" },
      { key: "title", label: "Incident Title" },
      { key: "riskLevel", label: "Risk Level" },
      { key: "type", label: "Sensor Event" },
      { key: "status", label: "Review Status" },
      { key: "timestamp", label: "Timestamp" },
    ]);
  };

  const filtered = flags.filter((f) => {
    const participant = (f.participant || "").toLowerCase();
    const title = (f.title || "").toLowerCase();
    const code = (f.candidateCode || "").toLowerCase();
    const asm = (f.assessment || "").toLowerCase();
    const matchesSearch =
      participant.includes(search.toLowerCase()) ||
      title.includes(search.toLowerCase()) ||
      code.includes(search.toLowerCase()) ||
      asm.includes(search.toLowerCase());
    const matchesRisk =
      riskFilter === "all" ||
      (f.riskLevel || "").toLowerCase() === riskFilter.toLowerCase();
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" &&
        f.status !== "DISMISSED" &&
        f.status !== "ESCALATED") ||
      (statusFilter === "resolved" &&
        (f.status === "DISMISSED" || f.status === "ESCALATED"));
    return matchesSearch && matchesRisk && matchesStatus;
  });

  const highRiskCount = flags.filter((f) => f.riskLevel === "High").length;
  const mediumRiskCount = flags.filter((f) => f.riskLevel === "Medium").length;
  const lowRiskCount = flags.filter((f) => f.riskLevel === "Low").length;
  const totalMonitored = totalSessionsCount;
  const cleanCount =
    totalSessionsCount > 0
      ? Math.max(0, totalSessionsCount - highRiskCount - mediumRiskCount)
      : 0;

  // Dynamic Category Breakdown for Bar Chart
  const typeCounts = flags.reduce((acc, f) => {
    let t = (f.type || "Sensor").replace(/_/g, " ");
    if (t.length > 9) t = t.slice(0, 9);
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const barChartData =
    Object.keys(typeCounts).length > 0
      ? Object.entries(typeCounts)
          .slice(0, 6)
          .map(([label, value]) => ({ label, value }))
      : [
          { label: "TabBlur", value: 0 },
          { label: "FullScr", value: 0 },
          { label: "MultiFace", value: 0 },
          { label: "Audio", value: 0 },
          { label: "ClipBrd", value: 0 },
        ];

  const donutChartData =
    flags.length > 0
      ? [
          { label: "Low Risk", value: lowRiskCount, color: "#22c55e" },
          { label: "Medium Risk", value: mediumRiskCount, color: "#f59e0b" },
          { label: "High Risk", value: highRiskCount, color: "#ef4444" },
        ]
      : [{ label: "Clean / No Incidents", value: 1, color: "#22c55e" }];

  return (
    <div className="space-y-6">
      {liveIncidentToast && (
        <Toast
          type={liveIncidentToast.type}
          message={liveIncidentToast.text}
          onClose={() => setLiveIncidentToast(null)}
        />
      )}

      <PageHeader
        title="Proctoring & Integrity Center"
        subtitle="Telemetry signals, automated anti-cheat detections, and invigilator review queues."
        icon={
          <ShieldCheck
            size={22}
            className="text-primary-600 dark:text-primary-400"
          />
        }
        breadcrumbs={[
          { label: "Dashboard", onClick: () => onNavigate("org-dashboard") },
          { label: "Integrity" },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-50 dark:bg-success-950/60 border border-success-200 dark:border-success-800/40 text-xs font-semibold text-success-700 dark:text-success-300 shadow-xs">
              <Radio size={14} className="animate-pulse text-success-500" />
              <span>Live Socket Stream</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              icon={
                <RefreshCw
                  size={14}
                  className={loading ? "animate-spin" : ""}
                />
              }
              onClick={fetchFlaggedEvents}
            >
              Sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Download size={15} />}
              onClick={handleExportCSV}
            >
              Export Audit Logs
            </Button>
          </div>
        }
      />

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Sessions Monitored"
          value={totalMonitored}
          icon={<Activity size={20} />}
          color="primary"
        />
        <MetricCard
          label="Clean / Low Risk"
          value={cleanCount}
          icon={<ShieldCheck size={20} />}
          color="success"
        />
        <MetricCard
          label="Medium Flags"
          value={mediumRiskCount}
          icon={<AlertCircle size={20} />}
          color="warning"
        />
        <MetricCard
          label="High Risk Incidents"
          value={highRiskCount}
          icon={<AlertCircle size={20} />}
          color="danger"
        />
      </div>

      {/* Visual Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader
            title="Risk Profile Breakdown"
            subtitle={`${flags.length} total integrity events recorded`}
            icon={<ShieldCheck size={18} />}
          />
          <CardBody>
            <DonutChart
              centerValue={String(flags.length)}
              centerLabel="Flags"
              data={donutChartData}
            />
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Integrity Anomaly Telemetry by Category"
            subtitle="Browser focus loss, multi-face tracking, fullscreen exits, and audio spikes"
            icon={<Activity size={18} />}
          />
          <CardBody>
            <BarChart data={barChartData} color="#f59e0b" />
          </CardBody>
        </Card>
      </div>

      {/* Dynamic Flagged Incidents Review Queue */}
      <Card>
        <CardHeader
          title={`Flagged Incidents Review Queue (${filtered.length})`}
          subtitle={
            filtered.length > 0
              ? `${filtered.length} anomaly event${filtered.length === 1 ? "" : "s"} requiring examiner validation & resolution`
              : "All candidate proctoring events are currently reviewed or filtered."
          }
          icon={<AlertCircle size={18} />}
        />
        <CardBody className="p-0">
          <div className="px-5 pt-3 pb-2 border-b border-accent-100 dark:border-accent-800/60 bg-accent-50/30 dark:bg-accent-900/20">
            <div className="flex flex-col sm:flex-row gap-3">
              <SearchBar
                value={search}
                onChange={setSearch}
                placeholder="Search by examinee name, student code, assessment, or signal..."
                className="flex-1"
              />
              <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  options={[
                    { value: "all", label: "All Statuses" },
                    { value: "pending", label: "Pending Review" },
                    { value: "resolved", label: "Resolved / Decided" },
                  ]}
                  className="w-36"
                />
                <Select
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  options={[
                    { value: "all", label: "All Risk Levels" },
                    { value: "low", label: "Low Risk" },
                    { value: "medium", label: "Medium Risk" },
                    { value: "high", label: "High Risk" },
                  ]}
                  className="w-36"
                />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-6">
              <SkeletonTable rows={4} cols={4} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={<ShieldCheck size={32} className="text-success-500" />}
                title="No Flagged Incidents Matching Filters"
                description="All active examinee attempts in this organization are clean or matched by your search criteria."
              />
            </div>
          ) : (
            <div className="divide-y divide-accent-100 dark:divide-accent-800/60">
              {filtered.map((flag) => {
                const isResolving =
                  resolvingId === flag.id || resolvingId === flag.eventId;
                const isDecided =
                  flag.status === "DISMISSED" || flag.status === "ESCALATED";

                return (
                  <div
                    key={flag.id}
                    className="flex items-start gap-3.5 px-5 py-4 hover:bg-accent-50/60 dark:hover:bg-accent-800/40 transition-colors cursor-pointer"
                    onClick={() =>
                      onNavigate("org-integrity-evidence", {
                        eventId: flag.eventId || flag.id,
                        sessionId: flag.sessionId,
                        incident: flag,
                      })
                    }
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-soft ${
                        flag.riskLevel === "High"
                          ? "bg-danger-50 dark:bg-danger-950/60 text-danger-600 dark:text-danger-400 border border-danger-200 dark:border-danger-900/50"
                          : flag.riskLevel === "Medium"
                            ? "bg-warning-50 dark:bg-warning-950/60 text-warning-600 dark:text-warning-400 border border-warning-200 dark:border-warning-900/50"
                            : "bg-success-50 dark:bg-success-950/60 text-success-600 dark:text-success-400 border border-success-200 dark:border-success-900/50"
                      }`}
                    >
                      <AlertCircle size={20} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-bold text-accent-900 dark:text-white">
                          {flag.participant}
                        </span>
                        {flag.candidateCode && (
                          <span className="font-mono text-[10px] bg-accent-100 dark:bg-accent-800 text-accent-600 dark:text-accent-400 px-1.5 py-0.5 rounded">
                            {flag.candidateCode}
                          </span>
                        )}
                        <span className="text-accent-300 dark:text-accent-700">
                          ·
                        </span>
                        <span className="text-xs text-accent-600 dark:text-accent-300 font-medium">
                          {flag.assessment}
                        </span>
                        <RiskBadge level={flag.riskLevel} />
                        <Badge
                          variant={
                            flag.status === "DISMISSED"
                              ? "success"
                              : flag.status === "ESCALATED"
                                ? "danger"
                                : "neutral"
                          }
                        >
                          {flag.status}
                        </Badge>
                      </div>
                      <p className="text-xs font-semibold text-accent-800 dark:text-accent-200 mb-0.5">
                        {flag.title}
                      </p>
                      <p className="text-[11px] text-accent-500 dark:text-accent-400 leading-relaxed line-clamp-2">
                        {flag.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 text-[11px] text-accent-400 font-mono hidden sm:flex">
                        <Clock size={12} /> {flag.timestamp}
                      </div>

                      {!isDecided && (
                        <div
                          className="flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isResolving}
                            icon={
                              <CheckCircle2
                                size={13}
                                className="text-success-500"
                              />
                            }
                            className="text-xs text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-950/40 px-2 py-1"
                            onClick={(e) =>
                              handleReviewAction(
                                flag.eventId || flag.id,
                                "DISMISSED",
                                e,
                              )
                            }
                            title="Dismiss as False Positive"
                          >
                            Dismiss
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isResolving}
                            icon={
                              <AlertTriangle
                                size={13}
                                className="text-danger-500"
                              />
                            }
                            className="text-xs text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-950/40 px-2 py-1"
                            onClick={(e) =>
                              handleReviewAction(
                                flag.eventId || flag.id,
                                "ESCALATED",
                                e,
                              )
                            }
                            title="Escalate to Disciplinary Board"
                          >
                            Escalate
                          </Button>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye size={13} />}
                        className="text-xs px-2.5 py-1"
                        onClick={() =>
                          onNavigate("org-integrity-evidence", {
                            eventId: flag.eventId || flag.id,
                            sessionId: flag.sessionId,
                            incident: flag,
                          })
                        }
                      >
                        Dossier
                      </Button>
                      <ChevronRight size={16} className="text-accent-400" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default IntegrityCenter;
