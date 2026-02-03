
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_TABLE = 'project_state';
const CONFIG_ID = 'current_omega_config';

export interface DbResult {
  state: AppState | null;
  error?: string;
  code?: string;
  details?: string;
}

export const dbService = {
  saveState: async (state: AppState): Promise<{ success: boolean; error?: any }> => {
    // 1. Backup Local imediato
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // 2. Cloud Sync
    if (!supabase) return { success: false, error: 'Supabase não configurado' };
    
    try {
      const { error } = await supabase
        .from(SUPABASE_TABLE)
        .upsert({ 
          id: CONFIG_ID, 
          data: state, 
          updated_at: new Date().toISOString() 
        }, { onConflict: 'id' });
      
      if (error) {
        console.error('Erro ao salvar na nuvem:', error);
        return { success: false, error };
      }
      return { success: true };
    } catch (e) {
      return { success: false, error: e };
    }
  },

  loadState: async (): Promise<DbResult> => {
    const localData = localStorage.getItem(STORAGE_KEY);
    const fallbackState = localData ? JSON.parse(localData) : null;

    if (!supabase) return { state: fallbackState, error: 'Supabase Offline' };

    try {
      const { data, error } = await supabase
        .from(SUPABASE_TABLE)
        .select('data')
        .eq('id', CONFIG_ID)
        .maybeSingle();

      if (error) {
        // Erro 42P01 significa que a tabela não existe no banco
        if (error.code === '42P01') {
          return { state: fallbackState, error: 'TABLE_NOT_FOUND', code: error.code, details: 'A tabela project_state não existe no seu Supabase.' };
        }
        // Erro 42501 significa que o RLS está bloqueando o acesso
        if (error.code === '42501') {
          return { state: fallbackState, error: 'RLS_ERROR', code: error.code, details: 'As políticas de segurança (RLS) estão bloqueando o acesso.' };
        }
        return { state: fallbackState, error: error.message };
      }

      if (data && data.data) {
        return { state: data.data as AppState };
      }
    } catch (e: any) {
      return { state: fallbackState, error: e.message };
    }

    return { state: fallbackState };
  }
};
