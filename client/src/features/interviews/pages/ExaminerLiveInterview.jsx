import React from 'react';
import { ConfirmModal } from '@/components/ui';
import { useExaminerSession } from '../hooks/useExaminerSession';
import {
  ExaminerHeader,
  ExaminerVideoStage,
  ExaminerControlDock,
  ExaminerSidebar,
  ExaminerAddQuestionModal,
  ExaminerConcludedSummary,
} from '../components/examiner';

export function ExaminerLiveInterview({ onNavigate }) {
  const session = useExaminerSession({ onNavigate });

  // Concluded Summary View
  if (session.sessionEnded) {
    return (
      <ExaminerConcludedSummary
        interviewTitle={session.interviewTitle}
        examineeName={session.examineeName}
        candCode={session.candCode}
        elapsed={session.elapsed}
        questions={session.questions}
        handleSaveQuestionRating={session.handleSaveQuestionRating}
        handleHostNextCandidate={session.handleHostNextCandidate}
        onNavigate={onNavigate}
      />
    );
  }

  return (
    <div className="h-screen bg-accent-950 flex flex-col overflow-hidden text-white select-none">
      {/* Top Header */}
      <ExaminerHeader
        interviewTitle={session.interviewTitle}
        interviewType={session.interview?.type}
        examineeName={session.examineeName}
        candCode={session.candCode}
        elapsed={session.elapsed}
        formatTime={session.formatTime}
        activeLayout={session.activeLayout}
        setActiveLayout={session.setActiveLayout}
        handleExitRoom={session.handleExitRoom}
      />

      {/* Main Room Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Video Stage & Floating Controls */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          <ExaminerVideoStage
            screenSharing={session.screenSharing}
            activeLayout={session.activeLayout}
            remoteVideoRef={session.remoteVideoRef}
            remoteStreamActive={session.remoteStreamActive}
            remoteCamOn={session.remoteCamOn}
            remoteMicOn={session.remoteMicOn}
            examineeName={session.examineeName}
            localVideoRef={session.localVideoRef}
            camOn={session.camOn}
            examinerName={session.examinerName}
            isMirrored={session.isMirrored}
            setIsMirrored={session.setIsMirrored}
          />

          <ExaminerControlDock
            micOn={session.micOn}
            toggleMicrophone={session.toggleMicrophone}
            camOn={session.camOn}
            toggleCamera={session.toggleCamera}
            screenSharing={session.screenSharing}
            toggleScreenShare={session.toggleScreenShare}
            activeTab={session.activeTab}
            setActiveTab={session.setActiveTab}
            mobilePanelOpen={session.mobilePanelOpen}
            setMobilePanelOpen={session.setMobilePanelOpen}
            savedNotesCount={session.savedNotes.length}
            peersCount={session.activeRoomPeers.length > 0 ? session.activeRoomPeers.length + 1 : 2}
            handleEndInterview={session.handleEndInterview}
          />
        </div>

        {/* Right: Examiner Sidebar */}
        <ExaminerSidebar
          mobilePanelOpen={session.mobilePanelOpen}
          setMobilePanelOpen={session.setMobilePanelOpen}
          activeTab={session.activeTab}
          setShowAddQuestionModal={session.setShowAddQuestionModal}
          questions={session.questions}
          activeQuestion={session.activeQuestion}
          setActiveQuestion={session.setActiveQuestion}
          handleSaveQuestionRating={session.handleSaveQuestionRating}
          savedNotes={session.savedNotes}
          privateNoteInput={session.privateNoteInput}
          setPrivateNoteInput={session.setPrivateNoteInput}
          handleAddPrivateNote={session.handleAddPrivateNote}
          savingNote={session.savingNote}
          messages={session.messages}
          chatInput={session.chatInput}
          setChatInput={session.setChatInput}
          handleSendMessage={session.handleSendMessage}
          chatBottomRef={session.chatBottomRef}
          examineeName={session.examineeName}
          candCode={session.candCode}
          examinerName={session.examinerName}
        />
      </div>

      {/* Modal: Add Custom Question */}
      <ExaminerAddQuestionModal
        isOpen={session.showAddQuestionModal}
        onClose={() => session.setShowAddQuestionModal(false)}
        newQuestionTitle={session.newQuestionTitle}
        setNewQuestionTitle={session.setNewQuestionTitle}
        newQuestionPrompt={session.newQuestionPrompt}
        setNewQuestionPrompt={session.setNewQuestionPrompt}
        handleCreateCustomQuestion={session.handleCreateCustomQuestion}
      />

      {/* End Interview Confirmation Modal */}
      <ConfirmModal
        isOpen={session.showEndModal}
        onClose={() => session.setShowEndModal(false)}
        onConfirm={session.executeEndInterview}
        title="Conclude Live Interview"
        message={
          session.questions.some((q) => q.rating === 0)
            ? 'You have unrated evaluation questions. You can conclude now and complete scoring directly on the summary screen, or return to the room to continue.'
            : 'Are you sure you want to conclude and submit this live interview session? The room will close for all participants and the session recording & evaluation rubrics will be archived.'
        }
        confirmText="Conclude & Submit"
        cancelText="Return to Room"
        variant="danger"
        loading={session.endingSession}
      />
    </div>
  );
}

export default ExaminerLiveInterview;
