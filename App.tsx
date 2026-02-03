
import React, { useState, useEffect, useRef } from 'react';
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
import SettingsView from './components/SettingsView';
import { dbService, DbResult } from './services/database';
import { supabase } from './supabaseClient';
import { Hash, LogOut, Lock, Database, ShieldCheck as ShieldIcon, Mail, Fingerprint, ChevronRight, AlertCircle, RefreshCw, ServerCrash } from 'lucide-react';

const sqlSetup = `
-- COLE ISSO NO SQL EDITOR DO SUPABASE E CLIQUE EM RUN:

-- 1. Cria a tabela de estado
CREATE TABLE IF NOT EXISTS project_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ativa o Row Level Security (RLS)
ALTER TABLE project_state ENABLE ROW LEVEL SECURITY;

-- 3. Cria as políticas de acesso total para usuários logados
DROP POLICY IF EXISTS "Acesso Total" ON project_state;
CREATE POLICY "Acesso Total" ON project_state
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Habilita o Realtime para esta tabela
ALTER PUBLICATION supabase_realtime ADD TABLE project_state;
`.trim();

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isDataReady, setIsDataReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>(DefaultUserRole.MANAGER);
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('connected');
  const [showSetupModal, setShowSetupModal] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [chatInput, setChatInput] = useState('');

  const [availableRoles, setAvailableRoles] = useState<string[]>(Object.values(DefaultUserRole));
  const [team, setTeam] = useState<User[]>([]);
  
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

  const lastIncomingData = useRef<string>("");

  const syncUserAndEnter = async (session: any, currentTeam: User[], currentRoles: string[], currentDb: MonthlyData) => {
    if (!session?.user) return;
    
    const userEmail = session.user.email;
    const isVinicius = userEmail === 'viniciusbarbosasampaio71@gmail.com';
    
    let userMatch = currentTeam.find(u => u.authId === session.user.id || u.email === userEmail);

    if (isVinicius && !userMatch) {
      userMatch = {
        id: 'vinicius-ceo',
        authId: session.user.id,
        email: userEmail,
        name: 'Vinícius (CEO)',
        role: DefaultUserRole.CEO,
        isActive: true,
        isApproved: true
      };
      const updatedTeam = [userMatch, ...currentTeam.filter(u => u.id !== 'vinicius-ceo')];
      setTeam(updatedTeam);
      await dbService.saveState({ team: updatedTeam, availableRoles: currentRoles, db: currentDb });
    } else if (!userMatch) {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        authId: session.user.id,
        email: userEmail,
        name: session.user.user_metadata?.full_name || fullName || userEmail?.split('@')[0] || 'Novo Membro',
        role: DefaultUserRole.MANAGER,
        isActive: true,
        isApproved: true
      };
      const updatedTeam = [...currentTeam, newUser];
      setTeam(updatedTeam);
      userMatch = newUser;
      // Salva na nuvem na hora do login para o CEO já ver
      await dbService.saveState({ team: updatedTeam, availableRoles: currentRoles, db: currentDb });
    }

    if (userMatch) {
      setCurrentUser(userMatch);
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const result = await dbService.loadState();
        
        if (result.error === 'TABLE_NOT_FOUND' || result.error === 'RLS_ERROR') {
          setLoadError(result.details || 'Erro de Banco de Dados');
          setShowSetupModal(true);
          // Não paramos o carregamento aqui para mostrar o modal
        }

        if (result.state) {
          setTeam(result.state.team);
          setAvailableRoles(result.state.availableRoles);
          setDb(result.state.db);
          setIsDataReady(true);
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          await syncUserAndEnter(
            session, 
            result.state?.team || [], 
            result.state?.availableRoles || availableRoles, 
            result.state?.db || db
          );
        } else {
          setIsLoading(false);
        }

        // --- REALTIME ---
        const channel = supabase
          .channel('schema-db-changes')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'project_state', filter: 'id=eq.current_omega_config' },
            (payload: any) => {
              const newData = payload.new.data as AppState;
              const dataString = JSON.stringify(newData);
              
              if (dataString !== lastIncomingData.current) {
                lastIncomingData.current = dataString;
                setTeam(newData.team);
                setAvailableRoles(newData.availableRoles);
                setDb(newData.db);
                if (currentUser) {
                  const updatedMe = newData.team.find(u => u.email === currentUser.email);
                  if (updatedMe) setCurrentUser(updatedMe);
                }
              }
            }
          )
          .subscribe();

        return () => { supabase.removeChannel(channel); };

      } catch (err) {
        setLoadError('Falha na conexão com Ômega Cloud.');
        setIsLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoading(true);
        const result = await dbService.loadState();
        await syncUserAndEnter(session, result.state?.team || [], result.state?.availableRoles || availableRoles, result.state?.db || db);
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading && !showSetupModal && isAuthenticated && isDataReady) {
      const currentState = { team, availableRoles, db };
      const currentStateString = JSON.stringify(currentState);

      if (currentStateString !== lastIncomingData.current) {
        const sync = async () => {
          setDbStatus('syncing');
          const result = await dbService.saveState(currentState);
          if (result.success) {
            setDbStatus('connected');
            lastIncomingData.current = currentStateString;
          } else {
            setDbStatus('error');
          }
        };
        const timeout = setTimeout(sync, 800);
        return () => clearTimeout(timeout);
      }
    }
  }, [team, availableRoles, db, isLoading, showSetupModal, isAuthenticated, isDataReady]);

  const handleUpdateUserName = (newName: string) => {
    if (!currentUser) return;
    const updatedUser = { ...currentUser, name: newName };
    setCurrentUser(updatedUser);
    setTeam(prev => prev.map(u => u.id === currentUser.id ? { ...u, name: newName } : u));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoadError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      alert('Acesso Negado: ' + err.message);
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return alert('Senha muito curta.');
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, password, options: { data: { full_name: fullName } } 
      });
      if (error) throw error;
      if (data.user) {
        alert('Cadastro realizado! Faça seu login agora.');
        setAuthMode('LOGIN');
      }
    } catch (err: any) {
      alert('Erro: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const currentData = db[selectedMonth] || { clients: [], tasks: [], salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: '' }, chatMessages: [], drive: [], wiki: [] };

  const updateCurrentMonthData = (updates: Partial<MonthlyData[string]>) => {
    setDb(prev => ({ ...prev, [selectedMonth]: { ...currentData, ...updates } }));
  };

  const renderContent = () => {
    if (!currentUser) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard clients={currentData.clients.filter(c => !c.isPaused)} tasks={currentData.tasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
      case 'team': return <TeamView team={team} currentUser={currentUser} availableRoles={availableRoles} onUpdateRole={(id, r) => setTeam(prev => prev.map(u => u.id === id ? { ...u, role: r } : u))} onAddMember={(name, role) => setTeam(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name, role, isActive: true, isApproved: true }])} onRemoveMember={(id) => setTeam(prev => prev.filter(u => u.id !== id))} onAddRole={(role) => setAvailableRoles([...availableRoles, role])} onToggleActive={(id) => setTeam(prev => prev.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u))} />;
      case 'commercial': return <SalesView goal={currentData.salesGoal} team={team} clients={currentData.clients} currentUser={currentUser} onUpdateGoal={u => updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, ...u } })} onRegisterSale={(uid, val, cname) => { setTeam(prev => prev.map(usr => usr.id === uid ? { ...usr, salesVolume: (usr.salesVolume || 0) + val } : usr)); const newClient: Client = { id: Math.random().toString(36).substr(2,9), name: cname, industry: 'Novo Contrato', health: 'Estável', progress: 0, managerId: '', salesId: uid, contractValue: val, statusFlag: 'GREEN', isPaused: false, folder: { briefing: '', accessLinks: '', operationalHistory: '' } }; updateCurrentMonthData({ salesGoal: { ...currentData.salesGoal, currentValue: currentData.salesGoal.currentValue + val, totalSales: currentData.salesGoal.totalSales + 1 }, clients: [...currentData.clients, newClient] }); }} onUpdateUserGoal={(id, pg, sg) => setTeam(prev => prev.map(u => u.id === id ? { ...u, personalGoal: pg, superGoal: sg } : u))} onUpdateClientNotes={(cid, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) })} />;
      case 'checklists': return <ChecklistView tasks={currentData.tasks} currentUser={currentUser} onAddTask={t => updateCurrentMonthData({ tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentData.tasks] })} onRemoveTask={id => updateCurrentMonthData({ tasks: currentData.tasks.filter(t => t.id !== id) })} />;
      case 'my-workspace': return <ManagerWorkspace managerId={currentUser.id} clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} drive={currentData.drive || []} onUpdateDrive={(newItems) => updateCurrentMonthData({ drive: newItems })} onToggleTask={id => updateCurrentMonthData({ tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) })} onUpdateNotes={(id, n) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, notes: n } : c) })} onUpdateStatusFlag={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) })} onUpdateFolder={(id, f) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) })} />;
      case 'clients': return <SquadsView clients={currentData.clients} currentUser={currentUser} onAssignManager={(cid, mid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, managerId: mid } : c) })} onRemoveClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.filter(c => c.id !== cid) })} onTogglePauseClient={(cid) => updateCurrentMonthData({ clients: currentData.clients.map(c => c.id === cid ? { ...c, isPaused: !c.isPaused } : c) })} />;
      case 'notes': return <WikiView wiki={currentData.wiki || []} currentUser={currentUser} onUpdateWiki={(newItems) => updateCurrentMonthData({ wiki: newItems })} />;
      case 'chat': return (
        <div className="flex flex-col h-full max-w-[1000px] mx-auto">
           <header className="mb-8 flex justify-between items-center px-4"><h2 className="text-3xl font-black text-white italic uppercase flex items-center gap-3"><Hash className="w-8 h-8 text-teal-500" /> Comunicação Direta</h2></header>
           <div className="flex-1 bg-[#111] border border-white/5 rounded-[40px] flex flex-col overflow-hidden shadow-2xl">
              <div className="flex-1 p-8 overflow-y-auto space-y-4">
                {currentData.chatMessages?.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-gray-600 uppercase mb-1">{msg.senderName}</span>
                    <div className={`px-5 py-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-[#14b8a6] text-black font-bold shadow-lg shadow-teal-500/10' : 'bg-white/5 text-white'}`}>{msg.text}</div>
                  </div>
                ))}
              </div>
              <div className="p-6 bg-black/40 flex gap-4">
                <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (()=>{if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: '' }] }); setChatInput('');})()} placeholder="Comando para o time..." className="flex-1 bg-black rounded-2xl px-6 py-4 text-white outline-none border border-white/5 focus:border-teal-500/30 transition-all" />
                <button onClick={() => {if(!chatInput.trim())return; updateCurrentMonthData({ chatMessages: [...(currentData.chatMessages || []), { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: '' }] }); setChatInput('');}} className="bg-teal-500 px-8 rounded-2xl text-black font-black italic hover:scale-105 transition-all">ENVIAR</button>
              </div>
           </div>
        </div>
      );
      case 'settings': return <SettingsView currentUser={currentUser} theme={theme} setTheme={setTheme} onUpdateName={handleUpdateUserName} onLogout={handleLogout} />;
      default: return null;
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center space-y-4">
          <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em] animate-pulse">Sincronizando Ômega Cloud</p>
          {loadError && (
            <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-2xl max-w-sm">
               <div className="flex items-center gap-2 text-red-500 mb-2">
                 <ServerCrash className="w-4 h-4" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Erro de Banco de Dados</span>
               </div>
               <p className="text-[10px] text-gray-400 italic leading-relaxed">{loadError}</p>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="flex items-center gap-2 text-[9px] text-gray-500 hover:text-white transition-colors uppercase border border-white/5 px-6 py-2 rounded-full">
            <RefreshCw className="w-3 h-3" /> Reiniciar
          </button>
          <button onClick={() => setIsLoading(false)} className="text-[9px] text-teal-500/50 hover:text-teal-500 transition-colors uppercase border border-teal-500/10 px-6 py-2 rounded-full">Forçar Entrada</button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden font-inter">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#14b8a6]/10 blur-[150px] rounded-full"></div>
        <div className="w-full max-w-md relative z-10 space-y-8">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-[#14b8a6] rounded-[24px] flex items-center justify-center mx-auto shadow-[0_20px_40px_rgba(20,184,166,0.3)] transform rotate-3">
              <span className="text-black font-black text-4xl italic">Ω</span>
            </div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">Omega System</h1>
            <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em]">Gestão Operacional de Elite</p>
          </div>
          <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister} className="bg-[#111]/80 backdrop-blur-xl border border-white/5 p-10 rounded-[48px] shadow-2xl space-y-6">
            <div className="flex bg-black/40 p-1 rounded-2xl mb-4">
              <button type="button" onClick={() => setAuthMode('LOGIN')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${authMode === 'LOGIN' ? 'bg-[#14b8a6] text-black' : 'text-gray-500'}`}>Acessar</button>
              <button type="button" onClick={() => setAuthMode('REGISTER')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${authMode === 'REGISTER' ? 'bg-[#14b8a6] text-black' : 'text-gray-500'}`}>Novo</button>
            </div>
            <div className="space-y-4">
              {authMode === 'REGISTER' && (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Nome Completo</label>
                    <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Como quer ser chamado?" className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#14b8a6] transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Sua Função</label>
                    <select value={requestedRole} onChange={e => setRequestedRole(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none">
                      {availableRoles.filter(r => r !== 'CEO').map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </>
              )}
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">E-mail Corporativo</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@omega.com" className="w-full bg-black border border-white/5 rounded-2xl px-12 py-4 text-white text-sm outline-none focus:border-[#14b8a6] transition-all" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Senha Segura</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black border border-white/5 rounded-2xl px-12 py-4 text-white text-sm outline-none focus:border-[#14b8a6] transition-all" />
                </div>
              </div>
              <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_rgba(20,184,166,0.2)] flex items-center justify-center gap-3 mt-4 italic">
                {authMode === 'LOGIN' ? 'ENTRAR AGORA' : 'REGISTRAR NO TIME'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen ${theme === 'dark' ? 'bg-[#0a0a0a] text-gray-300' : 'bg-[#f4f7f6] text-slate-800'} overflow-hidden font-inter transition-colors duration-500 relative`}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} dbStatus={dbStatus} theme={theme} />
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full overflow-y-auto p-12 custom-scrollbar">{renderContent()}</div>
        <div className={`fixed top-[-100px] right-[-100px] w-[700px] h-[700px] ${theme === 'dark' ? 'bg-[#14b8a6]/5' : 'bg-[#14b8a6]/10'} blur-[180px] rounded-full pointer-events-none -z-10`}></div>
      </main>
      {showSetupModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-6">
          <div className="bg-[#111] border border-white/10 rounded-[48px] p-12 max-w-2xl w-full shadow-2xl animate-in zoom-in duration-300 space-y-8 text-center">
             <div className="flex justify-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center animate-pulse">
                   <ServerCrash className="w-10 h-10 text-red-500" />
                </div>
             </div>
             <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Erro de Configuração Supabase</h2>
             <p className="text-gray-400 text-sm leading-relaxed px-4">O Banco de Dados precisa que você execute o SQL abaixo no seu Console Supabase para liberar o Ômega Cloud:</p>
             <div className="relative group">
                <pre className="bg-black rounded-3xl p-6 text-[10px] text-teal-500 font-mono text-left overflow-x-auto max-h-[150px] border border-white/5 custom-scrollbar">{sqlSetup}</pre>
                <button onClick={() => {navigator.clipboard.writeText(sqlSetup); alert('SQL Copiado!')}} className="absolute top-4 right-4 bg-white/10 p-2 rounded-lg text-white hover:bg-teal-500 hover:text-black transition-all shadow-lg"><Database className="w-4 h-4"/></button>
             </div>
             <div className="space-y-4">
                <p className="text-[10px] text-gray-500 italic">Tutorial: Menu Lateral Supabase > SQL Editor > New Query > Cole o código acima > Run</p>
                <button onClick={() => window.location.reload()} className="w-full bg-[#14b8a6] text-black py-4 rounded-xl font-black uppercase italic hover:scale-105 transition-all shadow-[0_15px_30px_rgba(20,184,166,0.3)]">RECONECTAR SISTEMA</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
