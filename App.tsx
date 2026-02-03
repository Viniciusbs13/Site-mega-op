
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
import { Hash, Bell, Database, WifiOff, Settings, LogOut, Send } from 'lucide-react';

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
  const recentSaleHandled = useRef<string | null>(null);

  // Sincronização em Tempo Real (Realtime)
  useEffect(() => {
    const init = async () => {
      const result = await dbService.loadState();
      if (result.state) {
        setTeam(result.state.team);
        setAvailableRoles(result.state.availableRoles);
        setDb(result.state.db);
        setNotifications(result.state.notifications || {});
        lastIncomingData.current = JSON.stringify(result.state);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleAuth(session, result.state?.team || []);
      } else {
        setIsLoading(false);
      }

      // Canal de Escuta: Qualquer mudança no banco de dados reflete aqui instantaneamente
      const channel = supabase.channel('omega-realtime')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'project_state' }, (payload: any) => {
          const newData = payload.new.data as AppState;
          const newDataString = JSON.stringify(newData);

          // Só atualiza se for uma mudança vinda de outro usuário
          if (newDataString !== lastIncomingData.current) {
            lastIncomingData.current = newDataString;
            setTeam(newData.team);
            setDb(newData.db);
            setNotifications(newData.notifications || {});
            
            // Verifica se há uma nova venda para celebrar
            if (newData.recentSale && newData.recentSale.id !== recentSaleHandled.current) {
              recentSaleHandled.current = newData.recentSale.id;
              setGlobalSaleCelebration({ sellerName: newData.recentSale.sellerName, value: newData.recentSale.value });
              setTimeout(() => setGlobalSaleCelebration(null), 6000);
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
        isActive: true, isApproved: true
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
    const state: AppState = { 
      team: updatedTeam, 
      availableRoles, 
      db: updatedDb, 
      notifications: updatedNotifs,
      recentSale: updatedSale 
    };
    const stateString = JSON.stringify(state);
    lastIncomingData.current = stateString;
    const result = await dbService.saveState(state);
    setDbStatus(result.success ? 'connected' : 'error');
  };

  const updateStateAndSync = (newTeam: User[], newDb: MonthlyData, newNotifs: any, newSale: any = null) => {
    setTeam(newTeam);
    setDb(newDb);
    setNotifications(newNotifs);
    
    // Debounce para não sobrecarregar o banco em edições rápidas (exceto chat que é imediato)
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      forceCloudSync(newTeam, newDb, newNotifs, newSale);
    }, 500);
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !currentUser) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };

    const updatedDb = {
      ...db,
      [selectedMonth]: {
        ...currentData,
        chatMessages: [...(currentData.chatMessages || []), newMessage]
      }
    };

    setChatInput(''); // Limpa o campo na hora
    updateStateAndSync(team, updatedDb, notifications);
    // Para chat, forçamos a sincronização imediata sem debounce longo
    forceCloudSync(team, updatedDb, notifications);
  };

  const currentData = db[selectedMonth] || { clients: [], tasks: [], salesGoal: { monthlyTarget: 100000, monthlySuperTarget: 150000, currentValue: 0, totalSales: 0, contractFormUrl: '' }, chatMessages: [], drive: [], wiki: [], squads: [] };

  if (isLoading) return <div className="h-screen w-full bg-[#0a0a0a] flex flex-col items-center justify-center space-y-6"><div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div><p className="text-[10px] font-black text-teal-500 uppercase tracking-widest animate-pulse">Sincronizando Ômega Cloud...</p></div>;

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="h-screen w-full bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8 text-center">
          <div className="w-20 h-20 bg-[#14b8a6] rounded-3xl flex items-center justify-center mx-auto shadow-2xl rotate-3"><span className="text-black font-black text-4xl italic">Ω</span></div>
          <h1 className="text-3xl font-black text-white italic uppercase">Acesso Restrito</h1>
          <div className="bg-[#111] border border-white/5 p-8 rounded-3xl space-y-4">
             <input type="email" placeholder="E-mail" onChange={e => (window as any).email = e.target.value} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
             <input type="password" placeholder="Senha" onChange={e => (window as any).pass = e.target.value} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
             <button onClick={async () => {
                const { error } = await supabase.auth.signInWithPassword({ email: (window as any).email, password: (window as any).pass });
                if (error) alert(error.message);
                else window.location.reload();
             }} className="w-full bg-teal-500 text-black py-4 rounded-xl font-black uppercase">Entrar no Sistema</button>
          </div>
        </div>
      </div>
    );
  }

  const myClients = currentData.clients.filter(c => currentUser.role === DefaultUserRole.CEO || currentUser.role === DefaultUserRole.SALES || c.assignedUserIds?.includes(currentUser.id));
  const myTasks = currentData.tasks.filter(t => currentUser.role === DefaultUserRole.CEO || t.assignedTo === 'ALL' || t.assignedTo === currentUser.id);

  const handleRegisterSale = (uid: string, val: number, cname: string) => {
    const updatedTeam = team.map(u => u.id === uid ? { ...u, salesVolume: (u.salesVolume || 0) + val } : u);
    const newClient: Client = { 
      id: Math.random().toString(36).substr(2,9), name: cname, industry: 'Novo Contrato', health: 'Estável', progress: 0, assignedUserIds: [uid], salesId: uid, contractValue: val, statusFlag: 'GREEN', folder: {} 
    };
    const updatedDb = { ...db, [selectedMonth]: { ...currentData, salesGoal: { ...currentData.salesGoal, currentValue: currentData.salesGoal.currentValue + val, totalSales: currentData.salesGoal.totalSales + 1 }, clients: [...currentData.clients, newClient] } };
    const saleSignal = { id: Date.now().toString(), sellerName: currentUser.name, value: val, timestamp: Date.now() };
    updateStateAndSync(updatedTeam, updatedDb, notifications, saleSignal);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard clients={myClients} tasks={myTasks} currentUser={currentUser} currentMonth={selectedMonth} months={MONTHS.map(m => `${m} ${currentYear}`)} onMonthChange={setSelectedMonth} />;
      case 'commercial': return <SalesView goal={currentData.salesGoal} team={team} clients={currentData.clients} currentUser={currentUser} onUpdateGoal={u => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, salesGoal: { ...currentData.salesGoal, ...u } } }, notifications)} onRegisterSale={handleRegisterSale} onUpdateUserGoal={(id, pg, sg) => updateStateAndSync(team.map(u => u.id === id ? { ...u, personalGoal: pg, superGoal: sg } : u), db, notifications)} onUpdateClientNotes={(cid, n) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, clients: currentData.clients.map(c => c.id === cid ? { ...c, closingNotes: n } : c) } }, notifications)} />;
      case 'my-workspace': return <ManagerWorkspace managerId={currentUser.id} clients={myClients} tasks={myTasks} currentUser={currentUser} drive={currentData.drive || []} onUpdateDrive={items => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, drive: items } }, notifications)} onToggleTask={id => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) } }, notifications)} onUpdateNotes={(id, n) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, clients: currentData.clients.map(c => c.id === id ? { ...c, notes: n } : c) } }, notifications)} onUpdateStatusFlag={(id, f) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, clients: currentData.clients.map(c => c.id === id ? { ...c, statusFlag: f } : c) } }, notifications)} onUpdateFolder={(id, f) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, clients: currentData.clients.map(c => c.id === id ? { ...c, folder: { ...c.folder, ...f } } : c) } }, notifications)} />;
      case 'checklists': return <ChecklistView tasks={myTasks} currentUser={currentUser} team={team} onAddTask={t => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, tasks: [{ ...t, id: Date.now().toString() } as Task, ...currentData.tasks] } }, notifications)} onRemoveTask={id => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, tasks: currentData.tasks.filter(t => t.id !== id) } }, notifications)} onToggleTask={id => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, tasks: currentData.tasks.map(t => t.id === id ? { ...t, status: t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED' } : t) } }, notifications)} />;
      case 'team': return <TeamView team={team} currentUser={currentUser} availableRoles={availableRoles} onUpdateRole={(id, r) => updateStateAndSync(team.map(u => u.id === id ? { ...u, role: r } : u), db, notifications)} onAddMember={(n, r) => updateStateAndSync([...team, { id: Math.random().toString(36).substr(2, 9), name: n, role: r, isActive: true, isApproved: true }], db, notifications)} onRemoveMember={id => updateStateAndSync(team.filter(u => u.id !== id), db, notifications)} onAddRole={r => setAvailableRoles([...availableRoles, r])} onToggleActive={id => updateStateAndSync(team.map(u => u.id === id ? { ...u, isActive: !u.isActive } : u), db, notifications)} />;
      case 'clients': return <SquadsView clients={currentData.clients} team={team} currentUser={currentUser} onAssignUsers={(cid, uids) => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, clients: currentData.clients.map(c => c.id === cid ? { ...c, assignedUserIds: uids } : c) } }, notifications)} onRemoveClient={cid => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, clients: currentData.clients.filter(c => c.id !== cid) } }, notifications)} onTogglePauseClient={cid => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, clients: currentData.clients.map(c => c.id === cid ? { ...c, isPaused: !c.isPaused } : c) } }, notifications)} />;
      case 'chat': return (
        <div className="max-w-4xl mx-auto h-full flex flex-col pb-6">
          <header className="mb-6 flex items-center justify-between px-4">
             <div><h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Comunicação do Time</h2><p className="text-xs text-teal-500 font-bold uppercase tracking-widest">Chat em Tempo Real</p></div>
          </header>
          <div className="flex-1 bg-[#111] rounded-[40px] border border-white/5 overflow-hidden flex flex-col p-8 space-y-4 custom-scrollbar">
            {currentData.chatMessages?.length === 0 && <div className="h-full flex flex-col items-center justify-center opacity-20 italic uppercase text-[10px] tracking-widest text-center"><Hash className="w-12 h-12 mb-4" />Nenhuma mensagem no canal principal ainda...</div>}
            {currentData.chatMessages?.map(m => (
              <div key={m.id} className={`flex flex-col ${m.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                <span className="text-[9px] text-gray-600 mb-1 font-bold uppercase">{m.senderName} • {m.timestamp}</span>
                <div className={`px-5 py-3 rounded-2xl text-sm ${m.senderId === currentUser.id ? 'bg-[#14b8a6] text-black font-bold shadow-lg shadow-teal-500/10' : 'bg-white/5 text-white'}`}>{m.text}</div>
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-4">
            <input 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendChatMessage()} 
              placeholder="Digite sua mensagem para o time..." 
              className="flex-1 bg-[#111] border border-white/5 rounded-2xl px-6 py-4 text-white outline-none focus:border-teal-500 transition-all" 
            />
            <button 
              onClick={handleSendChatMessage} 
              className="bg-teal-500 px-10 rounded-2xl text-black font-black uppercase flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-teal-500/20"
            >
              <Send className="w-4 h-4" /> Enviar
            </button>
          </div>
        </div>
      );
      case 'notes': return <WikiView wiki={currentData.wiki || []} currentUser={currentUser} onUpdateWiki={items => updateStateAndSync(team, { ...db, [selectedMonth]: { ...currentData, wiki: items } }, notifications)} />;
      case 'settings': return <SettingsView currentUser={currentUser} theme={theme} setTheme={setTheme} onUpdateName={n => updateStateAndSync(team.map(u => u.id === currentUser.id ? { ...u, name: n } : u), db, notifications)} onLogout={() => supabase.auth.signOut()} />;
      default: return null;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden font-inter transition-colors duration-500 relative ${theme === 'dark' ? 'bg-[#0a0a0a] text-gray-300' : 'bg-[#f4f7f6] text-slate-800'}`}>
      {globalSaleCelebration && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in zoom-in duration-300">
          <div className="text-center space-y-8 p-16 bg-white/[0.02] rounded-[64px] border border-white/5 shadow-[0_0_100px_rgba(20,184,166,0.3)]">
            <Bell className="w-48 h-48 text-teal-400 animate-bell mx-auto drop-shadow-[0_0_50px_rgba(20,184,166,0.8)]" />
            <div className="space-y-2">
              <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter">VENDA REGISTRADA!</h2>
              <p className="text-3xl font-bold text-teal-400 uppercase">{globalSaleCelebration.sellerName}</p>
              <p className="text-5xl font-black text-white">R$ {globalSaleCelebration.value.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} currentUser={currentUser} onLogout={() => supabase.auth.signOut()} dbStatus={dbStatus} theme={theme} notificationCount={notifications[currentUser.id] || 0} />
      
      <main className="flex-1 h-full overflow-hidden relative">
        <div className="h-full overflow-y-auto p-12 custom-scrollbar">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
