import React, { useEffect, useState } from 'react';
import { fetchRisks } from '../services/auditService';
import { RiskItem } from '../types/index';
import { ShieldAlert, AlertTriangle, MoreHorizontal, Filter, Plus, ArrowUpDown, Search, SlidersHorizontal, Loader2 } from 'lucide-react';

const RiskRegister: React.FC = () => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRisks = async () => {
      try {
        setLoading(true);
        const data = await fetchRisks();
        setRisks(data);
      } catch (error) {
        console.error("Failed to fetch risks", error);
      } finally {
        setLoading(false);
      }
    };
    loadRisks();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p>Loading Risks...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in max-w-[1600px] mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">风险登记簿</h2>
          <p className="text-zinc-400 mt-1 text-sm">活跃威胁面与整改追踪</p>
        </div>
        <div className="flex gap-3">
          <div className="relative group">
             <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400" />
             <input 
                type="text" 
                placeholder="搜索 CVE 编号或关键词..." 
                className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 w-64 text-zinc-200 placeholder:text-zinc-600 transition-all"
             />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 hover:bg-white/10 font-medium transition-colors">
            <SlidersHorizontal size={16} /> 筛选
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors text-sm font-bold tracking-wide">
            <Plus size={16} />
            新增风险
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden border border-white/10 flex-1 flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-zinc-900/90 backdrop-blur sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider w-24">编号</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">风险描述</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">安全领域</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-300">严重程度 <ArrowUpDown size={10} /></div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">负责人</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {risks.map((risk) => (
                <tr key={risk.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-1 rounded border border-violet-500/20">
                      {risk.id}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-zinc-200 text-sm group-hover:text-white transition-colors">{risk.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5 truncate max-w-md font-mono">{risk.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">
                     <span className="inline-flex items-center px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-[10px] uppercase tracking-wide">
                       {risk.category === 'Access Control' ? '访问控制' : 
                        risk.category === 'Business Continuity' ? '业务连续性' :
                        risk.category === 'Encryption' ? '加密安全' :
                        risk.category === 'Supplier Relationships' ? '供应商管理' : risk.category}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      risk.severity === 'High' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                      risk.severity === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                         risk.severity === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                         risk.severity === 'Medium' ? 'bg-amber-500' :
                         'bg-blue-500'
                      }`}></span>
                      {risk.severity === 'High' ? '高危' : risk.severity === 'Medium' ? '中危' : '低危'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400 flex items-center gap-2">
                     <div className="w-5 h-5 rounded bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                        {risk.owner.charAt(0)}
                     </div>
                     {risk.owner === 'IT Security' ? '信息安全部' : 
                      risk.owner === 'DevOps' ? '运维开发' :
                      risk.owner === 'App Support' ? '应用支持' :
                      risk.owner === 'Procurement' ? '采购部' : risk.owner}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`text-xs font-bold uppercase tracking-wider ${
                        risk.status === 'Open' ? 'text-rose-400' : 
                        risk.status === 'Mitigated' ? 'text-blue-400' :
                        'text-emerald-400'
                     }`}>
                       {risk.status === 'Open' ? '未解决' : risk.status === 'Mitigated' ? '已缓解' : '已关闭'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/10 rounded transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskRegister;
