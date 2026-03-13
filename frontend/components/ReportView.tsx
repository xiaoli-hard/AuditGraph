import React, { useState, useEffect } from 'react';
import { createReport, downloadReport, fetchReports } from '../services/auditService';
import { AuditReport } from '../types';
import { FileText, Download, Printer, Plus, Loader } from 'lucide-react';
import { useToast } from './Toast';

const ReportView: React.FC = () => {
  const { showToast } = useToast();
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [creating, setCreating] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customReport, setCustomReport] = useState({
    title: '',
    summary: '',
    findingsCount: 0
  });

  useEffect(() => {
    const loadData = async () => {
      const data = await fetchReports();
      setReports(data);
    };
    loadData();
  }, []);

  const handleCreateReport = async () => {
    try {
      setCreating(true);
      const report = await createReport();
      setReports((prev) => [report, ...prev]);
      showToast('已生成新报告', 'success');
    } catch (error) {
      console.error(error);
      showToast('生成报告失败，请检查后端接口', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleCustomReport = async () => {
    if (!customReport.title.trim()) {
      showToast('请填写报告标题', 'error');
      return;
    }
    try {
      setCreating(true);
      const report = await createReport({
        title: customReport.title.trim(),
        summary: customReport.summary.trim() || undefined,
        findingsCount: Number(customReport.findingsCount) || 0
      });
      setReports((prev) => [report, ...prev]);
      setShowCustomModal(false);
      setCustomReport({ title: '', summary: '', findingsCount: 0 });
      showToast('自定义报告已生成', 'success');
    } catch (error) {
      console.error(error);
      showToast('生成报告失败，请检查后端接口', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      await downloadReport(reportId);
      showToast('已开始下载', 'success');
    } catch (error) {
      console.error(error);
      showToast('下载失败，请检查后端接口', 'error');
    }
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 animate-fade-in max-w-[1920px] mx-auto w-full">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">审计报告</h2>
          <p className="text-zinc-400 mt-1 text-sm">自动化合规摘要与执行简报</p>
        </div>
        <button onClick={handleCreateReport} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all text-sm font-bold tracking-wide">
          {creating ? <Loader size={16} className="animate-spin" /> : <Plus size={16} />}
          {creating ? '生成中...' : '生成新报告'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="glass-panel rounded-xl p-6 flex flex-col border border-white/5 hover:border-violet-500/30 transition-all group relative overflow-hidden">
             {/* Top glow */}
             <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:via-violet-500/50 transition-all"></div>
             
             <div className="flex justify-between items-start mb-5">
               <div className="p-3 bg-zinc-900 rounded-lg text-zinc-500 border border-white/5 group-hover:text-violet-400 group-hover:border-violet-500/20 transition-colors">
                 <FileText size={24} />
               </div>
               <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                 report.status === 'Finalized' 
                 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                 : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
               }`}>
                 {report.status === 'Finalized' ? '已归档' : '草稿'}
               </span>
             </div>
             
             <h3 className="text-lg font-bold text-zinc-100 mb-2 leading-tight group-hover:text-white transition-colors">{report.title}</h3>
             <p className="text-xs text-zinc-500 mb-6 flex-1 leading-relaxed">{report.summary}</p>
             
             <div className="border-t border-white/5 pt-4 mt-auto">
               <div className="flex justify-between text-xs text-zinc-600 mb-4 font-mono">
                 <span>{report.date}</span>
                 <span className={report.findingsCount > 0 ? "text-rose-400" : "text-emerald-500"}>{report.findingsCount} 个发现项</span>
               </div>
               <div className="flex gap-2">
                  <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-2 border border-zinc-800 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                   <Printer size={14} /> 打印
                 </button>
                  <button onClick={() => handleDownloadReport(report.id)} className="flex-1 flex items-center justify-center gap-2 py-2 bg-violet-600/10 border border-violet-500/20 text-violet-300 rounded-lg text-xs font-bold hover:bg-violet-600 hover:text-white hover:border-violet-600 transition-all">
                   <Download size={14} /> PDF
                 </button>
               </div>
             </div>
          </div>
        ))}

        {/* Create New Placeholder */}
        <div onClick={() => setShowCustomModal(true)} className="border border-dashed border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-600/5 transition-all group min-h-[300px]">
           <div className="w-14 h-14 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 group-hover:scale-110 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-all shadow-lg">
             <Plus size={24} />
           </div>
           <h3 className="font-bold text-zinc-300 group-hover:text-white transition-colors">自定义报告</h3>
           <p className="text-xs text-zinc-600 mt-2 max-w-[200px]">配置特定控制项、日期范围和风险域生成 AI 报告。</p>
        </div>
      </div>
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">自定义报告</h3>
              <button onClick={() => setShowCustomModal(false)} className="text-zinc-500 hover:text-white transition-colors">×</button>
            </div>
            <div className="space-y-3">
              <input
                value={customReport.title}
                onChange={(e) => setCustomReport((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="报告标题"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50"
              />
              <textarea
                value={customReport.summary}
                onChange={(e) => setCustomReport((prev) => ({ ...prev, summary: e.target.value }))}
                placeholder="报告摘要（可选）"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50 h-24 resize-none"
              />
              <input
                type="number"
                value={customReport.findingsCount}
                onChange={(e) => setCustomReport((prev) => ({ ...prev, findingsCount: Number(e.target.value) }))}
                placeholder="发现项数量"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-violet-500/50"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowCustomModal(false)} className="px-4 py-2 rounded-lg border border-white/10 text-zinc-300 text-sm hover:bg-white/5">取消</button>
              <button onClick={handleCustomReport} className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-bold hover:bg-violet-500">生成报告</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportView;
