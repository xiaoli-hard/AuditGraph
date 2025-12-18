import React, { useEffect, useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle, ShieldCheck, Database, Zap, ArrowUpRight, ArrowRight, Activity, Globe } from 'lucide-react';
import { fetchDashboardStats, fetchRisks } from '../services/auditService';
import { AuditStat, RiskItem } from '../types/index';

const BentoCard: React.FC<{ children: React.ReactNode; className?: string; title?: string; icon?: any }> = ({ children, className = '', title, icon: Icon }) => (
  <div className={`glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-white/20 transition-colors ${className}`}>
    {title && (
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />}
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wide">{title}</h3>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
          <div className="w-1 h-1 rounded-full bg-zinc-700"></div>
        </div>
      </div>
    )}
    <div className="relative z-10 flex-1">{children}</div>
    {/* Decorative background glow */}
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-violet-600/5 rounded-full blur-3xl group-hover:bg-violet-600/10 transition-colors"></div>
  </div>
);

const StatDisplay: React.FC<{ label: string; value: string; trend?: string; trendUp?: boolean; color: string }> = ({ label, value, trend, trendUp, color }) => (
  <div>
    <div className="text-2xl font-bold text-white tracking-tight mb-1">{value}</div>
    <div className="flex items-center gap-2 text-xs">
      <span className="text-zinc-500">{label}</span>
      {trend && (
        <span className={`flex items-center ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trendUp ? '+' : ''}{trend}
          <ArrowUpRight size={10} className={trendUp ? '' : 'rotate-90'} />
        </span>
      )}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const [complianceStats, setComplianceStats] = useState<AuditStat[]>([]);
  const [riskStats, setRiskStats] = useState<AuditStat[]>([]);
  const [recentRisks, setRecentRisks] = useState<RiskItem[]>([]);
  const [summary, setSummary] = useState<{ total_nodes: number; total_documents: number }>({ total_nodes: 0, total_documents: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [stats, risks] = await Promise.all([
          fetchDashboardStats(),
          fetchRisks()
        ]);
        setComplianceStats(stats.compliance);
        setRiskStats(stats.risk_distribution);
        setSummary(stats.summary);
        setRecentRisks(risks);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Derived calculations
  const totalComplianceCount = complianceStats.reduce((acc, curr) => acc + curr.value, 0);
  const closedCount = complianceStats.find(s => s.name === '已合规')?.value || 0;
  const openCount = complianceStats.find(s => s.name === '不合规')?.value || 0;
  const complianceRate = totalComplianceCount > 0 ? Math.round((closedCount / totalComplianceCount) * 100) : 0;
  
  const highRiskCount = riskStats.find(r => r.name === '高危')?.value || 0;
  const mitigatedCount = complianceStats.find(s => s.name === '待审核')?.value || 0;

  if (loading) {
    return <div className="p-8 text-zinc-500">Loading Dashboard...</div>;
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">系统状态看板</h2>
          <div className="flex items-center gap-2 mt-2 text-zinc-400 text-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <span>实时监控运行中</span>
             <span className="text-zinc-600">|</span>
             <span className="font-mono text-xs">延迟: 24ms</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-lg text-xs font-medium border border-white/5 transition-colors">
            导出日志
          </button>
          <button className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all">
            启动全量审计
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:grid-rows-2 h-auto lg:h-[600px]">
        
        {/* Main Compliance Score - Large Square */}
        <BentoCard className="lg:col-span-1 lg:row-span-2 relative" title="整体合规率" icon={ShieldCheck}>
           <div className="absolute inset-0 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {complianceStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center">
                 <span className="text-4xl font-bold text-white">{complianceRate}%</span>
                 <span className="text-xs text-zinc-500 uppercase tracking-widest mt-1">就绪度</span>
              </div>
           </div>
           <div className="absolute bottom-6 left-6 right-6">
              <div className="flex justify-between text-xs mb-2">
                 <span className="text-emerald-500">已合规</span>
                 <span className="text-white">{totalComplianceCount > 0 ? Math.round((closedCount / totalComplianceCount) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-white/10 h-1 rounded-full mb-4">
                 <div className="bg-emerald-500 h-1 rounded-full" style={{width: `${totalComplianceCount > 0 ? (closedCount / totalComplianceCount) * 100 : 0}%`}}></div>
              </div>
              <div className="flex justify-between text-xs mb-2">
                 <span className="text-rose-500">不合规</span>
                 <span className="text-white">{totalComplianceCount > 0 ? Math.round((openCount / totalComplianceCount) * 100) : 0}%</span>
              </div>
               <div className="w-full bg-white/10 h-1 rounded-full">
                 <div className="bg-rose-500 h-1 rounded-full" style={{width: `${totalComplianceCount > 0 ? (openCount / totalComplianceCount) * 100 : 0}%`}}></div>
              </div>
           </div>
        </BentoCard>

        {/* Risk Metrics - Wide */}
        <BentoCard className="lg:col-span-2" title="风险分析" icon={AlertTriangle}>
           <div className="flex gap-8 mb-6">
              <StatDisplay label="高危风险" value={highRiskCount.toString()} trend="-" trendUp={false} color="rose" />
              <StatDisplay label="待审核" value={mitigatedCount.toString()} trend="-" trendUp={true} color="emerald" />
              <StatDisplay label="风险速率" value="低" color="blue" />
           </div>
           <div className="h-24 w-full mt-auto">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={riskStats}>
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                 <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                 />
                 <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                   {riskStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </BentoCard>

        {/* Knowledge Graph Stats - Small */}
        <BentoCard title="知识图谱" icon={Globe}>
           <div className="flex items-end justify-between">
              <div>
                 <div className="text-3xl font-bold text-white">{summary.total_nodes.toLocaleString()}</div>
                 <div className="text-xs text-zinc-500 mt-1">关联节点</div>
              </div>
              <Activity className="text-violet-500 mb-2" />
           </div>
           <div className="mt-4 flex gap-2">
              <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 text-[10px] font-mono border border-violet-500/20">ISO 27001</span>
              <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">SOC2</span>
           </div>
        </BentoCard>

        {/* RAG Docs Stats - Small */}
        <BentoCard title="向量索引" icon={Database}>
            <div className="flex items-end justify-between">
              <div>
                 <div className="text-3xl font-bold text-white">{summary.total_documents.toLocaleString()}</div>
                 <div className="text-xs text-zinc-500 mt-1">文档数量</div>
              </div>
              <Zap className="text-amber-500 mb-2" />
           </div>
           <div className="mt-4 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-amber-500 h-full w-[85%] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
           </div>
           <div className="mt-2 text-[10px] text-right text-zinc-500">索引健康</div>
        </BentoCard>

        {/* Recent Activity Feed - Wide Bottom */}
        <BentoCard className="lg:col-span-3 h-64" title="实时安全监测" icon={Activity}>
           <div className="overflow-y-auto pr-2 custom-scrollbar -mr-2">
             <table className="w-full text-left">
               <thead className="text-[10px] uppercase text-zinc-600 font-bold sticky top-0 bg-[#121215]">
                 <tr>
                   <th className="pb-2">时间戳</th>
                   <th className="pb-2">事件 ID</th>
                   <th className="pb-2">描述</th>
                   <th className="pb-2">等级</th>
                   <th className="pb-2 text-right">操作</th>
                 </tr>
               </thead>
               <tbody className="text-xs font-mono">
                 {recentRisks.map((risk) => (
                   <tr key={risk.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                     <td className="py-3 text-zinc-500">{new Date(risk.dateIdentified || Date.now()).toLocaleTimeString()}</td>
                     <td className="py-3 text-violet-400">{risk.id}</td>
                     <td className="py-3 text-zinc-300 font-sans">{risk.title}</td>
                     <td className="py-3">
                       <span className={`px-1.5 py-0.5 rounded border ${
                         risk.severity === 'High' ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' :
                         risk.severity === 'Medium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                         'border-blue-500/30 text-blue-400 bg-blue-500/10'
                       }`}>
                         {risk.severity === 'High' ? '高危' : risk.severity === 'Medium' ? '中危' : '低危'}
                       </span>
                     </td>
                     <td className="py-3 text-right">
                       <button className="text-zinc-500 hover:text-white"><ArrowRight size={14} /></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </BentoCard>

      </div>
    </div>
  );
};

export default Dashboard;
