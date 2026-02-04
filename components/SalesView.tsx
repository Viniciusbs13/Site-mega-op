
import React, { useState } from 'react';
import { SalesGoal, User, DefaultUserRole, Client, ServiceType } from '../types';
import { Target, TrendingUp, Trophy, Bell, Plus, Edit2, DollarSign, Link, Clipboard, UserCheck, Info, CheckCircle2, ListChecks, Rocket, Crown, Zap, FileText } from 'lucide-react';

interface SalesViewProps {
  goal: SalesGoal;
  team: User[];
  clients: Client[];
  currentUser: User;
  onUpdateGoal: (updates: Partial<SalesGoal>) => void;
  onRegisterSale: (userId: string, value: number, clientName: string, planItems: string[], serviceType: ServiceType) => void;
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
  const [serviceType, setServiceType] = useState<ServiceType>('PERPETUAL');
  const [copied, setCopied] = useState(false);

  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const isSales = currentUser.role === DefaultUserRole.SALES;

  const sellers = team.filter(u => u.role === DefaultUserRole.SALES).sort((a, b) => (b.salesVolume || 0) - (a.salesVolume || 0));
  const progressPercent = Math.min(100, Math.round((goal.currentValue / goal.monthlyTarget) * 100));

  const handleConfirmSale = () => {
    const val = parseFloat(saleValue);
    if (isNaN(val) || val <= 0 || !newClientName) return;
    
    const items = planItemsRaw
      .split(/[\n,]+/)
      .map(i => i.trim())
      .filter(i => i !== "");

    onRegisterSale(currentUser.id, val, newClientName, items, serviceType);
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
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Target className="w-6 h-6 text-[#14b8a6]" />
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight uppercase italic leading-none">Arena de Vendas</h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-2">Nível: Performance Ômega</p>
          </div>
        </div>
        {isCEO && (
          <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-white/10 transition-colors flex items-center gap-2">
            <Edit2 className="w-3 h-3" /> Configurações de Meta
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          {(isSales || isCEO) && (
            <div className="bg-[#111] border border-white/5 rounded-[50px] p-12 space-y-10 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-transparent opacity-30"></div>
                <h4 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">
                  <Rocket className="w-7 h-7 text-[#14b8a6]" /> Registrar Novo Contrato / Vitória
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4">Empresa / Projeto</label>
                      <input 
                        type="text"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        placeholder="Ex: Grupo Tech BR"
                        className="w-full bg-black border border-white/10 rounded-[30px] px-8 py-5 text-white outline-none focus:border-[#14b8a6] font-bold text-lg"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4">Valor (R$)</label>
                        <input 
                          type="number"
                          value={saleValue}
                          onChange={(e) => setSaleValue(e.target.value)}
                          placeholder="0,00"
                          className="w-full bg-black border border-white/10 rounded-[30px] px-8 py-5 text-white font-black text-xl outline-none focus:border-[#14b8a6]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4">Modelo</label>
                        <select 
                          value={serviceType}
                          onChange={(e) => setServiceType(e.target.value as ServiceType)}
                          className="w-full bg-black border border-white/10 rounded-[30px] px-6 py-5 text-white font-bold outline-none focus:border-[#14b8a6] text-xs uppercase"
                        >
                          <option value="PERPETUAL">Perpétuo</option>
                          <option value="ONE_TIME">Único / Spot</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-4 flex items-center gap-2">
                      <ListChecks className="w-4 h-4 text-teal-500" /> Escopo Principal do Plano
                    </label>
                    <textarea 
                      value={planItemsRaw}
                      onChange={(e) => setPlanItemsRaw(e.target.value)}
                      placeholder="Ex: Gestão Meta Ads, 4 Reels/mês..."
                      className="w-full h-full min-h-[160px] bg-black border border-white/10 rounded-[30px] px-8 py-6 text-xs text-gray-400 outline-none focus:border-[#14b8a6] resize-none font-medium leading-relaxed"
                    />
                  </div>
                </div>

                <button onClick={handleConfirmSale} className="w-full bg-[#14b8a6] text-black py-7 rounded-[35px] font-black text-xl hover:scale-[1.01] active:scale-95 transition-all uppercase shadow-[0_20px_50px_rgba(20,184,166,0.3)] italic flex items-center justify-center gap-4">
                   LANÇAR FATURAMENTO <Zap className="w-6 h-6" />
                </button>
            </div>
          )}

          {isCEO && isEditingGoal && (
            <div className="bg-[#111] border border-teal-500/30 rounded-[40px] p-10 space-y-8 animate-in slide-in-from-top-4 shadow-2xl">
              <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-3"><Zap className="w-4 h-4 text-teal-400" /> Configuração Estratégica de Metas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Meta Global de Vendas (R$)</label>
                  <input type="number" defaultValue={goal.monthlyTarget} onBlur={(e) => onUpdateGoal({ monthlyTarget: parseFloat(e.target.value) })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Super Meta de Alavancagem (R$)</label>
                  <input type="number" defaultValue={goal.monthlySuperTarget} onBlur={(e) => onUpdateGoal({ monthlySuperTarget: parseFloat(e.target.value) })} className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm text-white font-black" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-[#111] border border-white/5 rounded-[50px] p-16 relative overflow-hidden group shadow-2xl">
             <div className="absolute right-[-20px] top-[-20px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                <TrendingUp className="w-[400px] h-[400px]" />
             </div>
             <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                <div className="space-y-8 flex-1 text-center md:text-left">
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-[0.4em] mb-4">Volume Faturado / Mês Vigente</p>
                    <h3 className="text-8xl font-black text-white tracking-tighter italic drop-shadow-xl">R$ {goal.currentValue.toLocaleString()}</h3>
                  </div>
                  <div className="w-full h-6 bg-white/5 rounded-full overflow-hidden border border-white/5 p-1">
                    <div className="h-full bg-gradient-to-r from-[#14b8a6] via-teal-400 to-blue-500 shadow-[0_0_20px_rgba(20,184,166,0.5)] transition-all duration-1000 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                  </div>
                  <p className="text-[10px] font-black text-teal-500 uppercase tracking-widest">{progressPercent}% Concluído rumo à Meta Master</p>
                </div>
                <div className="grid grid-cols-1 gap-6 min-w-[200px]">
                  <div className="bg-black/60 p-10 rounded-[45px] border border-white/5 text-center shadow-lg group-hover:border-teal-500/20 transition-colors">
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-2">Contratos</p>
                    <p className="text-6xl font-black text-white">{goal.totalSales}</p>
                  </div>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#111] border border-white/5 rounded-[45px] p-10 space-y-8 h-full flex flex-col shadow-2xl">
            <h4 className="flex items-center gap-3 text-2xl font-black text-white uppercase italic tracking-tighter">
              <Trophy className="w-8 h-8 text-yellow-500" /> Rankings de Elite
            </h4>
            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {sellers.map((seller, index) => (
                <div key={seller.id} className={`flex flex-col p-8 rounded-[35px] border transition-all duration-500 ${getSellerStatusClass(seller)} shadow-sm relative overflow-hidden group/seller`}>
                  {index === 0 && <Crown className="absolute -right-2 -top-2 w-16 h-16 text-amber-500/20 rotate-12" />}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-5">
                      <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black ${index === 0 ? 'bg-amber-400 text-black shadow-lg shadow-amber-400/20' : 'bg-white/10 text-white'}`}>{index + 1}º</span>
                      <div>
                        <p className={`text-sm font-black uppercase tracking-tight ${seller.id === currentUser.id ? 'text-[#14b8a6]' : 'text-white'}`}>{seller.name}</p>
                        <p className="text-[9px] text-gray-600 font-bold uppercase">{seller.salesCount || 0} Fechamentos Totais</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                     <p className="text-2xl font-black text-white italic">R$ {(seller.salesVolume || 0).toLocaleString()}</p>
                     <p className="text-[10px] font-black text-gray-700 uppercase">{Math.round(((seller.salesVolume || 0)/(seller.personalGoal || 1)) * 100)}% Meta</p>
                  </div>
                  <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-4">
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
