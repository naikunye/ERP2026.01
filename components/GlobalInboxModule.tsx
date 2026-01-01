import React, { useState } from 'react';
import { CustomerMessage } from '../types';
import { 
  MessageSquare, Mail, Video, ShoppingBag, Search, Filter, 
  Send, Sparkles, User, Clock, AlertCircle, Smile, Frown, Meh,
  CheckCircle2, Reply
} from 'lucide-react';

const DEMO_MESSAGES: CustomerMessage[] = [
    {
        id: 'MSG-001',
        platform: 'Amazon',
        customerName: 'Alice Smith',
        subject: 'Defective Item Received',
        content: 'I received the headphones yesterday but the right ear cup is not working. I am very disappointed as this was a gift.',
        timestamp: '10:30 AM',
        status: 'Unread',
        sentiment: 'Negative',
        orderId: '112-39283-12321',
        aiDraft: 'Dear Alice,\n\nI am so sorry to hear about the issue with the right ear cup. This is certainly not the experience we want for our customers, especially for a gift.\n\nWe would be happy to send you a free replacement immediately, no return needed. Please confirm your shipping address.\n\nBest regards,\nCustomer Support'
    },
    {
        id: 'MSG-002',
        platform: 'TikTok',
        customerName: 'cool_dude_99',
        subject: 'DM',
        content: 'Yo! Can I get a discount code for the LED strips? Love your vids!',
        timestamp: '09:15 AM',
        status: 'Unread',
        sentiment: 'Positive',
        aiDraft: 'Hey! Thanks for the love! 🔥\n\nUse code TIKTOK10 for 10% off your order. Can\'t wait to see your setup!\n\nCheers!'
    },
    {
        id: 'MSG-003',
        platform: 'Email',
        customerName: 'Logistics Partner',
        subject: 'Inbound Shipment Delayed',
        content: 'Please be advised that shipment SH-002 is held at customs for inspection.',
        timestamp: 'Yesterday',
        status: 'Replied',
        sentiment: 'Urgent'
    }
];

const GlobalInboxModule: React.FC = () => {
    const [messages, setMessages] = useState<CustomerMessage[]>(DEMO_MESSAGES);
    const [selectedId, setSelectedId] = useState<string>(DEMO_MESSAGES[0].id);
    const [replyText, setReplyText] = useState('');

    const selectedMsg = messages.find(m => m.id === selectedId);

    const handleSelect = (msg: CustomerMessage) => {
        setSelectedId(msg.id);
        setReplyText(''); // Clear previous draft edits
    };

    const handleUseAiDraft = () => {
        if (selectedMsg?.aiDraft) {
            setReplyText(selectedMsg.aiDraft);
        }
    };

    const getPlatformIcon = (platform: string) => {
        switch(platform) {
            case 'Amazon': return <ShoppingBag size={14} />;
            case 'TikTok': return <Video size={14} />;
            case 'Email': return <Mail size={14} />;
            default: return <MessageSquare size={14} />;
        }
    };

    const getSentimentIcon = (sentiment: string) => {
        switch(sentiment) {
            case 'Negative': return <Frown size={14} className="text-neon-pink" />;
            case 'Positive': return <Smile size={14} className="text-neon-green" />;
            case 'Urgent': return <AlertCircle size={14} className="text-neon-yellow" />;
            default: return <Meh size={14} className="text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in w-full pb-20 h-full flex flex-col">
            
            {/* Header */}
            <div className="flex justify-between items-end border-b border-white/10 pb-6 shrink-0">
                <div>
                    <h1 className="text-[32px] font-display font-bold text-white tracking-tight leading-none flex items-center gap-3">
                        全球消息中心
                        <span className="text-neon-green/50 font-sans text-sm tracking-widest font-medium border border-neon-green/30 px-2 py-0.5 rounded">GLOBAL INBOX</span>
                    </h1>
                    <p className="text-gray-400 text-sm mt-2">跨平台统一客诉管理与 AI 辅助回复。</p>
                </div>
                <div className="flex gap-2">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-neon-pink animate-pulse"></div>
                        <span className="text-xs font-bold text-white">3 待处理</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
                
                {/* Message List */}
                <div className="w-[350px] flex flex-col gap-4 overflow-hidden shrink-0 border-r border-white/5 pr-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input 
                            className="w-full h-10 pl-10 pr-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:border-neon-green outline-none"
                            placeholder="搜索客户或订单号..."
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                        {messages.map(msg => (
                            <div 
                                key={msg.id}
                                onClick={() => handleSelect(msg)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border relative ${
                                    selectedId === msg.id 
                                    ? 'bg-white/10 border-neon-green/50' 
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1 rounded bg-black/20 text-gray-400">
                                            {getPlatformIcon(msg.platform)}
                                        </div>
                                        <span className="font-bold text-white text-xs truncate max-w-[100px]">{msg.customerName}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500">{msg.timestamp}</span>
                                </div>
                                <div className="text-xs text-gray-300 font-medium mb-1 truncate">{msg.subject}</div>
                                <div className="text-[10px] text-gray-500 truncate">{msg.content}</div>
                                
                                {msg.sentiment !== 'Neutral' && (
                                    <div className="absolute top-4 right-4" title={`Sentiment: ${msg.sentiment}`}>
                                        {getSentimentIcon(msg.sentiment)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 flex flex-col glass-card border-white/10 overflow-hidden relative">
                    {selectedMsg ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-900 flex items-center justify-center text-white border border-white/10">
                                        <User size={20} />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm flex items-center gap-2">
                                            {selectedMsg.customerName}
                                            <span className="px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-gray-400 font-normal border border-white/10">{selectedMsg.platform}</span>
                                        </div>
                                        {selectedMsg.orderId && (
                                            <div className="text-[10px] text-neon-green font-mono cursor-pointer hover:underline">Order #{selectedMsg.orderId}</div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {selectedMsg.status === 'Replied' && (
                                        <span className="flex items-center gap-1 text-xs text-neon-green font-bold">
                                            <CheckCircle2 size={14}/> 已回复
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Conversation */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-black/20 custom-scrollbar">
                                {/* Customer Message */}
                                <div className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center shrink-0 mt-1">
                                        <User size={14} className="text-gray-300"/>
                                    </div>
                                    <div className="bg-white/10 border border-white/5 p-4 rounded-2xl rounded-tl-none max-w-[80%]">
                                        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{selectedMsg.content}</p>
                                    </div>
                                </div>

                                {/* AI Suggestion Box (if not replied) */}
                                {selectedMsg.status === 'Unread' && selectedMsg.aiDraft && (
                                    <div className="mx-12 p-4 rounded-xl border border-neon-purple/30 bg-neon-purple/5 relative group animate-fade-in">
                                        <div className="absolute -top-3 left-4 px-2 bg-[#121218] text-[10px] font-bold text-neon-purple flex items-center gap-1">
                                            <Sparkles size={10} /> AI 建议回复 (Sentiment: {selectedMsg.sentiment})
                                        </div>
                                        <p className="text-xs text-gray-300 whitespace-pre-wrap font-mono leading-relaxed opacity-80">
                                            {selectedMsg.aiDraft}
                                        </p>
                                        <button 
                                            onClick={handleUseAiDraft}
                                            className="mt-3 px-3 py-1.5 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/30 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                        >
                                            <Reply size={12}/> 使用此草稿
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Reply Input */}
                            <div className="p-4 bg-white/5 border-t border-white/10">
                                <div className="relative">
                                    <textarea 
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                        className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-neon-green outline-none resize-none placeholder-gray-600"
                                        placeholder="输入回复内容..."
                                    />
                                    <div className="absolute bottom-3 right-3 flex gap-2">
                                        <button className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
                                            <Sparkles size={18} />
                                        </button>
                                        <button className="px-4 py-2 bg-neon-green text-black rounded-lg font-bold text-xs flex items-center gap-2 hover:scale-105 transition-transform shadow-glow-green">
                                            <Send size={14} /> 发送
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p>选择一条消息开始处理</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalInboxModule;