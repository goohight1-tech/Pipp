
import React, { useState, useRef } from 'react';
import { Send, User, Bot, Copy, Check, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PromptResponse } from '../types';

/**
 * LoadingSpinner: A smooth, modern pulsing animation
 */
export const LoadingSpinner = () => (
  <div className="flex items-center gap-2 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit animate-pulse">
    <div className="flex gap-1">
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></span>
    </div>
    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">AI Master đang tư duy...</span>
  </div>
);

interface MessageBubbleProps {
  role: 'user' | 'ai';
  content: string;
  promptResult?: PromptResponse;
}

/**
 * MessageBubble: Displays user and AI messages with Markdown support
 */
// Using React.FC to ensure the component is recognized correctly by TypeScript and accepts standard props like 'key'
export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  role, 
  content, 
  promptResult 
}) => {
  const isUser = role === 'user';
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
      <div className={`flex max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600'
        }`}>
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>

        {/* Bubble Content */}
        <div className="flex flex-col gap-2">
          <div className={`p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'
          }`}>
            <ReactMarkdown className="prose dark:prose-invert max-w-none">
              {content}
            </ReactMarkdown>
          </div>

          {/* Special Result Display for AI (Prompt Engineering specific) */}
          {!isUser && promptResult && (
            <div className="mt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
              {/* Analysis */}
              <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-4">
                <p className="text-sm text-indigo-900 dark:text-indigo-300 font-medium italic">
                  "{promptResult.analysis}"
                </p>
              </div>

              {/* Action Buttons / Result Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bản Ngắn Gọn</span>
                    <button onClick={() => handleCopy(promptResult.concisePrompt, 'concise')} className="text-slate-400 hover:text-indigo-500">
                      {copiedSection === 'concise' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 font-mono">{promptResult.concisePrompt}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bản Deep Prompt</span>
                    <button onClick={() => handleCopy(promptResult.deepPrompt, 'deep')} className="text-slate-400 hover:text-indigo-500">
                      {copiedSection === 'deep' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 font-mono">{promptResult.deepPrompt}</p>
                </div>
              </div>

              {/* Questions */}
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl p-3">
                 <span className="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest block mb-1">Gợi ý làm rõ</span>
                 <ul className="text-xs text-amber-900 dark:text-amber-400 space-y-1 list-disc list-inside">
                   {promptResult.clarifyingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                 </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChatInterfaceProps {
  onSend: (msg: string) => void;
  disabled: boolean;
}

/**
 * ChatInterface: Input area with auto-expanding textarea
 */
// Using React.FC for consistent typing
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ onSend, disabled }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input);
      setInput('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  return (
    <div className="p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 sticky bottom-0 z-30">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-end gap-3">
        <div className="relative flex-1">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Mô tả ý tưởng hoặc dán prompt cần tối ưu..."
            className="w-full max-h-48 p-4 pr-12 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />
          <div className="absolute right-3 bottom-3 text-slate-400">
            <Sparkles size={18} className={input ? 'text-indigo-500 animate-pulse' : ''} />
          </div>
        </div>
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            !input.trim() || disabled 
              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20'
          }`}
        >
          <Send size={20} />
        </button>
      </form>
      <p className="max-w-4xl mx-auto text-center mt-2 text-[10px] text-slate-400 uppercase tracking-widest font-medium">
        Sử dụng Shift + Enter để xuống dòng
      </p>
    </div>
  );
};
