import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar'; // This is now actually the Top Navbar
import Dashboard from './components/Dashboard';
import AuditChat from './components/AuditChat';
import GraphView from './components/GraphView';
import RiskRegister from './components/RiskRegister';
import RegulationExplorer from './components/RegulationExplorer';
import ReportView from './components/ReportView';
import DocumentsView from './components/DocumentsView';
import Settings from './components/Settings';
import { ToastProvider } from './components/Toast';
import { Activity } from 'lucide-react';
import { UserAccount } from './types/index';
import { login, register, fetchCurrentUser, clearAuthToken, getAuthToken } from './services/auditService';

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
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: ''
  });
  const [authError, setAuthError] = useState('');

  const loadCurrentUser = async () => {
    try {
      const user = await fetchCurrentUser();
      setCurrentUser(user);
    } catch (error) {
      clearAuthToken();
      setCurrentUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      loadCurrentUser();
    } else {
      setAuthLoading(false);
    }
  }, []);

  const handleLogin = async () => {
    setAuthError('');
    try {
      await login(authForm.username, authForm.password);
      await loadCurrentUser();
    } catch (error) {
      setAuthError('登录失败，请检查用户名和密码');
    }
  };

  const handleRegister = async () => {
    setAuthError('');
    try {
      await register({
        username: authForm.username,
        password: authForm.password,
        full_name: authForm.full_name || undefined,
        email: authForm.email || undefined
      });
      await handleLogin();
    } catch (error) {
      setAuthError('注册失败，请检查信息是否重复');
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const renderAuthScreen = () => (
    <div className="flex items-center justify-center h-screen bg-[#050506] text-zinc-200 font-sans bg-grid">
      <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-white/10">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">AuditGraph</h2>
          <p className="text-zinc-500 text-sm mt-1">{authMode === 'login' ? '登录系统' : '创建新账号'}</p>
        </div>
        <div className="space-y-4">
          <input
            className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none"
            placeholder="用户名"
            value={authForm.username}
            onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
          />
          <input
            type="password"
            className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none"
            placeholder="密码"
            value={authForm.password}
            onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
          />
          {authMode === 'register' && (
            <>
              <input
                className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none"
                placeholder="姓名"
                value={authForm.full_name}
                onChange={(e) => setAuthForm({ ...authForm, full_name: e.target.value })}
              />
              <input
                className="w-full p-3 bg-black/40 border border-white/10 rounded-lg text-sm text-white outline-none"
                placeholder="邮箱"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
              />
            </>
          )}
          {authError && <div className="text-xs text-rose-400">{authError}</div>}
          <button
            onClick={authMode === 'login' ? handleLogin : handleRegister}
            className="w-full py-3 bg-violet-600 text-white rounded-lg hover:bg-violet-500 text-sm font-bold"
          >
            {authMode === 'login' ? '登录' : '注册'}
          </button>
          <button
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
            className="w-full py-2 text-zinc-400 hover:text-white text-xs"
          >
            {authMode === 'login' ? '没有账号？去注册' : '已有账号？去登录'}
          </button>
        </div>
      </div>
    </div>
  );

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
        return <Settings currentUser={currentUser} />;
      default:
        return <Placeholder title="未知模块" />;
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#050506] text-zinc-200 font-sans bg-grid">
        <div className="text-sm text-zinc-500">加载中...</div>
      </div>
    );
  }

  if (!currentUser) {
    return renderAuthScreen();
  }

  return (
    <ToastProvider>
      <div className="flex flex-col h-screen bg-[#050506] text-zinc-200 font-sans overflow-hidden bg-grid">
        {/* Top Navigation Bar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} />
        
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
    </ToastProvider>
  );
};

export default App;
