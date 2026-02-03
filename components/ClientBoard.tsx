
import React from 'react';
import { Client, ClientHealth } from '../types';
import { MoreHorizontal, Plus, Search, Filter } from 'lucide-react';

interface ClientBoardProps {
  clients: Client[];
}

const ClientBoard: React.FC<ClientBoardProps> = ({ clients }) => {
  // Fixed: use ClientHealth enum and handle string fallback
  const getHealthColor = (health: ClientHealth | string) => {
    switch (health) {
      case ClientHealth.EXCELLENT: return 'text-green-400 bg-green-400/10';
      case ClientHealth.STABLE: return 'text-blue-400 bg-blue-400/10';
      case ClientHealth.AT_RISK: return 'text-amber-400 bg-amber-400/10';
      case ClientHealth.CRITICAL: return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase">Gestão de Carteira</h2>
          <p className="text-sm text-gray-400">Acompanhamento detalhado de cada jornada.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input placeholder="Buscar cliente..." className="bg-[#111] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-xs w-64 outline-none focus:border-teal-500/50" />
           </div>
           <button className="p-2 bg-[#111] border border-white/10 rounded-lg hover:bg-white/5"><Filter className="w-4 h-4"/></button>
           <button className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-black font-black text-xs rounded-lg hover:scale-105 transition-transform">
             <Plus className="w-4 h-4" /> NOVO CLIENTE
           </button>
        </div>
      </header>

      <div className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.03] border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Saúde</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-center">Progresso</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest">Responsável (ID)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-500 tracking-widest text-right">Valor</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">{client.name}</span>
                      <span className="text-[10px] text-gray-500">{client.industry}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${getHealthColor(client.health)}`}>
                      {client.health}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1 min-w-[120px]">
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-teal-500" style={{ width: `${client.progress}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">{client.progress}% concluído</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       {/* Fixed: client.owner and client.lastContact do not exist on Client type; using managerId instead */}
                       <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold">M</div>
                       <span className="text-xs text-gray-300">{client.managerId || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-bold text-white">R$ {client.contractValue.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-gray-600 hover:text-white"><MoreHorizontal className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ClientBoard;
