import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

try {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({ apiKey });
  } else {
    console.warn("Gemini API Key missing in environment variables.");
  }
} catch (e) {
  console.error("Failed to initialize Gemini AI client:", e);
}

export const getMemorizationAdvice = async (question: string, context?: string): Promise<string> => {
  if (!ai) return "عذراً، خدمة الذكاء الاصطناعي غير متوفرة حالياً. يرجى التحقق من إعدادات المفتاح.";

  try {
    const model = 'gemini-3-flash-preview';
    const prompt = `
      أنت مساعد ذكي متخصص في تحفيظ القرآن الكريم وتجويده. اسمك "رفيق الحفاظ".
      أسلوبك لطيف، مشجع، ومحترم جداً.
      
      سياق المستخدم: ${context || 'مستخدم عام'}
      
      سؤال المستخدم: ${question}
      
      الرجاء الإجابة باللغة العربية مع تقديم نصائح عملية وجدول مقترح إذا لزم الأمر. اجعل الإجابة مختصرة ومفيدة.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "لم أتمكن من الحصول على إجابة، حاول مرة أخرى.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "حدث خطأ أثناء الاتصال بالمساعد الذكي. قد يكون هناك مشكلة في الاتصال أو الحصة المتاحة.";
  }
};