
import React, { useState, useEffect } from 'react';
import { Client, Task, ClientStatus, User, DriveItem, PlanItem } from '../types';
/* Added Database to the lucide-react imports */
import { CheckCircle2, Circle, Target, Flag, FolderOpen, Info, Link as LinkIcon, History, ChevronDown, ChevronUp, FileText, FolderPlus, FilePlus, ChevronRight, Trash2, ArrowLeft, Save, X, Plus, Minus, Table as TableIcon, FileType, ListChecks, Edit3, CheckSquare, Square, Search, Database } from 'lucide-react';

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
  onUpdatePlan: (clientId: string, planItems: PlanItem[]) => void;
  onTogglePlanItem: (clientId: string, itemId: string) => void;
}

const ManagerWorkspace: React.FC<ManagerWorkspaceProps> = ({ 
  managerId, clients, tasks, currentUser, drive, onUpdateDrive, onToggleTask, onUpdateNotes, onUpdateStatusFlag, onUpdateFolder, onUpdatePlan, onTogglePlanItem 
}) => {
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);
  const [currentDrivePath, setCurrentDrivePath] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<DriveItem | null>(null);
  const [isSelectingFileType, setIsSelectingFileType] = useState(false);
  const [sheetData, setSheetData] = useState<string[][]>([["", "", ""], ["", "", ""], ["", "", ""]]);
  const [docContent, setDocContent] = useState('');
  const [editingPlanClientId, setEditingPlanClientId] = useState<string | null>(null);
  const [tempPlanText, setTempPlanText] = useState('');

  const currentItems = drive.filter(item => item.parentId === currentDrivePath);

  // Navegação Breadcrumbs
  const breadcrumbs = [];
  let tempPath = currentDrivePath;
  while (tempPath) {
    const parent = drive.find(i => i.id === tempPath);
    if (parent) {
      breadcrumbs.unshift(parent);
      tempPath = parent.parentId;
    } else break;
  }
  
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

  const handleCreateFile = (fileType: 'SHEET' | 'DOC') => {
    const name = prompt(`Nome do ${fileType === 'SHEET' ? 'Arquivo de Dados' : 'Documento'}:`);
    if (!name) return;
    const newItem: DriveItem = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      type: 'FILE',
      fileType,
      content: fileType === 'SHEET' ? '[["","",""],["","",""],["","",""]]' : '',
      parentId: currentDrivePath,
      ownerId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    onUpdateDrive([...drive, newItem]);
    setIsSelectingFileType(false);
    setEditingFile(newItem);
  };

  const handleSaveFile = () => {
    if (!editingFile) return;
    const content = editingFile.fileType === 'SHEET' ? JSON.stringify(sheetData) : docContent;
    onUpdateDrive(drive.map(i => i.id === editingFile.id ? { ...i, content } : i));
    setEditingFile(null);
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Deseja excluir permanentemente?')) {
      const idsToDelete = new Set<string>();
      const collect = (targetId: string) => {
        idsToDelete.add(targetId);
        drive.filter(i => i.parentId === targetId).forEach(child => collect(child.id));
      };
      collect(id);
      onUpdateDrive(drive.filter(i => !idsToDelete.has(i.id)));
    }
  };

  const updateCell = (r: number, c: number, val: string) => {
    const newData = [...sheetData];
    newData[r][c] = val;
    setSheetData(newData);
  };

  const addRow = () => setSheetData([...sheetData, new Array(sheetData[0].length).fill("")]);
  const addCol = () => setSheetData(sheetData.map(row => [...row, ""]));

  const startEditingPlan = (client: Client) => {
    setEditingPlanClientId(client.id);
    setTempPlanText(client.planItems?.map(p => p.label).join('\n') || '');
  };

  const savePlan = (clientId: string) => {
    const labels = tempPlanText.split('\n').map(i => i.trim()).filter(i => i !== '');
    const client = clients.find(c => c.id === clientId);
    const existingItems = client?.planItems || [];

    const newItems: PlanItem[] = labels.map(label => {
      const existing = existingItems.find(e => e.label === label);
      return {
        id: existing?.id || Math.random().toString(36).substr(2, 9),
        label,
        isDone: existing?.isDone || false
      };
    });

    onUpdatePlan(clientId, newItems);
    setEditingPlanClientId(null);
  };

  const myClients = clients.filter(c => !c.isPaused);
  const myTasks = tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
            <FolderOpen className="w-8 h-8 text-[#14b8a6]" /> Dashboard Operacional
          </h2>
          <p className="text-gray-400 font-medium">Gestão estratégica e organização de dados em tempo real.</p>
        </div>
        
        {/* BOTÕES DO DRIVE */}
        <div className="flex items-center gap-3">
           <button onClick={handleCreateFolder} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 text-teal-500 transition-all">
              <FolderPlus className="w-6 h-6" />
           </button>
           <div className="relative">
              <button onClick={() => setIsSelectingFileType(!isSelectingFileType)} className="bg-teal-500 text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 shadow-lg shadow-teal-500/20 hover:scale-105 transition-all">
                <FilePlus className="w-5 h-5" /> Novo Arquivo
              </button>
              {isSelectingFileType && (
                <div className="absolute top-full mt-4 right-0 w-64 bg-[#111] border border-white/10 rounded-3xl p-4 shadow-2xl z-50 flex flex-col gap-2 animate-in slide-in-from-top-4">
                   <button onClick={() => handleCreateFile('DOC')} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all text-left group">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-xs font-black text-white uppercase">Documento</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase">Texto e Processos</p>
                      </div>
                   </button>
                   <button onClick={() => handleCreateFile('SHEET')} className="flex items-center gap-4 p-4 hover:bg-white/5 rounded-2xl transition-all text-left group">
                      <TableIcon className="w-5 h-5 text-green-400" />
                      <div>
                        <p className="text-xs font-black text-white uppercase">Planilha</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase">Dados e Listas</p>
                      </div>
                   </button>
                </div>
              )}
           </div>
        </div>
      </header>

      {/* NAVEGAÇÃO DRIVE */}
      <div className="bg-[#111] border border-white/5 rounded-[48px] p-10 space-y-8">
        <div className="flex items-center gap-2 text-[10px] text-gray-600 font-black uppercase tracking-widest bg-black/40 px-6 py-3 rounded-full w-fit">
          <button onClick={() => setCurrentDrivePath(null)} className="hover:text-teal-400">MEU DRIVE</button>
          {breadcrumbs.map(bc => (
            <React.Fragment key={bc.id}>
              <ChevronRight className="w-3 h-3 opacity-20" />
              <button onClick={() => setCurrentDrivePath(bc.id)} className="hover:text-teal-400 max-w-[150px] truncate">{bc.name}</button>
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {currentDrivePath && (
            <button onClick={() => {
              const current = drive.find(i => i.id === currentDrivePath);
              setCurrentDrivePath(current?.parentId || null);
            }} className="flex flex-col items-center justify-center p-8 bg-white/[0.02] border border-dashed border-white/10 rounded-[35px] text-gray-700 hover:text-white transition-all h-[160px]">
              <ArrowLeft className="w-6 h-6 mb-2" />
              <span className="text-[9px] font-black uppercase tracking-widest">Voltar</span>
            </button>
          )}

          {currentItems.map(item => (
            <div key={item.id} onClick={() => item.type === 'FOLDER' ? setCurrentDrivePath(item.id) : setEditingFile(item)} className="bg-black/40 border border-white/5 p-6 rounded-[35px] flex flex-col items-center justify-center gap-3 hover:border-teal-500/30 transition-all cursor-pointer relative group h-[160px] text-center">
              <button onClick={(e) => handleDeleteItem(e, item.id)} className="absolute top-4 right-4 text-gray-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="w-4 h-4" />
              </button>
              {item.type === 'FOLDER' ? (
                <div className="w-12 h-10 bg-teal-500/10 rounded-xl flex items-center justify-center border border-teal-500/20"><FolderOpen className="w-6 h-6 text-teal-500" /></div>
              ) : item.fileType === 'SHEET' ? (
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20"><TableIcon className="w-6 h-6 text-green-500" /></div>
              ) : (
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20"><FileText className="w-6 h-6 text-blue-500" /></div>
              )}
              <h4 className="text-[11px] font-black text-white uppercase italic tracking-tighter truncate w-full px-2">{item.name}</h4>
              <p className="text-[8px] text-gray-700 font-bold uppercase tracking-widest">{item.type === 'FOLDER' ? 'Pasta' : item.fileType}</p>
            </div>
          ))}

          {currentItems.length === 0 && !currentDrivePath && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-20 italic">
               <Database className="w-12 h-12 mb-4" />
               <p className="text-[10px] font-black uppercase tracking-[0.4em]">Seu diretório está vazio. Comece criando uma pasta ou arquivo.</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* SEÇÃO DE TAREFAS (FILA DIÁRIA) */}
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

        {/* SEÇÃO DE SQUADS */}
        <div className="lg:col-span-8 space-y-6">
          <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 px-4">
            <Target className="w-4 h-4 text-teal-500" /> GESTÃO DE CONTAS SQUADS
          </h3>
          <div className="space-y-4">
            {myClients.map(client => (
              <div key={client.id} className="bg-[#111] border border-white/5 rounded-[48px] overflow-hidden transition-all duration-300 shadow-xl">
                <div className={`p-10 cursor-pointer flex items-center justify-between hover:bg-white/[0.01] ${expandedFolder === client.id ? 'bg-white/[0.02]' : ''}`} onClick={() => setExpandedFolder(expandedFolder === client.id ? null : client.id)}>
                  <div className="flex items-center gap-6">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(client.statusFlag)}`}></div>
                    <div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter italic">{client.name}</h4>
                        <div className="flex items-center gap-3 mt-1">
                            <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-teal-500" style={{width: `${client.progress}%`}}></div>
                            </div>
                            <span className="text-[9px] text-gray-600 font-black uppercase">{client.progress}% ENTREGUE</span>
                        </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">{expandedFolder === client.id ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}</div>
                </div>
                {expandedFolder === client.id && (
                  <div className="p-10 pt-0 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-10 animate-in slide-in-from-top-4">
                    <div className="space-y-6">
                      <div className="bg-black/40 border border-teal-500/20 rounded-[35px] p-8 space-y-6 shadow-inner relative group/plan">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-teal-500 uppercase flex items-center gap-2 tracking-widest">
                            <ListChecks className="w-4 h-4" /> Checklist de Entrega
                          </label>
                          <button onClick={(e) => { e.stopPropagation(); editingPlanClientId === client.id ? savePlan(client.id) : startEditingPlan(client); }} className={`p-2 rounded-xl transition-all ${editingPlanClientId === client.id ? 'bg-teal-500 text-black' : 'bg-white/5 text-gray-600 hover:text-white'}`}>
                            {editingPlanClientId === client.id ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                          </button>
                        </div>
                        {editingPlanClientId === client.id ? (
                          <textarea value={tempPlanText} onChange={(e) => setTempPlanText(e.target.value)} className="w-full bg-black border border-teal-500/30 rounded-2xl p-4 text-xs text-white outline-none focus:border-teal-500 min-h-[120px]" placeholder="Um entregável por linha..." />
                        ) : (
                          <div className="space-y-2">
                            {client.planItems?.map((item) => (
                                <button key={item.id} onClick={() => onTogglePlanItem(client.id, item.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${item.isDone ? 'bg-teal-500/10 border-teal-500/30' : 'bg-white/[0.01] border-white/5 hover:border-white/10'}`}>
                                  {item.isDone ? <CheckSquare className="w-4 h-4 text-teal-500 shrink-0" /> : <Square className="w-4 h-4 text-gray-700 shrink-0" />}
                                  <span className={`text-[10px] font-bold uppercase tracking-tight ${item.isDone ? 'text-teal-400 line-through opacity-50' : 'text-gray-300'}`}>{item.label}</span>
                                </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><Info className="w-3 h-3 text-blue-400" /> Briefing Estratégico</label>
                        <textarea value={client.folder?.briefing || ''} onChange={(e) => onUpdateFolder(client.id, { briefing: e.target.value })} placeholder="Estratégia central..." className="w-full bg-black border border-white/5 rounded-3xl p-6 text-xs text-gray-400 min-h-[120px] outline-none focus:border-blue-500/30 transition-all resize-none" />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-3"><label className="text-[10px] font-black text-gray-500 uppercase flex items-center gap-2"><LinkIcon className="w-3 h-3 text-purple-400" /> Acessos & Links Rápidos</label>
                        <textarea value={client.folder?.accessLinks || ''} onChange={(e) => onUpdateFolder(client.id, { accessLinks: e.target.value })} placeholder="IDs, Links de Pastas..." className="w-full bg-black border border-white/10 rounded-3xl p-6 text-xs text-gray-400 min-h-[100px] outline-none focus:border-purple-500/30 transition-all resize-none" />
                      </div>
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

      {/* EDITOR DE ARQUIVOS (MODAL) */}
      {editingFile && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 animate-in fade-in zoom-in duration-300">
           <div className="w-full max-w-6xl h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-[60px] flex flex-col overflow-hidden shadow-2xl">
              <header className="p-10 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${editingFile.fileType === 'SHEET' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-blue-500/10 border-blue-500/20 text-blue-500'}`}>
                       {editingFile.fileType === 'SHEET' ? <TableIcon className="w-7 h-7" /> : <FileText className="w-7 h-7" />}
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{editingFile.name}</h3>
                       <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Editor de Trabalho • Ômega Cloud</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={() => setEditingFile(null)} className="p-4 text-gray-500 hover:text-white transition-all bg-white/5 rounded-2xl"><X className="w-6 h-6" /></button>
                    <button onClick={handleSaveFile} className="bg-teal-500 text-black px-12 py-4 rounded-2xl font-black text-xs uppercase shadow-xl shadow-teal-500/30 hover:scale-105 transition-all flex items-center gap-3">
                       <Save className="w-5 h-5" /> Salvar Alterações
                    </button>
                 </div>
              </header>

              <div className="flex-1 overflow-auto p-10 bg-[#111] custom-scrollbar">
                 {editingFile.fileType === 'SHEET' ? (
                   <div className="space-y-6">
                      <div className="flex gap-3 mb-6">
                         <button onClick={addRow} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all flex items-center gap-2"><Plus className="w-3 h-3" /> Linha</button>
                         <button onClick={addCol} className="px-6 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-400 hover:text-white transition-all flex items-center gap-2"><Plus className="w-3 h-3" /> Coluna</button>
                      </div>
                      <div className="inline-block border border-white/5 rounded-2xl overflow-hidden shadow-inner">
                        <table className="border-collapse">
                          <tbody>
                            {sheetData.map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-white/5 last:border-none">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="border-r border-white/5 last:border-none p-0">
                                    <input 
                                      value={cell} 
                                      onChange={(e) => updateCell(rIdx, cIdx, e.target.value)}
                                      className="w-40 bg-transparent text-xs text-gray-300 p-4 outline-none focus:bg-teal-500/5 focus:text-white transition-all font-medium" 
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
                   <textarea 
                     value={docContent}
                     onChange={(e) => setDocContent(e.target.value)}
                     placeholder="Comece a escrever seu processo ou documento estratégico..."
                     className="w-full h-full bg-transparent text-gray-300 text-lg outline-none resize-none font-medium leading-relaxed custom-scrollbar p-6"
                   />
                 )}
              </div>
              <footer className="p-6 bg-black/40 border-t border-white/5 text-center">
                 <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.5em]">Ambiente Operacional Seguro • Omega v2.6</p>
              </footer>
           </div>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (flag: string) => {
    if (flag === 'GREEN') return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    if (flag === 'YELLOW') return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
};

export default ManagerWorkspace;
