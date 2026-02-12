
import React, { useState, useRef, useEffect } from 'react';
import { generateOptimizedPrompt } from './services/geminiService';
import { ChatMessage, AppStatus } from './types';
import { MessageBubble, LoadingSpinner, ChatInterface } from './components/ChatComponents';
import { Moon, Sun, Trash2, Zap } from 'lucide-react';

const Navbar = ({ onClear, isDark, toggleDark }: { onClear: () => void, isDark: boolean, toggleDark: () => void }) => (
  <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 transition-colors duration-300">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-indigo-200 dark:shadow-indigo-900/20 shadow-lg">
          <Zap size={18} className="text-white fill-current" />
        </div>
        <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          AI Prompt Master
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={toggleDark}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Chế độ tối"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button 
          onClick={onClear}
          className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          title="Xóa cuộc hội thoại"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  </nav>
);

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isDark, setIsDark] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, status]);

  const toggleDark = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  const handleClear = () => {
    if (confirm('Bạn có chắc muốn xóa lịch sử tối ưu prompt này?')) {
      setMessages([]);
      setStatus(AppStatus.IDLE);
    }
  };

  const handleSend = async (userInput: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userInput
    };

    setMessages(prev => [...prev, userMsg]);
    setStatus(AppStatus.LOADING);

    try {
      const data = await generateOptimizedPrompt(userInput);
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `Tôi đã phân tích yêu cầu của bạn. Dưới đây là các phiên bản prompt tối ưu được thiết kế theo tiêu chuẩn Prompt Engineering:`,
        promptResult: data
      };
      setMessages(prev => [...prev, aiMsg]);
      setStatus(AppStatus.SUCCESS);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: `❌ **Đã có lỗi xảy ra:** Không thể kết nối với hệ thống tối ưu. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.`
      };
      setMessages(prev => [...prev, errorMsg]);
      setStatus(AppStatus.ERROR);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      <Navbar onClear={handleClear} isDark={isDark} toggleDark={toggleDark} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8">
        {messages.length === 0 ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mb-6">
              <Zap size={40} className="text-indigo-600" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
              Bạn cần tối ưu prompt nào?
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Nhập ý tưởng sơ khai, mục tiêu hoặc một prompt chưa hiệu quả. Tôi sẽ giúp bạn tái cấu trúc nó chuyên nghiệp hơn.
            </p>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {['Viết kịch bản TikTok...', 'Tạo prompt vẽ ảnh...', 'Xây dựng bài viết SEO...', 'Viết email marketing...'].map((s) => (
                <button 
                  key={s}
                  onClick={() => handleSend(s)}
                  className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id} 
                role={msg.role} 
                content={msg.content} 
                promptResult={msg.promptResult} 
              />
            ))}
            
            {status === AppStatus.LOADING && <LoadingSpinner />}
            <div ref={scrollRef} className="h-4" />
          </div>
        )}
      </main>

      <ChatInterface onSend={handleSend} disabled={status === AppStatus.LOADING} />
    </div>
  );
}
