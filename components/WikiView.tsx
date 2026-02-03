
import React, { useState } from 'react';
import { DriveItem, User } from '../types';
import { BookOpen, Search, Plus, FolderPlus, FilePlus, ChevronRight, Trash2, ArrowLeft, Save, X, FileText, FolderOpen } from 'lucide-react';

interface WikiViewProps {
  wiki: DriveItem[];
  currentUser: User;
  onUpdateWiki: (items: DriveItem[]) => void;
}

const WikiView: React.FC<WikiViewProps> = ({ wiki, currentUser, onUpdateWiki }) => {
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<DriveItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const currentItems = wiki.filter(item => 
    item.parentId === currentPath && 
    (searchTerm === '' || item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const breadcrumbs = [];
  let tempPath = currentPath;
  while (tempPath) {
    const parent = wiki.find(i => i.id === tempPath);
    if (parent) {
      breadcrumbs.unshift(parent);
      tempPath = parent.parentId;
    } else break;
  }

  const handleCreateFolder = () => {
    const name = prompt('Nome da Categoria/Pasta:');
    if (!name) return;
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FOLDER',
      parentId: currentPath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateWiki([...wiki, newItem]);
  };

  const handleCreateArticle = () => {
    const name = prompt('Título do Artigo/Nota:');
    if (!name) return;
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FILE',
      content: '',
      parentId: currentPath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateWiki([...wiki, newItem]);
    setEditingItem(newItem);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Excluir este item da Wiki permanentemente?')) {
      const idsToDelete = new Set<string>();
      const collect = (targetId: string) => {
        idsToDelete.add(targetId);
        wiki.filter(i => i.parentId === targetId).forEach(child => collect(child.id));
      };
      collect(id);
      onUpdateWiki(wiki.filter(i => !idsToDelete.has(i.id)));
    }
  };

  const handleSave = () => {
    if (!editingItem) return;
    onUpdateWiki(wiki.map(i => i.id === editingItem.id ? editingItem : i));
    setEditingItem(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-500" /> Ômega Intel
          </h2>
          <p className="text-sm text-gray-400 font-medium">Base de conhecimento e processos estratégicos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar na Wiki..." 
              className="bg-[#111] border border-white/5 rounded-2xl py-3 pl-10 pr-6 text-xs w-64 outline-none focus:border-purple-500/50" 
            />
          </div>
          <button onClick={handleCreateFolder} className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-purple-400">
            <FolderPlus className="w-5 h-5" />
          </button>
          <button onClick={handleCreateArticle} className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-black text-[10px] rounded-2xl hover:scale-105 transition-all shadow-xl shadow-purple-900/20 uppercase tracking-widest">
            <Plus className="w-4 h-4" /> Novo Artigo
          </button>
        </div>
      </header>

      {/* Navegação Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest bg-white/5 px-6 py-3 rounded-full w-fit">
        <button onClick={() => setCurrentPath(null)} className="hover:text-purple-400">CENTRAL</button>
        {breadcrumbs.map(bc => (
          <React.Fragment key={bc.id}>
            <ChevronRight className="w-3 h-3 opacity-20" />
            <button onClick={() => setCurrentPath(bc.id)} className="hover:text-purple-400 max-w-[150px] truncate">{bc.name}</button>
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {currentPath && (
          <button 
            onClick={() => {
              const current = wiki.find(i => i.id === currentPath);
              setCurrentPath(current?.parentId || null);
            }}
            className="flex flex-col items-center justify-center p-8 rounded-[40px] bg-white/[0.02] border border-dashed border-white/10 text-gray-600 hover:text-white hover:bg-white/5 transition-all h-[200px]"
          >
            <ArrowLeft className="w-8 h-8 mb-2" />
            <span className="text-[10px] font-black uppercase tracking-widest">VOLTAR</span>
          </button>
        )}

        {currentItems.map(item => (
          <div 
            key={item.id}
            onClick={() => item.type === 'FOLDER' ? setCurrentPath(item.id) : setEditingItem(item)}
            className="bg-[#111] border border-white/5 p-8 rounded-[40px] flex flex-col items-center justify-center gap-4 group hover:border-purple-500/30 transition-all cursor-pointer relative h-[200px]"
          >
            <button 
              onClick={(e) => handleDelete(e, item.id)}
              className="absolute top-6 right-6 p-2 text-gray-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {item.type === 'FOLDER' ? (
              <div className="w-16 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                <FolderOpen className="w-8 h-8 text-purple-500" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            )}

            <div className="text-center w-full px-4">
              <h4 className="text-sm font-black text-white uppercase italic tracking-tighter truncate">{item.name}</h4>
              <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-1">
                {item.type === 'FOLDER' ? 'Categoria' : 'Artigo'}
              </p>
            </div>
          </div>
        ))}

        {currentItems.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center space-y-4 opacity-20 italic">
            <BookOpen className="w-16 h-16" />
            <p className="text-xs font-black uppercase tracking-[0.4em]">Nenhum conhecimento registrado aqui.</p>
          </div>
        )}
      </div>

      {/* Editor de Artigo Wiki */}
      {editingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 animate-in fade-in zoom-in duration-300">
          <div className="w-full max-w-5xl bg-[#0a0a0a] border border-white/10 rounded-[48px] overflow-hidden flex flex-col shadow-2xl h-[90vh]">
            <header className="p-8 px-12 bg-black/40 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{editingItem.name}</h3>
                  <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Base de Conhecimento • Ômega Intel</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setEditingItem(null)} className="p-3 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full">
                  <X className="w-5 h-5" />
                </button>
                <button onClick={handleSave} className="flex items-center gap-2 px-10 py-3 bg-purple-600 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-purple-900/20 hover:scale-105 transition-all">
                  <Save className="w-4 h-4" /> SALVAR ARTIGO
                </button>
              </div>
            </header>
            
            <div className="flex-1 p-12 overflow-y-auto bg-[#111] flex flex-col items-center">
              <div className="w-full max-w-[850px] space-y-8">
                <textarea 
                  autoFocus
                  value={editingItem.content || ''}
                  onChange={(e) => setEditingItem({...editingItem, content: e.target.value})}
                  placeholder="Escreva o processo, tutorial ou nota aqui..."
                  className="w-full bg-transparent text-gray-300 text-lg outline-none resize-none font-medium leading-relaxed min-h-[500px]"
                />
              </div>
            </div>
            
            <footer className="p-4 bg-black/40 border-t border-white/5 px-12">
              <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.3em]">Ambiente Seguro • Acesso Restrito ao Time Operacional</p>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

export default WikiView;
