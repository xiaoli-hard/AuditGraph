import React, { useEffect, useRef, useState } from 'react';
import { deleteDocument, downloadDocument, fetchDocuments, uploadDocuments } from '../services/auditService';
import { Document } from '../types/index';
import { FileText, Upload, Search, MoreHorizontal, Loader } from 'lucide-react';
import { useToast } from './Toast';

const DocumentsView: React.FC = () => {
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocuments = async (search?: string) => {
    try {
      setLoading(true);
      const data = await fetchDocuments(search);
      setDocuments(data);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadDocuments(searchQuery.trim() ? searchQuery.trim() : undefined);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    try {
      setUploading(true);
      const created = await uploadDocuments(files);
      showToast(`已上传 ${created.length} 个文件`, 'success');
      await loadDocuments(searchQuery.trim() ? searchQuery.trim() : undefined);
    } catch (error) {
      console.error(error);
      showToast('上传失败，请检查后端接口', 'error');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDownload = async (docId: string) => {
    try {
      await downloadDocument(docId);
      showToast('已开始下载', 'success');
    } catch (error) {
      console.error(error);
      showToast('下载失败，请检查后端接口', 'error');
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleDelete = async (docId: string) => {
    try {
      await deleteDocument(docId);
      showToast('已删除文档', 'success');
      await loadDocuments(searchQuery.trim() ? searchQuery.trim() : undefined);
    } catch (error) {
      console.error(error);
      showToast('删除失败，请检查后端接口', 'error');
    } finally {
      setOpenMenuId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-zinc-500">
        <Loader className="w-8 h-8 animate-spin mb-2" />
        <p>Loading Documents...</p>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 space-y-6 h-full flex flex-col overflow-hidden max-w-[1920px] mx-auto w-full animate-fade-in">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900 tracking-tight">审计证据库</h2>
          <p className="text-zinc-500 mt-1 text-sm">管理审计底稿与RAG向量上下文索引</p>
        </div>
        <button onClick={handleUploadClick} className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-all shadow-[0_0_20px_rgba(124,58,237,0.3)] text-sm font-bold tracking-wide">
          {uploading ? <Loader size={16} className="animate-spin" /> : <Upload size={16} />}
          {uploading ? '上传中...' : '上传证据文件'}
        </button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUploadChange} />
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden flex-1 flex flex-col shadow-2xl">
         {/* Toolbar */}
         <div className="px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
            <div className="relative group">
               <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-500 group-focus-within:text-violet-400 transition-colors" />
               <input 
                  type="text" 
                  placeholder="搜索文件名或内容..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-violet-500/50 text-zinc-700 w-80 transition-all placeholder:text-zinc-400"
               />
            </div>
            <div className="flex gap-4 items-center">
               <div className="text-xs font-mono text-zinc-500">
                  存储占用: <span className="text-zinc-700">2.4 GB</span>
               </div>
               <div className="h-4 w-px bg-zinc-200"></div>
               <div className="text-xs font-mono text-zinc-500">
                  显示数量: <span className="text-violet-400 font-bold">{documents.length}</span>
               </div>
            </div>
         </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white text-zinc-500 font-medium sticky top-0 backdrop-blur-md z-10 border-b border-zinc-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">底稿详情</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">类型</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">大小</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">收录时间</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">RAG 索引状态</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 transition-colors group cursor-default">
                  <td className="px-6 py-4 flex items-center gap-4">
                    <div className="w-10 h-10 flex items-center justify-center bg-zinc-100 border border-zinc-200 rounded-lg text-zinc-500 group-hover:text-violet-500 group-hover:border-violet-500/30 transition-colors">
                      <FileText size={18} />
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-700 block text-sm group-hover:text-zinc-900">{doc.name}</span>
                      <span className="text-[10px] font-mono text-zinc-600">{doc.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-zinc-100 rounded text-[10px] font-bold text-zinc-600 border border-zinc-200">{doc.type}</span>
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
                    <div className="relative inline-flex">
                      <button onClick={() => setOpenMenuId((prev) => prev === doc.id ? null : doc.id)} className="p-2 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors">
                          <MoreHorizontal size={18} />
                      </button>
                      {openMenuId === doc.id && (
                        <div className="absolute right-0 top-10 w-36 glass-panel rounded-lg border border-zinc-200 p-2 z-20">
                          <button onClick={() => handleDownload(doc.id)} className="w-full text-left text-xs text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 px-2 py-1 rounded">
                            下载文件
                          </button>
                          <button onClick={() => handleDelete(doc.id)} className="w-full text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-1 rounded">
                            删除记录
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!documents.length && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-zinc-500 text-sm">
                    未找到匹配的证据文件
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DocumentsView;
