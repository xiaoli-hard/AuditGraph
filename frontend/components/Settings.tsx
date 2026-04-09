import React, { useEffect, useState } from 'react';
import { Save, RefreshCw, Cpu, Database, Network, Shield, Info, Users, Play, Clock } from 'lucide-react';
import { AgentSettings, UserAccount } from '../types/index';
import { exportSystemLogs, fetchSettings, saveSettings, listUsers, createUser, updateUser, deleteUser, startEtl, getEtlStatus } from '../services/auditService';
import { useToast } from './Toast';

const Settings: React.FC<{ currentUser: UserAccount | null }> = ({ currentUser }) => {
  const { showToast } = useToast();
  const isAdmin = currentUser?.role === 'admin';
  const [settings, setSettings] = useState<AgentSettings>({
    modelName: 'DouBao-1.6',
    temperature: 0.7,
    maxTokens: 2048,
    retrievalTopK: 5,
    useGraphRAG: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    role: 'user' as 'admin' | 'user'
  });
  const [etlState, setEtlState] = useState<{
    status: string;
    progress: number;
    current_step: string;
    logs: string[];
    last_run_at?: string | null;
  }>({ status: 'idle', progress: 0, current_step: '', logs: [], last_run_at: null });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.type === 'number' || e.target.type === 'range'
        ? Number(e.target.value)
        : e.target.value;
    
    setSettings({ ...settings, [e.target.name]: value });
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      setSettings(data);
    } catch (error) {
      console.error(error);
      showToast('加载配置失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      setUsersLoading(true);
      const data = await listUsers();
      setUsers(data);
    } catch (error) {
      console.error(error);
      showToast('加载用户列表失败', 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadEtlStatus = async () => {
    if (!isAdmin) return;
    try {
      const data = await getEtlStatus();
      setEtlState(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
    loadEtlStatus();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (etlState.status === 'running') {
      const interval = setInterval(() => {
        loadEtlStatus();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [etlState.status, isAdmin]);

  const handleSave = async () => {
    try {
      setSaving(true);
      const saved = await saveSettings(settings);
      setSettings(saved);
      showToast('配置已保存', 'success');
    } catch (error) {
      console.error(error);
      showToast('保存失败，请检查后端接口', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUser = async () => {
    try {
      if (!userForm.username || !userForm.password) {
        showToast('用户名与密码必填', 'error');
        return;
      }
      const created = await createUser(userForm);
      setUsers((prev) => [created, ...prev]);
      setUserForm({ username: '', password: '', full_name: '', email: '', role: 'user' });
      showToast('用户已创建', 'success');
    } catch (error) {
      console.error(error);
      showToast('创建用户失败', 'error');
    }
  };

  const handleUpdateUser = async (username: string, updates: Partial<UserAccount> & { password?: string }) => {
    try {
      const updated = await updateUser(username, updates);
      setUsers((prev) => prev.map((u) => (u.username === username ? updated : u)));
      showToast('用户已更新', 'success');
    } catch (error) {
      console.error(error);
      showToast('更新用户失败', 'error');
    }
  };

  const handleDeleteUser = async (username: string) => {
    try {
      await deleteUser(username);
      setUsers((prev) => prev.filter((u) => u.username !== username));
      showToast('用户已删除', 'success');
    } catch (error) {
      console.error(error);
      showToast('删除用户失败', 'error');
    }
  };

  const handleRunEtl = async () => {
    try {
      await startEtl();
      await loadEtlStatus();
      showToast('ETL 已启动', 'success');
    } catch (error) {
      console.error(error);
      showToast('ETL 启动失败', 'error');
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const defaults: AgentSettings = {
        modelName: 'doubao-seed-1-6-250615',
        temperature: 0.7,
        maxTokens: 2048,
        retrievalTopK: 5,
        useGraphRAG: true
      };
      const saved = await saveSettings(defaults);
      setSettings(saved);
      showToast('已恢复默认配置', 'success');
    } catch (error) {
      console.error(error);
      showToast('重置失败，请检查后端接口', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6 lg:p-10 max-w-5xl mx-auto animate-fade-in w-full">
      <div className="mb-10 flex justify-between items-end border-b border-zinc-200 pb-6">
        <div>
           <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">系统配置</h2>
           <p className="text-zinc-500 mt-1 text-sm">管理 AI 智能体参数、RAG 策略及 API 密钥</p>
        </div>
        <div className="flex gap-3">
             <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors text-sm font-medium">
                <RefreshCw size={16} /> 重置
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-colors text-sm font-bold tracking-wide">
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />} 保存更改
              </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Col */}
        <div className="lg:col-span-2 space-y-8">
            {/* LLM Section */}
            <div className="glass-panel rounded-xl border border-zinc-200 p-6 md:p-8">
              <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-violet-600/20 rounded-lg text-violet-400"><Cpu size={20} /></div>
                模型配置
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">模型选择</label>
                  <div className="relative">
                      <select 
                        name="modelName"
                        value={settings.modelName}
                        onChange={handleChange}
                        disabled={loading}
                        className="w-full p-4 bg-white border border-zinc-300 rounded-xl text-zinc-700 focus:border-violet-500/50 outline-none appearance-none cursor-pointer hover:bg-zinc-50 transition-colors"
                      >
                        <option value="doubao-seed-1-6-250615">豆包 Seed 1.6 (推荐)</option>
                        <option value="doubao-pro-32k">豆包 Pro 32k</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">▼</div>
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-2">Flash 模型适用于实时审计查询，响应速度更快。</p>
                </div>

                <div>
                  <div className="flex justify-between mb-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">温度 (创造性)</label>
                    <span className="text-xs font-mono text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">{settings.temperature}</span>
                  </div>
                  <input 
                    type="range" 
                    name="temperature"
                    min="0" max="1" step="0.1"
                    value={settings.temperature}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400"
                  />
                  <div className="flex justify-between text-[10px] text-zinc-600 mt-2 font-medium uppercase tracking-wide">
                    <span>确定性</span>
                    <span>平衡</span>
                    <span>发散性</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RAG Section */}
            <div className="glass-panel rounded-xl border border-zinc-200 p-6 md:p-8">
              <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-3">
                <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400"><Database size={20} /></div>
                检索增强生成 (RAG)
              </h3>
              
              <div className="space-y-6 divide-y divide-zinc-200">
                <div className="flex items-center justify-between pt-2">
                   <div>
                     <span className="font-bold text-zinc-700 block text-sm">Top-K 检索量</span>
                     <span className="text-xs text-zinc-500">每次查询检索的文档切片数量。数值越高上下文越丰富，但可能引入噪音。</span>
                   </div>
                   <input 
                    type="number"
                    name="retrievalTopK"
                    value={settings.retrievalTopK}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-20 p-2 bg-white border border-zinc-200 rounded-lg text-sm text-center text-zinc-700 focus:border-emerald-500/50 outline-none"
                   />
                </div>
                
                <div className="flex items-center justify-between pt-6">
                   <div className="flex items-start gap-4">
                     <div className={`mt-1 p-1.5 rounded-full ${settings.useGraphRAG ? 'bg-indigo-500/20 text-indigo-500' : 'bg-zinc-200 text-zinc-500'}`}>
                        <Network size={18} />
                     </div>
                     <div>
                       <span className="font-bold text-zinc-700 block text-sm">启用 GraphRAG</span>
                       <span className="text-xs text-zinc-500 max-w-sm block mt-1">
                         利用 Neo4j 知识图谱增强向量检索。这将遍历控制项、风险和证据之间的图谱关系。
                       </span>
                     </div>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      name="useGraphRAG"
                      checked={settings.useGraphRAG}
                      onChange={(e) => setSettings({...settings, useGraphRAG: e.target.checked})}
                      className="sr-only peer" 
                    />
                    <div className="w-12 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-300 peer-checked:after:bg-indigo-500 peer-checked:after:shadow-[0_0_10px_rgba(129,140,248,0.5)] shadow-inner"></div>
                  </label>
                </div>
              </div>
            </div>
            
            {isAdmin && (
              <div className="glass-panel rounded-xl border border-zinc-200 p-6 md:p-8">
                <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-indigo-600/20 rounded-lg text-indigo-400"><Play size={20} /></div>
                  数据导入 ETL
                </h3>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-zinc-700">状态：{etlState.status}</div>
                    <div className="text-xs text-zinc-500 mt-1">{etlState.current_step || '等待启动'}</div>
                  </div>
                  <button
                    onClick={handleRunEtl}
                    disabled={etlState.status === 'running'}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold"
                  >
                    <Play size={14} /> 运行ETL
                  </button>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>进度 {etlState.progress}%</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {etlState.last_run_at || '未运行'}</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-200 rounded-full mt-2 overflow-hidden">
                    <div className="h-2 bg-indigo-500" style={{ width: `${etlState.progress}%` }}></div>
                  </div>
                </div>
                <div className="mt-4 max-h-40 overflow-auto text-[10px] text-zinc-500 space-y-1">
                  {etlState.logs.length === 0 ? (
                    <div>暂无日志</div>
                  ) : (
                    etlState.logs.map((log, idx) => (
                      <div key={`${log}-${idx}`}>{log}</div>
                    ))
                  )}
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="glass-panel rounded-xl border border-zinc-200 p-6 md:p-8">
                <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-3">
                  <div className="p-2 bg-amber-600/20 rounded-lg text-amber-400"><Users size={20} /></div>
                  用户与权限管理
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    placeholder="用户名"
                    className="p-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 outline-none"
                  />
                  <input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder="密码"
                    className="p-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 outline-none"
                  />
                  <input
                    value={userForm.full_name}
                    onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
                    placeholder="姓名"
                    className="p-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 outline-none"
                  />
                  <input
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="邮箱"
                    className="p-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 outline-none"
                  />
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as 'admin' | 'user' })}
                    className="p-3 bg-white border border-zinc-200 rounded-lg text-sm text-zinc-700 outline-none md:col-span-2"
                  >
                    <option value="user">普通用户</option>
                    <option value="admin">管理员</option>
                  </select>
                </div>
                <button onClick={handleCreateUser} className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-500 text-xs font-bold">
                  创建用户
                </button>
                <div className="mt-6 space-y-2">
                  {usersLoading ? (
                    <div className="text-xs text-zinc-500">加载中...</div>
                  ) : (
                    users.map((user) => {
                      const isSelf = user.username === currentUser?.username;
                      return (
                        <div key={user.username} className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-white border border-zinc-200 rounded-lg text-xs">
                          <div>
                            <div className="text-zinc-700 font-semibold">{user.username}</div>
                            <div className="text-zinc-500">{user.full_name || '未填写'} · {user.email || '未填写'}</div>
                          </div>
                          <div className="flex items-center gap-3">
                            <select
                              value={user.role}
                              onChange={(e) => handleUpdateUser(user.username, { role: e.target.value as 'admin' | 'user' })}
                              disabled={isSelf}
                              className="p-2 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-700 outline-none disabled:opacity-50"
                            >
                              <option value="user">普通用户</option>
                              <option value="admin">管理员</option>
                            </select>
                            <button
                              onClick={() => handleUpdateUser(user.username, { disabled: !user.disabled })}
                              disabled={isSelf}
                              className={`px-3 py-2 rounded-lg text-xs font-semibold ${user.disabled ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'} disabled:opacity-50`}
                            >
                              {user.disabled ? '已禁用' : '已启用'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.username)}
                              disabled={isSelf}
                              className="px-3 py-2 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-700 hover:text-zinc-900 disabled:opacity-50"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
        </div>

        {/* Right Col */}
        <div className="space-y-8">
            <div className="glass-panel rounded-xl border border-zinc-200 p-6">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield size={14} /> 连接状态
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                        <span className="text-sm text-zinc-700">Neo4j 数据库</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]"></div>
                            已连接
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                        <span className="text-sm text-zinc-700">向量知识库</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]"></div>
                            在线
                        </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-zinc-50 rounded-lg border border-zinc-200">
                        <span className="text-sm text-zinc-700">Doubao API</span>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-400 uppercase">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_currentColor]"></div>
                            活跃
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-xl border border-zinc-200 p-6 bg-gradient-to-br from-violet-200/20 to-transparent">
                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={14} /> 关于系统
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed mb-4">
                    AuditGraph AI v2.0.4<br/>
                    Build: 2024.10.15-RELEASE
                </p>
                <button onClick={async () => {
                    try {
                      await exportSystemLogs();
                      showToast('已开始下载日志', 'success');
                    } catch (error) {
                      console.error(error);
                      showToast('日志导出失败', 'error');
                    }
                  }} className="w-full py-2 bg-white hover:bg-zinc-100 text-zinc-700 text-xs font-bold rounded-lg transition-colors border border-zinc-200">
                    查看系统日志
                </button>
            </div>
        </div>

      </div>
    </div>
    </div>
  );
};

export default Settings;
