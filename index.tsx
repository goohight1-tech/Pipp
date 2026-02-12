
import { GoogleGenAI, Type } from "@google/genai";

// Cấu hình AI Engine
const SYSTEM_INSTRUCTION = `Bạn là một Chuyên gia Prompt Engineering hàng đầu thế giới. 
Nhiệm vụ của bạn là nhận ý tưởng sơ khai từ người dùng và chuyển đổi nó thành một prompt tối ưu theo các bước sau:
1. Phân tích mục tiêu: Xác định người dùng muốn đạt được điều gì (Mục tiêu cốt lõi).
2. Cấu trúc lại prompt theo công thức: [Vai trò] + [Nhiệm vụ cụ thể] + [Bối cảnh/Dữ liệu đầu vào] + [Định dạng đầu ra mong muốn] + [Ràng buộc/Lưu ý].
3. Đưa ra 2 phiên bản:
   - Phiên bản ngắn gọn (Concise Prompt).
   - Phiên bản chuyên sâu (Deep Prompt) - chứa đầy đủ các chi tiết kỹ thuật và reasoning.
4. Đưa ra 1-2 câu hỏi làm rõ nếu ý tưởng mơ hồ.

TẤT CẢ PHẢI TRẢ VỀ ĐỊNH DẠNG JSON.
Ngôn ngữ sử dụng: Tiếng Việt.`;

// DOM Elements
const userInput = document.getElementById('user-input') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const messageList = document.getElementById('message-list') as HTMLDivElement;
const emptyState = document.getElementById('empty-state') as HTMLDivElement;
const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement;
const themeToggle = document.getElementById('theme-toggle') as HTMLButtonElement;
const clearChat = document.getElementById('clear-chat') as HTMLButtonElement;
const inputSparkle = document.getElementById('input-sparkle');

// State
let isDarkMode = false;
let isGenerating = false;

// Helpers
const updateIcons = () => (window as any).lucide.createIcons();

const scrollToBottom = () => {
    const container = document.getElementById('chat-container');
    if (container) container.scrollTop = container.scrollHeight;
};

const copyToClipboard = (text: string, button: HTMLButtonElement) => {
    navigator.clipboard.writeText(text);
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i data-lucide="check" class="w-3.5 h-3.5 text-green-500"></i>';
    updateIcons();
    setTimeout(() => {
        button.innerHTML = originalHTML;
        updateIcons();
    }, 2000);
};

// Render Functions
const createMessageBubble = (role: 'user' | 'ai', content: string, promptResult?: any) => {
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.className = `flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`;
    
    let aiContentHTML = '';
    if (promptResult) {
        aiContentHTML = `
            <div class="mt-4 space-y-4">
                <div class="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 rounded-xl p-4">
                    <p class="text-sm text-indigo-900 dark:text-indigo-300 font-medium italic">"${promptResult.analysis}"</p>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bản Ngắn Gọn</span>
                            <button class="copy-btn text-slate-400 hover:text-indigo-500" data-text="${promptResult.concisePrompt.replace(/"/g, '&quot;')}">
                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 font-mono">${promptResult.concisePrompt}</p>
                    </div>
                    <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2">
                        <div class="flex justify-between items-center">
                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bản Deep Prompt</span>
                            <button class="copy-btn text-slate-400 hover:text-indigo-500" data-text="${promptResult.deepPrompt.replace(/"/g, '&quot;')}">
                                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                        <p class="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 font-mono">${promptResult.deepPrompt}</p>
                    </div>
                </div>
                <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-xl p-3">
                     <span class="text-[10px] font-bold text-amber-600 dark:text-amber-500 uppercase tracking-widest block mb-1">Gợi ý làm rõ</span>
                     <ul class="text-xs text-amber-900 dark:text-amber-400 space-y-1 list-disc list-inside">
                        ${promptResult.clarifyingQuestions.map((q: string) => `<li>${q}</li>`).join('')}
                     </ul>
                </div>
            </div>
        `;
    }

    div.innerHTML = `
        <div class="flex max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}">
            <div class="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center shadow-sm ${isUser ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600'}">
                <i data-lucide="${isUser ? 'user' : 'bot'}" class="w-5 h-5"></i>
            </div>
            <div class="flex flex-col gap-2">
                <div class="p-4 rounded-2xl shadow-sm text-[15px] leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-none'}">
                    <div class="prose dark:prose-invert max-w-none">
                        ${(window as any).marked.parse(content)}
                    </div>
                </div>
                ${aiContentHTML}
            </div>
        </div>
    `;

    // Gắn sự kiện copy cho nút mới thêm
    div.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => copyToClipboard(btn.getAttribute('data-text') || '', btn as HTMLButtonElement));
    });

    return div;
};

// Main Logic
const generatePrompt = async (text: string) => {
    if (isGenerating) return;
    isGenerating = true;
    
    // UI Update
    emptyState.classList.add('hidden');
    messageList.classList.remove('hidden');
    messageList.appendChild(createMessageBubble('user', text));
    loadingIndicator.classList.remove('hidden');
    userInput.value = '';
    userInput.style.height = 'auto';
    sendBtn.disabled = true;
    updateIcons();
    scrollToBottom();

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: text,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        analysis: { type: Type.STRING },
                        concisePrompt: { type: Type.STRING },
                        deepPrompt: { type: Type.STRING },
                        clarifyingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["analysis", "concisePrompt", "deepPrompt", "clarifyingQuestions"]
                }
            }
        });

        const data = JSON.parse(response.text);
        const aiMsg = createMessageBubble('ai', "Tôi đã phân tích yêu cầu của bạn. Dưới đây là các phiên bản prompt tối ưu:", data);
        messageList.appendChild(aiMsg);
        
    } catch (err) {
        console.error(err);
        messageList.appendChild(createMessageBubble('ai', "❌ **Lỗi:** Không thể kết nối với trí tuệ nhân tạo. Vui lòng thử lại sau."));
    } finally {
        isGenerating = false;
        loadingIndicator.classList.add('hidden');
        sendBtn.disabled = false;
        updateIcons();
        scrollToBottom();
    }
};

// Event Listeners
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = `${userInput.scrollHeight}px`;
    if (userInput.value.trim()) {
        inputSparkle?.classList.add('text-indigo-500', 'animate-pulse');
    } else {
        inputSparkle?.classList.remove('text-indigo-500', 'animate-pulse');
    }
});

userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const text = userInput.value.trim();
        if (text) generatePrompt(text);
    }
});

sendBtn.addEventListener('click', () => {
    const text = userInput.value.trim();
    if (text) generatePrompt(text);
});

themeToggle.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.documentElement.classList.toggle('dark');
    document.getElementById('theme-icon-moon')?.classList.toggle('hidden');
    document.getElementById('theme-icon-sun')?.classList.toggle('hidden');
});

clearChat.addEventListener('click', () => {
    if (confirm('Xóa sạch lịch sử hội thoại?')) {
        messageList.innerHTML = '';
        messageList.classList.add('hidden');
        emptyState.classList.remove('hidden');
    }
});

document.querySelectorAll('.suggestion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.textContent || '';
        generatePrompt(text);
    });
});

// Init
updateIcons();
