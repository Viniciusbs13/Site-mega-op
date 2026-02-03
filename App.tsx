
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
import { supabase } from './supabaseClient';
import { Hash, LogIn, ShieldCheck, UserCircle, LogOut, Lock, RefreshCw, AlertCircle, Copy, Check, Database, ShieldAlert, ShieldCheck as ShieldIcon, KeyRound, UserPlus, Mail, Fingerprint } from 'lucide-react';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [isLoading, setIsLoading] = useState(true);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>(DefaultUserRole.MANAGER);
  
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('connected');
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [chatInput, setChatInput] = useState('');

  const [availableRoles, setAvailableRoles] = useState<string[]>(Object.values(DefaultUserRole));
  const [team, setTeam] = useState<User[]>([
    { id: 'ceo-master', name: 'Diretoria Ômega', role: DefaultUserRole.CEO, isActive: true, isApproved: true }
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

  const sqlSetup = `-- 1. TABELA ATÔMICA
CREATE TABLE IF NOT EXISTS project_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ATIVAR BLINDAGEM RLS
ALTER TABLE project_state ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS
DROP POLICY IF EXISTS "Acesso Público" ON project_state;
CREATE POLICY "Acesso Público" ON project_state FOR ALL TO anon USING (true);`;

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      // Carregar estado global
      const result = await dbService.loadState();
      if (result.error === 'TABLE_NOT_FOUND') setShowSetupModal(true);
      if (result.state) {
        setTeam(result.state.team);
        setAvailableRoles(result.state.availableRoles);
        setDb(result.state.db);
      }

      // Verificar sessão Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user && result.state) {
        const userInTeam = result.state.team.find(u => u.authId === session.user.id);
        if (userInTeam) {
          setCurrentUser(userInTeam);
          setIsAuthenticated(true);
        }
      }
      
      setIsLoading(false);
    };
    init();

    // Listener de Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Recarregar para garantir que pegamos o time atualizado
        const res = await dbService.loadState();
        if (res.state) {
          const user = res.state.team.find(u => u.authId === session.user.id);
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && !showSetupModal && isAuthenticated) {
      const sync = async () => {
        setDbStatus('syncing');
        const result = await dbService.saveState({ team, availableRoles, db });
        if (result.success) setDbStatus('connected');
        else setDbStatus('error');
      };
      const timeout = setTimeout(sync, 1500);
      return () => clearTimeout(timeout);
    }
  }, [team, availableRoles, db, isLoading, showSetupModal, isAuthenticated]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          authId: data.user.id,
          email: email,
          name: fullName,
          role: requestedRole,
          isActive: false,
          isApproved: false
        };
        // Atualizar estado local do time e sincronizar imediatamente
        const newTeam = [...team, newUser];
        setTeam(newTeam);
        await dbService.saveState({ team: newTeam, availableRoles, db });
        alert('Cadastro realizado! Aguarde a aprovação de um administrador para acessar o sistema.');
        setAuthMode('LOGIN');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const currentData = db[selectedMonth] || { 
    clients: [], tasks: [], salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: '' }, 
    chatMessages: [], drive: [], wiki: []
  };

  const updateCurrentMonthData = (updates: Partial<MonthlyData[string]>) => {
    setDb(prev => ({ ...prev, [selectedMonth]: { ...currentData, ...updates } }));
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-black text-teal-500 uppercase tracking-[0.4em] animate-pulse">Sincronizando Ômega Cloud...</p>
      </div>
    );
  }

  // Tela de Autenticação Reestruturada
  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#14b8a6]/10 blur-[120px] rounded-full"></div>
        
        <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister} className="bg-[#111] border border-white/5 p-10 rounded-[48px] max-w-md w-full shadow-2xl space-y-6 relative z-10 animate-in fade-in zoom-in duration-500">
           <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-[#14b8a6] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_10px_30px_rgba(20,184,166,0.3)]">
                <span className="text-black font-black text-2xl">Ω</span>
              </div>
              <h1 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {authMode === 'LOGIN' ? 'Portal de Acesso' : 'Solicitar Cadastro'}
              </h1>
           </div>

           <div className="space-y-4">
              {authMode === 'REGISTER' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2 flex items-center gap-2"><UserCircle className="w-3 h-3" /> Nome Completo</label>
                    <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu Nome" className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#14b8a6]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2 flex items-center gap-2"><ShieldIcon className="w-3 h-3" /> Função Desejada</label>
                    <select value={requestedRole} onChange={e => setRequestedRole(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none">
                      {availableRoles.filter(r => r !== 'CEO').map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Mail className="w-3 h-3" /> E-mail Profissional</label>
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#14b8a6]" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2 flex items-center gap-2"><Lock className="w-3 h-3" /> Senha</label>
                <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#14b8a6]" />
              </div>

              <button type="submit" className="w-full bg-[#14b8a6] text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-teal-500/20">
                {authMode === 'LOGIN' ? 'ENTRAR NO SISTEMA' : 'SOLICITAR ADMISSÃO'}
              </button>
           </div>

           <div className="text-center">
             <button type="button" onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')} className="text-[10px] font-bold text-gray-500 hover:text-teal-500 uppercase tracking-widest">
               {authMode === 'LOGIN' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça Login'}
             </button>
           </div>
        </form>
      </div>
    );
  }

  // Tela de Bloqueio (Não aprovado)
  if (currentUser && !currentUser.isApproved) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6 text-center">
         <div className="max-w-md space-y-6">
            <Fingerprint className="w-20 h-20 text-teal-500 mx-auto animate-pulse" />
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Acesso Pendente</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Olá, <span className="text-white">{currentUser.name}</span>. Sua solicitação para a função de <span className="text-teal-500">{currentUser.role.replace('_', ' ')}</span> foi registrada com sucesso.
              <br /><br />
              A diretoria precisa aprovar seu perfil antes que você possa visualizar os dados da empresa.
            </p>
            <button onClick={handleLogout} className="text-xs font-black text-red-500 uppercase tracking-widest flex items-center gap-2 mx-auto hover:text-red-400">
               <LogOut className="w-4 h-4" /> Cancelar e Sair
            </button>
         </div>
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
          onAddMember={(name, role) => setTeam(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, role, isActive: true, isApproved: true }])}
          onRemoveMember={(id) => setTeam(prev => prev.filter(u => u.id !== id))}
          onAddRole={(role) => setAvailableRoles([...availableRoles, role])}
          onToggleActive={(id) => setTeam(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive, isApproved: true } : u))} 
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

      {showSetupModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="bg-[#111] border border-white/10 rounded-[48px] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 space-y-8 text-center">
             <ShieldIcon className="w-16 h-16 text-teal-500 mx-auto" />
             <h2 className="text-2xl font-black text-white uppercase italic">Sincronização Inicial</h2>
             <p className="text-gray-500 text-sm leading-relaxed">Execute o script SQL no Supabase para inicializar o cluster de dados.</p>
             <pre className="bg-black rounded-3xl p-6 text-[10px] text-teal-500 font-mono text-left overflow-x-auto max-h-[150px]">{sqlSetup}</pre>
             <button onClick={() => window.location.reload()} className="w-full bg-[#14b8a6] text-black py-4 rounded-xl font-black uppercase">RECARREGAR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
