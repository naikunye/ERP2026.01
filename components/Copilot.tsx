import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, X, Send, Bot, User, RefreshCcw, Zap, 
  Terminal, BarChart3, TrendingUp, AlertCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface CopilotProps {
  contextData: any; // Data from the current view to give context
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

const Copilot: React.FC<CopilotProps> = ({ contextData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: '我是 Aero Copilot。我已经连接到您的 ERP 核心数据。您可以问我关于库存、物流或财务的问题，或者让我帮您撰写营销文案。',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      // Lazy Initialize Gemini to prevent crash on module load if env missing
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Construct a prompt with context
      // Limit context size for demo purposes
      const contextSummary = JSON.stringify(contextData).slice(0, 5000); 
      
      const prompt = `
        You are "Aero Copilot", an AI assistant embedded in a Cross-Border ERP system.
        
        Current Context Data (JSON snippet):
        ${contextSummary}
        
        User Question: "${userMsg.content}"
        
        Instructions:
        1. Answer strictly based on the provided context if it's a data question.
        2. If asked to write content, be professional and creative.
        3. Keep answers concise (under 100 words) unless asked for details.
        4. Use formatting like bullet points for clarity.
        5. Tone: Futuristic, professional, helpful.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const aiText = response.text || "I'm having trouble connecting to the neural core right now.";

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMsg]);

    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "系统连接中断 (API Error)。请检查网络或稍后重试。",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Floating Orb Trigger */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-8 right-8 z-[90] w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 shadow-glow-purple group ${isOpen ? 'rotate-90 scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <div className="absolute inset-0 bg-gradient-neon-purple rounded-full opacity-80 group-hover:opacity-100"></div>
        <div className="absolute inset-0 border-2 border-white/20 rounded-full animate-ping opacity-20"></div>
        <Sparkles size={24} className="text-white relative z-10" />
      </button>

      {/* Chat Interface */}
      <div 
        className={`fixed bottom-8 right-8 w-[380px] h-[600px] glass-card border-neon-purple/30 z-[100] flex flex-col transition-all duration-500 origin-bottom-right shadow-2xl ${
          isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-20 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="h-14 border-b border-white/10 flex items-center justify-between px-5 bg-gradient-to-r from-neon-purple/10 to-transparent">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-neon-purple/20 flex items-center justify-center text-neon-purple border border-neon-purple/30">
                <Bot size={18} />
             </div>
             <div>
                 <h3 className="text-sm font-bold text-white leading-none">Aero Copilot</h3>
                 <div className="text-[10px] text-neon-green flex items-center gap-1 mt-0.5">
                     <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></span>
                     Online
                 </div>
             </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
             <X size={18} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4 bg-black/20">
            {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border ${
                        msg.role === 'user' ? 'bg-white/10 border-white/20 text-gray-300' : 'bg-neon-purple/20 border-neon-purple/30 text-neon-purple'
                    }`}>
                        {msg.role === 'user' ? <User size={14}/> : <Sparkles size={14}/>}
                    </div>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user' ? 'bg-white/10 text-white rounded-tr-sm' : 'bg-black/40 border border-white/5 text-gray-200 rounded-tl-sm'
                    }`}>
                        {msg.content.split('\n').map((line, i) => <p key={i} className="mb-1">{line}</p>)}
                    </div>
                </div>
            ))}
            {isProcessing && (
                <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-neon-purple/20 border-neon-purple/30 text-neon-purple flex items-center justify-center shrink-0">
                        <Sparkles size={14} className="animate-spin"/>
                     </div>
                     <div className="bg-black/40 border border-white/5 p-3 rounded-2xl rounded-tl-sm text-xs text-gray-400 flex items-center gap-2">
                        <span className="animate-pulse">思考中...</span>
                     </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-white/10 bg-white/5">
             {/* Quick Actions */}
             {messages.length < 3 && (
                 <div className="flex gap-2 overflow-x-auto pb-3 custom-scrollbar">
                     <button onClick={() => setInput("分析当前库存风险")} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-neon-blue flex items-center gap-1 transition-colors">
                        <AlertCircle size={10}/> 库存风险
                     </button>
                     <button onClick={() => setInput("生成一份促销文案")} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-neon-pink flex items-center gap-1 transition-colors">
                        <Terminal size={10}/> 营销文案
                     </button>
                     <button onClick={() => setInput("预测下个月销量")} className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-neon-green flex items-center gap-1 transition-colors">
                        <TrendingUp size={10}/> 销量预测
                     </button>
                 </div>
             )}

             <div className="relative">
                 <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    className="w-full h-10 pl-4 pr-10 bg-black/40 border border-white/10 rounded-xl text-sm text-white focus:border-neon-purple outline-none placeholder-gray-600"
                    placeholder="输入指令给 AI..."
                    disabled={isProcessing}
                 />
                 <button 
                    onClick={handleSend}
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-neon-purple hover:bg-white/10 transition-colors disabled:opacity-50"
                 >
                     <Send size={16} />
                 </button>
             </div>
        </div>
      </div>
    </>
  );
};

export default Copilot;