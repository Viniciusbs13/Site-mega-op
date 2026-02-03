
import React from 'react';
// Import DefaultUserRole for enum value access
import { Client, Task, User, DefaultUserRole } from '../types';
import { LayoutDashboard, ArrowRight, ChevronRight, FileText, Clock, AlertTriangle, ShieldAlert, Calendar as CalendarIcon, Zap } from 'lucide-react';

interface DashboardProps {
  clients: Client[];
  tasks: Task[];
  currentUser: User;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  months: string[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, tasks, currentUser, currentMonth, onMonthChange, months }) => {
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  
  // Filtra dados se não for CEO
  const filteredClients = isCEO ? clients : clients.filter(c => c.managerId === currentUser.id);
  const filteredTasks = isCEO ? tasks : tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED').length;
  const avgProgress = filteredClients.length ? Math.round(filteredClients.reduce((acc, c) => acc + c.progress, 0) / filteredClients.length) : 0;

  const getStatusColor = (flag: string) => {
    if (flag === 'GREEN') return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    if (flag === 'YELLOW') return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
  };

  // Lógica do Calendário
  const today = new Date();
  const currentDay = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const motivationalPhrases = [
    "O SUCESSO É A SOMA DE PEQUENOS ESFORÇOS REPETIDOS DIA APÓS DIA.",
    "A DISCIPLINA É A PONTE ENTRE METAS E REALIZAÇÕES.",
    "NÃO PARE QUANDO ESTIVER CANSADO, PARE QUANDO TIVER TERMINADO.",
    "EXCELÊNCIA NÃO É UM ATO, MAS UM HÁBITO.",
    "O TRABALHO DURO VENCE O TALENTO QUANDO O TALENTO NÃO TRABALHA DURO.",
    "SUA ÚNICA COMPETIÇÃO É QUEM VOCÊ FOI ONTEM.",
    "FOCO TOTAL NA EXECUÇÃO. O RESULTADO É CONSEQUÊNCIA."
  ];

  const phraseOfTheDay = motivationalPhrases[today.getDate() % motivationalPhrases.length];

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
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-12 relative overflow-hidden group min-h-[400px] flex flex-col justify-center shadow-2xl">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <span className="text-[350px] font-black leading-none select-none text-white">Ω</span>
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
                  className="h-full bg-gradient-to-r from-teal-500 to-[#14b8a6] shadow-[0_0_15px_rgba(20,184,166,0.5)] transition-all duration-1000 ease-out" 
                  style={{ width: `${avgProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 relative z-10">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest">Suas Tarefas</p>
                <p className="text-3xl font-black text-white">{filteredTasks.length}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest">Concluídas</p>
                <p className="text-3xl font-black text-[#14b8a6]">{completedTasks}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 hover:border-teal-500/20 transition-colors">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest">Suas Contas</p>
                <p className="text-3xl font-black text-white">{filteredClients.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DO CALENDÁRIO & MOTIVAÇÃO */}
        <div className="xl:col-span-1 space-y-6 flex flex-col">
          {/* FRASE MOTIVACIONAL */}
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 flex flex-col justify-center min-h-[140px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Zap className="w-12 h-12 text-teal-500" />
            </div>
            <p className="text-[9px] font-black text-teal-500 uppercase tracking-[0.3em] mb-3">Diretoria Ômega • Mindset</p>
            <h3 className="text-lg font-black text-white leading-tight uppercase italic tracking-tighter">
              "{phraseOfTheDay}"
            </h3>
          </div>

          {/* CALENDÁRIO */}
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 flex-1 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <CalendarIcon className="w-5 h-5 text-teal-500" />
                <h4 className="text-sm font-black text-white uppercase italic tracking-widest">{currentMonth.split(' ')[0]}</h4>
              </div>
              <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{today.getFullYear()}</span>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, idx) => (
                <div key={idx} className="text-center text-[9px] font-black text-gray-700 uppercase">{day}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2 flex-1 content-start">
              {blanks.map(i => <div key={`b-${i}`} className="aspect-square"></div>)}
              {days.map(day => (
                <div 
                  key={day} 
                  className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold transition-all border ${
                    day === currentDay 
                    ? 'bg-teal-500 text-black border-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.4)] scale-110 z-10' 
                    : 'bg-black/20 border-white/5 text-gray-500 hover:border-teal-500/30'
                  }`}
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5">
               <div className="flex items-center justify-between">
                 <div className="space-y-1">
                   <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Status da Operação</p>
                   <p className="text-[10px] font-bold text-green-500 uppercase tracking-tighter flex items-center gap-1">
                     <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Sistema Ativo
                   </p>
                 </div>
                 <div className="text-right">
                    <p className="text-[8px] font-black text-gray-600 uppercase tracking-widest">Check-in de Hoje</p>
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter">Realizado</p>
                 </div>
               </div>
            </div>
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
