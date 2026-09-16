import React from 'react';

export function ScheduleDetailsForm({
  title,
  setTitle,
  interviewPurpose,
  setInterviewPurpose,
  interviewType,
  setInterviewType,
  scheduledDate,
  setScheduledDate,
  scheduledTime,
  setScheduledTime,
  durationMinutes,
  setDurationMinutes,
  description,
  setDescription,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-accent-700 dark:text-accent-300 uppercase tracking-wider mb-2">
        2. Interview Details & Purpose
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Interview Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Distributed Systems Architecture & WebRTC Defense"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Purpose / Category
          </label>
          <select
            value={interviewPurpose}
            onChange={(e) => setInterviewPurpose(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="HIRING">Hiring & Recruitment</option>
            <option value="ACADEMIC_ENTRY">Academic Entry / Admission</option>
            <option value="ORAL_EXAM">Course Oral Exam / Viva</option>
            <option value="TECHNICAL">Technical Defense</option>
            <option value="TESTING">Skill & Certification Test</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-3">
        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Format Type
          </label>
          <select
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="TECHNICAL">Technical Defense</option>
            <option value="CODING">Live Coding & Whiteboard</option>
            <option value="PANEL">Multi-Examiner Panel</option>
            <option value="BEHAVIORAL">Behavioral / Case Review</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Scheduled Date
          </label>
          <input
            type="date"
            required
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Start Time
          </label>
          <input
            type="time"
            required
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
            Duration Window
          </label>
          <select
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full text-xs h-9 px-3 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-xs font-semibold text-accent-700 dark:text-accent-300 mb-1">
          Agenda / Topics & Evaluation Criteria
        </label>
        <textarea
          rows={2}
          placeholder="Key questions, core rubrics, or instructions for candidate..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full text-xs p-2.5 rounded-lg bg-accent-50 dark:bg-accent-800 border border-accent-200 dark:border-accent-700 text-accent-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
        />
      </div>
    </div>
  );
}
