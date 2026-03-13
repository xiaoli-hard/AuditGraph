import React, { useEffect, useMemo, useState } from 'react';
import { createRisk, fetchRisks, markFalsePositive, remediateRisk } from '../services/auditService';
import { RiskItem } from '../types/index';
import { MoreHorizontal, Plus, ArrowUpDown, Search, SlidersHorizontal, Loader } from 'lucide-react';
import { useToast } from './Toast';

const RiskRegister: React.FC = () => {
  const { showToast } = useToast();
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [severityFilter, setSeverityFilter] = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | RiskItem['status']>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortDirection, setSortDirection] = useState<'none' | 'asc' | 'desc'>('none');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newRisk, setNewRisk] = useState({
    title: '',
    description: '',
    severity: 'Medium' as RiskItem['severity'],
    category: '',
    owner: ''
  });

  const categories = useMemo(() => {
    const unique = new Set<string>();
    risks.forEach((risk) => {
      if (risk.category) unique.add(risk.category);
    });
    return Array.from(unique);
  }, [risks]);

  const filteredRisks = useMemo(() => risks, [risks]);

  const handleToggleSort = () => {
    setSortDirection((prev) => (prev === 'none' ? 'desc' : prev === 'desc' ? 'asc' : 'none'));
  };

  const loadRisks = async (params?: {
    search?: string;
    severity?: string;
    status?: string;
    category?: string;
    sort?: string;
  }) => {
    try {
      setLoading(true);
      const data = await fetchRisks(params);
      setRisks(data);
    } catch (error) {
      console.error("Failed to fetch risks", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRisks();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadRisks({
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        severity: severityFilter === 'All' ? undefined : severityFilter,
        status: statusFilter === 'All' ? undefined : statusFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        sort: sortDirection === 'none' ? undefined : sortDirection === 'asc' ? 'severity_asc' : 'severity_desc'
      });
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery, severityFilter, statusFilter, categoryFilter, sortDirection]);

  const handleCreateRisk = async () => {
    if (!newRisk.title.trim() || !newRisk.description.trim()) {
      showToast('请填写风险标题与描述', 'error');
      return;
    }
    try {
      await createRisk({
        title: newRisk.title.trim(),
        description: newRisk.description.trim(),
        severity: newRisk.severity,
        category: newRisk.category || undefined,
        owner: newRisk.owner || undefined
      });
      await loadRisks({
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        severity: severityFilter === 'All' ? undefined : severityFilter,
        status: statusFilter === 'All' ? undefined : statusFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        sort: sortDirection === 'none' ? undefined : sortDirection === 'asc' ? 'severity_asc' : 'severity_desc'
      });
      setShowCreateModal(false);
      setNewRisk({ title: '', description: '', severity: 'Medium', category: '', owner: '' });
      showToast('风险已新增', 'success');
    } catch (error) {
      console.error(error);
      showToast('新增风险失败，请检查后端接口', 'error');
    }
  };

  const handleRemediate = async (riskId: string) => {
    try {
      await remediateRisk(riskId);
      await loadRisks({
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        severity: severityFilter === 'All' ? undefined : severityFilter,
        status: statusFilter === 'All' ? undefined : statusFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        sort: sortDirection === 'none' ? undefined : sortDirection === 'asc' ? 'severity_asc' : 'severity_desc'
      });
      showToast('已启动修复流程', 'success');
    } catch (error) {
      console.error(error);
      showToast('操作失败，请检查后端接口', 'error');
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleFalsePositive = async (riskId: string) => {
    try {
      await markFalsePositive(riskId);
      await loadRisks({
        search: searchQuery.trim() ? searchQuery.trim() : undefined,
        severity: severityFilter === 'All' ? undefined : severityFilter,
        status: statusFilter === 'All' ? undefined : statusFilter,
        category: categoryFilter === 'All' ? undefined : categoryFilter,
        sort: sortDirection === 'none' ? undefined : sortDirection === 'asc' ? 'severity_asc' : 'severity_desc'
      });
      showToast('已标记为误报', 'success');
    } catch (error) {
      console.error(error);
      showToast('操作失败，请检查后端接口', 'error');
    } finally {
      setOpenMenuId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Loader className="w-8 h-8 animate-spin mb-2" />
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 w-64 text-zinc-200 placeholder:text-zinc-600 transition-all"
             />
          </div>
          <div className="relative">
            <button onClick={() => setShowFilters((prev) => !prev)} className="flex items-center gap-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-300 hover:bg-white/10 font-medium transition-colors">
            <SlidersHorizontal size={16} /> 筛选
          </button>
            {showFilters && (
              <div className="absolute right-0 mt-2 w-56 glass-panel rounded-xl border border-white/10 p-3 z-20">
                <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">严重程度</div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {(['All', 'High', 'Medium', 'Low'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => setSeverityFilter(level)}
                      className={`px-2 py-1 text-[10px] rounded border ${severityFilter === level ? 'border-violet-500/60 text-violet-300 bg-violet-500/10' : 'border-white/10 text-zinc-400 hover:text-zinc-200'}`}
                    >
                      {level === 'All' ? '全部' : level === 'High' ? '高危' : level === 'Medium' ? '中危' : '低危'}
                    </button>
                  ))}
                </div>
                <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">状态</div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as RiskItem['status'] | 'All')}
                  className="w-full mb-3 bg-black/40 border border-white/10 rounded-lg text-xs text-zinc-200 px-2 py-2 focus:outline-none focus:border-violet-500/50"
                >
                  <option value="All">全部</option>
                  <option value="Open">未解决</option>
                  <option value="Remediation In Progress">修复中</option>
                  <option value="Mitigated">已缓解</option>
                  <option value="Closed">已关闭</option>
                  <option value="False Positive">误报</option>
                </select>
                <div className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-2">安全领域</div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg text-xs text-zinc-200 px-2 py-2 focus:outline-none focus:border-violet-500/50"
                >
                  <option value="All">全部</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors text-sm font-bold tracking-wide">
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
                  <div onClick={handleToggleSort} className="flex items-center gap-1 cursor-pointer hover:text-zinc-300">
                    严重程度 <ArrowUpDown size={10} />
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">负责人</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-4 text-[10px] font-bold text-zinc-500 uppercase tracking-wider text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredRisks.map((risk) => (
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
                        {(risk.owner || '?').charAt(0)}
                     </div>
                     {risk.owner === 'IT Security' ? '信息安全部' : 
                      risk.owner === 'DevOps' ? '运维开发' :
                      risk.owner === 'App Support' ? '应用支持' :
                      risk.owner === 'Procurement' ? '采购部' : (risk.owner || '未分配')}
                  </td>
                  <td className="px-6 py-4">
                     <span className={`text-xs font-bold uppercase tracking-wider ${
                        risk.status === 'Open' ? 'text-rose-400' : 
                        risk.status === 'Mitigated' ? 'text-blue-400' :
                        risk.status === 'Remediation In Progress' ? 'text-violet-400' :
                        risk.status === 'False Positive' ? 'text-zinc-500' :
                        'text-emerald-400'
                     }`}>
                       {risk.status === 'Remediation In Progress' ? '修复中' : 
                        risk.status === 'False Positive' ? '误报' : 
                        risk.status === 'Open' ? '未解决' :
                        risk.status === 'Mitigated' ? '已缓解' : '已关闭'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="relative inline-flex">
                      <button onClick={() => setOpenMenuId((prev) => prev === risk.id ? null : risk.id)} className="p-1.5 text-zinc-600 hover:text-white hover:bg-white/10 rounded transition-colors">
                        <MoreHorizontal size={16} />
                      </button>
                      {openMenuId === risk.id && (
                        <div className="absolute right-0 top-9 w-40 glass-panel rounded-lg border border-white/10 p-2 z-20">
                          <button onClick={() => handleRemediate(risk.id)} className="w-full text-left text-xs text-zinc-300 hover:text-white hover:bg-white/5 px-2 py-1 rounded">
                            启动修复流程
                          </button>
                          <button onClick={() => handleFalsePositive(risk.id)} className="w-full text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded">
                            标记为误报
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredRisks.length && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-zinc-500 text-sm">
                    未找到匹配的风险
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">新增风险</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white transition-colors">×</button>
            </div>
            <div className="space-y-3">
              <input
                value={newRisk.title}
                onChange={(e) => setNewRisk((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="风险标题"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50"
              />
              <textarea
                value={newRisk.description}
                onChange={(e) => setNewRisk((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="风险描述"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50 h-24 resize-none"
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={newRisk.severity}
                  onChange={(e) => setNewRisk((prev) => ({ ...prev, severity: e.target.value as RiskItem['severity'] }))}
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50"
                >
                  <option value="High">高危</option>
                  <option value="Medium">中危</option>
                  <option value="Low">低危</option>
                </select>
                <input
                  value={newRisk.category}
                  onChange={(e) => setNewRisk((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="安全领域（可选）"
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <input
                value={newRisk.owner}
                onChange={(e) => setNewRisk((prev) => ({ ...prev, owner: e.target.value }))}
                placeholder="负责人（可选）"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5">取消</button>
              <button onClick={handleCreateRisk} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500">确认新增</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiskRegister;
