
import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { UserRole, User, DefaultUserRole } from '../types';
import { X, Shield, Settings, LogOut, Database, Wifi, WifiOff, Mail, Bell } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogout: () => void;
  dbStatus: 'connected' | 'error' | 'syncing';
  theme?: 'dark' | 'light';
  notificationCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, currentUser, onLogout, dbStatus, theme = 'dark', notificationCount = 0 }) => {
  if (!currentUser) return null;

  const filteredNav = NAVIGATION_ITEMS.filter(item => 
    (item.roles as string[]).includes(currentUser.role)
  );

  const isDark = theme === 'dark';

  return (
    <aside className={`w-72 ${isDark ? 'bg-[#0a0a0a] border-white/5' : 'bg-white border-gray-200'} border-r flex flex-col h-full overflow-hidden shrink-0 transition-colors duration-500`}>
      <div className="p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#14b8a6] rounded-lg flex items-center justify-center shadow-[0_5px_15px_rgba(20,184,166,0.3)]">
            <span className="text-black font-black text-lg">Ω</span>
          </div>
          <h1 className={`text-xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-black'} uppercase italic`}>OMEGA</h1>
        </div>
        
        {notificationCount > 0 && (
          <div className="relative group cursor-pointer" title={`${notificationCount} novas atualizações`}>
            <Bell className="w-5 h-5 text-teal-500 animate-bell" />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]">
              {notificationCount}
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        {filteredNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all text-sm font-bold uppercase tracking-tighter italic ${
              activeTab === item.id
                ? 'bg-[#14b8a6]/10 text-[#14b8a6] border border-[#14b8a6]/20'
                : `${isDark ? 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className={`p-4 border-t ${isDark ? 'border-white/5' : 'border-gray-100'} space-y-6`}>
        <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 text-[#14b8a6]" />
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sessão Segura</span>
            </div>
            <div className="flex items-center gap-2">
              {dbStatus === 'connected' ? (
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Live Cloud</span>
                </div>
              ) : dbStatus === 'syncing' ? (
                <div className="flex items-center gap-1.5">
                  <Database className="w-2.5 h-2.5 text-teal-500 animate-spin" />
                  <span className="text-[8px] font-black text-teal-500 uppercase tracking-widest">Salvando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <WifiOff className="w-2.5 h-2.5 text-red-500" />
                  <span className="text-[8px] font-black text-red-500 uppercase tracking-widest">Offline</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={`${isDark ? 'bg-[#111] border-white/5' : 'bg-gray-50 border-gray-200'} border rounded-2xl p-4 space-y-3 shadow-sm`}>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#14b8a6]/10 flex items-center justify-center text-[#14b8a6] text-xs font-black border border-[#14b8a6]/20 shrink-0">
                  {currentUser.name[0]}
                </div>
                <div className="overflow-hidden">
                  <p className={`text-[11px] font-black ${isDark ? 'text-white' : 'text-gray-800'} uppercase truncate italic tracking-tighter`}>{currentUser.name}</p>
                  <p className="text-[8px] font-bold text-[#14b8a6] uppercase tracking-[0.2em] truncate">{(currentUser.role || '').replace('_', ' ')}</p>
                </div>
             </div>
             <div className={`pt-2 border-t ${isDark ? 'border-white/5' : 'border-gray-200'} flex items-center gap-2 text-gray-500`}>
                <Mail className="w-3 h-3 text-teal-500/50" />
                <p className="text-[9px] font-medium truncate italic text-gray-400">{currentUser.email}</p>
             </div>
          </div>
        </div>

        <div className="space-y-1">
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-3 py-3 transition-all text-xs font-bold uppercase tracking-widest rounded-xl ${
              activeTab === 'settings' 
              ? 'bg-[#14b8a6]/10 text-[#14b8a6]' 
              : `${isDark ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configurações</span>
          </button>
          <button 
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:text-red-400 transition-colors text-xs font-black uppercase tracking-widest rounded-xl ${isDark ? 'hover:bg-red-500/5' : 'hover:bg-red-50'}`}
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
