
import React, { useState } from 'react';
import { Client, Task, User, DefaultUserRole } from '../types';
// Added CheckCircle2 to imports
import { LayoutDashboard, ArrowRight, ChevronRight, FileText, Clock, AlertTriangle, ShieldAlert, Calendar as CalendarIcon, Zap, Sparkles, BrainCircuit, Activity, BarChart3, TrendingUp, Trophy, CheckCircle2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface DashboardProps {
  clients: Client[];
  tasks: Task[];
  currentUser: User;
  currentMonth: string;
  onMonthChange: (month: string) => void;
  months: string[];
  team: User[];
}

const Dashboard: React.FC<DashboardProps> = ({ clients, tasks, currentUser, currentMonth, onMonthChange, months, team }) => {
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  
  const filteredClients = isCEO ? clients : clients.filter(c => c.assignedUserIds?.includes(currentUser.id));
  const filteredTasks = isCEO ? tasks : tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  const completedTasks = filteredTasks.filter(t => t.status === 'COMPLETED').length;
  const avgProgress = filteredClients.length ? Math.round(filteredClients.reduce((acc, c) => acc + (c.progress || 0), 0) / filteredClients.length) : 0;

  const getStatusColor = (flag: string) => {
    if (flag === 'GREEN') return 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]';
    if (flag === 'YELLOW') return 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.4)]';
    return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.4)]';
  };

  const handleGenerateAiInsight = async () => {
    setIsGeneratingInsight(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
      const prompt = `Como analista de operações master da Omega Group, analise estes dados e dê um diagnóstico curto e assertivo (máximo 100 palavras) sobre a saúde da agência:
      Total Clientes: ${clients.length}
      Progresso Médio: ${avgProgress}%
      Tarefas Concluídas: ${tasks.filter(t => t.status === 'COMPLETED').length}/${tasks.length}
      Clientes em Risco (Vermelho): ${clients.filter(c => c.statusFlag === 'RED').length}
      Foque em sugerir a próxima grande ação para o CEO.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setAiInsight(response.text || "Dados insuficientes para diagnóstico.");
    } catch (e) {
      setAiInsight("Erro ao conectar com Omega Oracle.");
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  // Rank Operacional (Eficiência)
  const opRank = team
    .filter(u => u.role !== DefaultUserRole.SALES && u.role !== DefaultUserRole.CEO)
    .sort((a, b) => (b.efficiencyScore || 0) - (a.efficiencyScore || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto pb-12">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <LayoutDashboard className="w-6 h-6 text-[#14b8a6]" />
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight italic uppercase leading-none">Painel de Performance</h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Nível: {currentUser.name} ({currentUser.role})</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isCEO && (
            <button 
              onClick={handleGenerateAiInsight}
              disabled={isGeneratingInsight}
              className="bg-purple-600/10 border border-purple-500/30 px-6 py-3 rounded-2xl text-[10px] font-black text-purple-400 uppercase flex items-center gap-3 hover:bg-purple-600/20 transition-all shadow-xl shadow-purple-900/10"
            >
              <BrainCircuit className={`w-4 h-4 ${isGeneratingInsight ? 'animate-spin' : ''}`} /> 
              {isGeneratingInsight ? 'Consultando Oracle...' : 'Omega Oracle Insight'}
            </button>
          )}
          <div className="flex items-center gap-3 bg-[#111] border border-white/5 p-2 rounded-2xl">
            <select 
              value={currentMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-black border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-[#14b8a6] outline-none cursor-pointer uppercase"
            >
              {months.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </header>

      {aiInsight && (
        <div className="bg-gradient-to-br from-purple-900/20 to-teal-900/20 border border-purple-500/20 rounded-[40px] p-10 relative overflow-hidden animate-in slide-in-from-top-4">
           <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles className="w-24 h-24 text-purple-400" /></div>
           <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white"><BrainCircuit className="w-6 h-6" /></div>
              <h4 className="text-lg font-black text-white uppercase italic">Diagnóstico Estratégico Ômega</h4>
           </div>
           <p className="text-sm text-gray-300 leading-relaxed font-medium italic">"{aiInsight}"</p>
           <button onClick={() => setAiInsight(null)} className="mt-6 text-[9px] font-black text-gray-500 uppercase tracking-widest hover:text-white transition-colors">Dispensar Análise</button>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        <div className="xl:col-span-3 space-y-8">
          <div className="bg-[#111] border border-white/5 rounded-[48px] p-12 relative overflow-hidden group min-h-[450px] flex flex-col justify-center shadow-2xl">
            <div className="absolute right-[-20px] bottom-[-20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <span className="text-[350px] font-black leading-none select-none text-white italic">Ω</span>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Health Score Médio</p>
                  <h3 className="text-[120px] font-black text-white leading-none tracking-tighter italic">
                    {avgProgress}<span className="text-[#14b8a6]">%</span>
                  </h3>
                </div>
                <div className="hidden md:flex gap-4">
                   <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                      <p className="text-[9px] font-black text-gray-600 uppercase mb-1">Taxa de Conclusão</p>
                      <p className="text-2xl font-black text-white">{Math.round((completedTasks/(filteredTasks.length || 1)) * 100)}%</p>
                   </div>
                </div>
              </div>
              <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-gradient-to-r from-teal-500 to-[#14b8a6] shadow-[0_0_25px_rgba(20,184,166,0.6)] transition-all duration-1000 ease-out" 
                  style={{ width: `${avgProgress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12 relative z-10">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-teal-500/20 transition-all hover:scale-105">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest flex items-center gap-2"><Clock className="w-3 h-3"/> Tarefas</p>
                <p className="text-4xl font-black text-white">{filteredTasks.length}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-teal-500/20 transition-all hover:scale-105">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest flex items-center gap-2"><CheckCircle2 className="w-3 h-3 text-teal-500"/> Prontas</p>
                <p className="text-4xl font-black text-[#14b8a6]">{completedTasks}</p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-teal-500/20 transition-all hover:scale-105">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest flex items-center gap-2"><BarChart3 className="w-3 h-3 text-purple-500"/> Eficiência</p>
                <p className="text-4xl font-black text-white">{currentUser.efficiencyScore || 0}<span className="text-xs text-gray-600 ml-1">pts</span></p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 rounded-3xl p-8 hover:border-teal-500/20 transition-all hover:scale-105">
                <p className="text-[10px] font-bold text-gray-600 uppercase mb-2 tracking-widest flex items-center gap-2"><Activity className="w-3 h-3 text-red-500"/> Contas</p>
                <p className="text-4xl font-black text-white">{filteredClients.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-[40px] p-8 space-y-8 flex-1 flex flex-col shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform"><Trophy className="w-16 h-16 text-teal-500" /></div>
            <h4 className="text-sm font-black text-white uppercase italic tracking-[0.2em] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-teal-500" /> Elite Operacional
            </h4>
            <div className="space-y-4">
              {opRank.map((u, i) => (
                <div key={u.id} className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl hover:border-teal-500/30 transition-all">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-teal-500 text-black' : 'bg-white/5 text-gray-500'}`}>{i+1}</span>
                    <div>
                      <p className="text-xs font-black text-white uppercase tracking-tighter italic">{u.name}</p>
                      <p className="text-[9px] text-gray-600 font-bold uppercase">Score: {u.efficiencyScore || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
              {opRank.length === 0 && <p className="text-[10px] text-gray-700 italic text-center py-10">Membros sem pontuação ainda.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
