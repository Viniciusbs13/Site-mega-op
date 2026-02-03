
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
import { Hash, LogOut, Lock, Database, ShieldCheck as ShieldIcon, Mail, Fingerprint, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [isLoading, setIsLoading] = useState(true);
  const [isDataReady, setIsDataReady] = useState(false); // Flag para evitar saves precoces
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [requestedRole, setRequestedRole] = useState<UserRole>(DefaultUserRole.MANAGER);
  
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('connected');
  const [showSetupModal, setShowSetupModal] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [chatInput, setChatInput] = useState('');

  const [availableRoles, setAvailableRoles] = useState<string[]>(Object.values(DefaultUserRole));
  const [team, setTeam] = useState<User[]>([
    { id: 'ceo-master', name: 'Vinícius (CEO)', role: DefaultUserRole.CEO, isActive: true, isApproved: true, email: 'viniciusbarbosasampaio71@gmail.com' }
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

  const sqlSetup = `-- CONFIGURAÇÃO DO BANCO ÔMEGA
-- 1. TABELA DE ESTADO ÚNICO
CREATE TABLE IF NOT EXISTS project_state (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ATIVAR RLS
ALTER TABLE project_state ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICA DE ACESSO TOTAL (GARANTE CONEXÃO 100%)
-- Esta política permite que usuários autenticados e o backdoor anônimo operem os dados
DROP POLICY IF EXISTS "Acesso Total" ON project_state;
CREATE POLICY "Acesso Total" ON project_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);`;

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      
      // Tentar carregar dados do Cloud
      const result = await dbService.loadState();
      
      if (result.error === 'TABLE_NOT_FOUND') {
        setShowSetupModal(true);
      } else if (result.state) {
        setTeam(result.state.team);
        setAvailableRoles(result.state.availableRoles);
        setDb(result.state.db);
        setIsDataReady(true);
      } else {
        // Se não houver dados no banco mas a tabela existir, marca como pronto para o primeiro save
        setIsDataReady(true);
      }

      // Checar se já existe sessão de backdoor (Omega)
      const isOmegaBackdoor = localStorage.getItem('omega_backdoor_session') === 'true';
      if (isOmegaBackdoor) {
        setCurrentUser({
          id: 'backdoor-ceo',
          name: 'Diretoria (Mestre)',
          role: DefaultUserRole.CEO,
          isActive: true,
          isApproved: true
        });
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      // Checar Sessão Supabase
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        if (session.user.email === 'viniciusbarbosasampaio71@gmail.com') {
          setCurrentUser({
            id: 'vinicius-ceo',
            authId: session.user.id,
            email: session.user.email,
            name: 'Vinícius Barbosa',
            role: DefaultUserRole.CEO,
            isActive: true,
            isApproved: true
          });
          setIsAuthenticated(true);
        } else {
          // Buscar no time carregado
          const userMatch = result.state?.team.find(u => u.authId === session.user.id || u.email === session.user.email);
          if (userMatch) {
            setCurrentUser(userMatch);
            setIsAuthenticated(true);
          }
        }
      }
      
      setIsLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        if (session.user.email === 'viniciusbarbosasampaio71@gmail.com') {
           setCurrentUser({ id: 'vinicius-ceo', authId: session.user.id, email: session.user.email, name: 'Vinícius Barbosa', role: DefaultUserRole.CEO, isActive: true, isApproved: true });
           setIsAuthenticated(true);
        } else {
          // Recarrega estado para garantir que pegamos o usuário recém aprovado
          const res = await dbService.loadState();
          const user = res.state?.team.find(u => u.authId === session.user.id || u.email === session.user.email);
          if (user) {
            setCurrentUser(user);
            setIsAuthenticated(true);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setCurrentUser(null);
        localStorage.removeItem('omega_backdoor_session');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // SINCRONIZAÇÃO NUVEM (AUTO-SAVE INTELIGENTE)
  useEffect(() => {
    // SÓ SALVA SE: não estiver carregando, tabela existir, usuário logado E os dados iniciais foram carregados
    if (!isLoading && !showSetupModal && isAuthenticated && isDataReady) {
      const sync = async () => {
        setDbStatus('syncing');
        const result = await dbService.saveState({ team, availableRoles, db });
        if (result.success) setDbStatus('connected');
        else setDbStatus('error');
      };
      const timeout = setTimeout(sync, 1200); // Debounce para não sobrecarregar
      return () => clearTimeout(timeout);
    }
  }, [team, availableRoles, db, isLoading, showSetupModal, isAuthenticated, isDataReady]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // BACKDOOR CEO (ÔMEGA)
    if (email === 'Omega' && password === 'eu que mando') {
       localStorage.setItem('omega_backdoor_session', 'true');
       setCurrentUser({ id: 'backdoor-ceo', name: 'Diretoria (Mestre)', role: DefaultUserRole.CEO, isActive: true, isApproved: true });
       setIsAuthenticated(true);
       return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      alert('Falha na autenticação Cloud.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return alert('Sua senha deve ter no mínimo 6 dígitos.');
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { full_name: fullName } }
      });
      
      if (error) throw error;
      
      if (data.user) {
        const isVinicius = email === 'viniciusbarbosasampaio71@gmail.com';
        const newUser: User = {
          id: isVinicius ? 'vinicius-ceo' : Math.random().toString(36).substr(2, 9),
          authId: data.user.id,
          email: email,
          name: fullName,
          role: isVinicius ? DefaultUserRole.CEO : requestedRole,
          isActive: true,
          isApproved: isVinicius
        };

        const updatedTeam = [...team, newUser];
        setTeam(updatedTeam);
        // Forçar save imediato no registro para o CEO ver
        await dbService.saveState({ team: updatedTeam, availableRoles, db });
        
        alert(isVinicius ? 'Acesso Master Liberado!' : 'Solicitação enviada! Aguarde a liberação do Vinícius.');
        setAuthMode('LOGIN');
      }
    } catch (err: any) {
      alert('Erro no cadastro: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem('omega_backdoor_session');
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
        <p className="text-[10px] font-black text-teal-500 uppercase tracking-[0.4em] animate-pulse">Sincronizando Ômega Cloud...</p>
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
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Nome</label>
                    <input required type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu Nome" className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none focus:border-[#14b8a6] transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Cargo</label>
                    <select value={requestedRole} onChange={e => setRequestedRole(e.target.value)} className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white text-sm outline-none">
                      {availableRoles.filter(r => r !== 'CEO').map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Identificação</label>
                <div className="relative">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="E-mail ou ID Master" className="w-full bg-black border border-white/5 rounded-2xl px-12 py-4 text-white text-sm outline-none focus:border-[#14b8a6] transition-all" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Chave Segura</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                  <input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-black border border-white/5 rounded-2xl px-12 py-4 text-white text-sm outline-none focus:border-[#14b8a6] transition-all" />
                </div>
              </div>

              <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_15px_30px_rgba(20,184,166,0.2)] flex items-center justify-center gap-3 mt-4 italic">
                {authMode === 'LOGIN' ? 'AUTENTICAR' : 'SOLICITAR ACESSO'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (currentUser && !currentUser.isApproved) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6 text-center font-inter">
         <div className="max-w-md space-y-8 animate-in zoom-in duration-500">
            <Fingerprint className="w-32 h-32 text-teal-500 mx-auto animate-pulse" />
            <div className="space-y-4">
               <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Acesso em Fila</h2>
               <p className="text-gray-500 text-sm leading-relaxed px-6">
                 Olá, <span className="text-white font-bold">{currentUser.name}</span>. Sua identidade Cloud foi criada. 
                 Agora o <span className="text-white">Vinícius</span> precisa aprovar seu acesso ao setor de <span className="text-teal-500 font-bold">{currentUser.role.replace('_', ' ')}</span>.
               </p>
            </div>
            <button onClick={handleLogout} className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-3 mx-auto hover:text-red-400 italic">
               <LogOut className="w-4 h-4" /> CANCELAR E SAIR
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
          managerId={currentUser.id} clients={currentData.clients} tasks={currentData.tasks} currentUser={currentUser} drive={currentData.drive || []} onUpdateDrive={(newItems) => updateCurrentMonthData({ drive: newItems })}
          onToggleTask={id => updateCurrentMonthData({ tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) })} 
          // Fixed: Changed 'cid' to 'id' as 'cid' was not defined
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
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-gray-300 overflow-hidden font-inter relative">
      {currentUser && currentUser.isApproved && (
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
             <h2 className="text-2xl font-black text-white uppercase italic">Configuração de Nuvem Necessária</h2>
             <p className="text-gray-500 text-sm leading-relaxed">Sua estrutura de dados Ômega não foi encontrada no Cloud. Copie e execute o script abaixo no SQL Editor do Supabase para conectar:</p>
             <div className="relative group">
                <pre className="bg-black rounded-3xl p-6 text-[10px] text-teal-500 font-mono text-left overflow-x-auto max-h-[150px] custom-scrollbar">{sqlSetup}</pre>
                <button onClick={() => {navigator.clipboard.writeText(sqlSetup); alert('SQL Copiado!')}} className="absolute top-4 right-4 bg-white/5 p-2 rounded-lg text-white hover:bg-white/10 transition-all"><Database className="w-4 h-4"/></button>
             </div>
             <button onClick={() => window.location.reload()} className="w-full bg-[#14b8a6] text-black py-4 rounded-xl font-black uppercase italic hover:scale-105 transition-all">Sincronizar Protocolo</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
