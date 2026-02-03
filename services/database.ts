
import { AppState } from '../types';
import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'omega_v2_data';
const SUPABASE_TABLE = 'project_state';
const CONFIG_ID = 'current_omega_config';

export interface DbResult {
  state: AppState | null;
  error?: string;
  code?: string;
}

export const dbService = {
  saveState: async (state: AppState): Promise<{ success: boolean; error?: any }> => {
    // 1. Persistência Local Imediata (Backup)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // 2. Sincronização Cloud Atômica
    if (supabase) {
      try {
        const { error } = await supabase
          .from(SUPABASE_TABLE)
          .upsert({ 
            id: CONFIG_ID, 
            data: state, 
            updated_at: new Date().toISOString() 
          }, { onConflict: 'id' });
        
        if (error) {
          console.error('Database Sync Warning:', error.message);
          return { success: false, error };
        }
        return { success: true };
      } catch (e) {
        console.error('Critical Cloud Failure:', e);
        return { success: false, error: e };
      }
    }
    return { success: true };
  },

  loadState: async (): Promise<DbResult> => {
    // Carregar do backup local como fallback inicial
    const localData = localStorage.getItem(STORAGE_KEY);
    const fallbackState = localData ? JSON.parse(localData) : null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from(SUPABASE_TABLE)
          .select('data')
          .eq('id', CONFIG_ID)
          .maybeSingle();

        // Tratamento de Erro de Tabela Inexistente (42P01)
        if (error) {
          if (error.code === '42P01') {
            return { state: fallbackState, error: 'TABLE_NOT_FOUND', code: error.code };
          }
          // Se for erro de permissão (RLS) ou outro, ainda retornamos o fallback local
          console.error('Supabase Load Error:', error.message);
          return { state: fallbackState, error: error.message };
        }

        if (data && data.data) {
          return { state: data.data as AppState };
        }
      } catch (e: any) {
        console.error('Unexpected Load Failure:', e);
        return { state: fallbackState, error: e.message };
      }
    }

    return { state: fallbackState };
  }
};
