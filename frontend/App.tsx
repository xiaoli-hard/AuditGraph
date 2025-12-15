import React, { useState } from 'react';
import Sidebar from './components/Sidebar'; // This is now actually the Top Navbar
import Dashboard from './components/Dashboard';
import AuditChat from './components/AuditChat';
import GraphView from './components/GraphView';
import RiskRegister from './components/RiskRegister';
import RegulationExplorer from './components/RegulationExplorer';
import ReportView from './components/ReportView';
import Settings from './components/Settings';
import { MOCK_DOCUMENTS } from './data/constants';
import { FileText, Upload, CheckCircle2, Clock, Search, MoreHorizontal, FileType, Activity } from 'lucide-react';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full text-zinc-500 flex-col gap-4 animate-fade-in">
    <div className="p-6 rounded-full bg-white/5 border border-white/5">
        <Activity size={48} className="opacity-20" />
    </div>
    <div className="text-xl font-medium tracking-tight text-zinc-300">{title}</div>
    <div className="text-sm opacity-50 font-mono">状态：开发中</div>
  </div>
);

const DocumentsView: React.FC = () => (
  <div className="p-6 lg:p-10 space-y-6 h-full flex flex-col overflow-hidden max-w-[1920px] mx-auto w-full animate-fade-in">
    <div className="flex justify-between items-end">
      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">审计证据库</h2>
        <p className="text-zinc-400 mt-1 text-sm">管理审计底稿与RAG向量上下文索引</p>
      </div>
      <button className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] text-sm font-bold tracking-wide">
        <Upload size={16} />
        上传证据文件
      </button>
    </div>

    <div className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col shadow-2xl">
       {/* Toolbar */}
       <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/30">
          <div className="relative group">
             <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
             <input 
                type="text" 
                placeholder="搜索文件名或内容..." 
                className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 text-zinc-200 w-80 transition-all placeholder:text-zinc-600"
             />
          </div>
          <div className="flex gap-4 items-center">
             <div className="text-xs font-mono text-zinc-500">
                存储占用: <span className="text-zinc-300">2.4 GB</span>
             </div>
             <div className="h-4 w-px bg-white/10"></div>
             <div className="text-xs font-mono text-zinc-500">
                向量数量: <span className="text-violet-400 font-bold">{MOCK_DOCUMENTS.length}</span>
             </div>
          </div>
       </div>

      <div className="overflow-y-auto flex-1">
        <table className="w-full text-left border-collapse">
          <thead className="bg-zinc-950/50 text-zinc-500 font-medium sticky top-0 backdrop-blur-md z-10">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">底稿详情</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">类型</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">大小</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">收录时间</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">RAG 索引状态</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {MOCK_DOCUMENTS.map((doc) => (
              <tr key={doc.id} className="hover:bg-white/5 transition-colors group cursor-default">
                <td className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 flex items-center justify-center bg-zinc-800/50 border border-white/5 rounded-lg text-zinc-400 group-hover:text-violet-400 group-hover:border-violet-500/30 transition-colors">
                    <FileText size={18} />
                  </div>
                  <div>
                    <span className="font-semibold text-zinc-200 block text-sm group-hover:text-white">{doc.name}</span>
                    <span className="text-[10px] font-mono text-zinc-600">{doc.id}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-zinc-800 rounded text-[10px] font-bold text-zinc-400 border border-zinc-700">{doc.type}</span>
                </td>
                <td className="px-6 py-4 text-zinc-500 text-xs font-mono">{doc.size}</td>
                <td className="px-6 py-4 text-zinc-500 text-xs">{doc.uploadDate}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${doc.status === 'Indexed' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`}></div>
                      <span className={`text-xs font-medium ${doc.status === 'Indexed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {doc.status === 'Indexed' ? '已索引' : '处理中'}
                      </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="p-2 text-zinc-600 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                      <MoreHorizontal size={18} />
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'agent':
        return <AuditChat />;
      case 'graph':
        return <GraphView />;
      case 'documents':
        return <DocumentsView />;
      case 'risks':
        return <RiskRegister />;
      case 'regulations':
        return <RegulationExplorer />;
      case 'reports':
        return <ReportView />;
      case 'settings':
        return <Settings />;
      default:
        return <Placeholder title="未知模块" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#050506] text-zinc-200 font-sans overflow-hidden bg-grid">
      {/* Top Navigation Bar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10">
        {renderContent()}
      </main>

      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
         <div className="absolute top-[-10%] left-[20%] w-[40%] h-[40%] bg-violet-900/5 blur-[100px] rounded-full mix-blend-screen"></div>
         <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-indigo-900/5 blur-[100px] rounded-full mix-blend-screen"></div>
      </div>
    </div>
  );
};

export default App;