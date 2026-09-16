import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui';

export const ExaminerAddQuestionModal = ({
  isOpen,
  onClose,
  newQuestionTitle,
  setNewQuestionTitle,
  newQuestionPrompt,
  setNewQuestionPrompt,
  handleCreateCustomQuestion,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-accent-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-accent-900 border border-accent-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-accent-800">
          <h3 className="text-sm font-bold text-white">Add Custom Oral Defense Question</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-accent-400 hover:text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleCreateCustomQuestion} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-accent-300 mb-1">Question Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Distributed Consensus"
              value={newQuestionTitle}
              onChange={(e) => setNewQuestionTitle(e.target.value)}
              className="w-full text-xs h-9 px-3 rounded-lg bg-accent-800 border border-accent-700 text-white placeholder:text-accent-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-accent-300 mb-1">Prompt / Evaluation Rubric</label>
            <textarea
              rows={3}
              placeholder="Describe evaluation criteria..."
              value={newQuestionPrompt}
              onChange={(e) => setNewQuestionPrompt(e.target.value)}
              className="w-full text-xs p-3 rounded-lg bg-accent-800 border border-accent-700 text-white placeholder:text-accent-500 focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Add to Rubric
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
