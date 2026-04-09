import React, { useEffect, useState } from 'react';
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { AlertTriangle, ShieldCheck, Database, Zap, ArrowUpRight, ArrowRight, Activity, Globe, X, Clock, User, Tag, AlertCircle, Loader, Sparkles, Save } from 'lucide-react';
import { fetchDashboardStats, fetchRisks, exportLogs, startFullAudit, getAuditStatus, remediateRisk, markFalsePositive, generateRemediationSuggestion, saveRemediationSuggestion } from '../services/auditService';
import { AuditStat, RiskItem } from '../types/index';
import { useToast } from './Toast';

const BentoCard: React.FC<{ children: React.ReactNode; className?: string; title?: string; icon?: any }> = ({ children, className = '', title, icon: Icon }) => (
  <div className={`glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-violet-200 transition-colors ${className}`}>
    {title && (
      <div className="flex items-center justify-between mb-4 z-10">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} className="text-zinc-500 group-hover:text-violet-400 transition-colors" />}
          <h3 className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">{title}</h3>
        </div>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
          <div className="w-1 h-1 rounded-full bg-zinc-300"></div>
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
    <div className="text-2xl font-bold text-zinc-900 tracking-tight mb-1">{value}</div>
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
  const { showToast } = useToast();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [complianceStats, setComplianceStats] = useState<AuditStat[]>([]);
  const [riskStats, setRiskStats] = useState<AuditStat[]>([]);
  const [recentRisks, setRecentRisks] = useState<RiskItem[]>([]);
  const [selectedRisk, setSelectedRisk] = useState<RiskItem | null>(null);
  const [suggestion, setSuggestion] = useState<string>('');
  const [summary, setSummary] = useState<{ total_nodes: number; total_documents: number }>({ total_nodes: 0, total_documents: 0 });
  const [loading, setLoading] = useState(true);
  
  // Audit Status State
  const [auditState, setAuditState] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    progress: number;
    current_step: string;
    logs: string[];
  }>({ status: 'idle', progress: 0, current_step: '', logs: [] });

  useEffect(() => {
    if (selectedRisk) {
      setSuggestion(selectedRisk.remediation_suggestion || '');
    }
  }, [selectedRisk]);

  const loadData = async () => {
    try {
      // setLoading(true); // Don't set loading on refresh to avoid flickering
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

  useEffect(() => {
    setLoading(true);
    loadData();
  }, []);

  // Polling for audit status
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (auditState.status === 'running') {
      interval = setInterval(async () => {
        const status = await getAuditStatus();
        setAuditState(prev => ({ ...prev, ...status }));
        
        if (status.status === 'completed' || status.status === 'error') {
          clearInterval(interval);
          if (status.status === 'completed') {
            loadData(); // Refresh stats on completion
          }
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [auditState.status]);

  const handleExportLogs = async () => {
    try {
      // 直接调用服务，服务内处理下载逻辑
      await exportLogs();
    } catch (e) {
      showToast("日志导出失败", 'error');
    }
  };

  const handleStartAudit = async () => {
    const res = await startFullAudit();
    if (res.status === 'started' || res.status === 'running') {
      setAuditState(prev => ({ ...prev, status: 'running', progress: 0, logs: [], current_step: 'Starting...' }));
    } else {
      showToast(`无法启动审计: ${res.message}`, 'error');
    }
  };

  const closeAuditModal = () => {
    setAuditState(prev => ({ ...prev, status: 'idle' }));
  };

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
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">系统状态看板</h2>
          <div className="flex items-center gap-2 mt-2 text-zinc-400 text-sm">
             <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
             <span>实时监控运行中</span>
             <span className="text-zinc-600">|</span>
             <span className="font-mono text-xs">延迟: 24ms</span>
          </div>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExportLogs}
            className="px-4 py-2 bg-white hover:bg-zinc-100 text-zinc-700 rounded-lg text-xs font-medium border border-zinc-200 transition-colors"
          >
            导出日志
          </button>
          <button 
            onClick={handleStartAudit}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-xs font-bold tracking-wide shadow-[0_0_15px_rgba(124,58,237,0.4)] transition-all"
          >
            启动全量审计
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 h-auto">
        
        {/* Row 1 */}
        {/* Main Compliance Score */}
        <BentoCard className="lg:col-span-1 h-96 relative" title="整体合规率" icon={ShieldCheck}>
           <div className="flex flex-col h-full">
              {/* Chart Area - Fixed height to avoid overlap */}
              <div className="flex-1 relative min-h-[200px]">
                <div className="absolute inset-0 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={complianceStats}
                          cx="50%"
                          cy="50%"
                          innerRadius={70}
                          outerRadius={85}
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
                    <div className="absolute flex flex-col items-center pointer-events-none">
                      <span className="text-4xl font-bold text-zinc-900">{complianceRate}%</span>
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">就绪度</span>
                    </div>
                </div>
              </div>
              
              {/* Stats Area - Bottom aligned */}
              <div className="mt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-emerald-500 font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        已合规
                      </span>
                      <span className="text-zinc-400">{totalComplianceCount > 0 ? Math.round((closedCount / totalComplianceCount) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-1 rounded-full transition-all duration-500" style={{width: `${totalComplianceCount > 0 ? (closedCount / totalComplianceCount) * 100 : 0}%`}}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] mb-1.5">
                      <span className="text-rose-500 font-medium flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                        不合规
                      </span>
                      <span className="text-zinc-400">{totalComplianceCount > 0 ? Math.round((openCount / totalComplianceCount) * 100) : 0}%</span>
                    </div>
                    <div className="w-full bg-zinc-200 h-1 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-1 rounded-full transition-all duration-500" style={{width: `${totalComplianceCount > 0 ? (openCount / totalComplianceCount) * 100 : 0}%`}}></div>
                    </div>
                  </div>
              </div>
           </div>
        </BentoCard>

        {/* Risk Metrics */}
        <BentoCard className="lg:col-span-1 h-96" title="风险分析" icon={AlertTriangle}>
           <div className="flex flex-col h-full">
               <div className="flex gap-4 mb-6 justify-between">
                  <StatDisplay label="高危风险" value={highRiskCount.toString()} trend="-" trendUp={false} color="rose" />
                  <StatDisplay label="待审核" value={mitigatedCount.toString()} trend="-" trendUp={true} color="emerald" />
                  <StatDisplay label="风险速率" value="低" color="blue" />
               </div>
               <div className="flex-1 w-full min-h-0">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={riskStats} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                     <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} />
                     <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}}
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e4e4e7', borderRadius: '8px', color: '#18181b' }}
                     />
                     <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                       {riskStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                     </Bar>
                   </BarChart>
                 </ResponsiveContainer>
               </div>
           </div>
        </BentoCard>

        {/* Stats Column */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-96">
            {/* Knowledge Graph Stats */}
            <BentoCard className="flex-1" title="知识图谱" icon={Globe}>
               <div className="flex items-end justify-between h-full pb-2">
                  <div>
                     <div className="text-4xl font-bold text-zinc-900">{summary.total_nodes.toLocaleString()}</div>
                     <div className="text-xs text-zinc-500 mt-1">关联节点</div>
                  </div>
                  <div className="flex gap-2 mb-1">
                      <span className="px-2 py-1 rounded bg-violet-500/10 text-violet-400 text-[10px] font-mono border border-violet-500/20">ISO 27001</span>
                      <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-mono border border-blue-500/20">SOC2</span>
                   </div>
               </div>
            </BentoCard>

            {/* RAG Docs Stats */}
            <BentoCard className="flex-1" title="向量索引" icon={Database}>
                <div className="flex flex-col justify-between h-full pb-2">
                    <div className="flex items-end justify-between">
                      <div>
                         <div className="text-4xl font-bold text-zinc-900">{summary.total_documents.toLocaleString()}</div>
                         <div className="text-xs text-zinc-500 mt-1">文档数量</div>
                      </div>
                      <Zap className="text-amber-500 mb-2" size={24} />
                   </div>
                   <div>
                       <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-amber-500 h-full w-[85%] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                       </div>
                       <div className="mt-2 text-[10px] text-right text-zinc-500">索引健康</div>
                   </div>
               </div>
            </BentoCard>
        </div>

        {/* Row 2: Recent Activity Feed */}
        <BentoCard className="lg:col-span-3 h-[400px]" title="实时安全监测" icon={Activity}>
           <div className="overflow-y-auto pr-2 custom-scrollbar -mr-2 h-full">
             <table className="w-full text-left border-collapse">
               <thead className="text-[10px] uppercase text-zinc-500 font-bold sticky top-0 bg-white z-10 border-b border-zinc-200">
                 <tr>
                   <th className="pb-4 pl-2 font-medium tracking-wider">时间戳</th>
                   <th className="pb-4 font-medium tracking-wider">事件 ID</th>
                   <th className="pb-4 font-medium tracking-wider">描述</th>
                   <th className="pb-4 font-medium tracking-wider">等级</th>
                   <th className="pb-4 pr-2 text-right font-medium tracking-wider">操作</th>
                 </tr>
               </thead>
               <tbody className="text-xs font-mono">
                 {recentRisks.map((risk) => (
                   <tr key={risk.id} className="border-b border-zinc-100 hover:bg-zinc-50 transition-colors group">
                     <td className="py-4 pl-2 text-zinc-500">{new Date(risk.dateIdentified || Date.now()).toLocaleTimeString()}</td>
                     <td className="py-4 text-violet-400">{risk.id}</td>
                     <td className="py-4 text-zinc-700 font-sans font-medium">{risk.title}</td>
                     <td className="py-4">
                       <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide border ${
                         risk.severity === 'High' ? 'border-rose-500/20 text-rose-400 bg-rose-500/5' :
                         risk.severity === 'Medium' ? 'border-amber-500/20 text-amber-400 bg-amber-500/5' :
                         'border-blue-500/20 text-blue-400 bg-blue-500/5'
                       }`}>
                         {risk.severity === 'High' ? '高危' : risk.severity === 'Medium' ? '中危' : '低危'}
                       </span>
                     </td>
                     <td className="py-4 pr-2 text-right">
                      <button 
                        onClick={() => setSelectedRisk(risk)}
                        className="text-zinc-500 hover:text-zinc-900 p-2 hover:bg-zinc-100 rounded-lg transition-colors group-hover:text-violet-500"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
       </BentoCard>
     </div>

     {/* Risk Detail Modal */}
     {selectedRisk && (
        <div className="fixed inset-0 bg-zinc-900/35 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="p-6 border-b border-zinc-200 flex justify-between items-start bg-zinc-50">
              <div className="flex gap-4">
                <div className={`p-3 rounded-xl ${
                  selectedRisk.severity === 'High' ? 'bg-rose-500/10 text-rose-500' :
                  selectedRisk.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                  'bg-blue-500/10 text-blue-500'
                }`}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">{selectedRisk.id}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded border ${
                      selectedRisk.severity === 'High' ? 'border-rose-500/30 text-rose-400 bg-rose-500/10' :
                      selectedRisk.severity === 'Medium' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                      'border-blue-500/30 text-blue-400 bg-blue-500/10'
                    }`}>
                      {selectedRisk.severity === 'High' ? '高危' : selectedRisk.severity === 'Medium' ? '中危' : '低危'}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded border border-zinc-200 text-zinc-500 bg-zinc-100">
                      {selectedRisk.status}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">{selectedRisk.title}</h3>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRisk(null)}
                className="text-zinc-500 hover:text-zinc-900 transition-colors p-2 hover:bg-zinc-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              
              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Tag size={12}/> 风险类别</div>
                  <div className="text-sm text-zinc-700">{selectedRisk.category || '未分类'}</div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><User size={12}/> 责任人</div>
                  <div className="text-sm text-zinc-700">{selectedRisk.owner || '未分配'}</div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Clock size={12}/> 发现时间</div>
                  <div className="text-sm text-zinc-700">{selectedRisk.dateIdentified || '未知'}</div>
                </div>
                <div className="bg-zinc-50 rounded-lg p-3 border border-zinc-200">
                  <div className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><Activity size={12}/> 影响范围</div>
                  <div className="text-sm text-zinc-700">系统全局</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">风险描述</h4>
                <div className="bg-zinc-50 rounded-xl p-4 text-zinc-700 text-sm leading-relaxed border border-zinc-200">
                  {selectedRisk.description}
                </div>
              </div>

              {/* Remediation Plan */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">修复建议方案</h4>
                  <div className="flex gap-2">
                     {selectedRisk.remediation_source && (
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${
                            selectedRisk.remediation_source === 'AI' 
                            ? 'border-violet-500/30 text-violet-400 bg-violet-500/10'
                            : 'border-zinc-500/30 text-zinc-400 bg-zinc-500/10'
                        }`}>
                            {selectedRisk.remediation_source === 'AI' ? 'AI 生成' : '人工编辑'}
                        </span>
                     )}
                  </div>
                </div>
                
                <div className="relative">
                    <textarea 
                        value={suggestion}
                        onChange={(e) => setSuggestion(e.target.value)}
                        placeholder="在此输入修复建议，或点击 AI 生成..."
                        className="w-full h-40 bg-white border border-zinc-200 rounded-xl p-4 text-sm text-zinc-700 focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 outline-none resize-none custom-scrollbar leading-relaxed"
                    />
                    
                    <div className="absolute bottom-3 right-3 flex gap-2">
                        <button
                            disabled={!!actionLoading}
                            onClick={async () => {
                                setActionLoading('generate-ai');
                                try {
                                    const updatedRisk = await generateRemediationSuggestion(selectedRisk.id);
                                    // Update selectedRisk with the full updated object from backend
                                    // This ensures useEffect sees the new suggestion and doesn't overwrite it
                                    setSelectedRisk(updatedRisk);
                                    setSuggestion(updatedRisk.remediation_suggestion || '');
                                    showToast("AI 建议已生成", 'success');
                                } catch (e) {
                                    console.error(e);
                                    showToast("生成失败，请检查日志", 'error');
                                } finally {
                                    setActionLoading(null);
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 rounded-lg text-xs font-bold border border-violet-500/20 transition-all disabled:opacity-50"
                        >
                            {actionLoading === 'generate-ai' ? <Loader size={12} className="animate-spin" /> : <Sparkles size={12} />}
                            AI 生成
                        </button>
                        
                        <button
                            disabled={!!actionLoading}
                            onClick={async () => {
                                setActionLoading('save-suggestion');
                                try {
                                    await saveRemediationSuggestion(selectedRisk.id, suggestion);
                                    setSelectedRisk(prev => prev ? {...prev, remediation_suggestion: suggestion, remediation_source: 'Manual'} : null);
                                    showToast("修复建议已保存", 'success');
                                    loadData(); // Update global list if needed
                                } catch (e) {
                                    console.error(e);
                                    showToast("保存失败", 'error');
                                } finally {
                                    setActionLoading(null);
                                }
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-bold border border-zinc-200 transition-all disabled:opacity-50"
                        >
                            {actionLoading === 'save-suggestion' ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
                            保存
                        </button>
                    </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  disabled={!!actionLoading}
                  onClick={async () => {
                    setActionLoading('remediate');
                    try {
                      await remediateRisk(selectedRisk.id);
                      setSelectedRisk(null);
                      loadData();
                    } catch (e) {
                      console.error(e);
                      showToast("操作失败，请检查控制台日志", 'error');
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                  className="flex-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2.5 rounded-lg font-medium text-sm transition-colors shadow-lg shadow-violet-900/20 flex items-center justify-center"
                >
                  {actionLoading === 'remediate' && <Loader className="animate-spin mr-2" size={16}/>}
                  开始修复流程
                </button>
                <button 
                  disabled={!!actionLoading}
                  onClick={async () => {
                    setActionLoading('false-positive');
                    try {
                      await markFalsePositive(selectedRisk.id);
                      showToast("已标记为误报", 'success');
                      setSelectedRisk(null);
                      loadData();
                    } catch (e) {
                      showToast("操作失败，请检查控制台日志", 'error');
                    } finally {
                      setActionLoading(null);
                    }
                  }}
                  className="flex-1 bg-white hover:bg-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-700 py-2.5 rounded-lg font-medium text-sm transition-colors border border-zinc-200 flex items-center justify-center"
                >
                  {actionLoading === 'false-positive' && <Loader className="animate-spin mr-2" size={16}/>}
                  标记为误报
                </button>
              </div>

            </div>
          </div>
        </div>
     )}

     {/* Audit Progress Modal */}
      {(auditState.status === 'running' || auditState.status === 'completed' || auditState.status === 'error') && (
        <div className="fixed inset-0 bg-zinc-900/35 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden">
            
            {/* Background Glow */}
            <div className={`absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none transition-colors duration-500
              ${auditState.status === 'running' ? 'bg-violet-600' : 
                auditState.status === 'completed' ? 'bg-emerald-600' : 'bg-rose-600'}`} 
            />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-3">
                {auditState.status === 'running' && (
                  <>
                    <div className="relative">
                      <div className="w-3 h-3 bg-violet-500 rounded-full animate-pulse"></div>
                      <div className="absolute inset-0 w-3 h-3 bg-violet-500 rounded-full animate-ping opacity-50"></div>
                    </div>
                    <span>全量审计执行中...</span>
                  </>
                )}
                {auditState.status === 'completed' && (
                  <>
                    <ShieldCheck className="text-emerald-500" size={24} />
                    <span>审计完成</span>
                  </>
                )}
                {auditState.status === 'error' && (
                  <>
                    <AlertTriangle className="text-rose-500" size={24} />
                    <span>审计失败</span>
                  </>
                )}
              </h3>
              {auditState.status !== 'running' && (
                <button 
                  onClick={closeAuditModal}
                  className="p-1 hover:bg-zinc-100 rounded-full transition-colors text-zinc-500 hover:text-zinc-900"
                >
                  <ArrowRight size={20} />
                </button>
              )}
            </div>
            
            {/* Progress Bar */}
            <div className="mb-2 flex justify-between text-sm text-zinc-400 relative z-10">
              <span className="truncate pr-4">{auditState.current_step}</span>
              <span className="font-mono">{Math.round(auditState.progress)}%</span>
            </div>
            <div className="w-full bg-zinc-200 h-2 rounded-full mb-6 overflow-hidden relative z-10">
              <div 
                className={`h-full rounded-full transition-all duration-300 ease-out 
                  ${auditState.status === 'completed' ? 'bg-emerald-500' : 
                    auditState.status === 'error' ? 'bg-rose-500' : 'bg-violet-600'}`}
                style={{ width: `${auditState.progress}%` }}
              ></div>
            </div>
            
            {/* Logs Window */}
            <div className="h-48 overflow-y-auto bg-zinc-50 rounded-lg p-4 font-mono text-xs text-zinc-500 custom-scrollbar border border-zinc-200 relative z-10">
              {auditState.logs.length === 0 ? (
                <div className="text-zinc-600 italic">等待日志流...</div>
              ) : (
                auditState.logs.map((log: string, i: number) => (
                  <div key={i} className="mb-1 last:mb-0 break-all animate-in fade-in slide-in-from-bottom-1 duration-300">
                    <span className="text-zinc-600 mr-2">{log.substring(1, 9)}</span>
                    <span className={log.includes('ERROR') ? 'text-rose-500' : 'text-zinc-700'}>
                      {log.substring(11)}
                    </span>
                  </div>
                ))
              )}
              {/* Auto scroll anchor */}
              <div ref={(el) => el?.scrollIntoView({ behavior: 'smooth' })} />
            </div>

            {/* Actions */}
            {auditState.status === 'completed' && (
               <div className="mt-6 flex justify-end relative z-10">
                 <button 
                   onClick={closeAuditModal}
                   className="px-6 py-2 bg-white text-black font-bold rounded-lg hover:bg-zinc-200 transition-colors"
                 >
                   查看结果
                 </button>
               </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
