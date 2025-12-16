import React, { useState } from 'react';
import Sidebar from './components/Sidebar'; // This is now actually the Top Navbar
import Dashboard from './components/Dashboard';
import AuditChat from './components/AuditChat';
import GraphView from './components/GraphView';
import RiskRegister from './components/RiskRegister';
import RegulationExplorer from './components/RegulationExplorer';
import ReportView from './components/ReportView';
import DocumentsView from './components/DocumentsView';
import Settings from './components/Settings';
import { Activity } from 'lucide-react';

const Placeholder = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-full text-zinc-500 flex-col gap-4 animate-fade-in">
    <div className="p-6 rounded-full bg-white/5 border border-white/5">
        <Activity size={48} className="opacity-20" />
    </div>
    <div className="text-xl font-medium tracking-tight text-zinc-300">{title}</div>
    <div className="text-sm opacity-50 font-mono">状态：开发中</div>
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