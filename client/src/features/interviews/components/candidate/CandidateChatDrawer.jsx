import React from 'react';
import { X, Send } from 'lucide-react';

export const CandidateChatDrawer = ({
  isChatOpen,
  setIsChatOpen,
  messages,
  chatInput,
  setChatInput,
  handleSendMessage,
  chatBottomRef,
  examineeName,
}) => {
  if (!isChatOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
        onClick={() => setIsChatOpen(false)}
      />

      <div className="fixed md:static inset-y-0 right-0 z-50 md:z-auto w-full max-w-xs md:max-w-none md:w-80 border-l border-accent-800 bg-accent-900/98 backdrop-blur-md flex flex-col justify-between shrink-0 shadow-2xl md:shadow-none transition-all duration-200">
        <div className="p-4 border-b border-accent-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Discussion Channel</h3>
          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="text-accent-400 hover:text-white p-1 rounded-lg hover:bg-accent-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m, idx) => {
            const isMe = m.sender === examineeName || m.role === 'CANDIDATE';
            return (
              <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-1 text-[10px] text-accent-400 mb-0.5">
                  <span className="font-semibold text-accent-300">{m.sender}</span>
                  <span>· {m.time}</span>
                </div>
                <div
                  className={`p-2.5 rounded-xl text-xs max-w-[90%] break-words ${
                    isMe ? 'bg-primary-600 text-white rounded-br-none' : 'bg-accent-800 text-accent-100 rounded-bl-none'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>

        <form onSubmit={handleSendMessage} className="p-3 border-t border-accent-800 flex items-center gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-accent-950/80 border border-accent-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-accent-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            type="submit"
            disabled={!chatInput.trim()}
            className="p-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white disabled:opacity-40 transition-colors"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </>
  );
};
