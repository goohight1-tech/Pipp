
import { GoogleGenAI, Type } from "@google/genai";
import { PromptResponse } from "../types";

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

export async function generateOptimizedPrompt(userInput: string): Promise<PromptResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: userInput,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          analysis: { 
            type: Type.STRING, 
            description: "Phân tích mục tiêu của người dùng" 
          },
          concisePrompt: { 
            type: Type.STRING, 
            description: "Prompt phiên bản ngắn gọn" 
          },
          deepPrompt: { 
            type: Type.STRING, 
            description: "Prompt phiên bản chi tiết (Deep Prompt)" 
          },
          clarifyingQuestions: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "1-2 câu hỏi để làm rõ ý định"
          }
        },
        required: ["analysis", "concisePrompt", "deepPrompt", "clarifyingQuestions"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Không nhận được phản hồi từ AI");
  
  return JSON.parse(text) as PromptResponse;
}
