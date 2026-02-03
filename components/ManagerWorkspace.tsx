
import React, { useState, useEffect } from 'react';
import { Client, Task, ClientStatus, User, DriveItem } from '../types';
import { CheckCircle2, Circle, Target, Flag, FolderOpen, Info, Link as LinkIcon, History, ChevronDown, ChevronUp, FileText, FolderPlus, FilePlus, ChevronRight, Trash2, ArrowLeft, Save, X, Plus, Minus, Table as TableIcon, FileType } from 'lucide-react';

interface ManagerWorkspaceProps {
  managerId: string;
  clients: Client[];
  tasks: Task[];
  currentUser: User;
  drive: DriveItem[];
  onUpdateDrive: (items: DriveItem[]) => void;
  onToggleTask: (taskId: string) => void;
  onUpdateNotes: (clientId: string, notes: string) => void;
  onUpdateStatusFlag: (clientId: string, flag: ClientStatus) => void;
  onUpdateFolder: (clientId: string, folder: Partial<Client['folder']>) => void;
}

const ManagerWorkspace: React.FC<ManagerWorkspaceProps> = ({ 
  managerId, clients, tasks, currentUser, drive, onUpdateDrive, onToggleTask, onUpdateNotes, onUpdateStatusFlag, onUpdateFolder 
}) => {
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [currentDrivePath, setCurrentDrivePath] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<DriveItem | null>(null);
  const [isSelectingFileType, setIsSelectingFileType] = useState(false);
  const [sheetData, setSheetData] = useState<string[][]>([[""]]);
  const [docContent, setDocContent] = useState('');
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  const currentItems = drive.filter(item => item.parentId === currentDrivePath);
  
  useEffect(() => {
    if (editingFile) {
      if (editingFile.fileType === 'SHEET') {
        try {
          const parsed = JSON.parse(editingFile.content || '[["","",""],["","",""],["","",""]]');
          setSheetData(parsed);
        } catch (e) {
          setSheetData([["", "", ""], ["", "", ""], ["", "", ""]]);
        }
      } else {
        setDocContent(editingFile.content || '');
      }
    }
  }, [editingFile]);

  const breadcrumbs = [];
  let tempPath = currentDrivePath;
  while (tempPath) {
    const parent = drive.find(i => i.id === tempPath);
    if (parent) {
      breadcrumbs.unshift(parent);
      tempPath = parent.parentId;
    } else break;
  }

  const handleCreateFolder = () => {
    const name = prompt('Nome da Pasta:');
    if (!name) return;
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FOLDER',
      parentId: currentDrivePath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateDrive([...drive, newItem]);
  };

  const handleCreateFile = (type: 'SHEET' | 'DOC') => {
    const name = prompt(type === 'SHEET' ? 'Nome da Planilha:' : 'Nome do Documento:');
    if (!name) return;
    
    const initialContent = type === 'SHEET' 
      ? JSON.stringify([["", "", ""], ["", "", ""], ["", "", ""]])
      : "";

    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FILE',
      fileType: type,
      content: initialContent,
      parentId: currentDrivePath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateDrive([...drive, newItem]);
    setIsSelectingFileType(false);
    setEditingFile(newItem);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja excluir permanentemente?')) {
      const itemsToDelete = new Set<string>();
      const collectToDelete = (targetId: string) => {
        itemsToDelete.add(targetId);
        drive.filter(i => i.parentId === targetId).forEach(child => collectToDelete(child.id));
      };
      collectToDelete(id);
      onUpdateDrive(drive.filter(i => !itemsToDelete.has(i.id)));
    }
  };

  const handleSaveFile = () => {
    if (!editingFile) return;
    const content = editingFile.fileType === 'SHEET' ? JSON.stringify(sheetData) : docContent;
    const updatedFile = { ...editingFile, content };
    onUpdateDrive(drive.map(i => i.id === editingFile.id ? updatedFile : i));
    setEditingFile(null);
  };

  const updateCell = (r: number, c: number, val: string) => {
    const newData = sheetData.map((row, ri) => 
      ri === r ? row.map((cell, ci) => ci === c ? val : cell) : row
    );
    setSheetData(newData);
  };

  const addRow = () => setSheetData([...sheetData, new Array(sheetData[0]?.length || 1).fill("")]);
  const addCol = () => setSheetData(sheetData.map(row => [...row, ""]));
  const removeRow = (idx: number) => {
    if (sheetData.length <= 1) return;
    setSheetData(sheetData.filter((_, i) => i !== idx));
  };
  const removeCol = (idx: number) => {
    if (sheetData[0].length <= 1) return;
    setSheetData(sheetData.map(row => row.filter((_, i) => i !== idx)));
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDrop = (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    const itemId = e.dataTransfer.getData('text/plain');
    setDragOverFolderId(null);
    setDraggedItemId(null);
    if (itemId === targetFolderId) return;
    onUpdateDrive(drive.map(item => 
      item.id === itemId ? { ...item, parentId: targetFolderId } : item
    ));
  };

  const getColLetter = (n: number) => String.fromCharCode(65 + n);

  const myClients = clients.filter(c => !c.isPaused);
  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-32">
      <header>
        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
          <FolderOpen className="w-8 h-8 text-[#14b8a6]" /> Dashboard Operacional
        </h2>
        <p className="text-gray-400 font-medium">Gestão estratégica e organização de dados em tempo real.</p>
      </header>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
             <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
                <TableIcon className="w-4 h-4 text-[#14b8a6]" /> ÔMEGA DRIVE
             </h3>
             <div className="flex items-center gap-2 text-[10px] text-gray-600 font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full">
                <button 
                  onClick={() => setCurrentDrivePath(null)} 
                  onDragOver={(e) => { e.preventDefault(); setDragOverFolderId('root'); }}
                  onDrop={(e) => handleDrop(e, null)}
                  className={`hover:text-teal-400 p-1 rounded transition-colors ${dragOverFolderId === 'root' ? 'text-teal-400' : ''}`}
                >
                  HOME
                </button>
                {breadcrumbs.map(bc => (
                  <React.Fragment key={bc.id}>
                    <ChevronRight className="w-3 h-3 opacity-20" />
                    <button 
                      onClick={() => setCurrentDrivePath(bc.id)} 
                      onDragOver={(e) => { e.preventDefault(); setDragOverFolderId(bc.id); }}
                      onDrop={(e) => handleDrop(e, bc.id)}
                      className={`hover:text-teal-400 max-w-[120px] truncate p-1 rounded transition-colors ${dragOverFolderId === bc.id ? 'text-teal-400' : ''}`}
                    >
                      {bc.name}
                    </button>
                  </React.Fragment>
                ))}
             </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleCreateFolder} className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black text-gray-400 hover:text-white transition-all border border-white/5">
              <FolderPlus className="w-4 h-4 text-purple-400"/> NOVA PASTA
            </button>
            <button onClick={() => setIsSelectingFileType(true)} className="flex items-center gap-2 px-6 py-3 bg-[#14b8a6] hover:bg-[#0d9488] rounded-2xl text-[10px] font-black text-black hover:scale-105 transition-all shadow-[0_10px_20px_rgba(20,184,166,0.2)]">
              <Plus className="w-4 h-4"/> NOVO ARQUIVO
            </button>
          </div>
        </div>

        <div 
          className="bg-[#111] border border-white/5 rounded-[48px] p-10 min-h-[450px] relative overflow-hidden group shadow-2xl"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => draggedItemId && !dragOverFolderId && handleDrop(e, currentDrivePath)}
        >
           <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-8 relative z-10">
              {currentDrivePath && (
                <button 
                  onClick={() => {
                    const current = drive.find(i => i.id === currentDrivePath);
                    setCurrentDrivePath(current?.parentId || null);
                  }}
                  className="flex flex-col items-center justify-center p-6 rounded-[32px] bg-white/[0.02] border border-dashed border-white/10 text-gray-600 hover:text-white hover:bg-white/5 transition-all h-[180px]"
                >
                  <ArrowLeft className="w-8 h-8 mb-2" />
                  <span className="text-[10px] font-black uppercase tracking-widest">VOLTAR</span>
                </button>
              )}
              
              {currentItems.map(item => (
                <div 
                  key={item.id} 
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  onDragOver={(e) => { e.preventDefault(); if(item.type === 'FOLDER') setDragOverFolderId(item.id); }}
                  onDragLeave={() => setDragOverFolderId(null)}
                  onDrop={(e) => item.type === 'FOLDER' && handleDrop(e, item.id)}
                  onClick={() => item.type === 'FOLDER' ? setCurrentDrivePath(item.id) : setEditingFile(item)}
                  className={`flex flex-col items-center justify-center p-8 rounded-[40px] border transition-all group/item relative h-[180px] cursor-grab active:cursor-grabbing ${
                    item.type === 'FOLDER' 
                      ? (dragOverFolderId === item.id ? 'bg-purple-500/20 border-purple-500 scale-105 shadow-[0_0_40px_rgba(168,85,247,0.3)]' : 'bg-black/40 border-white/5 hover:border-purple-500/40') 
                      : (draggedItemId === item.id ? 'opacity-30' : 'bg-black/40 border-white/5 hover:border-teal-500/40 hover:bg-white/[0.02]')
                  }`}
                >
                  <button 
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    className="absolute top-5 right-5 p-2 text-gray-800 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-opacity z-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {item.type === 'FOLDER' ? (
                    <div className="w-14 h-11 rounded-lg relative mb-4 transition-transform group-hover/item:scale-110 bg-purple-500/20 shadow-lg shadow-purple-500/5">
                      <div className="absolute top-[-4px] left-0 w-8 h-2 rounded-t-sm bg-purple-500"></div>
                    </div>
                  ) : (
                    <div className="relative mb-4 group-hover/item:scale-110 transition-transform">
                      {item.fileType === 'SHEET' ? (
                        <div className="w-12 h-16 bg-teal-500/10 border border-teal-500/20 rounded-sm shadow-xl flex items-center justify-center">
                          <TableIcon className="w-6 h-6 text-teal-400/50" />
                        </div>
                      ) : (
                        <div className="w-12 h-16 bg-blue-500/10 border border-blue-500/20 rounded-sm shadow-xl flex items-center justify-center">
                          <FileText className="w-6 h-6 text-blue-400/50" />
                        </div>
                      )}
                      <div className="absolute top-0 right-0 w-3 h-3 bg-[#111] border-l border-b border-white/10 rounded-bl-sm"></div>
                    </div>
                  )}
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center truncate w-full px-2 group-hover/item:text-white transition-colors">
                    {item.name}
                  </span>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Modal de Seleção de Tipo de Arquivo */}
      {isSelectingFileType && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[48px] p-10 space-y-8 shadow-2xl relative">
              <button onClick={() => setIsSelectingFileType(false)} className="absolute right-8 top-8 text-gray-500 hover:text-white"><X /></button>
              <div className="text-center">
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">Criar Novo Arquivo</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-2">Escolha a ferramenta ideal para sua tarefa</p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => handleCreateFile('SHEET')}
                  className="flex flex-col items-center gap-6 p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-teal-500/50 hover:bg-teal-500/5 transition-all group"
                >
                  <div className="w-16 h-16 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20 group-hover:scale-110 transition-transform">
                    <TableIcon className="w-8 h-8 text-teal-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-white uppercase italic">Planilha Ômega</p>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Cálculos e Listas (Excel)</p>
                  </div>
                </button>
                <button 
                  onClick={() => handleCreateFile('DOC')}
                  className="flex flex-col items-center gap-6 p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                >
                  <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-white uppercase italic">Documento Ômega</p>
                    <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mt-1">Processos e Notas (Word)</p>
                  </div>
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Editor de Arquivo (Sheets ou Doc) */}
      {editingFile && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 md:p-10 animate-in zoom-in duration-300">
           <div className="w-full h-full max-w-7xl bg-[#0a0a0a] border border-white/10 rounded-[64px] flex flex-col shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden">
              <header className="p-8 border-b border-white/5 flex items-center justify-between bg-black/40">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${editingFile.fileType === 'SHEET' ? 'bg-teal-500/10 border-teal-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                    {editingFile.fileType === 'SHEET' ? <TableIcon className="w-6 h-6 text-teal-500" /> : <FileText className="w-6 h-6 text-blue-500" />}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">{editingFile.name}</h3>
                    <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">
                      {editingFile.fileType === 'SHEET' ? 'ÔMEGA SHEETS • EDITOR DE DADOS' : 'ÔMEGA DOCS • EDITOR DE TEXTO'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setEditingFile(null)} className="p-3 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                  <button onClick={handleSaveFile} className={`flex items-center gap-2 px-10 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-xl ${editingFile.fileType === 'SHEET' ? 'bg-teal-500 text-black shadow-teal-500/20' : 'bg-blue-600 text-white shadow-blue-600/20'}`}>
                    <Save className="w-4 h-4" /> SALVAR ARQUIVO
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-auto p-10 bg-[#111]">
                {editingFile.fileType === 'SHEET' ? (
                  <div className="space-y-6">
                    <div className="flex gap-3 mb-4">
                      <button onClick={addRow} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-[10px] font-black text-gray-400 hover:text-white border border-white/5 rounded-xl uppercase transition-all">
                        <Plus className="w-3 h-3 text-teal-500" /> Linha
                      </button>
                      <button onClick={addCol} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-[10px] font-black text-gray-400 hover:text-white border border-white/5 rounded-xl uppercase transition-all">
                        <Plus className="w-3 h-3 text-teal-500" /> Coluna
                      </button>
                    </div>
                    <div className="overflow-auto border border-white/5 rounded-2xl shadow-2xl bg-black/40">
                      <table className="border-collapse">
                        <thead>
                          <tr>
                            <th className="w-12 bg-black/60 border border-white/10 p-2"></th>
                            {sheetData[0]?.map((_, ci) => (
                              <th key={ci} className="min-w-[150px] bg-black/60 border border-white/10 p-2 text-[10px] font-black text-gray-600 uppercase tracking-widest relative group/col">
                                {getColLetter(ci)}
                                <button onClick={() => removeCol(ci)} className="absolute top-1 right-1 opacity-0 group-hover/col:opacity-100 transition-opacity text-red-500 hover:text-red-400">
                                  <Minus className="w-3 h-3" />
                                </button>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {sheetData.map((row, ri) => (
                            <tr key={ri} className="group/row">
                              <td className="w-12 bg-black/60 border border-white/10 p-2 text-[10px] font-black text-gray-600 text-center relative">
                                {ri + 1}
                                <button onClick={() => removeRow(ri)} className="absolute left-1 top-1 opacity-0 group-hover/row:opacity-100 transition-opacity text-red-500 hover:text-red-400">
                                  <Minus className="w-3 h-3" />
                                </button>
                              </td>
                              {row.map((cell, ci) => (
                                <td key={ci} className="border border-white/10 p-0 focus-within:ring-2 ring-teal-500/50">
                                  <input 
                                    value={cell} 
                                    onChange={(e) => updateCell(ri, ci, e.target.value)}
                                    className="w-full h-full bg-transparent p-3 text-sm text-gray-300 outline-none"
                                  />
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full max-w-4xl mx-auto flex flex-col space-y-8">
                     <textarea 
                        value={docContent}
                        onChange={(e) => setDocContent(e.target.value)}
                        placeholder="Inicie sua escrita aqui..."
                        className="w-full flex-1 bg-transparent text-gray-300 text-lg outline-none resize-none leading-relaxed font-medium placeholder:text-gray-700"
                        autoFocus
                     />
                  </div>
                )}
              </div>
              <footer className="p-4 bg-black/20 border-t border-white/5 text-[8px] font-black text-gray-700 uppercase tracking-[0.5em] text-center">
                Protocolo de Segurança Ativo • Edição Criptografada
              </footer>
           </div>
        </div>
      )}

      {/* Grid de Seções (Fila Diária e Squads) mantida conforme original */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-500" /> FILA DIÁRIA
            </h3>
            <span className="text-[10px] bg-white/5 px-3 py-1.5 rounded-full text-gray-500 font-black">{myTasks.filter(t => t.status === 'PENDING').length} PENDENTES</span>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-[48px] p-8 space-y-4 max-h-[700px] overflow-y-auto custom-scrollbar shadow-xl">
            {myTasks.map(task => (
                <button key={task.id} onClick={() => onToggleTask(task.id)} className={`w-full flex items-center gap-4 p-6 rounded-[32px] border transition-all text-left ${task.status === 'COMPLETED' ? 'bg-black/40 border-transparent opacity-40' : 'bg-white/[0.03] border-white/5 hover:border-teal-500/20'}`}>
                  {task.status === 'COMPLETED' ? <CheckCircle2 className="w-5 h-5 text-teal-500" /> : <Circle className="w-5 h-5 text-gray-700" />}
                  <div>
                    <p className={`text-sm font-bold uppercase tracking-tighter ${task.status === 'COMPLETED' ? 'text-gray-600 line-through' : 'text-white'}`}>{task.title}</p>
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{task.type}</span>
                  </div>
                </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 px-4">
            <Target className="w-4 h-4 text-teal-500" /> GESTÃO DE CONTAS SQUADS
          </h3>
          <div className="space-y-4">
            {myClients.map(client => (
              <div key={client.id} className="bg-[#111] border border-white/5 rounded-[48px] overflow-hidden transition-all duration-300 shadow-xl">
                <div className={`p-10 cursor-pointer flex items-center justify-between hover:bg-white/[0.01] ${expandedFolder === client.id ? 'bg-white/[0.02]' : ''}`} onClick={() => setExpandedFolder(expandedFolder === client.id ? null : client.id)}>
                  <div className="flex items-center gap-6">
                    <div className={`w-3 h-3 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]'}`}></div>
                    <div><h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">{client.name}</h4><p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">{client.industry}</p></div>
                  </div>
                  <div className="flex items-center gap-4">{expandedFolder === client.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}</div>
                </div>
                {expandedFolder === client.id && (
                  <div className="p-10 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-top-4">
                    <div className="space-y-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Info className="w-3 h-3 text-blue-400" /> Briefing Estratégico</label>
                        <textarea value={client.folder?.briefing || ''} onChange={(e) => onUpdateFolder(client.id, { briefing: e.target.value })} placeholder="Estratégia central..." className="w-full bg-black border border-white/5 rounded-3xl p-6 text-xs text-gray-400 min-h-[120px] outline-none focus:border-blue-500/30 transition-all resize-none" />
                      </div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><LinkIcon className="w-3 h-3 text-purple-400" /> Acessos & Links Rápidos</label>
                        <textarea value={client.folder?.accessLinks || ''} onChange={(e) => onUpdateFolder(client.id, { accessLinks: e.target.value })} placeholder="IDs, Links de Pastas..." className="w-full bg-black border border-white/10 rounded-3xl p-6 text-xs text-gray-400 min-h-[100px] outline-none focus:border-purple-500/30 transition-all resize-none" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><History className="w-3 h-3 text-teal-400" /> Log de Atividades</label>
                        <textarea value={client.folder?.operationalHistory || ''} onChange={(e) => onUpdateFolder(client.id, { operationalHistory: e.target.value })} placeholder="O que foi feito recentemente..." className="w-full bg-black border border-white/10 rounded-3xl p-6 text-xs text-gray-400 min-h-[120px] outline-none focus:border-teal-500/30 transition-all resize-none" />
                      </div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-600 uppercase flex items-center justify-between">Sinalizador de Urgência</label>
                         <div className="flex gap-3">
                            {(['GREEN', 'YELLOW', 'RED'] as ClientStatus[]).map(flag => (
                              <button key={flag} onClick={() => onUpdateStatusFlag(client.id, flag)} className={`flex-1 py-4 rounded-[20px] border transition-all ${client.statusFlag === flag ? (flag === 'GREEN' ? 'bg-green-500 border-green-400 text-black' : flag === 'YELLOW' ? 'bg-yellow-500 border-yellow-400 text-black' : 'bg-red-500 border-red-400 text-white') : 'bg-black border-white/5 text-gray-600 opacity-20'}`}>
                                <Flag className="w-4 h-4 mx-auto fill-current" />
                              </button>
                            ))}
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerWorkspace;
