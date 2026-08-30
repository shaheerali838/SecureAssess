export const SIGNALING_EVENTS = Object.freeze({
  // Room Lifecycle
  INTERVIEW_JOIN: "interview:join",
  INTERVIEW_LEAVE: "interview:leave",
  INTERVIEW_START: "interview:start",
  INTERVIEW_ENDED: "interview:ended",

  // Participant State
  PARTICIPANT_JOINED: "participant:joined",
  PARTICIPANT_LEFT: "participant:left",
  WAITING_ROOM_STATUS: "participant:waiting-status",

  // WebRTC P2P Signaling
  WEBRTC_OFFER: "webrtc:offer",
  WEBRTC_ANSWER: "webrtc:answer",
  WEBRTC_ICE_CANDIDATE: "webrtc:ice-candidate",

  // Media Controls
  CAMERA_CHANGED: "media:camera-changed",
  MICROPHONE_CHANGED: "media:microphone-changed",
  SCREEN_SHARE_STARTED: "media:screen-share-started",
  SCREEN_SHARE_STOPPED: "media:screen-share-stopped",

  // Real-time Chat
  CHAT_MESSAGE: "chat:message",
});
