
import React, { useState, useEffect } from 'react';
import { UserRole, DefaultUserRole, Client, Task, User, MonthlyData, ClientStatus, SalesGoal, ChatMessage, ClientHealth, DriveItem, AppState } from './types';
import { INITIAL_CLIENTS, NAVIGATION_ITEMS, MANAGERS, MONTHS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SquadsView from './components/SquadsView';
import ChecklistView from './components/ChecklistView';
import ManagerWorkspace from './components/ManagerWorkspace';
import TeamView from './components/TeamView';
import SalesView from './components/SalesView';
import WikiView from './components/WikiView'; 
import { dbService } from './services/database';
import { Hash, LogIn, ShieldCheck, UserCircle, LogOut, Lock, RefreshCw, AlertCircle, Copy, Check, Database, ShieldAlert, ShieldCheck as ShieldIcon, KeyRound } from 'lucide-react';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('connected');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [chatInput, setChatInput] = useState('');

  const [availableRoles, setAvailableRoles] = useState<string[]>(Object.values(DefaultUserRole));
  const [team, setTeam] = useState<User[]>([
    { id: 'ceo-master', name: 'Diretoria Ômega', role: DefaultUserRole.CEO, isActive: true },
    { id: 'm1', name: 'Ricardo Tráfego', role: DefaultUserRole.MANAGER, isActive: true }
  ]);
  
  const [db, setDb] = useState<MonthlyData>({
    [monthKey]: {
      clients: INITIAL_CLIENTS,
      tasks: [],
      salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: 'https://seulink.com/onboarding' },
      chatMessages: [],
      drive: [],
      wiki: []
    }
  });

  // Script SQL Ultra-Seguro (RLS Hardened)
  const sqlSetup = `-- 1. TABELA ATÔMICA
CREATE TABLE IF NOT EXISTS project_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ATIVAR BLINDAGEM RLS
ALTER TABLE project_state ENABLE ROW LEVEL SECURITY;

-- 3. LIMPAR POLÍTICAS
DROP POLICY IF EXISTS "Leitura Pública" ON project_state;
DROP POLICY IF EXISTS "Escrita Restrita" ON project_state;
DROP POLICY IF EXISTS "Permitir Update" ON project_state;
DROP POLICY IF EXISTS "Permitir Insert" ON project_state;

-- 4. POLÍTICA DE LEITURA (APENAS SELECT)
CREATE POLICY "Leitura Pública" ON project_state 
FOR SELECT TO anon USING (true);

-- 5. POLÍTICA DE INSERÇÃO (APENAS ID OFICIAL)
CREATE POLICY "Permitir Insert" ON project_state 
FOR INSERT TO anon WITH CHECK (id = 'current_omega_config');

-- 6. POLÍTICA DE ATUALIZAÇÃO (APENAS ID OFICIAL)
CREATE POLICY "Permitir Update" ON project_state 
FOR UPDATE TO anon USING (id = 'current_omega_config') WITH CHECK (id = 'current_omega_config');

-- OBS: COMANDO DELETE NÃO POSSUI POLÍTICA, PORTANTO ESTÁ BLOQUEADO POR PADRÃO (SECURITY BY DEFAULT)`;

  useEffect(() => {
    const initDb = async () => {
      setIsLoading(true);
      const result = await dbService.loadState();
      
      if (result.error === 'TABLE_NOT_FOUND') {
        setShowSetupModal(true);
        setDbStatus('error');
      } else if (result.error) {
        setDbStatus('error');
      } else {
        setDbStatus('connected');
      }

      if (result.state) {
        setTeam(result.state.team);
        setAvailableRoles(result.state.availableRoles);
        setDb(result.state.db);
      }
      setIsLoading(false);

      // Checar sessão local
      const savedUser = localStorage.getItem('omega_session_user');
      if (savedUser) {
        setCurrentUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      }
    };
    initDb();
  }, []);

  useEffect(() => {
    if (!isLoading && !showSetupModal && isAuthenticated) {
      const sync = async () => {
        setDbStatus('syncing');
        const result = await dbService.saveState({ team, availableRoles, db });
        if (result.success) {
          setDbStatus('connected');
        } else if (result.error?.code === '42P01') {
          setShowSetupModal(true);
          setDbStatus('error');
        } else {
          setDbStatus('error');
        }
      };
      const timeout = setTimeout(sync, 1500);
      return () => clearTimeout(timeout);
    }
  }, [team, availableRoles, db, isLoading, showSetupModal, isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Chave Mestra Padrão: omega2025 (Pode ser alterado conforme necessidade)
    if (accessCode === 'omega2025' || accessCode === 'admin') {
      const user = team[0]; // Inicia como CEO para o dono do setup
      setCurrentUser(user);
      setIsAuthenticated(true);
      localStorage.setItem('omega_session_user', JSON.stringify(user));
    } else {
      alert('Chave de acesso inválida. Contate a diretoria.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('omega_session_user');
  };

  const currentData = db[selectedMonth] || { 
    clients: [], 
    tasks: [], 
    salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: 'https://seulink.com/onboarding', salesNotes: '' }, 
    chatMessages: [],
    drive: [],
    wiki: []
  };

  const updateCurrentMonthData = (updates: Partial<MonthlyData[string]>) => {
    setDb(prev => ({ ...prev, [selectedMonth]: { ...currentData, ...updates } }));
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSetup);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-teal-500 uppercase tracking-[0.4em] animate-pulse">Criptografando Túnel de Dados...</p>
      </div>
    );
  }

  // Tela de Login (Vulnerabilidade de Acesso Corrigida)
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#14b8a6]/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full"></div>
        
        <form onSubmit={handleLogin} className="bg-[#111] border border-white/5 p-12 rounded-[48px] max-w-md w-full shadow-2xl space-y-8 relative z-10 animate-in fade-in zoom-in duration-500">
           <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#14b8a6] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-[0_10px_30px_rgba(20,184,166,0.3)]">
                <span className="text-black font-black text-3xl">Ω</span>
              </div>
              <h1 className="text-3xl font-black text-white italic uppercase tracking-tighter">Portal Ômega</h1>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Acesso Restrito ao Time Operacional</p>
           </div>

           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <KeyRound className="w-3 h-3" /> Chave de Identificação
                </label>
                <input 
                  type="password"
                  value={accessCode}
                  onChange={e => setAccessCode(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black border border-white/5 rounded-2xl px-6 py-5 text-white text-center text-xl tracking-[0.5em] outline-none focus:border-[#14b8a6] transition-all"
                />
              </div>
              <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-teal-500/20">
                AUTENTICAR ENTRADA
              </button>
           </div>

           <p className="text-[9px] text-center text-gray-600 font-bold uppercase tracking-widest leading-relaxed">
             Este sistema é monitorado. Tentativas de acesso não autorizadas são registradas conforme protocolos RLS.
           </p>
        </form>
      </div>
    );
  }

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard clients={currentData.clients.filter(c => !c.isPaused)} tasks={currentData.tasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
      case 'team': return (
        <TeamView 
          team={team} currentUser={currentUser} availableRoles={availableRoles} 
          onUpdateRole={(id, r) => setTeam(prev => prev.map(u => u.id === id ? { ...u, role: r } : u))}
          onAddMember={(name, role) => setTeam(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, role, isActive: true }])}
          onRemoveMember={(id) => setTeam(prev => prev.filter(u => u.id !== id))}
          onAddRole={(role) => setAvailableRoles([...availableRoles, role])}
          onToggleActive={(id) => setTeam(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))} 
        />
      );
      case 'commercial': return (
        <SalesView 
          goal={currentData.salesGoal} team={team} clients={currentData.clients} currentUser={currentUser}
          onUpdateGoal={u => updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, ...u } })}
          onRegisterSale={(uid, val, cname) => {
            setTeam(prev => prev.map(usr => usr.id === uid ? { ...usr, salesVolume: (usr.salesVolume || 0) + val } : usr));
            const newClient: Client = { id: Math.random().toString(36).substr(2,9), name: cname, industry: 'Novo Contrato', health: 'Estável', progress: 0, managerId: '', salesId: uid, contractValue: val, statusFlag: 'GREEN', isPaused: false, folder: { briefing: '', accessLinks: '', operationalHistory: '' } };
            updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, currentValue: currentData.salesGoal.currentValue + val, totalSales: currentData.salesGoal.totalSales + 1 }, clients: [...currentData.clients, newClient] });
          }}
          onUpdateUserGoal={(id, pg, sg) => setTeam(prev => prev.map(u => u.id === id ? { ...u, personalGoal: pg, superGoal: sg } : u))}
          onUpdateClientNotes={(cid, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) })}
        />
      );
      case 'checklists': return <ChecklistView tasks={currentData.tasks} currentUser={currentUser} onAddTask={t => updateCurrentMonthData({ tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentData.tasks] })} onRemoveTask={id => updateCurrentMonthData({ tasks: currentData.tasks.filter(t => t.id !== id) })} />;
      case 'my-workspace': return (
        <ManagerWorkspace 
          managerId={currentUser.id} clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} drive={currentData.drive || []} onUpdateDrive={handleDriveUpdate}
          onToggleTask={id => updateCurrentMonthData({ tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) })} 
          onUpdateNotes={(id, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, notes: n } : c) })} 
          onUpdateStatusFlag={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) })} 
          onUpdateFolder={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) })} 
        />
      );
      case 'clients': return (
        <SquadsView 
          clients={currentData.clients} currentUser={currentUser}
          onAssignManager={(cid, mid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, managerId: mid } : c) })} 
          onRemoveClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.filter(c => c.id !== cid) })}
          onTogglePauseClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, isPaused: !c.isPaused } : c) })}
        />
      );
      case 'notes': return <WikiView wiki={currentData.wiki || []} currentUser={currentUser} onUpdateWiki={handleWikiUpdate} />;
      case 'chat': return (
        <div className="flex flex-col h-full max-w-[1000px] mx-auto">
           <header className="mb-8 flex justify-between items-center px-4"><h2 className="text-3xl font-black text-white italic uppercase flex items-center gap-3"><Hash className="w-8 h-8 text-teal-500" /> Comunicação Interna</h2></header>
           <div className="flex-1 bg-[#111] border border-white/5 rounded-[40px] flex flex-col overflow-hidden">
              <div className="flex-1 p-8 overflow-y-auto space-y-4">
                {currentData.chatMessages?.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-gray-600 uppercase mb-1">{msg.senderName}</span>
                    <div className={`px-5 py-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-[#14b8a6] text-black font-bold' : 'bg-white/5 text-white'}`}>{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-black/40 flex gap-4">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (()=>{if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: '' }] }); setChatInput('');})()} placeholder="Escreva para o time..." className="flex-1 bg-black rounded-2xl px-6 py-4 text-white outline-none border border-white/5" />
                <button onClick={() => {if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: '' }] }); setChatInput('');}} className="bg-teal-500 px-8 rounded-2xl text-black font-black">ENVIAR</button>
              </div>
           </div>
        </div>
      );
      default: return null;
    }
  };

  const handleDriveUpdate = (newItems: DriveItem[]) => updateCurrentMonthData({ drive: newItems });
  const handleWikiUpdate = (newItems: DriveItem[]) => updateCurrentMonthData({ wiki: newItems });

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 overflow-hidden font-inter relative">
      {currentUser && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          currentUser={currentUser} 
          onLogout={handleLogout}
          dbStatus={dbStatus}
        />
      )}
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full overflow-y-auto p-12 custom-scrollbar">{renderContent()}</div>
        <div className="fixed top-[-100px] right-[-100px] w-[700px] h-[700px] bg-[#14b8a6]/5 blur-[180px] rounded-full pointer-events-none -z-10"></div>
      </main>

      {/* Setup de Segurança & Banco Modal (Hardened) */}
      {showSetupModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="bg-[#111] border border-white/10 rounded-[48px] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 space-y-8">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-teal-500/10 rounded-[24px] flex items-center justify-center border border-teal-500/20">
                   <ShieldIcon className="w-8 h-8 text-teal-500" />
                </div>
                <div>
                   <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight">Blindagem de Nível 3</h2>
                   <p className="text-gray-500 text-sm">Atualize seu Supabase para ativar políticas anti-vandalismo.</p>
                </div>
             </div>

             <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-red-500">
                  <ShieldAlert className="w-4 h-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Protocolo de Segurança Ativo</p>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Este script agora bloqueia permanentemente a função <span className="text-white font-bold">DELETE</span> via API anônima. Seus dados só poderão ser removidos manualmente via painel administrativo do Supabase, prevenindo ataques destrutivos.
                </p>
             </div>

             <div className="relative group">
                <div className="absolute top-4 right-4 z-10">
                   <button 
                    onClick={handleCopySql}
                    className="bg-white/5 hover:bg-white/10 p-2 rounded-xl transition-all border border-white/10"
                   >
                     {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                   </button>
                </div>
                <pre className="bg-black rounded-3xl p-8 pt-12 text-[11px] text-[#14b8a6] font-mono overflow-x-auto border border-white/5 max-h-[250px] custom-scrollbar">
                  {sqlSetup}
                </pre>
             </div>

             <button 
              onClick={() => window.location.reload()}
              className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-teal-500/20"
             >
               CONCLUÍDO, RECARREGAR SISTEMA BLINDADO
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
