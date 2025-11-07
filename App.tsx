
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import { Message, Role } from './types';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: Role.MODEL,
      content:
        'Xin chào! Tôi là trợ lý AI cho hoclieuso.id.vn. Tôi có thể giúp gì cho bạn về các câu hỏi Ngữ văn hôm nay?',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (userMessage: string) => {
    setIsLoading(true);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: Role.USER, content: userMessage },
    ]);

    try {
      if (!chatRef.current) {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        chatRef.current = ai.chats.create({
          model: 'gemini-2.5-flash',
          config: {
            systemInstruction:
`Bạn là một chuyên gia Ngữ văn AI, đóng vai trò là trợ lý ảo cho trang web www.hoclieuso.id.vn. Nhiệm vụ của bạn là cung cấp thông tin môn Ngữ văn chính xác, hấp dẫn và dễ hiểu cho học sinh và những người yêu thích Ngữ văn.
Quy tắc ứng xử:
1.  **Chuyên môn:** Chỉ trả lời các câu hỏi liên quan đến Ngữ văn. Nếu người dùng hỏi về chủ đề khác, hãy lịch sự từ chối và hướng họ quay lại chủ đề Ngữ văn.
2.  **Nguồn thông tin:** Luôn nhấn mạnh rằng bạn là trợ lý của trang Học Liệu Số (hoclieuso.id.vn).
3.  **Ngôn ngữ:** Sử dụng ngôn ngữ tiếng Việt trong sáng, dễ hiểu, phù hợp với môi trường giáo dục. Tránh dùng thuật ngữ quá phức tạp mà không giải thích.
4.  **Thái độ:** Luôn thân thiện, kiên nhẫn và khuyến khích người dùng khám phá thêm kiến thức.
5.  **Định dạng:** Khi liệt kê kiến thức, thông tin, hãy sử dụng danh sách (gạch đầu dòng hoặc số thứ tự) để câu trả lời được rõ ràng và có cấu trúc.
6.  **Tính khách quan:** Trình bày thông tin một cách khách quan, dựa trên các thông tin có trong trang hoclieuso.id.vn. Tránh đưa ra các ý kiến cá nhân hay những quan điểm gây tranh cãi.`
          },
        });
      }

      setMessages((prev) => [...prev, { role: Role.MODEL, content: '' }]);

      const result = await chatRef.current.sendMessageStream({
        message: userMessage,
      });

      for await (const chunk of result) {
        const chunkText = chunk.text;
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === Role.MODEL) {
            lastMessage.content += chunkText;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => {
         const newMessages = [...prev];
         const lastMessage = newMessages[newMessages.length - 1];
         if (lastMessage.role === Role.MODEL) {
            lastMessage.content = "Tôi xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.";
         }
         return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 text-center sticky top-0 z-10">
        <h1 className="text-xl font-bold text-slate-100">Trợ lý AI Học Liệu Số</h1>
      </header>

      <main className="flex-grow overflow-y-auto px-4">
        <div className="max-w-4xl mx-auto">
          {messages.map((msg, index) => (
            <ChatMessage key={index} message={msg} />
          ))}
           {isLoading && messages[messages.length - 1].role === Role.USER && (
            <div className="flex items-start gap-4 py-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center animate-pulse"></div>
                <div className="max-w-xl lg:max-w-3xl px-5 py-3 rounded-2xl bg-slate-700 text-slate-200 rounded-bl-none">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></div>
                    </div>
                </div>
            </div>
           )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="sticky bottom-0 bg-slate-900">
        <div className="max-w-4xl mx-auto relative">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </footer>
    </div>
  );
};

export default App;
