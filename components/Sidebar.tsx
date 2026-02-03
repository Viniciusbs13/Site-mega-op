
import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { UserRole, User, DefaultUserRole } from '../types';
import { X, Shield, Settings, LogOut } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout }) => {
  // Fix: Cast item.roles to string[] to allow safe comparison with UserRole (which can be a custom string)
  const filteredNav = NAVIGATION_ITEMS.filter(item => 
    (item.roles as string[]).includes(currentUser.role)
  );

  return (
    <aside className="w-72 bg-[#0a0a0a] border-r border-white/5 flex flex-col h-full overflow-hidden shrink-0">
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#14b8a6] rounded-lg flex items-center justify-center shadow-[0_5px_15px_rgba(20,184,166,0.3)]">
            <span className="text-black font-black text-lg">Ω</span>
          </div>
          <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">OMEGA</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-sm font-bold uppercase tracking-tighter italic ${
              activeTab === item.id
                ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-2">
            <Shield className="w-3 h-3 text-[#14b8a6]" />
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sessão Segura</span>
          </div>
          
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] text-xs font-black border border-[#14b8a6]/20">
                  {currentUser.name[0]}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[10px] font-black text-white uppercase truncate">{currentUser.name}</p>
                  <p className="text-[8px] font-bold text-[#14b8a6] uppercase tracking-widest truncate">{currentUser.role.replace('_', ' ')}</p>
                </div>
             </div>
          </div>
        </div>

        <div className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-3 text-gray-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-white/5">
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:text-red-400 transition-colors text-xs font-black uppercase tracking-widest rounded-xl hover:bg-red-500/5"
          >
            <LogOut className="w-4 h-4" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
