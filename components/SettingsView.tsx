
import React, { useState } from 'react';
import { User } from '../types';
import { Settings, User as UserIcon, Mail, Sun, Moon, LogOut, Save, Shield, Fingerprint, Palette } from 'lucide-react';

interface SettingsViewProps {
  currentUser: User;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onUpdateName: (newName: string) => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ currentUser, theme, setTheme, onUpdateName, onLogout }) => {
  const [tempName, setTempName] = useState(currentUser.name);
  const [showSavedMessage, setShowSavedMessage] = useState(false);

  const isDark = theme === 'dark';

  const handleSaveName = () => {
    if (!tempName.trim()) return;
    onUpdateName(tempName);
    setShowSavedMessage(true);
    setTimeout(() => setShowSavedMessage(false), 2000);
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1000px] mx-auto pb-24">
      <header className="space-y-2">
        <h2 className={`text-4xl font-black italic uppercase tracking-tighter flex items-center gap-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Settings className="w-10 h-10 text-teal-500" /> Configurações de Acesso
        </h2>
        <p className={`${isDark ? 'text-gray-500' : 'text-slate-500'} font-medium ml-14 uppercase text-[10px] tracking-[0.3em]`}>Gestão de Identidade & Preferências Visuais</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* CARD PERFIL */}
        <section className={`${isDark ? 'bg-[#111] border-white/5' : 'bg-white border-slate-200 shadow-xl'} border rounded-[48px] p-10 space-y-8 transition-all duration-500`}>
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20">
               <UserIcon className="w-6 h-6 text-teal-500" />
             </div>
             <div>
               <h3 className={`text-lg font-black uppercase italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Seu Cadastro</h3>
               <p className="text-[9px] text-teal-500 font-black uppercase tracking-widest">Controle de Membro</p>
             </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className={`text-[10px] font-black ${isDark ? 'text-gray-500' : 'text-slate-400'} uppercase tracking-widest ml-2`}>Nome de Guerra / Exibição</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className={`w-full ${isDark ? 'bg-black border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'} border rounded-3xl px-6 py-4 text-sm font-bold outline-none focus:border-teal-500 transition-all`}
                />
                <button 
                  onClick={handleSaveName}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-teal-500 text-black rounded-xl hover:scale-110 transition-all shadow-lg shadow-teal-500/20"
                >
                  <Save className="w-4 h-4" />
                </button>
              </div>
              {showSavedMessage && <p className="text-[10px] text-teal-500 font-black ml-4 animate-pulse">Sincronizado com a Nuvem!</p>}
            </div>

            <div className="space-y-2">
              <label className={`text-[10px] font-black ${isDark ? 'text-gray-500' : 'text-slate-400'} uppercase tracking-widest ml-2`}>E-mail Vinculado</label>
              <div className={`w-full ${isDark ? 'bg-black/40 border-white/5 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-500'} border rounded-3xl px-6 py-4 text-xs font-medium italic flex items-center gap-3`}>
                <Mail className="w-4 h-4 opacity-40 text-teal-500" />
                {currentUser.email}
              </div>
            </div>
          </div>
        </section>

        {/* CARD APARÊNCIA */}
        <section className={`${isDark ? 'bg-[#111] border-white/5' : 'bg-white border-slate-200 shadow-xl'} border rounded-[48px] p-10 space-y-8 transition-all duration-500`}>
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/20">
               <Palette className="w-6 h-6 text-amber-500" />
             </div>
             <div>
               <h3 className={`text-lg font-black uppercase italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Personalização</h3>
               <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest">Ambiente de Trabalho</p>
             </div>
          </div>

          <div className="space-y-4">
            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'} leading-relaxed font-medium`}>
              Alterne entre os modos para melhor conforto visual durante sua jornada operacional.
            </p>
            
            <div className={`flex ${isDark ? 'bg-black' : 'bg-slate-100'} p-2 rounded-3xl border ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              <button 
                onClick={() => setTheme('dark')}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${isDark ? 'bg-[#14b8a6] text-black shadow-lg shadow-teal-500/20' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <Moon className="w-4 h-4" /> Noturno
              </button>
              <button 
                onClick={() => setTheme('light')}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${!isDark ? 'bg-[#14b8a6] text-black shadow-lg shadow-teal-500/20' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Sun className="w-4 h-4" /> Diurno
              </button>
            </div>
          </div>
        </section>

        {/* CARD SEGURANÇA */}
        <section className={`${isDark ? 'bg-[#111] border-white/5' : 'bg-white border-slate-200 shadow-xl'} border rounded-[48px] p-10 space-y-8 md:col-span-2 transition-all duration-500`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                 <Shield className="w-6 h-6 text-red-500" />
               </div>
               <div>
                 <h3 className={`text-lg font-black uppercase italic ${isDark ? 'text-white' : 'text-slate-900'}`}>Controle de Sessão</h3>
                 <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">Protocolos de Segurança Ômega</p>
               </div>
            </div>
            
            <button 
              onClick={onLogout}
              className="flex items-center gap-3 px-12 py-5 bg-red-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-red-700 hover:scale-[1.02] transition-all shadow-xl shadow-red-900/20 italic"
            >
              <LogOut className="w-5 h-5" /> Encerrar Sessão Agora
            </button>
          </div>

          <div className={`p-6 rounded-3xl ${isDark ? 'bg-black/40 border-white/5' : 'bg-slate-50 border-slate-200'} border flex items-center gap-6`}>
             <Fingerprint className="w-12 h-12 text-teal-500/30" />
             <div className="space-y-1">
               <p className={`text-sm font-black uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-800'}`}>Token de Identidade Digital</p>
               <p className={`text-[10px] font-mono break-all ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{currentUser.authId || currentUser.id}</p>
             </div>
          </div>
        </section>
      </div>
      
      <footer className="text-center py-6 opacity-30">
        <p className={`text-[8px] font-black ${isDark ? 'text-gray-500' : 'text-slate-400'} uppercase tracking-[0.8em]`}>Omega Management Protocol v2.6.0</p>
      </footer>
    </div>
  );
};

export default SettingsView;
