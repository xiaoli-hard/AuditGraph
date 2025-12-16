import React, { useEffect, useState } from 'react';
import { fetchDocuments } from '../services/auditService';
import { Document } from '../types/index';
import { FileText, Upload, Search, MoreHorizontal, Loader2 } from 'lucide-react';

const DocumentsView: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const data = await fetchDocuments();
        setDocuments(data);
      } catch (error) {
        console.error("Failed to fetch documents", error);
      } finally {
        setLoading(false);
      }
    };
    loadDocuments();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p>Loading Documents...</p>
      </div>
    );
  }

  return (
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
                  向量数量: <span className="text-violet-400 font-bold">{documents.length}</span>
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
              {documents.map((doc) => (
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
};

export default DocumentsView;
