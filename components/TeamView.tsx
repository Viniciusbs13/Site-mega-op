
import React, { useState } from 'react';
import { User, UserRole, DefaultUserRole } from '../types';
import { Mail, ShieldCheck, UserCog, UserPlus, Trash2, ShieldPlus, X, Power, PowerOff, UserCheck, AlertCircle } from 'lucide-react';

interface TeamViewProps {
  team: User[];
  currentUser: User;
  availableRoles: string[];
  onUpdateRole: (userId: string, newRole: UserRole) => void;
  onAddMember: (name: string, role: UserRole) => void;
  onRemoveMember: (userId: string) => void;
  onAddRole: (roleName: string) => void;
  onToggleActive: (userId: string) => void;
}

const TeamView: React.FC<TeamViewProps> = ({ 
  team, currentUser, availableRoles, onUpdateRole, onAddMember, onRemoveMember, onAddRole, onToggleActive 
}) => {
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>(DefaultUserRole.MANAGER);
  const [newRoleName, setNewRoleName] = useState('');

  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const pendingUsers = team.filter(u => !u.isApproved);
  const activeTeam = team.filter(u => u.isApproved);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onAddMember(newName, newRole);
    setNewName('');
    setIsAddingMember(false);
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return;
    onAddRole(newRoleName.toUpperCase().replace(/\s+/g, '_'));
    setNewRoleName('');
    setIsAddingRole(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Central de Comando</h2>
          <p className="text-sm text-gray-400 font-medium">Gestão hierárquica e controle de acessos ativos.</p>
        </div>
        
        {isCEO && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsAddingRole(true)}
              className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl text-[10px] font-black text-white uppercase hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <ShieldPlus className="w-4 h-4 text-purple-400" /> Nova Função
            </button>
            <button 
              onClick={() => setIsAddingMember(true)}
              className="bg-[#14b8a6] px-6 py-3 rounded-2xl text-[10px] font-black text-black uppercase hover:scale-105 transition-all flex items-center gap-2 shadow-[0_10px_20px_rgba(20,184,166,0.2)]"
            >
              <UserPlus className="w-4 h-4" /> Admitir Direto
            </button>
          </div>
        )}
      </header>

      {/* SEÇÃO DE APROVAÇÕES (EXCLUSIVO CEO) */}
      {isCEO && pendingUsers.length > 0 && (
        <section className="space-y-6 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3 px-4">
             <AlertCircle className="w-5 h-5 text-amber-500" />
             <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Solicitações Pendentes ({pendingUsers.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {pendingUsers.map(user => (
               <div key={user.id} className="bg-amber-500/5 border border-amber-500/20 rounded-[32px] p-6 flex items-center justify-between group hover:bg-amber-500/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500 font-black">
                      {user.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white uppercase">{user.name}</p>
                      <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Solicitou: {user.role.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onToggleActive(user.id)}
                      className="bg-green-500 p-3 rounded-xl text-black hover:scale-110 transition-transform"
                      title="Aprovar Usuário"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onRemoveMember(user.id)}
                      className="bg-white/5 p-3 rounded-xl text-red-500 hover:bg-red-500/20 transition-all"
                      title="Recusar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
               </div>
             ))}
          </div>
        </section>
      )}

      {/* LISTA DE EQUIPE ATIVA */}
      <div className="space-y-6">
        <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] px-4">Membros Ativos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeTeam.map((member) => (
            <div key={member.id} className={`bg-[#111] border rounded-[40px] p-8 transition-all group relative overflow-hidden flex flex-col ${!member.isActive ? 'opacity-40 grayscale' : 'border-white/5 hover:border-[#14b8a6]/20'}`}>
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${member.isActive ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <span className="text-xl font-black">{member.name[0]}</span>
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-lg uppercase tracking-tighter italic">{member.name}</h4>
                    <span className={`text-[9px] font-black tracking-widest uppercase ${member.isActive ? 'text-teal-500' : 'text-red-500'}`}>
                      {member.isActive ? 'Acesso Liberado' : 'Suspenso'}
                    </span>
                  </div>
                </div>
                
                {isCEO && member.role !== DefaultUserRole.CEO && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onToggleActive(member.id)}
                      className={`p-3 rounded-xl transition-all ${member.isActive ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                    >
                      {member.isActive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </button>
                    <button 
                      onClick={() => onRemoveMember(member.id)}
                      className="p-3 bg-white/5 text-gray-600 hover:text-white hover:bg-red-600 rounded-xl transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center gap-2"><ShieldCheck className="w-3 h-3" /> Nível Operacional</label>
                  {isCEO ? (
                    <select 
                      value={member.role}
                      onChange={(e) => onUpdateRole(member.id, e.target.value)}
                      className="w-full bg-black border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold text-teal-400 outline-none focus:border-teal-500 transition-all cursor-pointer"
                    >
                      {availableRoles.map(role => (
                        <option key={role} value={role}>{role.replace('_', ' ')}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-xs font-bold text-gray-500 uppercase">
                      {member.role.replace('_', ' ')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL ADICIONAR DIRETO */}
      {isAddingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <form onSubmit={handleAddMember} className="bg-[#111] border border-white/10 p-10 rounded-[48px] w-full max-w-md space-y-6 shadow-2xl relative">
            <button type="button" onClick={() => setIsAddingMember(false)} className="absolute right-8 top-8 text-gray-500 hover:text-white"><X /></button>
            <h3 className="text-2xl font-black text-white uppercase italic">Cadastro Direto</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Nome do Colaborador</label>
                <input required value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#14b8a6]" placeholder="Ex: Lucas Silva" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Cargo Definido</label>
                <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white outline-none">
                  {availableRoles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-[#14b8a6] text-black py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">REGISTRAR MEMBRO ATIVO</button>
          </form>
        </div>
      )}

      {/* MODAL NOVA FUNÇÃO */}
      {isAddingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <form onSubmit={handleAddRole} className="bg-[#111] border border-white/10 p-10 rounded-[48px] w-full max-w-md space-y-6 shadow-2xl relative">
            <button type="button" onClick={() => setIsAddingRole(false)} className="absolute right-8 top-8 text-gray-500 hover:text-white"><X /></button>
            <h3 className="text-2xl font-black text-white uppercase italic">Criar Nível de Acesso</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Nome da Função</label>
                <input required value={newRoleName} onChange={e => setNewRoleName(e.target.value)} className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-purple-500" placeholder="Ex: Designer Sênior" />
              </div>
            </div>
            <button type="submit" className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-all">ESTABELECER FUNÇÃO</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default TeamView;
