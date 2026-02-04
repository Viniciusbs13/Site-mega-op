
import React, { useState } from 'react';
import { Client, User, DefaultUserRole, ClientStatus, ClientHealth, PlanItem, ServiceType } from '../types';
import { Briefcase, TrendingUp, Pause, Play, Trash2, ShieldAlert, UserPlus, X, Users, ShieldCheck, Plus, Target, DollarSign, Filter, Building2, CheckCircle2, Crown, Zap, ListChecks, Edit3, Save, BarChart3, PieChart, Wallet } from 'lucide-react';

interface SquadsViewProps {
  clients: Client[];
  currentUser: User;
  team: User[];
  onAssignUsers: (clientId: string, userIds: string[]) => void;
  onAddClient: (client: Client) => void;
  onRemoveClient: (clientId: string) => void;
  onTogglePauseClient: (clientId: string) => void;
  onUpdatePlan: (clientId: string, planItems: PlanItem[]) => void;
}

const SquadsView: React.FC<SquadsViewProps> = ({ clients, currentUser, team, onAssignUsers, onAddClient, onRemoveClient, onTogglePauseClient, onUpdatePlan }) => {
  const [view, setView] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', industry: '', contractValue: '', serviceType: 'PERPETUAL' as ServiceType });
  const [editingPlanClientId, setEditingPlanClientId] = useState<string | null>(null);
  const [tempPlanText, setTempPlanText] = useState('');
  
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const activeClients = clients.filter(c => !c.isPaused);
  const filteredClients = clients.filter(c => view === 'ACTIVE' ? !c.isPaused : c.isPaused);

  // Cálculos Financeiros Dinâmicos
  const totalRevenue = activeClients.reduce((acc, c) => acc + (c.contractValue || 0), 0);
  const mrr = activeClients.filter(c => c.serviceType === 'PERPETUAL').reduce((acc, c) => acc + (c.contractValue || 0), 0);
  const oneTimeRevenue = activeClients.filter(c => c.serviceType === 'ONE_TIME').reduce((acc, c) => acc + (c.contractValue || 0), 0);
  const avgTicket = activeClients.length > 0 ? totalRevenue / activeClients.length : 0;

  const formatRole = (role: string) => {
    return role.replace('_', ' ').toLowerCase();
  };

  const handleAddClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name || !newClient.contractValue) return;

    const client: Client = {
      id: Math.random().toString(36).substr(2, 9),
      name: newClient.name,
      industry: newClient.industry || 'Base Geral',
      health: ClientHealth.EXCELLENT,
      progress: 0,
      assignedUserIds: [],
      contractValue: parseFloat(newClient.contractValue),
      serviceType: newClient.serviceType,
      statusFlag: 'GREEN' as ClientStatus,
      folder: {},
      isPaused: false,
      planItems: []
    };

    onAddClient(client);
    setNewClient({ name: '', industry: '', contractValue: '', serviceType: 'PERPETUAL' });
    setIsAddingClient(false);
  };

  const startEditingPlan = (client: Client) => {
    setEditingPlanClientId(client.id);
    setTempPlanText(client.planItems?.map(p => p.label).join('\n') || '');
  };

  const savePlan = (clientId: string) => {
    const labels = tempPlanText.split('\n').map(i => i.trim()).filter(i => i !== '');
    const client = clients.find(c => c.id === clientId);
    const existingItems = client?.planItems || [];

    const planItems: PlanItem[] = labels.map(label => {
      const existing = existingItems.find(e => e.label === label);
      return {
        id: existing?.id || Math.random().toString(36).substr(2, 9),
        label,
        isDone: existing?.isDone || false
      };
    });

    onUpdatePlan(clientId, planItems);
    setEditingPlanClientId(null);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-40">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-5">
            <Crown className="w-12 h-12 text-teal-500" /> CRM de Faturamento
          </h2>
          <p className="text-sm text-gray-500 font-bold ml-1 uppercase tracking-[0.2em] flex items-center gap-3">
             <Zap className="w-4 h-4 text-teal-600" /> Inteligência Financeira Ômega
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex bg-white/5 border border-white/10 p-2 rounded-[28px]">
            <button 
              onClick={() => setView('ACTIVE')}
              className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'ACTIVE' ? 'bg-[#14b8a6] text-black shadow-lg shadow-teal-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Faturamento Ativo ({activeClients.length})
            </button>
            <button 
              onClick={() => setView('PAUSED')}
              className={`px-10 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all ${view === 'PAUSED' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Contratos Congelados ({clients.filter(c => c.isPaused).length})
            </button>
          </div>

          {isCEO && (
            <button onClick={() => setIsAddingClient(true)} className="bg-[#14b8a6] px-10 py-5 rounded-[28px] text-[11px] font-black text-black uppercase hover:scale-105 transition-all flex items-center gap-3 shadow-[0_20px_40px_rgba(20,184,166,0.2)]">
              <Plus className="w-5 h-5" /> Adicionar Contrato
            </button>
          )}
        </div>
      </header>

      {/* CONTABILIZADOR DE FATURAMENTO MASTER */}
      {view === 'ACTIVE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-top-6 duration-700">
           <div className="bg-gradient-to-br from-teal-500/10 to-transparent border border-teal-500/30 rounded-[40px] p-8 space-y-2 relative overflow-hidden group shadow-2xl">
              <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform"><Wallet className="w-32 h-32 text-teal-400" /></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic">Faturamento Total do Mês</p>
              <h3 className="text-5xl font-black text-white italic tracking-tighter">R$ {totalRevenue.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold text-teal-400 uppercase mt-4 bg-teal-500/10 w-fit px-3 py-1 rounded-full border border-teal-500/20">
                 <Zap className="w-3 h-3" /> Caixa Consolidado
              </div>
           </div>
           
           <div className="bg-[#111] border border-white/5 rounded-[40px] p-8 space-y-2 relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] opacity-5"><TrendingUp className="w-24 h-24" /></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Recorrência (MRR)</p>
              <h3 className="text-4xl font-black text-white italic">R$ {mrr.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600 uppercase mt-4">
                 Contratos Perpétuos
              </div>
           </div>

           <div className="bg-[#111] border border-white/5 rounded-[40px] p-8 space-y-2 relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] opacity-5"><PieChart className="w-24 h-24" /></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Trabalhos Únicos / Spot</p>
              <h3 className="text-4xl font-black text-white italic">R$ {oneTimeRevenue.toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600 uppercase mt-4">
                 Projetos Pontuais
              </div>
           </div>

           <div className="bg-[#111] border border-white/5 rounded-[40px] p-8 space-y-2 relative overflow-hidden group">
              <div className="absolute right-[-10px] top-[-10px] opacity-5"><BarChart3 className="w-24 h-24" /></div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ticket Médio (AOV)</p>
              <h3 className="text-4xl font-black text-white italic">R$ {Math.round(avgTicket).toLocaleString()}</h3>
              <div className="flex items-center gap-2 text-[9px] font-bold text-gray-600 uppercase mt-4">
                 Por Contrato Ativo
              </div>
           </div>
        </div>
      )}

      {/* MODAL ADICIONAR CLIENTE */}
      {isAddingClient && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-6">
           <form onSubmit={handleAddClientSubmit} className="w-full max-w-2xl bg-[#0a0a0a] border border-teal-500/20 rounded-[80px] p-16 space-y-10 shadow-[0_0_100px_rgba(20,184,166,0.1)] relative animate-in zoom-in duration-300">
              <button type="button" onClick={() => setIsAddingClient(false)} className="absolute right-12 top-12 text-gray-500 hover:text-teal-400 transition-colors"><X className="w-10 h-10" /></button>
              
              <div className="text-center space-y-4">
                <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Novo Contrato</h3>
                <p className="text-xs text-gray-600 uppercase tracking-[0.4em]">Configurar faturamento e modelo operacional</p>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Nome do Cliente / Projeto</label>
                    <input required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-[30px] px-8 py-5 text-white outline-none focus:border-teal-500 transition-all font-bold" placeholder="Razão Social" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Fee / Valor</label>
                        <input required type="number" value={newClient.contractValue} onChange={e => setNewClient({...newClient, contractValue: e.target.value})} className="w-full bg-black border border-white/10 rounded-[30px] px-8 py-5 text-white outline-none focus:border-teal-500 font-black text-xl" placeholder="R$ 0,00" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase ml-4">Modelo Comercial</label>
                        <select 
                          value={newClient.serviceType} 
                          onChange={e => setNewClient({...newClient, serviceType: e.target.value as ServiceType})}
                          className="w-full bg-black border border-white/10 rounded-[30px] px-8 py-5 text-white outline-none focus:border-teal-500 font-bold uppercase"
                        >
                           <option value="PERPETUAL">Recorrência Mensal</option>
                           <option value="ONE_TIME">Trabalho Único / Spot</option>
                        </select>
                    </div>
                 </div>
              </div>

              <button type="submit" className="w-full bg-teal-500 text-black py-7 rounded-[35px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_20px_40px_rgba(20,184,166,0.3)]">
                CONFIRMAR ADMISSÃO
              </button>
           </form>
        </div>
      )}

      {/* LISTAGEM DE CLIENTES NO CRM */}
      <div className="grid grid-cols-1 gap-12">
        {filteredClients.map(client => (
          <div key={client.id} className={`bg-[#111] border rounded-[60px] p-12 flex flex-col gap-10 transition-all group ${client.isPaused ? 'border-amber-500/20 grayscale opacity-70' : 'border-white/5 hover:border-teal-500/20 shadow-xl'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-6">
                  <div className={`w-4 h-4 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}></div>
                  <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">{client.name}</h4>
                  
                  <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-full border ${client.serviceType === 'PERPETUAL' ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' : 'bg-blue-500/10 border-blue-500/30 text-blue-400'}`}>
                    {client.serviceType === 'PERPETUAL' ? 'Recorrência Perpétua' : 'Projeto Único'}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-10 text-[11px] text-gray-500 font-black uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-3 text-white">
                    <TrendingUp className="w-4 h-4 text-teal-500"/> R$ {client.contractValue.toLocaleString()} / {client.serviceType === 'PERPETUAL' ? 'Mês' : 'Projeto'}
                  </span>
                  <span className="flex items-center gap-3">
                    <Building2 className="w-4 h-4"/> {client.industry}
                  </span>
                </div>
              </div>

              {isCEO && (
                <div className="flex items-center gap-4">
                  <button onClick={() => onTogglePauseClient(client.id)} className={`p-6 rounded-[30px] border transition-all ${client.isPaused ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                    {client.isPaused ? <Play className="w-6 h-6" fill="currentColor" /> : <Pause className="w-6 h-6" fill="currentColor" />}
                  </button>
                  <button onClick={() => { if(confirm('Remover cliente da base?')) onRemoveClient(client.id); }} className="p-6 bg-red-600/10 text-red-500 border border-red-500/30 rounded-[30px] hover:bg-red-600 hover:text-white transition-all">
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* ESCOPO DO PLANO */}
              <div className="bg-black/60 border border-teal-500/10 rounded-[45px] p-10 space-y-6">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-teal-500 uppercase tracking-widest flex items-center gap-3">
                    <ListChecks className="w-5 h-5" /> Escopo Detalhado
                  </label>
                  {(isCEO || currentUser.role === DefaultUserRole.MANAGER) && (
                    <button onClick={() => editingPlanClientId === client.id ? savePlan(client.id) : startEditingPlan(client)} className="p-3 bg-white/5 rounded-xl text-gray-500 hover:text-white transition-all">
                      {editingPlanClientId === client.id ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    </button>
                  )}
                </div>
                {editingPlanClientId === client.id ? (
                  <textarea value={tempPlanText} onChange={e => setTempPlanText(e.target.value)} className="w-full bg-black border border-teal-500/20 rounded-[25px] p-6 text-white outline-none min-h-[150px] text-xs font-bold" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {client.planItems?.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white/[0.02] border border-white/5 p-4 rounded-[20px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-tight">{item.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* MEMBROS RESPONSÁVEIS */}
              <div className="bg-black/60 border border-white/5 rounded-[45px] p-10 space-y-6">
                <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-teal-500" /> Time Responsável
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {team.map(user => {
                    const isAssigned = client.assignedUserIds?.includes(user.id);
                    return (
                      <button key={user.id} disabled={!isCEO} onClick={() => {
                          const current = client.assignedUserIds || [];
                          const next = isAssigned ? current.filter(id => id !== user.id) : [...current, user.id];
                          onAssignUsers(client.id, next);
                        }} className={`p-4 rounded-[25px] border transition-all text-left ${isAssigned ? 'bg-teal-500/10 border-teal-500/40 text-teal-400' : 'bg-white/[0.01] border-white/5 text-gray-700'} ${!isCEO ? 'cursor-default' : 'hover:scale-105 shadow-xl'}`}>
                        <p className="text-[11px] font-black uppercase truncate">{user.name}</p>
                        <p className={`text-[8px] font-bold uppercase ${isAssigned ? 'text-teal-900' : 'text-gray-900'}`}>{formatRole(user.role)}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SquadsView;
