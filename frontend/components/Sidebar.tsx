import React from 'react';
import { LayoutDashboard, MessageSquareText, Network, FileText, ShieldAlert, Settings, BookOpen, FileCheck, Hexagon, Bell, Search, Menu } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '总览', icon: LayoutDashboard },
    { id: 'agent', label: '智能助手', icon: MessageSquareText },
    { id: 'graph', label: '知识图谱', icon: Network },
    { id: 'documents', label: '审计证据', icon: FileText },
    { id: 'risks', label: '风险管理', icon: ShieldAlert },
    { id: 'regulations', label: '合规标准', icon: BookOpen },
    { id: 'reports', label: '报告中心', icon: FileCheck },
  ];

  return (
    <header className="h-16 flex-shrink-0 border-b border-white/10 bg-black/60 backdrop-blur-md z-50 flex items-center justify-between px-6 sticky top-0">
      {/* Left: Brand & Logo */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="relative group cursor-pointer">
             <div className="absolute inset-0 bg-violet-600 blur opacity-40 group-hover:opacity-80 transition-opacity rounded-full"></div>
             <div className="relative bg-zinc-950 border border-white/10 p-1.5 rounded-lg text-violet-500">
                <Hexagon size={22} strokeWidth={2.5} />
             </div>
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight text-lg leading-none">Audit<span className="text-violet-500">Graph</span></h1>
          </div>
        </div>

        {/* Center-Left: Main Navigation Pills */}
        <nav className="hidden lg:flex items-center gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-200 border ${
                  isActive
                    ? 'bg-white/10 text-white border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                    : 'text-zinc-500 border-transparent hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-violet-400' : ''} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right: Global Tools */}
      <div className="flex items-center gap-4">
        {/* Search Bar */}
        <div className="hidden md:flex items-center gap-2 bg-zinc-900/50 border border-white/10 rounded-full px-3 py-1.5 focus-within:border-violet-500/50 focus-within:bg-zinc-900 transition-all w-64">
           <Search size={14} className="text-zinc-500" />
           <input 
             type="text" 
             placeholder="全局搜索 (Ctrl+K)..." 
             className="bg-transparent border-none outline-none text-xs text-zinc-200 w-full placeholder:text-zinc-600"
           />
           <span className="text-[10px] text-zinc-700 font-mono border border-zinc-700 px-1 rounded">/</span>
        </div>

        <div className="h-6 w-px bg-white/10 mx-1"></div>

        <button className="relative p-2 text-zinc-400 hover:text-white transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-black"></span>
        </button>

        <button 
          onClick={() => setActiveTab('settings')}
          className={`p-2 transition-colors ${activeTab === 'settings' ? 'text-violet-400' : 'text-zinc-400 hover:text-white'}`}
        >
          <Settings size={18} />
        </button>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-2 border-l border-white/5 cursor-pointer group">
           <div className="text-right hidden sm:block">
             <div className="text-xs text-zinc-200 font-medium group-hover:text-white">管理员</div>
             <div className="text-[10px] text-zinc-600">安全架构师</div>
           </div>
           <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center text-xs font-bold text-white shadow-lg border border-white/10 group-hover:scale-105 transition-transform">
             AG
           </div>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button className="lg:hidden text-zinc-400 hover:text-white">
          <Menu size={24} />
        </button>
      </div>
    </header>
  );
};

export default Sidebar;