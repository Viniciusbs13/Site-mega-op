
import React, { useState } from 'react';
import { Task, User, DefaultUserRole } from '../types';
import { Plus, Trash2, Lock, CheckCircle2, Circle } from 'lucide-react';

interface ChecklistViewProps {
  tasks: Task[];
  currentUser: User;
  team: User[];
  onAddTask: (task: Partial<Task>) => void;
  onRemoveTask: (id: string) => void;
  onToggleTask: (id: string) => void;
}

const ChecklistView: React.FC<ChecklistViewProps> = ({ tasks, currentUser, team, onAddTask, onRemoveTask, onToggleTask }) => {
  const [newTitle, setNewTitle] = useState('');
  const isCEO = currentUser.role === DefaultUserRole.CEO;
  
  const [assignee, setAssignee] = useState(isCEO ? 'ALL' : currentUser.id);

  const filteredTasks = isCEO ? tasks : tasks.filter(t => t.assignedTo === currentUser.id || t.assignedTo === 'ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    onAddTask({
      title: newTitle,
      assignedTo: isCEO ? assignee : currentUser.id,
      type: 'ONCE',
      status: 'PENDING',
      priority: 'MEDIUM',
      createdAt: new Date().toISOString()
    });
    setNewTitle('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-24">
      <header>
        <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Cronogramas Operacionais</h2>
        <p className="text-sm text-gray-400">Organize sua rotina de alta performance e marque suas conclusões.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-[#111] border border-white/10 p-8 rounded-[32px] flex flex-wrap gap-6 items-end shadow-2xl">
        <div className="flex-1 min-w-[300px] space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Nova Tarefa / Objetivo</label>
          <input 
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="O que precisa ser feito hoje?"
            className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-6 py-4 text-sm text-white focus:border-teal-500 outline-none transition-all"
          />
        </div>
        
        {isCEO ? (
          <div className="space-y-2 min-w-[200px]">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Destinatário</label>
            <select 
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-2xl px-4 py-4 text-sm text-teal-400 font-bold outline-none"
            >
              <option value="ALL">PARA TODA A EQUIPE</option>
              {team.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.role.replace('_', ' ')})</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2 min-w-[200px] opacity-50">
             <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
               <Lock className="w-2 h-2" /> Atribuir para
             </label>
             <div className="bg-[#0a0a0a] border border-white/5 rounded-2xl px-4 py-4 text-sm text-gray-500 font-bold">
               SOMENTE VOCÊ
             </div>
          </div>
        )}

        <button type="submit" className="bg-[#14b8a6] text-black px-10 py-4 rounded-2xl font-black text-sm hover:scale-105 transition-transform flex items-center gap-2 uppercase italic tracking-tighter shadow-lg shadow-teal-500/20">
          <Plus className="w-4 h-4" /> ADICIONAR
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTasks.map(task => (
          <div key={task.id} className={`bg-[#111] border p-6 rounded-[24px] flex items-center justify-between group transition-all ${task.status === 'COMPLETED' ? 'border-teal-500/30 opacity-60 bg-teal-500/5' : 'border-white/5 hover:border-[#14b8a6]/20'}`}>
            <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => onToggleTask(task.id)}>
              <div className="p-3 bg-white/5 rounded-xl">
                {task.status === 'COMPLETED' ? <CheckCircle2 className="w-6 h-6 text-teal-500" /> : <Circle className="w-6 h-6 text-gray-700" />}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-bold uppercase tracking-tighter transition-all ${task.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
                <div className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">
                  <span>Pontual</span>
                  <span>•</span>
                  <span className="text-teal-500/80">ALVO: {task.assignedTo === 'ALL' ? 'EQUIPE' : 'DIRECIONADO'}</span>
                </div>
              </div>
            </div>
            { isCEO && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemoveTask(task.id); }}
                className="text-gray-800 hover:text-red-500 transition-colors p-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChecklistView;
