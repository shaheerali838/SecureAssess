import mongoose from "mongoose";
import ProctoringSession from "./proctoringSession.model.js";
import ProctoringEvent from "./proctoringEvent.model.js";
import ProctoringEvidence from "./proctoringEvidence.model.js";
import Candidate from "../candidates/candidate.model.js";
import Attempt from "../attempts/attempt.model.js";
import Assessment from "../assessments/assessment.model.js";
import { RiskService } from "./risk/risk.service.js";
import {
  PROCTORING_STATUSES,
  PROCTORING_EVENT_TYPES,
  INTEGRITY_STATUSES,
} from "../../constants/proctoringConstants.js";
import { ATTEMPT_STATUSES } from "../../constants/attemptStatuses.js";
import { ApiError } from "../../utils/ApiError.js";
import AuditLog from "../auditLogs/auditLog.model.js";

export class ProctoringService {
  /**
   * Starts or resumes a proctoring session for an active candidate attempt
   */
  static async startSession(userId, organizationId, payload = {}, clientIp = "") {
    const { attemptId } = payload;
    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Valid attempt ID is required to start proctoring");
    }

    // 1. Verify Candidate Identity
    const candidate = await Candidate.findOne({ userId, organizationId });
    if (!candidate) {
      throw new ApiError(403, "Candidate profile not found in this organization");
    }

    // 2. Verify Attempt Ownership & In-Progress Status
    const attempt = await Attempt.findOne({
      _id: attemptId,
      organizationId,
      candidateId: candidate._id,
    });

    if (!attempt) {
      throw new ApiError(404, "Attempt not found or access denied");
    }

    if (attempt.status !== ATTEMPT_STATUSES.IN_PROGRESS && attempt.status !== ATTEMPT_STATUSES.NOT_STARTED) {
      throw new ApiError(400, `Cannot start proctoring for attempt in '${attempt.status}' status`);
    }

    // 3. Verify Assessment & Proctoring Configuration
    const assessment = await Assessment.findById(attempt.assessmentId);
    if (!assessment) {
      throw new ApiError(404, "Associated assessment not found");
    }

    const proctoringConfig = assessment.securitySettings?.proctoring || assessment.settings?.proctoring || {
      enabled: true,
      requireCamera: true,
      requireMicrophone: true,
      requireScreenShare: true,
      detectTabSwitch: true,
      detectFullscreenExit: true,
      detectMultipleFaces: true,
      detectNoFace: true,
      detectCopyPaste: true,
    };

    // 4. Check Existing Proctoring Session for this Attempt
    let session = await ProctoringSession.findOne({ attemptId: attempt._id });

    if (session) {
      if (session.status === PROCTORING_STATUSES.ACTIVE) {
        return {
          session,
          configuration: proctoringConfig,
          message: "Proctoring session already active",
        };
      }

      session.status = PROCTORING_STATUSES.ACTIVE;
      session.lastHeartbeatAt = new Date();
      if (payload.cameraEnabled !== undefined) session.cameraEnabled = Boolean(payload.cameraEnabled);
      if (payload.microphoneEnabled !== undefined) session.microphoneEnabled = Boolean(payload.microphoneEnabled);
      if (payload.screenShareEnabled !== undefined) session.screenShareEnabled = Boolean(payload.screenShareEnabled);
      if (payload.browserInfo) session.browserInfo = payload.browserInfo;
      if (payload.deviceInfo) session.deviceInfo = payload.deviceInfo;
      if (clientIp) session.ipAddress = clientIp;
      await session.save();
    } else {
      session = await ProctoringSession.create({
        organizationId,
        attemptId: attempt._id,
        candidateId: candidate._id,
        assessmentId: assessment._id,
        status: PROCTORING_STATUSES.ACTIVE,
        integrityStatus: INTEGRITY_STATUSES.CLEAR,
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
        cameraEnabled: Boolean(payload.cameraEnabled),
        microphoneEnabled: Boolean(payload.microphoneEnabled),
        screenShareEnabled: Boolean(payload.screenShareEnabled),
        browserInfo: payload.browserInfo || {},
        deviceInfo: payload.deviceInfo || {},
        ipAddress: clientIp || payload.ipAddress || "",
      });

      // Update attempt reference to proctoringSessionId
      attempt.proctoringSessionId = session._id;
      if (attempt.status === ATTEMPT_STATUSES.NOT_STARTED) {
        attempt.status = ATTEMPT_STATUSES.IN_PROGRESS;
        attempt.startedAt = attempt.startedAt || new Date();
      }
      await attempt.save();

      // Record Initial PROCTORING_STARTED Event
      await ProctoringEvent.create({
        organizationId,
        proctoringSessionId: session._id,
        attemptId: attempt._id,
        candidateId: candidate._id,
        type: PROCTORING_EVENT_TYPES.PROCTORING_STARTED,
        severity: "INFO",
        riskPoints: 0,
        serverOccurredAt: new Date(),
        source: "SYSTEM",
        metadata: { initialConfig: proctoringConfig },
      });
    }

    // Audit Logging
    await AuditLog.create({
      organizationId,
      actor: { id: userId, email: candidate.email, role: "CANDIDATE" },
      action: "PROCTORING_SESSION_STARTED",
      target: { entity: "ProctoringSession", entityId: session._id.toString() },
      details: { attemptId: attempt._id.toString() },
    }).catch(() => {});

    return {
      session,
      configuration: proctoringConfig,
      message: "Proctoring session started successfully",
    };
  }

  /**
   * Ingests a proctoring integrity event from the client or AI vision agent with server risk calculation
   */
  static async recordEvent(userId, organizationId, eventData = {}) {
    const { sessionId, proctoringSessionId, type, clientEventId, occurredAt, duration, confidence, source, metadata, evidenceId } = eventData;
    const targetSessionId = sessionId || proctoringSessionId;

    if (!targetSessionId || !mongoose.Types.ObjectId.isValid(targetSessionId)) {
      throw new ApiError(400, "Invalid proctoring session ID format");
    }

    if (!type) {
      throw new ApiError(400, "Event type is required");
    }

    // Verify Session
    const session = await ProctoringSession.findOne({
      _id: targetSessionId,
      organizationId,
    });

    if (!session) {
      throw new ApiError(404, "Proctoring session not found in this organization");
    }

    if (session.status !== PROCTORING_STATUSES.ACTIVE && session.status !== PROCTORING_STATUSES.PAUSED) {
      throw new ApiError(400, `Cannot record events on proctoring session in '${session.status}' status`);
    }

    // Event Deduplication & Throttling
    if (clientEventId) {
      const existing = await ProctoringEvent.findOne({
        proctoringSessionId: session._id,
        clientEventId,
      });
      if (existing) {
        return {
          event: existing,
          sessionRiskScore: session.riskScore,
          sessionRiskLevel: session.riskLevel,
          deduplicated: true,
        };
      }
    }

    // Throttling rapid-fire events of identical type within 2000ms
    const throttled = await RiskService.isThrottled(session._id, type, 2000);
    if (throttled && !clientEventId && type === PROCTORING_EVENT_TYPES.TAB_SWITCH) {
      return {
        message: "Event throttled",
        sessionRiskScore: session.riskScore,
        sessionRiskLevel: session.riskLevel,
        deduplicated: true,
      };
    }

    // Calculate Risk Points and Severity on Server (adjusted by confidence)
    const { riskPoints, severity } = RiskService.calculateEventRisk(type, confidence);

    // Update Session Media State on Hardware Events
    if (type === PROCTORING_EVENT_TYPES.CAMERA_ENABLED) session.cameraEnabled = true;
    if (type === PROCTORING_EVENT_TYPES.CAMERA_DISABLED) session.cameraEnabled = false;
    if (type === PROCTORING_EVENT_TYPES.MICROPHONE_ENABLED) session.microphoneEnabled = true;
    if (type === PROCTORING_EVENT_TYPES.MICROPHONE_DISABLED) session.microphoneEnabled = false;
    if (type === PROCTORING_EVENT_TYPES.SCREEN_SHARE_STARTED) session.screenShareEnabled = true;
    if (type === PROCTORING_EVENT_TYPES.SCREEN_SHARE_STOPPED) session.screenShareEnabled = false;
    await session.save();

    // Create Proctoring Event
    const event = await ProctoringEvent.create({
      organizationId,
      proctoringSessionId: session._id,
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      evidenceId: evidenceId || null,
      clientEventId: clientEventId || null,
      type,
      severity,
      riskPoints,
      clientOccurredAt: occurredAt ? new Date(occurredAt) : null,
      serverOccurredAt: new Date(),
      duration: duration || 0,
      confidence: confidence !== undefined ? confidence : 1.0,
      source: source || "BROWSER",
      metadata: metadata || {},
    });

    // Update Cumulative Risk Score on Session
    const updatedRisk = await RiskService.updateSessionRisk(session._id);

    return {
      event,
      sessionRiskScore: updatedRisk.riskScore,
      sessionRiskLevel: updatedRisk.riskLevel,
      integrityStatus: updatedRisk.integrityStatus,
      violationCount: updatedRisk.violationCount,
      deduplicated: false,
    };
  }

  /**
   * Heartbeat to track active presence and detect sudden disconnection
   */
  static async sendHeartbeat(userId, organizationId, sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid proctoring session ID format");
    }

    const session = await ProctoringSession.findOneAndUpdate(
      {
        _id: sessionId,
        organizationId,
      },
      {
        $set: { lastHeartbeatAt: new Date() },
      },
      { returnDocument: "after" }
    );

    if (!session) {
      throw new ApiError(404, "Proctoring session not found");
    }

    return {
      success: true,
      lastHeartbeatAt: session.lastHeartbeatAt,
      status: session.status,
      warnings: session.warningsSent || [],
    };
  }

  /**
   * Ends a proctoring session upon exam completion
   */
  static async endSession(userId, organizationId, sessionId, reason = "") {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid proctoring session ID format");
    }

    const session = await ProctoringSession.findOne({
      _id: sessionId,
      organizationId,
    });

    if (!session) {
      throw new ApiError(404, "Proctoring session not found");
    }

    session.status = PROCTORING_STATUSES.ENDED;
    session.endedAt = new Date();
    await session.save();

    await ProctoringEvent.create({
      organizationId,
      proctoringSessionId: session._id,
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      type: PROCTORING_EVENT_TYPES.PROCTORING_ENDED,
      severity: "INFO",
      riskPoints: 0,
      serverOccurredAt: new Date(),
      source: "SYSTEM",
      metadata: { reason: reason || "Exam completed / session ended" },
    });

    return session;
  }

  /**
   * Proctor Action: Send real-time warning to candidate
   */
  static async sendWarning(organizationId, sessionId, warningMessage, proctorUserId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid session ID format");
    }

    if (!warningMessage || typeof warningMessage !== "string" || warningMessage.trim().length === 0) {
      throw new ApiError(400, "Warning message is required");
    }

    const session = await ProctoringSession.findOne({ _id: sessionId, organizationId });
    if (!session) {
      throw new ApiError(404, "Proctoring session not found");
    }

    const warningItem = {
      message: warningMessage.trim(),
      sentBy: proctorUserId,
      sentAt: new Date(),
    };

    session.warningsSent.push(warningItem);
    await session.save();

    // Log Event
    await ProctoringEvent.create({
      organizationId,
      proctoringSessionId: session._id,
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      type: PROCTORING_EVENT_TYPES.PROCTOR_WARNING,
      severity: "INFO",
      riskPoints: 0,
      serverOccurredAt: new Date(),
      source: "PROCTOR",
      metadata: { warningMessage, sentBy: proctorUserId },
    });

    // Audit Log
    await AuditLog.create({
      organizationId,
      actor: { id: proctorUserId, role: "PROCTOR" },
      action: "PROCTOR_ISSUED_WARNING",
      target: { entity: "ProctoringSession", entityId: session._id.toString() },
      details: { warningMessage },
    }).catch(() => {});

    return { session, warning: warningItem };
  }

  /**
   * Proctor Action: Pause examination session
   */
  static async pauseSession(organizationId, sessionId, reason = "", proctorUserId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid session ID format");
    }

    const session = await ProctoringSession.findOne({ _id: sessionId, organizationId });
    if (!session) {
      throw new ApiError(404, "Proctoring session not found");
    }

    session.status = PROCTORING_STATUSES.PAUSED;
    session.pausedAt = new Date();
    await session.save();

    await AuditLog.create({
      organizationId,
      actor: { id: proctorUserId, role: "PROCTOR" },
      action: "PROCTOR_PAUSED_SESSION",
      target: { entity: "ProctoringSession", entityId: session._id.toString() },
      details: { reason },
    }).catch(() => {});

    return session;
  }

  /**
   * Proctor Action: Terminate examination attempt due to cheating/policy violation
   */
  static async terminateSession(organizationId, sessionId, reason, proctorUserId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid session ID format");
    }

    if (!reason || typeof reason !== "string" || reason.trim().length === 0) {
      throw new ApiError(400, "Termination reason is strictly required");
    }

    const session = await ProctoringSession.findOne({ _id: sessionId, organizationId });
    if (!session) {
      throw new ApiError(404, "Proctoring session not found");
    }

    session.status = PROCTORING_STATUSES.TERMINATED;
    session.integrityStatus = INTEGRITY_STATUSES.CONFIRMED_VIOLATION;
    session.terminatedReason = reason.trim();
    session.endedAt = new Date();
    await session.save();

    // Terminate Attempt
    await Attempt.findByIdAndUpdate(session.attemptId, {
      $set: {
        status: ATTEMPT_STATUSES.TERMINATED,
        terminationReason: reason.trim(),
        submittedAt: new Date(),
      },
    });

    await AuditLog.create({
      organizationId,
      actor: { id: proctorUserId, role: "PROCTOR" },
      action: "PROCTOR_TERMINATED_ATTEMPT",
      target: { entity: "ProctoringSession", entityId: session._id.toString() },
      details: { reason, attemptId: session.attemptId.toString() },
    }).catch(() => {});

    return session;
  }

  /**
   * Stores multimedia evidence metadata
   */
  static async createEvidence(organizationId, sessionId, evidenceData) {
    const session = await ProctoringSession.findOne({ _id: sessionId, organizationId });
    if (!session) {
      throw new ApiError(404, "Proctoring session not found");
    }

    const evidence = await ProctoringEvidence.create({
      organizationId,
      proctoringSessionId: session._id,
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      eventId: evidenceData.eventId || null,
      type: evidenceData.type,
      storageKey: evidenceData.storageKey,
      mimeType: evidenceData.mimeType || "image/jpeg",
      fileSizeBytes: evidenceData.fileSizeBytes || 0,
      checksum: evidenceData.checksum || null,
      metadata: evidenceData.metadata || {},
    });

    return evidence;
  }

  /**
   * Retrieves all evidence captured during a session
   */
  static async getSessionEvidence(organizationId, sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid session ID format");
    }

    const evidenceList = await ProctoringEvidence.find({
      proctoringSessionId: sessionId,
      organizationId,
    }).sort({ capturedAt: 1 });

    return evidenceList;
  }

  /**
   * Retrieves single evidence record
   */
  static async getEvidenceById(organizationId, evidenceId) {
    if (!mongoose.Types.ObjectId.isValid(evidenceId)) {
      throw new ApiError(400, "Invalid evidence ID format");
    }

    const evidence = await ProctoringEvidence.findOne({
      _id: evidenceId,
      organizationId,
    });

    if (!evidence) {
      throw new ApiError(404, "Evidence not found in this organization");
    }

    return evidence;
  }

  /**
   * Examiner / Proctor View: Single proctoring session details
   */
  static async getSessionDetails(organizationId, sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid session ID format");
    }

    const session = await ProctoringSession.findOne({
      _id: sessionId,
      organizationId,
    })
      .populate("candidateId", "candidateCode firstName lastName email")
      .populate("assessmentId", "title code")
      .populate("attemptId", "status startedAt submittedAt durationSeconds");

    if (!session) {
      throw new ApiError(404, "Proctoring session not found in this organization");
    }

    return session;
  }

  /**
   * Examiner / Proctor View: Paginated/filtered proctoring events
   */
  static async getSessionEvents(organizationId, sessionId, query = {}) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid session ID format");
    }

    const filter = { proctoringSessionId: sessionId, organizationId };
    if (query.severity) filter.severity = query.severity;
    if (query.type) filter.type = query.type;
    if (query.reviewed !== undefined) filter.reviewed = query.reviewed === "true";

    const events = await ProctoringEvent.find(filter)
      .sort({ serverOccurredAt: 1 })
      .populate("reviewedBy", "firstName lastName email")
      .populate("evidenceId");

    return events;
  }

  /**
   * Examiner / Proctor View: Chronological Proctoring Timeline
   */
  static async getSessionTimeline(organizationId, sessionId) {
    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      throw new ApiError(400, "Invalid session ID format");
    }

    const [session, events] = await Promise.all([
      ProctoringSession.findOne({ _id: sessionId, organizationId })
        .populate("candidateId", "candidateCode firstName lastName email")
        .populate("assessmentId", "title code"),
      ProctoringEvent.find({ proctoringSessionId: sessionId, organizationId })
        .sort({ serverOccurredAt: 1 })
        .populate("reviewedBy", "firstName lastName email"),
    ]);

    if (!session) {
      throw new ApiError(404, "Proctoring session not found");
    }

    return {
      session,
      totalEvents: events.length,
      riskScore: session.riskScore,
      riskLevel: session.riskLevel,
      timeline: events,
    };
  }

  /**
   * Examiner / Proctor: Review and annotate an integrity event
   */
  static async reviewEvent(organizationId, eventId, userId, payload = {}) {
    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      throw new ApiError(400, "Invalid event ID format");
    }

    const { reviewed = true, reviewerNote = "", resolution = "UNRESOLVED" } = payload;

    const event = await ProctoringEvent.findOneAndUpdate(
      { _id: eventId, organizationId },
      {
        $set: {
          reviewed: Boolean(reviewed),
          reviewedBy: userId,
          reviewedAt: new Date(),
          reviewerNote: reviewerNote || "",
          resolution,
        },
      },
      { returnDocument: "after" }
    );

    if (!event) {
      throw new ApiError(404, "Proctoring event not found in this organization");
    }

    // Recalculate session risk (dismissed events reduce risk)
    await RiskService.updateSessionRisk(event.proctoringSessionId);

    return event;
  }
}
