
import React, { useState } from 'react';
import { Client, User, DefaultUserRole } from '../types';
import { MANAGERS } from '../constants';
import { Briefcase, TrendingUp, Pause, Play, Trash2, ShieldAlert } from 'lucide-react';

interface SquadsViewProps {
  clients: Client[];
  currentUser: User;
  onAssignManager: (clientId: string, managerId: string) => void;
  onRemoveClient: (clientId: string) => void;
  onTogglePauseClient: (clientId: string) => void;
}

const SquadsView: React.FC<SquadsViewProps> = ({ clients, currentUser, onAssignManager, onRemoveClient, onTogglePauseClient }) => {
  const [view, setView] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');
  const isCEO = currentUser.role === DefaultUserRole.CEO;

  const filteredClients = clients.filter(c => view === 'ACTIVE' ? !c.isPaused : c.isPaused);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Carteira Geral (CRM)</h2>
          <p className="text-sm text-gray-400 font-medium">Controle total de status e alocação de squads.</p>
        </div>

        <div className="flex bg-[#111] border border-white/5 p-1 rounded-2xl">
          <button 
            onClick={() => setView('ACTIVE')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'ACTIVE' ? 'bg-[#14b8a6] text-black' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Ativos ({clients.filter(c => !c.isPaused).length})
          </button>
          <button 
            onClick={() => setView('PAUSED')}
            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${view === 'PAUSED' ? 'bg-amber-500 text-black' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Pausados ({clients.filter(c => c.isPaused).length})
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {filteredClients.map(client => (
          <div key={client.id} className={`bg-[#111] border rounded-[40px] p-8 flex flex-col md:flex-row md:items-center justify-between gap-8 group transition-all ${client.isPaused ? 'border-amber-500/20 grayscale opacity-70' : 'border-white/5 hover:border-teal-500/20 shadow-2xl shadow-black/40'}`}>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${client.statusFlag === 'GREEN' ? 'bg-green-500' : client.statusFlag === 'YELLOW' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                <h4 className="text-2xl font-black text-white uppercase italic tracking-tighter">{client.name}</h4>
                {client.isPaused && <span className="bg-amber-500/10 text-amber-500 text-[8px] px-2 py-0.5 rounded font-black uppercase">Trabalho Congelado</span>}
              </div>
              <div className="flex items-center gap-6 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2 text-teal-500"><TrendingUp className="w-3 h-3"/> R$ {client.contractValue.toLocaleString()}</span>
                <span className="flex items-center gap-2"><Briefcase className="w-3 h-3"/> {client.industry}</span>
                <span>Progresso: {client.progress}%</span>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1 block">Squad Lead</label>
                <select 
                  disabled={!isCEO}
                  value={client.managerId}
                  onChange={(e) => onAssignManager(client.id, e.target.value)}
                  className="bg-black border border-white/10 rounded-xl px-4 py-3 text-xs font-black text-[#14b8a6] outline-none focus:border-teal-500 transition-all w-52 disabled:opacity-50"
                >
                  <option value="">Sem Gestor</option>
                  {MANAGERS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>

              {isCEO && (
                <div className="flex items-center gap-2 pt-4">
                  <button 
                    onClick={() => onTogglePauseClient(client.id)}
                    className={`p-4 rounded-xl transition-all ${client.isPaused ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'}`}
                    title={client.isPaused ? "Reativar Cliente" : "Pausar Cliente"}
                  >
                    {client.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => onRemoveClient(client.id)}
                    className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                    title="Excluir Cliente"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredClients.length === 0 && (
          <div className="py-32 flex flex-col items-center justify-center text-center space-y-4 opacity-20">
            <ShieldAlert className="w-16 h-16" />
            <p className="text-sm font-black uppercase tracking-[0.3em]">Nenhum cliente nesta visualização.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SquadsView;
