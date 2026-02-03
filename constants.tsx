
import React from 'react';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Briefcase, 
  Calendar,
  BookOpen,
  Users,
  Target,
  MessageSquare,
  Users2
} from 'lucide-react';
import { DefaultUserRole, ClientStatus } from './types';

export const NAVIGATION_ITEMS = [
  { id: 'dashboard', label: 'Painel', icon: <LayoutDashboard className="w-5 h-5" />, roles: [DefaultUserRole.CEO, DefaultUserRole.MANAGER, DefaultUserRole.SOCIAL_MEDIA, DefaultUserRole.EDITOR, DefaultUserRole.CAPTADOR] },
  { id: 'commercial', label: 'Vendas & Metas', icon: <Target className="w-5 h-5" />, roles: [DefaultUserRole.SALES, DefaultUserRole.CEO] },
  { id: 'squads-mgmt', label: 'Gestão Squads', icon: <Users2 className="w-5 h-5" />, roles: [DefaultUserRole.CEO, DefaultUserRole.MANAGER] },
  { id: 'checklists', label: 'Checklists Diários', icon: <Calendar className="w-5 h-5" />, roles: [DefaultUserRole.CEO, DefaultUserRole.SALES, DefaultUserRole.MANAGER, DefaultUserRole.SOCIAL_MEDIA, DefaultUserRole.EDITOR, DefaultUserRole.CAPTADOR] },
  { id: 'chat', label: 'Comunicação Time', icon: <MessageSquare className="w-5 h-5" />, roles: [DefaultUserRole.SALES, DefaultUserRole.CEO, DefaultUserRole.MANAGER, DefaultUserRole.SOCIAL_MEDIA, DefaultUserRole.EDITOR, DefaultUserRole.CAPTADOR] },
  { id: 'my-workspace', label: 'Minha Gestão', icon: <CheckSquare className="w-5 h-5" />, roles: [DefaultUserRole.MANAGER, DefaultUserRole.SOCIAL_MEDIA, DefaultUserRole.EDITOR, DefaultUserRole.CAPTADOR, DefaultUserRole.CEO, DefaultUserRole.SALES] },
  { id: 'clients', label: 'CRM Clientes', icon: <Briefcase className="w-5 h-5" />, roles: [DefaultUserRole.CEO] },
  { id: 'notes', label: 'Wiki & Notas', icon: <BookOpen className="w-5 h-5" />, roles: [DefaultUserRole.CEO, DefaultUserRole.MANAGER] },
  { id: 'team', label: 'Equipe', icon: <Users className="w-5 h-5" />, roles: [DefaultUserRole.CEO] },
];

export const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const MANAGERS = []; // Removido fixos para usar lista do Supabase

export const INITIAL_CLIENTS = [
  {
    id: 'c1',
    name: 'TechNova Solutions',
    industry: 'SaaS',
    health: 'Excelente',
    progress: 85,
    assignedUserIds: [],
    contractValue: 15000,
    notes: 'Acesso ao Business Manager liberado.',
    statusFlag: 'GREEN' as ClientStatus,
    closingNotes: 'Cliente muito focado em ROAS imediato.',
    folder: {
      briefing: 'Empresa de software buscando 100 leads/mês.',
      accessLinks: 'BM: 2938402 | Drive: bit.ly/nova-tech',
      operationalHistory: '01/02: Campanha de conversão iniciada.'
    }
  }
];
