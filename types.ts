
export enum DefaultUserRole {
  CEO = 'CEO',
  MANAGER = 'GESTOR_TRAFEGO',
  SALES = 'VENDEDOR',
  SOCIAL_MEDIA = 'SOCIAL_MEDIA',
  EDITOR = 'EDITOR_VIDEO',
  CAPTADOR = 'CAPTADOR'
}

export type UserRole = DefaultUserRole | string;

export enum ClientHealth {
  EXCELLENT = 'Excelente',
  STABLE = 'Estável',
  AT_RISK = 'Em Risco',
  CRITICAL = 'Crítico'
}

export type ClientStatus = 'GREEN' | 'YELLOW' | 'RED';

export interface DriveItem {
  id: string;
  name: string;
  type: 'FILE' | 'FOLDER';
  content?: string;
  parentId: string | null;
  ownerId: string;
  createdAt: string;
}

export interface User {
  id: string;
  authId?: string; // ID do Supabase Auth
  email?: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  isApproved: boolean; // Novo: Status de aprovação pelo CEO
  avatar?: string;
  salesCount?: number;
  salesVolume?: number;
  personalGoal?: number;
  superGoal?: number;
}

export interface ClientFolder {
  briefing?: string;
  accessLinks?: string;
  operationalHistory?: string;
}

export interface Client {
  id: string;
  name: string;
  industry: string;
  health: ClientHealth | string;
  progress: number;
  managerId: string;
  salesId?: string;
  closingNotes?: string;
  contractValue: number;
  notes?: string;
  statusFlag: ClientStatus;
  folder?: ClientFolder;
  isPaused?: boolean;
}

export interface Task {
  id: string;
  title: string;
  assignedTo: string;
  status: 'PENDING' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'ONCE' | 'WEEKLY';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface SalesGoal {
  monthlyTarget: number;
  monthlySuperTarget: number;
  currentValue: number;
  totalSales: number;
  contractFormUrl: string;
  salesNotes?: string;
}

export interface MonthlyData {
  [monthYear: string]: {
    clients: Client[];
    tasks: Task[];
    salesGoal: SalesGoal;
    chatMessages?: ChatMessage[];
    drive?: DriveItem[];
    wiki?: DriveItem[];
  };
}

export interface AppState {
  team: User[];
  availableRoles: string[];
  db: MonthlyData;
}
