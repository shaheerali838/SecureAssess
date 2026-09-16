import React from 'react';
import { Award, StickyNote, MessageSquare, Users, Plus, X } from 'lucide-react';
import { ExaminerRubricTab } from './ExaminerRubricTab';
import { ExaminerNotesTab } from './ExaminerNotesTab';
import { ExaminerChatTab } from './ExaminerChatTab';
import { ExaminerRosterTab } from './ExaminerRosterTab';

export const ExaminerSidebar = ({
  mobilePanelOpen,
  setMobilePanelOpen,
  activeTab,
  setShowAddQuestionModal,
  // Rubric props
  questions,
  activeQuestion,
  setActiveQuestion,
  handleSaveQuestionRating,
  // Notes props
  savedNotes,
  privateNoteInput,
  setPrivateNoteInput,
  handleAddPrivateNote,
  savingNote,
  // Chat props
  messages,
  chatInput,
  setChatInput,
  handleSendMessage,
  chatBottomRef,
  // Roster props
  examineeName,
  candCode,
  examinerName,
}) => {
  return (
    <>
      {/* Mobile Backdrop */}
      {mobilePanelOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobilePanelOpen(false)}
        />
      )}

      <div
        className={`w-full sm:w-96 bg-accent-900 border-l border-accent-800 flex flex-col shrink-0 overflow-hidden shadow-2xl transition-all ${
          mobilePanelOpen ? 'fixed inset-y-0 right-0 z-50 flex' : 'hidden lg:flex'
        }`}
      >
      {/* Sidebar Header */}
      <div className="px-4 h-12 border-b border-accent-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          {activeTab === 'rubric' && <Award size={16} className="text-primary-400 shrink-0" />}
          {activeTab === 'notes' && <StickyNote size={16} className="text-primary-400 shrink-0" />}
          {activeTab === 'chat' && <MessageSquare size={16} className="text-primary-400 shrink-0" />}
          {activeTab === 'participants' && <Users size={16} className="text-primary-400 shrink-0" />}
          <span className="text-xs font-bold text-white uppercase tracking-wider truncate">
            {activeTab === 'rubric' && 'Evaluation Rubric'}
            {activeTab === 'notes' && 'Private Notes'}
            {activeTab === 'chat' && 'Live In-Room Chat'}
            {activeTab === 'participants' && 'Active Roster'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'rubric' && (
            <button
              type="button"
              onClick={() => setShowAddQuestionModal(true)}
              className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Plus size={14} /> Add
            </button>
          )}

          {/* Close Mobile Panel Button */}
          <button
            type="button"
            onClick={() => setMobilePanelOpen(false)}
            className="lg:hidden text-accent-400 hover:text-white p-1 rounded-lg hover:bg-accent-800 cursor-pointer"
            title="Close Evaluation Panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'rubric' && (
        <ExaminerRubricTab
          questions={questions}
          activeQuestion={activeQuestion}
          setActiveQuestion={setActiveQuestion}
          handleSaveQuestionRating={handleSaveQuestionRating}
        />
      )}

      {activeTab === 'notes' && (
        <ExaminerNotesTab
          savedNotes={savedNotes}
          privateNoteInput={privateNoteInput}
          setPrivateNoteInput={setPrivateNoteInput}
          handleAddPrivateNote={handleAddPrivateNote}
          savingNote={savingNote}
        />
      )}

      {activeTab === 'chat' && (
        <ExaminerChatTab
          messages={messages}
          chatInput={chatInput}
          setChatInput={setChatInput}
          handleSendMessage={handleSendMessage}
          chatBottomRef={chatBottomRef}
        />
      )}

      {activeTab === 'participants' && (
        <ExaminerRosterTab
          examineeName={examineeName}
          candCode={candCode}
          examinerName={examinerName}
        />
      )}
    </div>
  </>
);
};
