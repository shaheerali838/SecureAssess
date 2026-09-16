import React from 'react';
import { StickyNote } from 'lucide-react';
import { Button } from '@/components/ui';

export const ExaminerNotesTab = ({
  savedNotes = [],
  privateNoteInput = '',
  setPrivateNoteInput,
  handleAddPrivateNote,
  savingNote = false,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <div className="p-3 rounded-xl bg-primary-950/30 border border-primary-800/40 text-xs text-primary-300 mb-2">
          <span className="font-bold block mb-1">🔒 Confidential Examiner Space</span>
          Notes recorded here are private to the evaluation committee and will not be displayed to the candidate.
        </div>

        {savedNotes.length === 0 ? (
          <div className="text-center py-10 text-accent-500 text-xs">
            <StickyNote size={28} className="mx-auto mb-2 opacity-50" />
            No private evaluation notes added yet.
          </div>
        ) : (
          savedNotes.map((sn, idx) => (
            <div
              key={sn._id || idx}
              className="p-3 rounded-xl bg-accent-850/80 border border-accent-800 text-xs space-y-1"
            >
              <p className="text-white leading-relaxed">{sn.data?.content || sn.content}</p>
              <span className="text-[10px] text-accent-400 block pt-1 border-t border-accent-800/60">
                {sn.data?.createdAt ? new Date(sn.data.createdAt).toLocaleTimeString() : 'Just now'} · Synced to Vault
              </span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleAddPrivateNote} className="p-3 border-t border-accent-800 bg-accent-950/60 space-y-2">
        <input
          type="text"
          placeholder="Record confidential observation..."
          value={privateNoteInput}
          onChange={(e) => setPrivateNoteInput(e.target.value)}
          className="w-full text-xs h-9 px-3 rounded-lg bg-accent-800 border border-accent-700 text-white placeholder:text-accent-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <Button
          variant="outline"
          size="sm"
          type="submit"
          loading={savingNote}
          className="w-full text-xs"
          icon={<StickyNote size={13} />}
        >
          Save Confidential Note
        </Button>
      </form>
    </div>
  );
};
