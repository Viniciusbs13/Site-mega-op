
import React from 'react';
// Import DefaultUserRole for enum value access
import { Client, Task, User, DefaultUserRole } from '../types';
import { LayoutDashboard, ArrowRight, ChevronRight, FileText, Clock, AlertTriangle, ShieldAlert } from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  tasks: Task[];
  currentUser: User;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  months: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, tasks, currentUser, currentMonth, onMonthChange, months }) => {
  /* Fixed: Using DefaultUserRole enum instead of UserRole type alias */
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  
  // Filtra dados se não for CEO
  const filteredClients = isCEO ? clients : clients.filter(c => c.managerId === currentUser.id);
  const filteredTasks = isCEO ? tasks : tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED').length;
  const pendingTasks = filteredTasks.filter(t => t.status === 'PENDING').length;
  const avgProgress = filteredClients.length ? Math.round(filteredClients.reduce((acc, c) => acc + c.progress, 0) / filteredClients.length) : 0;

  const getStatusColor = (flag: string) => {
    if (flag === 'GREEN') return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    if (flag === 'YELLOW') return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="w-6 h-6 text-[#14b8a6]" />
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight italic uppercase">Painel de Performance</h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Acesso: {currentUser.name} ({currentUser.role})</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-[#111] border border-white/5 p-2 rounded-2xl">
          <select 
            value={currentMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="bg-black border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-[#14b8a6] outline-none cursor-pointer uppercase"
          >
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-12 relative overflow-hidden group min-h-[400px] flex flex-col justify-center">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <span className="text-[350px] font-black leading-none select-none">Ω</span>
            </div>

            <div className="relative z-10">
              <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Seu Progresso Operacional</p>
              <div className="flex items-baseline gap-4 mb-8">
                <h3 className="text-[110px] font-black text-white leading-none tracking-tighter">
                  {avgProgress}<span className="text-[#14b8a6]">%</span>
                </h3>
                <p className="text-xl font-medium text-gray-500 lowercase">médio de entregas</p>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-1000 ease-out" 
                  style={{ width: `${avgProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 relative z-10">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest">Suas Tarefas</p>
                <p className="text-3xl font-black text-white">{filteredTasks.length}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest">Concluídas</p>
                <p className="text-3xl font-black text-[#14b8a6]">{completedTasks}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest">Suas Contas</p>
                <p className="text-3xl font-black text-white">{filteredClients.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#14b8a6] rounded-[32px] p-10 flex flex-col justify-between text-black relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] opacity-10">
            <span className="text-[200px] font-black">Ω</span>
          </div>
          <div className="relative z-10">
            <p className="text-lg font-bold mb-4 italic uppercase">{currentMonth}</p>
            <h3 className="text-4xl font-black leading-[1.1] tracking-tighter mb-8 uppercase italic">
              Excelência <br/> na execução.
            </h3>
          </div>
          <div className="p-4 bg-black/10 rounded-2xl">
             <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Status de Rede</p>
             <p className="text-xs font-bold">100% Criptografado</p>
          </div>
        </div>
      </div>

      {isCEO ? (
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h4 className="flex items-center gap-3 text-lg font-bold text-white uppercase tracking-tighter italic">
              <AlertTriangle className="w-5 h-5 text-yellow-500" /> Visão Administrativa (Global)
            </h4>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.02]">
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Cliente</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Progresso</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest">Gestor</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Contrato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {clients.map(client => (
                    <tr key={client.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="px-8 py-6">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(client.statusFlag)}`}></div>
                      </td>
                      <td className="px-8 py-6 font-bold text-white uppercase italic text-sm">{client.name}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="flex-1 h-1 bg-white/5 rounded-full max-w-[80px]">
                            <div className="h-full bg-[#14b8a6]" style={{ width: `${client.progress}%` }}></div>
                          </div>
                          <span className="text-[10px] font-black text-gray-500">{client.progress}%</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-400">{client.managerId || 'PENDENTE'}</td>
                      <td className="px-8 py-6 text-right font-black text-white text-sm">R$ {client.contractValue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        <div className="bg-[#111] border border-white/5 p-12 rounded-[32px] flex flex-col items-center justify-center text-center space-y-4">
           <ShieldAlert className="w-12 h-12 text-gray-700" />
           <div>
             <h4 className="text-lg font-bold text-white uppercase italic">Dados Confidenciais Ocultos</h4>
             <p className="text-xs text-gray-500 max-w-sm mx-auto">Valores contratuais e redflags globais são restritos ao nível de diretoria. Foque em seus resultados individuais.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
