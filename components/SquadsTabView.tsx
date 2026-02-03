
import React, { useState } from 'react';
import { Squad, User, DefaultUserRole, Task, ChatMessage } from '../types';
import { Users2, Plus, Trash2, X, ShieldAlert, Target, MessageSquare, Send, Hash } from 'lucide-react';

interface SquadsTabViewProps {
  squads: Squad[];
  team: User[];
  currentUser: User;
  onUpdateSquads: (squads: Squad[]) => void;
  onAddTask: (task: Partial<Task>) => void;
}

const SquadsTabView: React.FC<SquadsTabViewProps> = ({ squads = [], team, currentUser, onUpdateSquads, onAddTask }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [activeChatSquadId, setActiveChatSquadId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  const activeChatSquad = squads.find(s => s.id === activeChatSquadId);

  const handleCreate = () => {
    if (!newName) return;
    const newSquad: Squad = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName,
      memberIds: [],
      description: '',
      messages: []
    };
    onUpdateSquads([...squads, newSquad]);
    setNewName('');
    setIsAdding(false);
  };

  const handleToggleMember = (squadId: string, memberId: string) => {
    onUpdateSquads(squads.map(s => {
      if (s.id !== squadId) return s;
      const isMember = s.memberIds.includes(memberId);
      return {
        ...s,
        memberIds: isMember ? s.memberIds.filter(id => id !== memberId) : [...s.memberIds, memberId]
      };
    }));
  };

  const handleTaskToSquad = (squad: Squad) => {
    const title = prompt(`Tarefa para TODO o Squad ${squad.name}:`);
    if (!title) return;
    // Dispara uma tarefa que aparece para todos no squad (usando o squad ID como target)
    onAddTask({
      title,
      assignedTo: squad.id,
      type: 'ONCE',
      status: 'PENDING',
      priority: 'HIGH',
      createdAt: new Date().toISOString()
    });
  };

  const handleSendSquadMessage = () => {
    if (!chatInput.trim() || !activeChatSquadId) return;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      senderId: currentUser.id,
      senderName: currentUser.name,
      text: chatInput,
      timestamp: new Date().toLocaleTimeString()
    };
    
    onUpdateSquads(squads.map(s => 
      s.id === activeChatSquadId 
        ? { ...s, messages: [...(s.messages || []), newMessage] } 
        : s
    ));
    setChatInput('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-32">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
            <Users2 className="w-8 h-8 text-teal-500" /> Squads Operacionais
          </h2>
          <p className="text-sm text-gray-400 font-medium">Gestão de micro-equipes, chat interno e disparos de metas.</p>
        </div>
        {isCEO && (
          <button onClick={() => setIsAdding(true)} className="bg-[#14b8a6] px-8 py-3 rounded-2xl text-[10px] font-black text-black uppercase hover:scale-105 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20">
            <Plus className="w-4 h-4" /> NOVO SQUAD
          </button>
        )}
      </header>

      {isAdding && (
        <div className="bg-[#111] border border-teal-500/30 p-8 rounded-[32px] flex items-end gap-6 animate-in slide-in-from-top-4">
          <div className="flex-1 space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nome do Squad</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Squad de Lançamentos" className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-teal-500 outline-none" />
          </div>
          <div className="flex gap-2">
             <button onClick={() => setIsAdding(false)} className="px-6 py-4 rounded-2xl text-[10px] font-black text-gray-500 uppercase">Cancelar</button>
             <button onClick={handleCreate} className="bg-teal-500 text-black px-10 py-4 rounded-2xl font-black text-sm uppercase">Criar Squad</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {squads.map(squad => {
          const isMember = squad.memberIds.includes(currentUser.id) || isCEO;
          if (!isMember) return null;

          return (
            <div key={squad.id} className="bg-[#111] border border-white/5 rounded-[48px] p-8 flex flex-col gap-8 hover:border-teal-500/20 transition-all shadow-2xl relative group">
              {isCEO && (
                <button onClick={() => onUpdateSquads(squads.filter(s => s.id !== squad.id))} className="absolute top-8 right-8 text-gray-800 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              
              <div>
                <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{squad.name}</h3>
                <p className="text-[9px] text-teal-500 font-black uppercase tracking-[0.2em]">{squad.memberIds.length} Membros Conectados</p>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block">Membros do Squad</label>
                <div className="flex flex-wrap gap-2">
                  {team.filter(u => squad.memberIds.includes(u.id)).map(member => (
                    <div key={member.id} className="bg-teal-500/10 border border-teal-500/20 px-3 py-1.5 rounded-full text-[10px] font-bold text-teal-400 flex items-center gap-2">
                      {member.name}
                      {isCEO && <button onClick={() => handleToggleMember(squad.id, member.id)}><X className="w-3 h-3"/></button>}
                    </div>
                  ))}
                  {isCEO && (
                    <select 
                      onChange={(e) => handleToggleMember(squad.id, e.target.value)}
                      value=""
                      className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-500 outline-none cursor-pointer"
                    >
                      <option value="">+ Adicionar</option>
                      {team.filter(u => !squad.memberIds.includes(u.id)).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-white/5 flex gap-3">
                 <button onClick={() => handleTaskToSquad(squad)} className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 py-3 rounded-2xl text-[9px] font-black text-white uppercase transition-all">
                    <Target className="w-3 h-3 text-teal-500" /> Tarefa Squad
                 </button>
                 <button onClick={() => setActiveChatSquadId(squad.id)} className="flex items-center justify-center gap-2 bg-[#14b8a6]/10 border border-[#14b8a6]/20 py-3 px-6 rounded-2xl text-[9px] font-black text-teal-500 uppercase transition-all">
                    <MessageSquare className="w-3 h-3" /> Chat {squad.messages?.length || 0}
                 </button>
              </div>
            </div>
          );
        })}

        {squads.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center text-center opacity-20">
            <Users2 className="w-16 h-16" />
            <p className="text-sm font-black uppercase tracking-[0.3em] mt-4">Nenhum squad estabelecido.</p>
          </div>
        )}
      </div>

      {/* CHAT DO SQUAD MODAL */}
      {activeChatSquad && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
           <div className="w-full max-w-2xl h-[80vh] bg-[#0a0a0a] border border-white/10 rounded-[48px] overflow-hidden flex flex-col shadow-2xl">
              <header className="p-8 bg-black/40 border-b border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center">
                       <Hash className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Chat: {activeChatSquad.name}</h3>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Apenas membros deste squad</p>
                    </div>
                 </div>
                 <button onClick={() => setActiveChatSquadId(null)} className="p-3 text-gray-500 hover:text-white transition-colors bg-white/5 rounded-full">
                    <X className="w-5 h-5" />
                 </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                {activeChatSquad.messages?.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 text-center space-y-4">
                    <MessageSquare className="w-12 h-12" />
                    <p className="text-xs font-black uppercase tracking-[0.3em]">Nenhuma mensagem enviada.</p>
                  </div>
                )}
                {activeChatSquad.messages?.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.senderId === currentUser.id ? 'items-end' : 'items-start'}`}>
                    <span className="text-[9px] font-black text-gray-600 uppercase mb-1">{msg.senderName} • {msg.timestamp}</span>
                    <div className={`px-5 py-3 rounded-2xl text-sm ${msg.senderId === currentUser.id ? 'bg-[#14b8a6] text-black font-bold' : 'bg-white/5 text-white'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-8 bg-black/40 border-t border-white/5 flex gap-4">
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyPress={e => e.key === 'Enter' && handleSendSquadMessage()}
                  placeholder="Mensagem para o squad..." 
                  className="flex-1 bg-black rounded-2xl px-6 py-4 text-white outline-none border border-white/10 focus:border-teal-500 transition-all" 
                />
                <button onClick={handleSendSquadMessage} className="bg-teal-500 px-8 rounded-2xl text-black font-black italic hover:scale-105 transition-all">
                  <Send className="w-5 h-5" />
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SquadsTabView;
