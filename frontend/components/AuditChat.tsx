import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Sparkles, ChevronRight, Play, Cpu, AlertCircle, Hash, Search, Activity } from 'lucide-react';
import { Message } from '../types/index';
import { sendAuditMessage } from '../services/auditService';

interface LogLine {
  id: string;
  type: 'info' | 'process' | 'success' | 'data';
  content: string;
  timestamp: string;
}

const AuditChat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      content: `系统就绪。\n运行环境: 生产模式\nNeo4j 数据库: 已连接\n向量知识库: 在线\n等待指令中...`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, logs]);

  const addLog = (type: LogLine['type'], content: string) => {
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    setLogs(prev => [...prev, { id: Date.now().toString() + Math.random(), type, content, timestamp }]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setLogs([]); // Clear previous logs for new execution

    addLog('info', `接收指令: "${userMsg.content.substring(0, 30)}..."`);
    addLog('process', '初始化 AgentExecutor...');
    
    try {
      // API Call
      const result = await sendAuditMessage(userMsg.content);
      
      let aiResponseContent = '';
      
      // Handle response being either string or object
      if (typeof result === 'string') {
        aiResponseContent = result;
      } else {
        // Backend returns { response: "...", steps: [...] }
        // auditService interface says answer, but let's handle both
        // @ts-ignore
        aiResponseContent = result.response || result.answer || JSON.stringify(result);
        
        // Render steps if available
        if (result.steps && Array.isArray(result.steps)) {
          result.steps.forEach((step: any) => {
             // Map backend step status to log type
             const type = step.status === 'completed' ? 'success' : 'process';
             addLog(type, `[${step.node}] ${step.detail}`);
          });
        }
      }

      setMessages((prev) => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponseContent,
          timestamp: new Date()
        }
      ]);
      addLog('success', '响应生成完毕');
    } catch (error) {
      addLog('data', `Error: ${error}`);
      setMessages((prev) => [
        ...prev, 
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "抱歉，处理您的请求时遇到错误。",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full gap-4 p-4 lg:p-6 overflow-hidden max-w-[1800px] mx-auto">
      {/* Left: Chat Console */}
      <div className="flex-1 flex flex-col glass-panel rounded-xl overflow-hidden shadow-2xl">
        {/* Console Header */}
        <div className="h-12 bg-black/40 border-b border-white/5 flex items-center px-4 justify-between">
          <div className="flex items-center gap-2 text-zinc-400">
            <Terminal size={14} />
            <span className="text-xs font-mono font-bold tracking-wider">AUDIT_AGENT_V2.0</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-700"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono text-sm custom-scrollbar bg-black/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`flex items-center gap-2 mb-1 opacity-50 text-[10px]`}>
                 <span className={msg.role === 'user' ? 'text-violet-400' : 'text-emerald-400'}>
                   {msg.role === 'user' ? '用户' : '系统'}
                 </span>
                 <span>{msg.timestamp.toLocaleTimeString()}</span>
              </div>
              <div className={`max-w-[85%] p-4 rounded-lg border ${
                msg.role === 'user' 
                  ? 'bg-violet-500/10 border-violet-500/20 text-zinc-200' 
                  : 'bg-zinc-900 border-zinc-800 text-emerald-400/90 shadow-lg'
              }`}>
                <pre className="whitespace-pre-wrap font-mono leading-relaxed">{msg.content}</pre>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Line */}
        <div className="p-4 bg-zinc-900/50 border-t border-white/5">
           <div className="flex items-center gap-3 bg-black border border-zinc-800 rounded-lg p-3 focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/20 transition-all">
             <ChevronRight className="text-violet-500 blink" size={18} />
             <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="输入审计指令或查询问题..."
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-zinc-200 font-mono text-sm placeholder:text-zinc-700"
                autoFocus
             />
             <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className={`p-1.5 rounded transition-colors ${isLoading ? 'text-zinc-600' : 'text-zinc-400 hover:text-white'}`}
             >
               {isLoading ? <Sparkles size={16} className="animate-spin" /> : <Send size={16} />}
             </button>
           </div>
        </div>
      </div>

      {/* Right: Execution Trace (Visible on large screens) */}
      <div className="w-80 hidden lg:flex flex-col glass-panel rounded-xl overflow-hidden border-l border-white/5">
        <div className="h-10 bg-zinc-900/80 border-b border-white/5 flex items-center px-4 gap-2">
           <Cpu size={14} className="text-violet-400" />
           <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">系统追踪</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs custom-scrollbar">
           {logs.length === 0 && !isLoading && (
             <div className="text-zinc-600 italic text-center mt-10">等待任务...</div>
           )}
           {logs.map((log) => (
             <div key={log.id} className="flex gap-2 animate-fade-in">
               <span className="text-zinc-600 flex-shrink-0">[{log.timestamp}]</span>
               <div className="break-all">
                 {log.type === 'info' && <span className="text-zinc-400">{log.content}</span>}
                 {log.type === 'process' && <span className="text-violet-400 flex items-center gap-1"><Activity size={8} className="animate-spin" /> {log.content}</span>}
                 {log.type === 'data' && <span className="text-amber-500">{log.content}</span>}
                 {log.type === 'success' && <span className="text-emerald-500">{log.content}</span>}
               </div>
             </div>
           ))}
           <div ref={logsEndRef} />
        </div>
        
        {/* Agent Config Summary */}
        <div className="p-3 bg-zinc-950 border-t border-white/5 text-[10px] text-zinc-500 space-y-1">
           <div className="flex justify-between"><span>模型:</span> <span className="text-zinc-300">DouBao-1.6</span></div>
           <div className="flex justify-between"><span>温度:</span> <span className="text-zinc-300">0.2</span></div>
           <div className="flex justify-between"><span>GRAPH_RAG:</span> <span className="text-emerald-500">已启用</span></div>
        </div>
      </div>
    </div>
  );
};

export default AuditChat;
