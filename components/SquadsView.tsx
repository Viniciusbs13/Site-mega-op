
import React, { useState } from 'react';
import { Client, User, DefaultUserRole } from '../types';
import { Briefcase, TrendingUp, Pause, Play, Trash2, ShieldAlert, UserPlus, X, Users, ShieldCheck } from 'lucide-react';

interface SquadsViewProps {
  clients: Client[];
  currentUser: User;
  team: User[];
  onAssignUsers: (clientId: string, userIds: string[]) => void;
  onRemoveClient: (clientId: string) => void;
  onTogglePauseClient: (clientId: string) => void;
}

const SquadsView: React.FC<SquadsViewProps> = ({ clients, currentUser, team, onAssignUsers, onRemoveClient, onTogglePauseClient }) => {
  const [view, setView] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const isCEO = currentUser.role === DefaultUserRole.CEO;

  const filteredClients = clients.filter(c => view === 'ACTIVE' ? !c.isPaused : c.isPaused);

  // Formata o cargo para exibição amigável
  const formatRole = (role: string) => {
    return role.replace('_', ' ').toLowerCase();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-teal-500" /> CRM de Clientes
          </h2>
          <p className="text-sm text-gray-400 font-medium">Controle de faturamento e direcionamento de acessos.</p>
        </div>

        <div className="flex bg-[#111] border border-white/5 p-1.5 rounded-2xl">
          <button 
            onClick={() => setView('ACTIVE')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'ACTIVE' ? 'bg-[#14b8a6] text-black shadow-lg shadow-teal-500/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Ativos ({clients.filter(c => !c.isPaused).length})
          </button>
          <button 
            onClick={() => setView('PAUSED')}
            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'PAUSED' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Pausados ({clients.filter(c => c.isPaused).length})
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8">
        {filteredClients.map(client => (
          <div key={client.id} className={`bg-[#111] border rounded-[48px] p-10 flex flex-col gap-10 transition-all ${client.isPaused ? 'border-amber-500/20 grayscale opacity-70' : 'border-white/5 hover:border-teal-500/20 shadow-2xl'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4">
                  <div className={`w-4 h-4 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_15_rgba(239,68,68,0.5)]'}`}></div>
                  <h4 className="text-3xl font-black text-white uppercase italic tracking-tighter">{client.name}</h4>
                  {client.isPaused && <span className="bg-amber-500/10 text-amber-500 text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest border border-amber-500/20">Operação Congelada</span>}
                </div>
                <div className="flex flex-wrap items-center gap-6 text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                  <span className="flex items-center gap-2 text-teal-500 bg-teal-500/5 px-3 py-1 rounded-lg border border-teal-500/10"><TrendingUp className="w-3.5 h-3.5"/> R$ {client.contractValue.toLocaleString()}</span>
                  <span className="flex items-center gap-2"><Briefcase className="w-3.5 h-3.5"/> {client.industry}</span>
                  <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5"/> {client.assignedUserIds?.length || 0} Colaboradores</span>
                </div>
              </div>

              {isCEO && (
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onTogglePauseClient(client.id)} 
                    title={client.isPaused ? "Retomar Trabalho" : "Pausar Trabalho"}
                    className={`p-5 rounded-2xl transition-all border ${client.isPaused ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'}`}
                  >
                    {client.isPaused ? <Play className="w-6 h-6" /> : <Pause className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={() => onRemoveClient(client.id)} 
                    title="Excluir Cliente"
                    className="p-5 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all"
                  >
                    <Trash2 className="w-6 h-6" />
                  </button>
                </div>
              )}
            </div>

            {/* SEÇÃO DE DIRECIONAMENTO DE EQUIPE */}
            <div className="bg-black/30 border border-white/5 rounded-[32px] p-8 space-y-6">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-500" /> Direcionamento de Acessos (SQUAD LEAD)
                </label>
                <span className="text-[9px] text-gray-700 font-bold uppercase italic">Clique para dar ou remover a pasta do cliente</span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {team.map(user => {
                  const isAssigned = client.assignedUserIds?.includes(user.id);
                  const isOwner = user.role === DefaultUserRole.CEO || user.role === DefaultUserRole.SALES;
                  
                  return (
                    <button 
                      key={user.id}
                      disabled={!isCEO}
                      onClick={() => {
                        const current = client.assignedUserIds || [];
                        const next = isAssigned ? current.filter(id => id !== user.id) : [...current, user.id];
                        onAssignUsers(client.id, next);
                      }}
                      className={`flex flex-col items-start p-4 rounded-2xl border transition-all text-left relative overflow-hidden group ${
                        isAssigned 
                        ? 'bg-teal-500/10 border-teal-500 shadow-[inset_0_0_20px_rgba(20,184,166,0.1)]' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
                      } ${!isCEO ? 'cursor-default' : 'hover:scale-[1.02] active:scale-95'}`}
                    >
                      {isAssigned && (
                        <div className="absolute top-2 right-2">
                          <div className="bg-teal-500 rounded-full p-0.5"><X className="w-2 h-2 text-black" /></div>
                        </div>
                      )}
                      <span className={`text-[11px] font-black uppercase tracking-tighter truncate w-full ${isAssigned ? 'text-teal-400' : 'text-gray-300'}`}>
                        {user.name}
                      </span>
                      <span className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${isAssigned ? 'text-teal-600' : 'text-gray-600'}`}>
                        {formatRole(user.role)}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {isCEO && (
                <div className="pt-2">
                  <p className="text-[9px] text-gray-600 italic">Dica: Os vendedores e o CEO já possuem acesso automático a todas as pastas para fins de acompanhamento de metas.</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="py-48 flex flex-col items-center justify-center text-center space-y-6 opacity-20">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
               <ShieldAlert className="w-10 h-10" />
            </div>
            <div>
              <p className="text-xl font-black uppercase tracking-[0.3em]">Nenhum cliente em {view === 'ACTIVE' ? 'faturamento' : 'pausa'}.</p>
              <p className="text-xs font-medium uppercase mt-2 italic">Aguardando novos contratos na Arena de Vendas.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadsView;
