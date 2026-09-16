import React from 'react';
import { Send } from 'lucide-react';

export const ExaminerChatTab = ({
  messages = [],
  chatInput = '',
  setChatInput,
  handleSendMessage,
  chatBottomRef,
}) => {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const isMe = m.role === 'EXAMINER';
          return (
            <div key={m.id} className={`flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
              <div className="flex items-center gap-1 text-[10px] text-accent-500">
                <span className="font-semibold text-accent-400">{m.sender}</span>
                <span>· {m.time}</span>
              </div>
              <div
                className={`p-3 rounded-xl text-xs max-w-[90%] leading-relaxed ${
                  m.role === 'SYSTEM'
                    ? 'bg-accent-800/80 text-accent-300 border border-accent-700'
                    : isMe
                    ? 'bg-primary-600 text-white rounded-tr-none'
                    : 'bg-accent-800 text-white rounded-tl-none'
                }`}
              >
                <p>{m.text}</p>
              </div>
            </div>
          );
        })}
        <div ref={chatBottomRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-3 border-t border-accent-800 flex gap-2 bg-accent-950/50">
        <input
          type="text"
          placeholder="Message candidate..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="flex-1 h-9 px-3 text-xs rounded-lg bg-accent-800 text-white placeholder:text-accent-500 border border-accent-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <button
          type="submit"
          className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center hover:bg-primary-500 transition-colors shrink-0 cursor-pointer"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
};
