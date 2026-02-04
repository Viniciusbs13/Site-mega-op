
import React, { useState } from 'react';
import { SalesGoal, User, DefaultUserRole, Client } from '../types';
// Fixed: Added missing icon imports (Rocket, Crown) from lucide-react
import { Target, TrendingUp, Trophy, Bell, Plus, Edit2, DollarSign, Link, Clipboard, UserCheck, Info, CheckCircle2, ListChecks, Rocket, Crown } from 'lucide-react';

interface SalesViewProps {
  goal: SalesGoal;
  team: User[];
  clients: Client[];
  currentUser: User;
  onUpdateGoal: (updates: Partial<SalesGoal>) => void;
  onRegisterSale: (userId: string, value: number, clientName: string, planItems?: string[]) => void;
  onUpdateUserGoal: (userId: string, personalGoal: number, superGoal: number) => void;
  onUpdateClientNotes: (clientId: string, closingNotes: string) => void;
}

const SalesView: React.FC<SalesViewProps> = ({ 
  goal, team, clients, currentUser, onUpdateGoal, onRegisterSale, onUpdateUserGoal, onUpdateClientNotes 
}) => {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [saleValue, setSaleValue] = useState<string>('');
  const [newClientName, setNewClientName] = useState('');
  const [planItemsRaw, setPlanItemsRaw] = useState('');
  const [copied, setCopied] = useState(false);

  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const isSales = currentUser.role === DefaultUserRole.SALES;

  const sellers = team.filter(u => u.role === DefaultUserRole.SALES).sort((a, b) => (b.salesVolume || 0) - (a.salesVolume || 0));
  const myClosedClients = clients.filter(c => c.salesId === currentUser.id);
  const progressPercent = Math.min(100, Math.round((goal.currentValue / goal.monthlyTarget) * 100));

  const handleConfirmSale = () => {
    const val = parseFloat(saleValue);
    if (isNaN(val) || val <= 0 || !newClientName) return;
    
    // Converte o texto bruto em um array de itens, removendo vazios
    const items = planItemsRaw
      .split(/[\n,]+/)
      .map(i => i.trim())
      .filter(i => i !== "");

    onRegisterSale(currentUser.id, val, newClientName, items);
    setSaleValue('');
    setNewClientName('');
    setPlanItemsRaw('');
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
            <div className="grid grid-cols-1 gap-6">
              <div className="bg-[#111] border border-white/5 rounded-[40px] p-10 space-y-8 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent opacity-30"></div>
                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-[#14b8a6]" /> Registrar Nova Vitória Master
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Empresa Contratante</label>
                      <input 
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Ex: Grupo Tech BR"
                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white outline-none focus:border-[#14b8a6] font-bold text-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4">Valor do Fee (R$)</label>
                      <input 
                        type="number"
                        value={saleValue}
                        onChange={(e) => setSaleValue(e.target.value)}
                        placeholder="R$ 5.000,00"
                        className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white font-black text-2xl outline-none focus:border-[#14b8a6]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-4 flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-teal-500" /> Itens Inclusos no Plano
                    </label>
                    <textarea 
                      value={planItemsRaw}
                      onChange={(e) => setPlanItemsRaw(e.target.value)}
                      placeholder="Ex: Gestão de Meta Ads, Copywriting, 4 Vídeos/mês..."
                      className="w-full h-full min-h-[140px] bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm text-gray-300 outline-none focus:border-[#14b8a6] resize-none"
                    />
                    <p className="text-[9px] text-gray-700 font-bold uppercase italic mt-1 ml-2">Separe os itens por linha ou vírgula</p>
                  </div>
                </div>

                <button onClick={handleConfirmSale} className="w-full bg-[#14b8a6] text-black py-6 rounded-2xl font-black text-lg hover:scale-[1.01] active:scale-95 transition-all uppercase shadow-[0_20px_40px_rgba(20,184,166,0.3)] italic">
                   Confirmar Faturamento & Notificar Time <Rocket className="inline w-6 h-6 ml-2" />
                </button>
              </div>

              <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 flex flex-col justify-between shadow-xl">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 text-blue-400">
                    <Link className="w-4 h-4" /> Link de Onboarding do Cliente
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-2">Envie ao cliente para coletar os dados operacionais:</p>
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

          {isCEO && isEditingGoal && (
            <div className="bg-[#111] border border-teal-500/30 rounded-[32px] p-8 space-y-6 animate-in slide-in-from-top-4 shadow-2xl">
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
              </div>
            </div>
          )}

          <div className="bg-[#111] border border-white/5 rounded-[40px] p-12 relative overflow-hidden group shadow-2xl">
             <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                <TrendingUp className="w-[300px] h-[300px]" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                <div className="space-y-6 flex-1 text-center md:text-left">
                  <div>
                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-[0.3em] mb-3">Faturamento Global / {new Date().toLocaleString('pt-br', {month: 'long'}).toUpperCase()}</p>
                    <h3 className="text-7xl font-black text-white tracking-tighter italic drop-shadow-lg">R$ {goal.currentValue.toLocaleString()}</h3>
                  </div>
                  <div className="w-full h-5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <div className="h-full bg-gradient-to-r from-[#14b8a6] to-blue-500 shadow-[0_0_20px_rgba(20,184,166,0.5)] transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-black/60 p-8 rounded-[35px] border border-white/5 text-center shadow-lg group-hover:border-teal-500/20 transition-colors">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Contratos</p>
                    <p className="text-4xl font-black text-white">{goal.totalSales}</p>
                  </div>
                  <div className="bg-black/60 p-8 rounded-[35px] border border-white/5 text-center shadow-lg group-hover:border-teal-500/20 transition-colors">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-4xl font-black text-[#14b8a6]">{progressPercent}%</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#111] border border-white/5 rounded-[32px] p-8 space-y-6 h-full flex flex-col shadow-2xl">
            <h4 className="flex items-center gap-2 text-xl font-black text-white uppercase italic tracking-tighter">
              <Trophy className="w-6 h-6 text-yellow-500" /> Elite Rank
            </h4>
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {sellers.map((seller, index) => (
                <div key={seller.id} className={`flex flex-col p-6 rounded-3xl border transition-all duration-500 ${getSellerStatusClass(seller)} shadow-sm relative overflow-hidden group/seller`}>
                  {/* Fixed: Crown icon now imported */}
                  {index === 0 && <Crown className="absolute -right-2 -top-2 w-12 h-12 text-amber-500/20 rotate-12" />}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black ${index === 0 ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-white/10 text-white'}`}>{index + 1}º</span>
                      <div>
                        <p className={`text-[13px] font-black uppercase tracking-tight ${seller.id === currentUser.id ? 'text-[#14b8a6]' : 'text-white'}`}>{seller.name}</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase">{seller.salesCount || 0} Fechamentos</p>
                      </div>
                    </div>
                    <p className="text-base font-black text-white italic">R$ {(seller.salesVolume || 0).toLocaleString()}</p>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-3">
                    <div className="h-full bg-teal-500" style={{ width: `${Math.min(100, ((seller.salesVolume || 0)/(seller.personalGoal || 1)) * 100)}%` }}></div>
                  </div>
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
