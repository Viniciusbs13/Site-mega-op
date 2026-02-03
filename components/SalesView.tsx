
import React, { useState } from 'react';
// Import DefaultUserRole for enum value access
import { SalesGoal, User, DefaultUserRole, Client } from '../types';
import { Target, TrendingUp, Trophy, Bell, Plus, Edit2, DollarSign, Link, Clipboard, StickyNote, CheckCircle2, UserCheck, Info } from 'lucide-react';

interface SalesViewProps {
  goal: SalesGoal;
  team: User[];
  clients: Client[];
  currentUser: User;
  onUpdateGoal: (updates: Partial<SalesGoal>) => void;
  onRegisterSale: (userId: string, value: number, clientName: string) => void;
  onUpdateUserGoal: (userId: string, personalGoal: number, superGoal: number) => void;
  onUpdateClientNotes: (clientId: string, closingNotes: string) => void;
}

const SalesView: React.FC<SalesViewProps> = ({ 
  goal, team, clients, currentUser, onUpdateGoal, onRegisterSale, onUpdateUserGoal, onUpdateClientNotes 
}) => {
  const [celebration, setCelebration] = useState<{ name: string; value: number } | null>(null);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [saleValue, setSaleValue] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [copied, setCopied] = useState(false);

  /* Fixed: Using DefaultUserRole enum instead of UserRole type alias */
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const isSales = currentUser.role === DefaultUserRole.SALES;

  const sellers = team.filter(u => u.role === DefaultUserRole.SALES).sort((a, b) => (b.salesVolume || 0) - (a.salesVolume || 0));
  const myClosedClients = clients.filter(c => c.salesId === currentUser.id);
  const progressPercent = Math.min(100, Math.round((goal.currentValue / goal.monthlyTarget) * 100));

  const handleConfirmSale = () => {
    const val = parseFloat(saleValue);
    if (isNaN(val) || val <= 0 || !newClientName) return;
    
    setCelebration({ name: currentUser.name, value: val });
    onRegisterSale(currentUser.id, val, newClientName);
    setSaleValue('');
    setNewClientName('');
    setTimeout(() => setCelebration(null), 5000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(goal.contractFormUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSellerStatusClass = (seller: User) => {
    const vol = seller.salesVolume || 0;
    const g = seller.personalGoal || 10000;
    const sg = seller.superGoal || 15000;
    if (vol >= sg) return 'animate-gold-shine border-amber-400';
    if (vol >= g) return 'border-green-500 bg-green-500/5';
    if (vol >= g * 0.5) return 'animate-pulse-yellow border-yellow-500/50 bg-yellow-500/5';
    return 'border-red-500/30 bg-red-500/5';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
      
      {celebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl animate-in fade-in zoom-in duration-300">
          <div className="text-center space-y-8 p-12 bg-white/[0.02] rounded-[64px] border border-white/5">
            <Bell className="w-64 h-64 text-amber-400 animate-bell mx-auto drop-shadow-[0_0_80px_rgba(251,191,36,0.7)]" />
            <div className="space-y-2">
              <h2 className="text-7xl font-black text-white uppercase tracking-tighter italic">META SENDO ESMAGADA!</h2>
              <p className="text-4xl font-bold text-[#14b8a6] uppercase">{celebration.name}</p>
              <p className="text-6xl font-black text-white">R$ {celebration.value.toLocaleString()}</p>
            </div>
            <button onClick={() => setCelebration(null)} className="px-16 py-6 bg-white text-black font-black rounded-full hover:scale-110 transition-transform uppercase tracking-widest text-lg">Continuar o Grind</button>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Target className="w-6 h-6 text-[#14b8a6]" />
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight uppercase italic">Arena de Vendas</h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Performace & Motivação</p>
          </div>
        </div>
        {isCEO && (
          <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="bg-white/5 border border-white/10 px-6 py-2 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-white/10 transition-colors flex items-center gap-2">
            <Edit2 className="w-3 h-3" /> Ajustes de Meta (CEO)
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        <div className="xl:col-span-2 space-y-8">
          
          {isSales && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 space-y-6">
                <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-[#14b8a6]" /> Lançar Nova Vitória
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-600 uppercase">Nome da Empresa/Cliente</label>
                    <input 
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Ex: TechNova LTDA"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#14b8a6]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-600 uppercase">Valor do Contrato</label>
                    <input 
                      type="number"
                      value={saleValue}
                      onChange={(e) => setSaleValue(e.target.value)}
                      placeholder="R$ 0,00"
                      className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-[#14b8a6]"
                    />
                  </div>
                  <button onClick={handleConfirmSale} className="w-full bg-[#14b8a6] text-black py-4 rounded-xl font-black text-sm hover:scale-[1.02] transition-all uppercase shadow-[0_10px_30px_rgba(20,184,166,0.1)]">
                    REGISTRAR E TOCAR O SINO
                  </button>
                </div>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 text-blue-400">
                    <Link className="w-4 h-4" /> Link de Onboarding
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-2">Envie ao cliente para coletar os dados do contrato:</p>
                </div>
                <div className="mt-4 p-4 bg-black/50 border border-white/5 rounded-2xl flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-mono truncate mr-2">{goal.contractFormUrl}</span>
                  <button onClick={copyToClipboard} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white">
                    {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Clipboard className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MEUS CLIENTES FECHADOS (Contexto Operacional) */}
          {isSales && (
            <section className="space-y-4">
               <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                 <UserCheck className="w-4 h-4 text-teal-500" /> Minhas Vendas (Contexto Operacional)
               </h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {myClosedClients.map(client => (
                   <div key={client.id} className="bg-[#111] border border-white/5 rounded-3xl p-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-bold text-white uppercase">{client.name}</p>
                        <span className="text-[10px] font-black text-teal-500">R$ {client.contractValue.toLocaleString()}</span>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-gray-600 uppercase flex items-center gap-1">
                          <Info className="w-3 h-3" /> O que o operacional precisa saber?
                        </label>
                        <textarea 
                          value={client.closingNotes || ''}
                          onChange={(e) => onUpdateClientNotes(client.id, e.target.value)}
                          placeholder="Ex: Cliente focado em leads de WhatsApp, prefere contato por e-mail..."
                          className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-gray-300 min-h-[80px] outline-none focus:border-teal-500 transition-all resize-none"
                        />
                      </div>
                   </div>
                 ))}
                 {myClosedClients.length === 0 && (
                   <div className="col-span-full py-12 text-center bg-white/[0.01] rounded-3xl border border-dashed border-white/5 italic text-gray-600 text-sm">
                     Nenhum fechamento registrado este mês. Vamos pra cima!
                   </div>
                 )}
               </div>
            </section>
          )}

          {isCEO && isEditingGoal && (
            <div className="bg-[#111] border border-teal-500/30 rounded-[32px] p-8 space-y-6 animate-in slide-in-from-top-4">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">Configurações de Meta Direta</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-600 uppercase">Meta Global (R$)</label>
                  <input type="number" defaultValue={goal.monthlyTarget} onBlur={(e) => onUpdateGoal({ monthlyTarget: parseFloat(e.target.value) })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-600 uppercase">Super Meta (R$)</label>
                  <input type="number" defaultValue={goal.monthlySuperTarget} onBlur={(e) => onUpdateGoal({ monthlySuperTarget: parseFloat(e.target.value) })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-600 uppercase">Link de Form</label>
                  <input type="text" defaultValue={goal.contractFormUrl} onBlur={(e) => onUpdateGoal({ contractFormUrl: e.target.value })} className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-blue-400" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#111] border border-white/5 rounded-[32px] p-10 relative overflow-hidden group">
             <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                <TrendingUp className="w-[300px] h-[300px]" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="space-y-6 flex-1">
                  <div>
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Faturamento Global do Mês</p>
                    <h3 className="text-6xl font-black text-white tracking-tighter italic">R$ {goal.currentValue.toLocaleString()}</h3>
                  </div>
                  <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#14b8a6] to-blue-500 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Contratos</p>
                    <p className="text-3xl font-black text-white">{goal.totalSales}</p>
                  </div>
                  <div className="bg-black/40 p-6 rounded-3xl border border-white/5 text-center">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Progresso</p>
                    <p className="text-3xl font-black text-[#14b8a6]">{progressPercent}%</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 space-y-6 h-full flex flex-col">
            <h4 className="flex items-center gap-2 text-xl font-black text-white uppercase italic tracking-tighter">
              <Trophy className="w-6 h-6 text-yellow-500" /> Ranking Global
            </h4>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {sellers.map((seller, index) => (
                <div key={seller.id} className={`flex flex-col p-5 rounded-3xl border transition-all duration-500 ${getSellerStatusClass(seller)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${index === 0 ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-white/10 text-white'}`}>{index + 1}º</span>
                      <p className={`text-sm font-bold uppercase ${seller.id === currentUser.id ? 'text-[#14b8a6]' : 'text-white'}`}>{seller.name}</p>
                    </div>
                    <p className="text-sm font-black text-white">R$ {(seller.salesVolume || 0).toLocaleString()}</p>
                  </div>
                  {isCEO && isEditingGoal ? (
                    <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                      <input type="number" placeholder="Meta" onBlur={(e) => onUpdateUserGoal(seller.id, parseFloat(e.target.value), seller.superGoal || 0)} className="bg-black border border-white/5 rounded p-1 text-[10px] text-teal-400" />
                      <input type="number" placeholder="Super" onBlur={(e) => onUpdateUserGoal(seller.id, seller.personalGoal || 0, parseFloat(e.target.value))} className="bg-black border border-white/5 rounded p-1 text-[10px] text-amber-400" />
                    </div>
                  ) : (
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                      <div className="h-full bg-[#14b8a6]" style={{ width: `${Math.min(100, ((seller.salesVolume || 0)/(seller.personalGoal || 1)) * 100)}%` }}></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesView;
