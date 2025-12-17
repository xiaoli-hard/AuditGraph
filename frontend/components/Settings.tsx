import React, { useState } from 'react';
import { Save, RefreshCw, Cpu, Database, Network, Key, Shield, Info } from 'lucide-react';
import { AgentSettings } from '../types/index';

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<AgentSettings>({
    modelName: 'DouBao-1.6',
    temperature: 0.7,
    maxTokens: 2048,
    retrievalTopK: 5,
    useGraphRAG: true
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    
    setSettings({ ...settings, [e.target.name]: value });
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto animate-fade-in w-full">
      <div className="mb-10 flex justify-between items-end border-b border-white/5 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-white tracking-tight">系统配置</h2>
           <p className="text-zinc-400 mt-1 text-sm">管理 AI 智能体参数、RAG 策略及 API 密钥</p>
        </div>
        <div className="flex gap-3">
             <button className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-sm font-medium">
                <RefreshCw size={16} /> 重置
              </button>
              <button className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors text-sm font-bold tracking-wide">
                <Save size={16} /> 保存更改
              </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-8">
            {/* LLM Section */}
            <div className="glass-panel rounded-xl border border-white/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-violet-600/20 rounded-lg text-violet-400"><Cpu size={20} /></div>
                模型配置
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">模型选择</label>
                  <div className="relative">
                      <select 
                        name="modelName"
                        value={settings.modelName}
                        onChange={handleChange}
                        className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-zinc-200 focus:border-violet-500/50 outline-none appearance-none cursor-pointer hover:bg-black/60 transition-colors"
                      >
                        <option value="DouBao-1.6">Gemini 2.5 Flash (推荐 - 低延迟)</option>
                        <option value="gemini-3-pro-preview">Gemini 3.0 Pro Preview (高推理能力)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2">Flash 模型适用于实时审计查询，响应速度更快。</p>
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">温度 (创造性)</label>
                    <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">{settings.temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    name="temperature"
                    min="0" max="1" step="0.1"
                    value={settings.temperature}
                    onChange={handleChange}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-medium uppercase tracking-wide">
                    <span>确定性</span>
                    <span>平衡</span>
                    <span>发散性</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RAG Section */}
            <div className="glass-panel rounded-xl border border-white/5 p-6 md:p-8">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400"><Database size={20} /></div>
                检索增强生成 (RAG)
              </h3>
              
              <div className="space-y-6 divide-y divide-white/5">
                <div className="flex items-center justify-between pt-2">
                   <div>
                     <span className="font-bold text-zinc-200 block text-sm">Top-K 检索量</span>
                     <span className="text-xs text-zinc-500">每次查询检索的文档切片数量。数值越高上下文越丰富，但可能引入噪音。</span>
                   </div>
                   <input 
                    type="number"
                    name="retrievalTopK"
                    value={settings.retrievalTopK}
                    onChange={handleChange}
                    className="w-20 p-2 bg-black/40 border border-white/10 rounded-lg text-sm text-center text-white focus:border-emerald-500/50 outline-none"
                   />
                </div>
                
                <div className="flex items-center justify-between pt-6">
                   <div className="flex items-start gap-4">
                     <div className={`mt-1 p-1.5 rounded-full ${settings.useGraphRAG ? 'bg-indigo-500/20 text-indigo-400' : 'bg-zinc-800 text-zinc-600'}`}>
                        <Network size={18} />
                     </div>
                     <div>
                       <span className="font-bold text-zinc-200 block text-sm">启用 GraphRAG</span>
                       <span className="text-xs text-zinc-500 max-w-sm block mt-1">
                         利用 Neo4j 知识图谱增强向量检索。这将遍历控制项、风险和证据之间的图谱关系。
                       </span>
                     </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="useGraphRAG"
                      checked={settings.useGraphRAG}
                      onChange={(e) => setSettings({...settings, useGraphRAG: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-6 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-900 peer-checked:after:bg-indigo-400 peer-checked:after:shadow-[0_0_10px_rgba(129,140,248,0.5)] shadow-inner"></div>
                  </label>
                </div>
              </div>
            </div>
        </div>

        {/* Right Col */}
        <div className="space-y-8">
            <div className="glass-panel rounded-xl border border-white/5 p-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={14} /> 连接状态
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                        <span className="text-sm text-zinc-300">Neo4j 数据库</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]"></div>
                            已连接
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                        <span className="text-sm text-zinc-300">向量知识库</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]"></div>
                            在线
                        </div>
                    </div>
                     <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                        <span className="text-sm text-zinc-300">Google Gemini API</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]"></div>
                            活跃
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-xl border border-white/5 p-6 bg-gradient-to-br from-violet-900/10 to-transparent">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={14} /> 关于系统
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                    AuditGraph AI v2.0.4<br/>
                    Build: 2024.10.15-RELEASE
                </p>
                <button className="w-full py-2 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded-lg transition-colors border border-white/5">
                    查看系统日志
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;