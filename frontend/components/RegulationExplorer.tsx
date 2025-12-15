import React, { useState } from 'react';
import { MOCK_REGULATIONS } from '../data/constants';
import { Book, ChevronRight, ChevronDown, ExternalLink, ShieldCheck, FileText, AlertTriangle, Search, ChevronLeft } from 'lucide-react';

const RegulationExplorer: React.FC = () => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({'ISO-A.5': true, 'ISO-A.9': true});
  const [selectedId, setSelectedId] = useState<string>('A.9.1.1');

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({...prev, [id]: !prev[id]}));
  };

  return (
    <div className="p-6 lg:p-10 space-y-6 h-full flex flex-col animate-fade-in max-w-[1920px] mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">合规标准库</h2>
          <p className="text-zinc-400 mt-1 text-sm">ISO 27001 控制项与证据映射交互库</p>
        </div>
        <div className="relative group">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400" />
            <input 
            type="text" 
            placeholder="搜索控制项..." 
            className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 w-64 text-zinc-200 transition-all placeholder:text-zinc-600"
            />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left: Tree Navigation */}
        <div className="w-full lg:w-1/3 glass-panel rounded-xl flex flex-col overflow-hidden border border-white/5">
          <div className="p-4 bg-zinc-900/50 border-b border-white/5">
             <h3 className="font-bold text-zinc-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                <Book size={14} className="text-violet-500" /> ISO 27001:2013
             </h3>
          </div>
          <div className="overflow-y-auto flex-1 p-2 custom-scrollbar space-y-1">
            {MOCK_REGULATIONS.map((section) => (
              <div key={section.id} className="select-none">
                <button 
                  onClick={() => toggleExpand(section.id)}
                  className="w-full text-left flex items-center gap-2 p-2.5 hover:bg-white/5 rounded-lg text-sm font-medium text-zinc-300 transition-colors group"
                >
                  <span className="text-zinc-500 group-hover:text-zinc-300">
                    {expanded[section.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <span className="text-violet-400 font-mono text-xs">{section.code}</span>
                  <span className="truncate">{section.title}</span>
                </button>
                
                {expanded[section.id] && section.children && (
                  <div className="ml-4 pl-2 border-l border-white/10 space-y-1 mt-1 mb-2">
                    {section.children.map(child => (
                      <div 
                        key={child.id} 
                        onClick={() => setSelectedId(child.id)}
                        className={`p-2 pl-3 text-sm rounded-md cursor-pointer transition-all border border-transparent ${
                            selectedId === child.id 
                            ? 'bg-violet-600/10 text-violet-300 border-violet-500/20' 
                            : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                            <span className={`font-mono text-xs ${selectedId === child.id ? 'text-violet-400' : 'opacity-50'}`}>{child.code}</span>
                            <span className="truncate font-medium">{child.title}</span>
                        </div>
                      </div>
                    ))}
                    {section.children.length === 0 && (
                      <div className="p-2 text-xs text-zinc-600 italic ml-2">无子控制项</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detail View */}
        <div className="flex-1 glass-panel rounded-xl border border-white/5 p-8 overflow-y-auto custom-scrollbar relative">
          {/* Neon decorative line */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>

          <div className="flex items-start justify-between border-b border-white/5 pb-6 mb-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="px-3 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-xs font-mono font-bold shadow-[0_0_10px_rgba(139,92,246,0.2)]">A.9.1.1</span>
                <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider">控制域</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">访问控制策略 (Access Control Policy)</h3>
              <p className="text-zinc-400 text-lg leading-relaxed font-light">
                应基于业务和信息安全要求，建立、记录并审查访问控制策略。
              </p>
            </div>
            <button className="text-zinc-500 hover:text-white transition-colors p-2 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10">
              <ExternalLink size={20} />
            </button>
          </div>

          <div className="space-y-8">
            {/* Implementation Box */}
            <div className="bg-emerald-900/10 p-5 rounded-xl border border-emerald-500/20 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-2 text-sm uppercase tracking-wider">
                <ShieldCheck size={16} />
                实施指南
              </h4>
              <p className="text-emerald-100/70 text-sm leading-relaxed">
                资产所有者应根据其资产相关的安全风险水平，确定具体的访问控制规则、访问权限和限制。
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Evidence Column */}
                <div>
                    <h4 className="font-bold text-zinc-300 mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                        <FileText size={14} className="text-blue-400" /> 关联证据
                    </h4>
                    <div className="space-y-3">
                        <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 hover:border-blue-500/50 cursor-pointer transition-colors group">
                            <div className="text-sm font-medium text-zinc-300 group-hover:text-blue-400 transition-colors">Access_Policy_v3.pdf</div>
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-[10px] text-zinc-600 font-mono">ID: DOC-001</div>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">已验证</span>
                            </div>
                        </div>
                        <div className="bg-zinc-900/50 border border-white/5 rounded-lg p-3 hover:border-blue-500/50 cursor-pointer transition-colors group">
                            <div className="text-sm font-medium text-zinc-300 group-hover:text-blue-400 transition-colors">Jira_Access_Reviews.csv</div>
                            <div className="flex justify-between items-center mt-2">
                                <div className="text-[10px] text-zinc-600 font-mono">ID: DOC-084</div>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">已验证</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risks Column */}
                <div>
                    <h4 className="font-bold text-zinc-300 mb-4 flex items-center gap-2 text-xs uppercase tracking-wider">
                        <AlertTriangle size={14} className="text-rose-400" /> 关联风险
                    </h4>
                    <div className="bg-rose-900/10 border border-rose-500/20 rounded-lg p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <span className="text-xs font-mono text-rose-300/70">R-001</span>
                            <span className="text-[10px] font-bold bg-rose-500 text-white px-1.5 rounded shadow-[0_0_8px_rgba(244,63,94,0.4)]">高危</span>
                        </div>
                        <div className="text-sm font-medium text-rose-200">管理员账号缺少 MFA</div>
                        <div className="w-full bg-rose-950/50 h-1 rounded-full overflow-hidden mt-1">
                            <div className="bg-rose-500 h-full w-[80%]"></div>
                        </div>
                        <div className="text-[10px] text-rose-300/50 text-right">发生概率: 80%</div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegulationExplorer;