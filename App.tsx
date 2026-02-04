
import React, { useState, useEffect, useRef } from 'react';
import { UserRole, DefaultUserRole, Client, Task, User, MonthlyData, ClientStatus, SalesGoal, ChatMessage, ClientHealth, DriveItem, AppState, Squad } from './types';
import { INITIAL_CLIENTS, NAVIGATION_ITEMS, MANAGERS, MONTHS } from './constants';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SquadsView from './components/SquadsView';
import SquadsTabView from './components/SquadsTabView';
import ChecklistView from './components/ChecklistView';
import ManagerWorkspace from './components/ManagerWorkspace';
import TeamView from './components/TeamView';
import SalesView from './components/SalesView';
import WikiView from './components/WikiView'; 
import SettingsView from './components/SettingsView';
import { dbService, DbResult } from './services/database';
import { supabase } from './supabaseClient';
import { Hash, Bell, Database, WifiOff, Settings, LogOut, Send, Sparkles, Trophy, Star, Crown, Zap, Rocket, UserPlus, Key } from 'lucide-react';

const App: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const currentMonthName = MONTHS[new Date().getMonth()];
  const monthKey = `${currentMonthName} ${currentYear}`;

  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedMonth, setSelectedMonth] = useState(monthKey);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [dbStatus, setDbStatus] = useState<'connected' | 'error' | 'syncing'>('connected');
  const [chatInput, setChatInput] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  const [team, setTeam] = useState<User[]>([]);
  const [availableRoles, setAvailableRoles] = useState<string[]>(Object.values(DefaultUserRole));
  const [notifications, setNotifications] = useState<{ [userId: string]: number }>({});
  const [globalSaleCelebration, setGlobalSaleCelebration] = useState<{ sellerName: string; value: number } | null>(null);
  const [db, setDb] = useState<MonthlyData>({
    [monthKey]: {
      clients: INITIAL_CLIENTS,
      tasks: [],
      salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: '' },
      chatMessages: [], drive: [], wiki: [], squads: []
    }
  });

  const lastIncomingData = useRef<string>("");
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastHandledSaleId = useRef<string | null>(null);

  const playBellSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.2);
      gainNode.gain.setValueAtTime(0.6, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 3);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 3);
    } catch (e) {
      console.warn("Navegador bloqueou áudio automático.");
    }
  };

  const triggerCelebration = (sellerName: string, value: number) => {
    setGlobalSaleCelebration({ sellerName, value });
    playBellSound();
    setTimeout(() => setGlobalSaleCelebration(null), 10000);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.clear();
      window.location.reload();
    }
  };

  useEffect(() => {
    const init = async () => {
      const result = await dbService.loadState();
      if (result.state) {
        setTeam(result.state.team || []);
        setAvailableRoles(result.state.availableRoles || Object.values(DefaultUserRole));
        setDb(result.state.db || {});
        setNotifications(result.state.notifications || {});
        lastIncomingData.current = JSON.stringify(result.state);
        if (result.state.recentSale) {
          lastHandledSaleId.current = result.state.recentSale.id;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleAuth(session, result.state?.team || []);
      } else {
        setIsLoading(false);
      }

      const channel = supabase.channel('omega-realtime-master')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'project_state' }, (payload: any) => {
          const newData = payload.new.data as AppState;
          if (!newData) return;
          const newDataString = JSON.stringify(newData);
          if (newDataString !== lastIncomingData.current) {
            lastIncomingData.current = newDataString;
            setTeam(newData.team || []);
            setDb(newData.db || {});
            setNotifications(newData.notifications || {});
            if (newData.recentSale && newData.recentSale.id !== lastHandledSaleId.current) {
              lastHandledSaleId.current = newData.recentSale.id;
              triggerCelebration(newData.recentSale.sellerName, newData.recentSale.value);
            }
          }
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    };
    init();
  }, []);

  const handleAuth = async (session: any, currentTeam: User[]) => {
    const userEmail = session.user.email;
    let userMatch = currentTeam.find(u => u.authId === session.user.id || u.email === userEmail);
    if (!userMatch) {
      userMatch = { 
        id: Math.random().toString(36).substr(2, 9), 
        authId: session.user.id, 
        email: userEmail, 
        name: session.user.user_metadata?.full_name || userEmail.split('@')[0], 
        role: userEmail === 'viniciusbarbosasampaio71@gmail.com' ? DefaultUserRole.CEO : DefaultUserRole.MANAGER, 
        isActive: true, 
        isApproved: true 
      };
      const updatedTeam = [...currentTeam, userMatch];
      setTeam(updatedTeam);
      await forceCloudSync(updatedTeam, db, notifications);
    }
    setCurrentUser(userMatch);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

  const forceCloudSync = async (updatedTeam: User[], updatedDb: MonthlyData, updatedNotifs: any, updatedSale: any = null) => {
    setDbStatus('syncing');
    const state: AppState = { team: updatedTeam, availableRoles, db: updatedDb, notifications: updatedNotifs, recentSale: updatedSale };
    lastIncomingData.current = JSON.stringify(state);
    const result = await dbService.saveState(state);
    setDbStatus(result.success ? 'connected' : 'error');
  };

  const updateStateAndSync = (newTeam: User[], newDb: MonthlyData, newNotifs: any, newSale: any = null) => {
    setTeam(newTeam);
    setDb(newDb);
    setNotifications(newNotifs);
    if (newSale) {
      forceCloudSync(newTeam, newDb, newNotifs, newSale);
    } else {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = setTimeout(() => {
        forceCloudSync(newTeam, newDb, newNotifs, newSale);
      }, 500);
    }
  };

  const handleRegisterSale = (uid: string, val: number, cname: string, planItems: string[] = []) => {
    const seller = team.find(u => u.id === uid);
    const updatedTeam = team.map(u => u.id === uid ? { ...u, salesVolume: (u.salesVolume || 0) + val } : u);
    const currentMonthData = db[selectedMonth] || { clients: [], tasks: [], salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: '' }, chatMessages: [], drive: [], wiki: [], squads: [] };
    const newClient: Client = { 
      id: Math.random().toString(36).substr(2,9), 
      name: cname, 
      industry: 'Venda Comercial', 
      health: 'Excelente', 
      progress: 0, 
      assignedUserIds: [uid], 
      salesId: uid, 
      contractValue: val, 
      statusFlag: 'GREEN', 
      folder: {},
      planItems: planItems
    };
    const updatedDb = { 
      ...db, 
      [selectedMonth]: { 
        ...currentMonthData, 
        salesGoal: { 
          ...currentMonthData.salesGoal, 
          currentValue: (currentMonthData.salesGoal.currentValue || 0) + val, 
          totalSales: (currentMonthData.salesGoal.totalSales || 0) + 1 
        }, 
        clients: [...(currentMonthData.clients || []), newClient] 
      } 
    };
    
    const saleId = Date.now().toString();
    const sellerName = seller?.name || currentUser?.name || 'Operador';
    const saleSignal = { id: saleId, sellerName, value: val, timestamp: Date.now() };
    
    lastHandledSaleId.current = saleId;
    triggerCelebration(sellerName, val);
    updateStateAndSync(updatedTeam, updatedDb, notifications, saleSignal);
  };

  const handleUpdateClientPlan = (clientId: string, planItems: string[]) => {
    const currentMonthData = db[selectedMonth] || { clients: [], tasks: [], salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: '' }, chatMessages: [], drive: [], wiki: [], squads: [] };
    const updatedDb = {
      ...db,
      [selectedMonth]: {
        ...currentMonthData,
        clients: currentMonthData.clients.map(c => c.id === clientId ? { ...c, planItems } : c)
      }
    };
    updateStateAndSync(team, updatedDb, notifications);
  };

  if (isLoading) return <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center space-y-6"><div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div><p className="text-[10px] font-black text-teal-500 uppercase tracking-widest animate-pulse">Sincronizando Ômega Workspace...</p></div>;

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="w-24 h-24 bg-[#14b8a6] rounded-[40px] flex items-center justify-center mx-auto shadow-[0_20px_60px_rgba(20,184,166,0.4)] rotate-3 border-4 border-white/10"><span className="text-black font-black text-5xl italic">Ω</span></div>
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter">
              {authMode === 'login' ? 'Protocolo de Comando' : 'Protocolo de Recrutamento'}
            </h1>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-[0.3em]">
              {authMode === 'login' ? 'Módulo de Acesso Restrito' : 'Inscrição de Novo Colaborador'}
            </p>
          </div>

          <div className="bg-[#111] border border-white/5 p-10 rounded-[48px] space-y-5 shadow-2xl relative overflow-hidden group">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-500 to-transparent"></div>
             
             {authMode === 'register' && (
               <div className="space-y-1 text-left">
                  <label className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Nome Completo</label>
                  <input type="text" placeholder="Ex: Lucas Silva" id="auth_name" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-teal-500 transition-all font-bold" />
               </div>
             )}

             <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">E-mail Corporativo</label>
                <input type="email" placeholder="nome@omega.com" id="auth_email" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-teal-500 transition-all font-bold" />
             </div>

             <div className="space-y-1 text-left">
                <label className="text-[9px] font-black text-gray-600 uppercase ml-4 tracking-widest">Sua Chave Mestra</label>
                <input type="password" placeholder="••••••••" id="auth_pass" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-teal-500 transition-all font-bold" />
             </div>

             <button onClick={async () => {
                const em = (document.getElementById('auth_email') as HTMLInputElement).value;
                const ps = (document.getElementById('auth_pass') as HTMLInputElement).value;
                
                if (authMode === 'login') {
                  const { error } = await supabase.auth.signInWithPassword({ email: em, password: ps });
                  if (error) alert("Acesso Negado: Credenciais Inválidas");
                  else window.location.reload();
                } else {
                  const nm = (document.getElementById('auth_name') as HTMLInputElement).value;
                  if (!nm) { alert("Nome é obrigatório!"); return; }
                  const { error } = await supabase.auth.signUp({
                    email: em,
                    password: ps,
                    options: { data: { full_name: nm } }
                  });
                  if (error) alert("Erro no Cadastro: " + error.message);
                  else {
                    alert("Sucesso! Verifique seu e-mail ou faça login agora.");
                    setAuthMode('login');
                  }
                }
             }} className="w-full bg-teal-500 text-black py-5 rounded-2xl font-black uppercase hover:scale-105 active:scale-95 transition-all shadow-[0_15px_30px_rgba(20,184,166,0.2)]">
               {authMode === 'login' ? 'Entrar na Operação' : 'Finalizar Alistamento'}
             </button>

             <div className="pt-4">
                {authMode === 'login' ? (
                  <button onClick={() => setAuthMode('register')} className="text-[10px] text-gray-500 hover:text-teal-400 font-black uppercase tracking-widest transition-colors">
                    Não tem uma conta? <span className="underline decoration-teal-500/50">Recrute-se agora</span>
                  </button>
                ) : (
                  <button onClick={() => setAuthMode('login')} className="text-[10px] text-gray-500 hover:text-teal-400 font-black uppercase tracking-widest transition-colors">
                    Já possui acesso? <span className="underline decoration-teal-500/50">Voltar para o Comando</span>
                  </button>
                )}
             </div>

             <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest text-center pt-2">Omega Group © 2025</p>
          </div>
        </div>
      </div>
    );
  }

  // Filtered data calculation moved below the authentication check
  const currentMonthData = db[selectedMonth] || { clients: [], tasks: [], salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: '' }, chatMessages: [], drive: [], wiki: [], squads: [] };
  const myClients = currentMonthData.clients.filter(c => currentUser.role === DefaultUserRole.CEO || currentUser.role === DefaultUserRole.SALES || c.assignedUserIds?.includes(currentUser.id));
  const myTasks = currentMonthData.tasks.filter(t => currentUser.role === DefaultUserRole.CEO || t.assignedTo === 'ALL' || t.assignedTo === currentUser.id);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard clients={myClients} tasks={myTasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
      case 'commercial': return <SalesView goal={currentMonthData.salesGoal} team={team} clients={currentMonthData.clients} currentUser={currentUser} onUpdateGoal={u => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, salesGoal: { ...currentMonthData.salesGoal, ...u } } }, notifications)} onRegisterSale={handleRegisterSale} onUpdateUserGoal={(id, pg, sg) => updateStateAndSync(team.map(u => u.id === id ? { ...u, personalGoal: pg, superGoal: sg } : u), db, notifications)} onUpdateClientNotes={(cid, n) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, clients: currentMonthData.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) } }, notifications)} />;
      case 'squads-mgmt': return <SquadsTabView squads={currentMonthData.squads || []} team={team} currentUser={currentUser} onUpdateSquads={s => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, squads: s } }, notifications)} onAddTask={t => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentMonthData.tasks] } }, notifications)} />;
      case 'my-workspace': return <ManagerWorkspace managerId={currentUser.id} clients={myClients} tasks={myTasks} currentUser={currentUser} drive={currentMonthData.drive || []} onUpdateDrive={items => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, drive: items } }, notifications)} onToggleTask={id => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, tasks: currentMonthData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) } }, notifications)} onUpdateNotes={(id, n) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, clients: currentMonthData.clients.map(c => c.id === id ? { ...c, notes: n } : c) } }, notifications)} onUpdateStatusFlag={(id, f) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, clients: currentMonthData.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) } }, notifications)} onUpdateFolder={(id, f) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, clients: currentMonthData.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) } }, notifications)} onUpdatePlan={handleUpdateClientPlan} />;
      case 'checklists': return <ChecklistView tasks={myTasks} currentUser={currentUser} team={team} onAddTask={t => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentMonthData.tasks] } }, notifications)} onRemoveTask={id => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, tasks: currentMonthData.tasks.filter(t => t.id !== id) } }, notifications)} onToggleTask={id => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, tasks: currentMonthData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) } }, notifications)} />;
      case 'team': return <TeamView team={team} currentUser={currentUser} availableRoles={availableRoles} onUpdateRole={(id, r) => updateStateAndSync(team.map(u => u.id === id ? { ...u, role: r } : u), db, notifications)} onAddMember={(n, r) => updateStateAndSync([...team, { id: Math.random().toString(36).substr(2, 9), name: n, role: r, isActive: true, isApproved: true }], db, notifications)} onRemoveMember={id => updateStateAndSync(team.filter(u => u.id !== id), db, notifications)} onAddRole={r => setAvailableRoles([...availableRoles, r])} onToggleActive={id => updateStateAndSync(team.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u), db, notifications)} />;
      case 'clients': return (
        <SquadsView 
          clients={currentMonthData.clients} 
          team={team} 
          currentUser={currentUser} 
          onAssignUsers={(cid, uids) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, clients: currentMonthData.clients.map(c => c.id === cid ? { ...c, assignedUserIds: uids } : c) } }, notifications)} 
          onAddClient={c => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, clients: [...(currentMonthData.clients || []), c] } }, notifications)}
          onRemoveClient={cid => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, clients: currentMonthData.clients.filter(c => c.id !== cid) } }, notifications)} 
          onTogglePauseClient={cid => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, clients: currentMonthData.clients.map(c => c.id === cid ? { ...c, isPaused: !c.isPaused } : c) } }, notifications)} 
          onUpdatePlan={handleUpdateClientPlan}
        />
      );
      case 'chat': return (
        <div className="max-w-4xl mx-auto h-full flex flex-col pb-6">
          <header className="mb-8 px-4 flex items-center justify-between">
             <div><h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">Fluxo de Dados</h2><p className="text-[10px] text-teal-500 font-black uppercase tracking-[0.4em]">Realtime Communication</p></div>
          </header>
          <div className="flex-1 bg-[#111] rounded-[48px] border border-white/5 overflow-hidden flex flex-col p-10 space-y-6 custom-scrollbar shadow-inner">
            {currentMonthData.chatMessages?.map(m => (
              <div key={m.id} className={`flex flex-col ${m.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-gray-700 mb-1 font-bold uppercase tracking-widest">{m.senderName} • {m.timestamp}</span>
                <div className={`px-6 py-4 rounded-[24px] text-sm shadow-lg ${m.senderId === currentUser.id ? 'bg-[#14b8a6] text-black font-black' : 'bg-white/5 text-white'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex gap-4">
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (() => {
               if (!chatInput.trim() || !currentUser) return;
               const newMessage: ChatMessage = { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: new Date().toLocaleTimeString() };
               const updatedDb = { ...db, [selectedMonth]: { ...currentMonthData, chatMessages: [...(currentMonthData.chatMessages || []), newMessage] } };
               setChatInput(''); 
               updateStateAndSync(team, updatedDb, notifications);
            })()} placeholder="Transmitir mensagem..." className="flex-1 bg-black border border-white/10 rounded-3xl px-8 py-5 text-white outline-none focus:border-teal-500 transition-all font-bold" />
            <button onClick={() => {
              if (!chatInput.trim() || !currentUser) return;
              const newMessage: ChatMessage = { id: Date.now().toString(), senderId: currentUser.id, senderName: currentUser.name, text: chatInput, timestamp: new Date().toLocaleTimeString() };
              const updatedDb = { ...db, [selectedMonth]: { ...currentMonthData, chatMessages: [...(currentMonthData.chatMessages || []), newMessage] } };
              setChatInput(''); 
              updateStateAndSync(team, updatedDb, notifications);
            }} className="bg-teal-500 px-12 rounded-3xl text-black font-black uppercase flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-teal-500/30 italic"><Send className="w-5 h-5" /> Enviar</button>
          </div>
        </div>
      );
      case 'notes': return <WikiView wiki={currentMonthData.wiki || []} currentUser={currentUser} onUpdateWiki={items => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentMonthData, wiki: items } }, notifications)} />;
      case 'settings': return <SettingsView currentUser={currentUser} theme={theme} setTheme={setTheme} onUpdateName={n => updateStateAndSync(team.map(u => u.id === currentUser.id ? { ...u, name: n } : u), db, notifications)} onLogout={handleLogout} />;
      default: return null;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-inter transition-colors duration-700 relative ${theme === 'dark' ? 'bg-[#0a0a0a] text-gray-300' : 'bg-[#f4f7f6] text-slate-800'}`}>
      
      {/* CELEBRAÇÃO DE VENDAS CINEMATOGRÁFICA (SININHO) */}
      {globalSaleCelebration && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/95 backdrop-blur-[60px] animate-in fade-in zoom-in duration-700">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
             {Array.from({length: 60}).map((_, i) => (
               <div key={i} className="absolute bg-teal-400/40 w-1.5 h-1.5 rounded-full animate-ping shadow-[0_0_10px_rgba(45,212,191,0.5)]" style={{top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animationDuration: `${0.6 + Math.random() * 1.5}s`, animationDelay: `${Math.random() * 3}s`}}></div>
             ))}
          </div>

          <div className="text-center space-y-16 p-24 bg-white/[0.01] rounded-[240px] border border-teal-500/10 shadow-[0_0_500px_rgba(20,184,166,0.9)] relative overflow-hidden max-w-7xl w-full mx-6 transform scale-110">
            <div className="absolute inset-0 bg-gradient-to-b from-teal-500/50 via-transparent to-transparent"></div>
            <div className="absolute top-0 left-0 w-full h-2.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent animate-pulse shadow-[0_0_30px_rgba(20,184,166,1)]"></div>
            
            <div className="relative z-10 space-y-24">
              <div className="relative inline-block">
                <div className="absolute inset-0 blur-[200px] bg-teal-500/70 rounded-full animate-pulse"></div>
                <div className="relative group">
                  <Bell className="w-[450px] h-[450px] text-teal-400 animate-bell mx-auto drop-shadow-[0_0_150px_rgba(20,184,166,1)]" />
                  <Crown className="absolute -top-12 -right-12 w-40 h-40 text-amber-400 animate-bounce drop-shadow-[0_0_60px_rgba(251,191,36,0.9)]" />
                </div>
              </div>
              
              <div className="space-y-14">
                <div className="flex flex-col items-center gap-10">
                  <div className="flex items-center gap-20">
                    <Rocket className="w-24 h-24 text-teal-300 animate-bounce" />
                    <h2 className="text-[200px] font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-[0_40px_80px_rgba(0,0,0,1)] scale-125">
                      MEGA <span className="text-teal-400">HIT</span>
                    </h2>
                    <Zap className="w-24 h-24 text-teal-300 animate-pulse" />
                  </div>
                  <div className="h-3 w-[700px] bg-gradient-to-r from-transparent via-teal-400/80 to-transparent rounded-full shadow-[0_0_20px_rgba(20,184,166,0.5)]"></div>
                </div>

                <div className="space-y-10">
                  <p className="text-9xl font-black text-white uppercase tracking-[0.3em] italic drop-shadow-2xl animate-pulse">{globalSaleCelebration.sellerName}</p>
                  <div className="flex flex-col gap-4">
                    <p className="text-[18px] font-black text-teal-400 uppercase tracking-[2.5em] opacity-100 italic">CONTRATO MASTER ASSINADO</p>
                    <div className="flex justify-center gap-4">
                       {Array.from({length: 12}).map((_, i) => <Star key={i} className="w-6 h-6 text-teal-400 animate-spin" style={{animationDuration: `${1 + i * 0.2}s`}} />)}
                    </div>
                  </div>
                </div>

                <div className="bg-black/98 px-52 py-24 rounded-[120px] border border-teal-400/50 inline-block shadow-[0_80px_160px_rgba(0,0,0,1)] transform scale-125 hover:scale-130 transition-transform duration-700 group cursor-default">
                  <p className="text-[160px] font-black text-white flex items-center gap-12">
                    <span className="text-8xl text-teal-400 font-black italic">R$</span> {globalSaleCelebration.value.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex justify-center gap-16 pt-12">
                 {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => <Trophy key={i} className="w-20 h-20 text-teal-400/60 animate-bounce" style={{animationDelay: `${i * 0.08}s` }} />)}
              </div>
              
              <div className="pt-20">
                <button 
                  onClick={() => setGlobalSaleCelebration(null)} 
                  className="text-[20px] font-black text-white/60 uppercase tracking-[0.8em] hover:text-white transition-all border-b-4 border-white/5 hover:border-teal-400 py-8 px-24 group bg-white/5 hover:bg-white/15 rounded-[100px] shadow-2xl"
                >
                  Continuar Escala <Rocket className="inline w-6 h-6 ml-4 group-hover:translate-x-3 group-hover:-translate-y-3 transition-transform text-teal-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={handleLogout} dbStatus={dbStatus} theme={theme} notificationCount={notifications[currentUser.id] || 0} />
      
      <main className="flex-1 h-full overflow-hidden relative bg-black/30">
        <div className="h-full overflow-y-auto p-12 lg:p-16 custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
