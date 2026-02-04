
import React, { useState } from 'react';
import { Client, User, DefaultUserRole, ClientStatus, ClientHealth } from '../types';
import { Briefcase, TrendingUp, Pause, Play, Trash2, ShieldAlert, UserPlus, X, Users, ShieldCheck, Plus, Target, DollarSign, Filter, Building2, CheckCircle2, Crown, Zap, ListChecks, Edit3, Save } from 'lucide-react';

interface SquadsViewProps {
  clients: Client[];
  currentUser: User;
  team: User[];
  onAssignUsers: (clientId: string, userIds: string[]) => void;
  onAddClient: (client: Client) => void;
  onRemoveClient: (clientId: string) => void;
  onTogglePauseClient: (clientId: string) => void;
  onUpdatePlan: (clientId: string, planItems: string[]) => void;
}

const SquadsView: React.FC<SquadsViewProps> = ({ clients, currentUser, team, onAssignUsers, onAddClient, onRemoveClient, onTogglePauseClient, onUpdatePlan }) => {
  const [view, setView] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', industry: '', contractValue: '' });
  const [editingPlanClientId, setEditingPlanClientId] = useState<string | null>(null);
  const [tempPlanText, setTempPlanText] = useState('');
  
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const filteredClients = clients.filter(c => view === 'ACTIVE' ? !c.isPaused : c.isPaused);

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
      statusFlag: 'GREEN' as ClientStatus,
      folder: {},
      isPaused: false,
      planItems: []
    };

    onAddClient(client);
    setNewClient({ name: '', industry: '', contractValue: '' });
    setIsAddingClient(false);
  };

  const startEditingPlan = (client: Client) => {
    setEditingPlanClientId(client.id);
    setTempPlanText(client.planItems?.join('\n') || '');
  };

  const savePlan = (clientId: string) => {
    const items = tempPlanText.split('\n').map(i => i.trim()).filter(i => i !== '');
    onUpdatePlan(clientId, items);
    setEditingPlanClientId(null);
  };

  return (
    <div className="space-y-16 animate-in fade-in duration-500 max-w-[1500px] mx-auto pb-40">
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-white italic uppercase tracking-tighter flex items-center gap-5">
            <Crown className="w-12 h-12 text-teal-500" /> CRM de Faturamento
          </h2>
          <p className="text-sm text-gray-500 font-bold ml-1 uppercase tracking-[0.2em] flex items-center gap-3">
             <Zap className="w-4 h-4 text-teal-600" /> Controle Hierárquico de Clientes Ativos
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <div className="flex bg-white/5 border border-white/10 p-2.5 rounded-[32px] shadow-inner">
            <button 
              onClick={() => setView('ACTIVE')}
              className={`px-12 py-4 rounded-2xl text-[11px] font-black uppercase transition-all ${view === 'ACTIVE' ? 'bg-[#14b8a6] text-black shadow-lg shadow-teal-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Faturamento Ativo ({clients.filter(c => !c.isPaused).length})
            </button>
            <button 
              onClick={() => setView('PAUSED')}
              className={`px-12 py-4 rounded-2xl text-[11px] font-black uppercase transition-all ${view === 'PAUSED' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Pausas ({clients.filter(c => c.isPaused).length})
            </button>
          </div>

          {isCEO && (
            <button 
              onClick={() => setIsAddingClient(true)}
              className="bg-[#14b8a6] px-12 py-6 rounded-[30px] text-[12px] font-black text-black uppercase hover:scale-105 transition-all flex items-center gap-4 shadow-[0_20px_40px_rgba(20,184,166,0.35)] group animate-pulse hover:animate-none"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform" /> ADMITIR NOVO CLIENTE
            </button>
          )}
        </div>
      </header>

      {/* MODAL ADICIONAR CLIENTE (EXCLUSIVO CEO) */}
      {isAddingClient && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/98 backdrop-blur-2xl p-6">
           <form onSubmit={handleAddClientSubmit} className="w-full max-w-2xl bg-[#0a0a0a] border border-teal-500/20 rounded-[80px] p-16 space-y-12 shadow-[0_0_100px_rgba(20,184,166,0.1)] relative animate-in zoom-in duration-300">
              <button type="button" onClick={() => setIsAddingClient(false)} className="absolute right-12 top-12 text-gray-500 hover:text-teal-400 transition-colors"><X className="w-10 h-10" /></button>
              
              <div className="text-center space-y-4">
                <div className="w-24 h-24 bg-teal-500/10 rounded-[40px] flex items-center justify-center mx-auto mb-8 border border-teal-500/30 shadow-[0_15px_30px_rgba(20,184,166,0.1)]">
                   <Building2 className="w-12 h-12 text-teal-500" />
                </div>
                <h3 className="text-4xl font-black text-white italic uppercase tracking-tighter">Admissão Operacional</h3>
                <p className="text-xs text-gray-600 uppercase tracking-[0.4em]">Registrar cliente ativo na base Ômega</p>
              </div>

              <div className="space-y-8">
                 <div className="space-y-3">
                    <label className="text-[11px] font-black text-gray-500 uppercase ml-6 tracking-widest italic">Razão Social / Nome Fantasia</label>
                    <input required value={newClient.name} onChange={e => setNewClient({...newClient, name: e.target.value})} className="w-full bg-black border border-white/10 rounded-[35px] px-10 py-6 text-white outline-none focus:border-teal-500 transition-all text-xl font-bold shadow-inner" placeholder="Ex: Grupo Master Brasil" />
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-500 uppercase ml-6 tracking-widest italic">Segmento</label>
                        <input value={newClient.industry} onChange={e => setNewClient({...newClient, industry: e.target.value})} className="w-full bg-black border border-white/10 rounded-[35px] px-10 py-6 text-white outline-none focus:border-teal-500 transition-all font-bold shadow-inner" placeholder="Ex: E-commerce" />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-gray-500 uppercase ml-6 tracking-widest italic">Fee Mensal (R$)</label>
                        <div className="relative">
                          <DollarSign className="absolute left-8 top-1/2 -translate-y-1/2 w-6 h-6 text-teal-500" />
                          <input required type="number" value={newClient.contractValue} onChange={e => setNewClient({...newClient, contractValue: e.target.value})} className="w-full bg-black border border-white/10 rounded-[35px] px-16 py-6 text-white outline-none focus:border-teal-500 transition-all font-black text-2xl shadow-inner" placeholder="0.00" />
                        </div>
                    </div>
                 </div>
              </div>

              <button type="submit" className="w-full bg-teal-500 text-black py-8 rounded-[40px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-95 transition-all shadow-[0_25px_50px_rgba(20,184,166,0.3)] text-xl flex items-center justify-center gap-4 group">
                <CheckCircle2 className="w-8 h-8 group-hover:scale-110 transition-transform" /> FINALIZAR ADMISSÃO
              </button>
           </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-14">
        {filteredClients.map(client => (
          <div key={client.id} className={`bg-[#111] border rounded-[70px] p-14 flex flex-col gap-14 transition-all group ${client.isPaused ? 'border-amber-500/20 grayscale opacity-70' : 'border-white/5 hover:border-teal-500/25 shadow-2xl hover:shadow-teal-500/5'}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
              <div className="flex-1 space-y-6">
                <div className="flex items-center gap-8">
                  <div className={`w-6 h-6 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500 shadow-[0_0_25px_rgba(34,197,94,0.7)]' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500 shadow-[0_0_25px_rgba(234,179,8,0.7)]' : 'bg-red-500 shadow-[0_0_25px_rgba(239,68,68,0.7)]'}`}></div>
                  <h4 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-none">{client.name}</h4>
                  {client.isPaused && <span className="bg-amber-500/15 text-amber-500 text-[11px] px-7 py-2.5 rounded-full font-black uppercase tracking-[0.2em] border border-amber-500/30">OPERACAO CONGELADA</span>}
                </div>
                
                <div className="flex flex-wrap items-center gap-14 text-[13px] text-gray-500 font-black uppercase tracking-[0.25em]">
                  <span className="flex items-center gap-4 text-teal-400 bg-teal-500/5 px-6 py-3 rounded-2xl border border-teal-500/15 shadow-sm">
                    <TrendingUp className="w-5 h-5"/> R$ {client.contractValue.toLocaleString()} / Mês
                  </span>
                  <span className="flex items-center gap-4 text-gray-400">
                    <Building2 className="w-5 h-5 text-teal-600"/> {client.industry}
                  </span>
                </div>
              </div>

              {isCEO && (
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => onTogglePauseClient(client.id)} 
                    title={client.isPaused ? "Retomar Faturamento" : "Congelar Faturamento"}
                    className={`p-7 rounded-[35px] transition-all border shadow-lg ${client.isPaused ? 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/30 hover:bg-amber-500/20'}`}
                  >
                    {client.isPaused ? <Play className="w-8 h-8" fill="currentColor" /> : <Pause className="w-8 h-8" fill="currentColor" />}
                  </button>
                  <button 
                    onClick={() => { if(confirm('⚠️ REMOÇÃO CRÍTICA: Deseja apagar todos os dados operacionais deste cliente?')) onRemoveClient(client.id); }} 
                    title="Remover Base"
                    className="p-7 bg-red-600/10 text-red-500 border border-red-500/30 rounded-[35px] hover:bg-red-600 hover:text-white transition-all shadow-xl"
                  >
                    <Trash2 className="w-8 h-8" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
              {/* ESCOPO DO PLANO */}
              <div className="bg-black/60 border border-teal-500/10 rounded-[55px] p-12 space-y-8 shadow-inner relative overflow-hidden group/plan">
                <div className="flex items-center justify-between">
                  <label className="text-[12px] font-black text-teal-500 uppercase tracking-[0.4em] flex items-center gap-4">
                    <ListChecks className="w-6 h-6" /> ESCOPO DO PLANO PERSONALIZADO
                  </label>
                  {(isCEO || currentUser.role === DefaultUserRole.MANAGER) && (
                    <button 
                      onClick={() => editingPlanClientId === client.id ? savePlan(client.id) : startEditingPlan(client)}
                      className={`p-4 rounded-2xl transition-all ${editingPlanClientId === client.id ? 'bg-teal-500 text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                    >
                      {editingPlanClientId === client.id ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                    </button>
                  )}
                </div>

                {editingPlanClientId === client.id ? (
                  <textarea 
                    value={tempPlanText}
                    onChange={(e) => setTempPlanText(e.target.value)}
                    className="w-full bg-black border border-teal-500/20 rounded-[30px] p-8 text-white outline-none focus:border-teal-500 min-h-[200px] text-sm font-bold shadow-inner"
                    placeholder="Liste os entregáveis (um por linha)..."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {client.planItems && client.planItems.length > 0 ? (
                      client.planItems.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-5 rounded-[25px] hover:border-teal-500/30 transition-all">
                          <CheckCircle2 className="w-4 h-4 text-teal-500 shrink-0" />
                          <span className="text-xs font-black text-gray-300 uppercase tracking-tight">{item}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-gray-700 font-bold uppercase italic p-4">Nenhum item de plano cadastrado para este cliente.</p>
                    )}
                  </div>
                )}
              </div>

              {/* DIRECIONAMENTO HIERÁRQUICO */}
              <div className="bg-black/60 border border-white/5 rounded-[55px] p-12 space-y-10 shadow-inner">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <label className="text-[12px] font-black text-gray-600 uppercase tracking-[0.4em] flex items-center gap-4">
                    <ShieldCheck className="w-6 h-6 text-teal-500" /> DIRECIONAMENTO HIERÁRQUICO (RBAC)
                  </label>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {team.map(user => {
                    const isAssigned = client.assignedUserIds?.includes(user.id);
                    return (
                      <button 
                        key={user.id}
                        disabled={!isCEO}
                        onClick={() => {
                          const current = client.assignedUserIds || [];
                          const next = isAssigned ? current.filter(id => id !== user.id) : [...current, user.id];
                          onAssignUsers(client.id, next);
                        }}
                        className={`flex flex-col items-start p-6 rounded-[30px] border transition-all text-left relative overflow-hidden group/btn ${
                          isAssigned 
                          ? 'bg-teal-500/15 border-teal-500/60 shadow-[0_15px_30px_rgba(20,184,166,0.1)]' 
                          : 'bg-white/[0.01] border-white/5 hover:border-white/15'
                        } ${!isCEO ? 'cursor-default' : 'hover:scale-[1.05] active:scale-95 shadow-2xl'}`}
                      >
                        {isAssigned && (
                          <div className="absolute top-4 right-4 animate-in zoom-in">
                            <div className="bg-teal-500 rounded-full p-1.5 shadow-lg shadow-teal-500/40"><X className="w-3 h-3 text-black" /></div>
                          </div>
                        )}
                        <span className={`text-[12px] font-black uppercase tracking-tighter truncate w-full mb-1.5 ${isAssigned ? 'text-teal-400' : 'text-gray-400 group-hover/btn:text-white'}`}>
                          {user.name}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-[0.1em] ${isAssigned ? 'text-teal-900' : 'text-gray-800'}`}>
                          {formatRole(user.role)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="py-80 flex flex-col items-center justify-center text-center space-y-10 opacity-30 grayscale">
            <div className="w-40 h-40 bg-white/[0.03] rounded-[50px] flex items-center justify-center border border-white/10 animate-pulse">
               <Briefcase className="w-20 h-20 text-gray-700" />
            </div>
            <div className="max-w-lg space-y-4">
              <p className="text-3xl font-black uppercase tracking-[0.5em] text-white">Base de Dados Vazia</p>
              <p className="text-sm font-medium uppercase italic text-gray-500">O CEO pode admitir novos contratos usando o comando superior à direita.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadsView;
