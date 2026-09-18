import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Default Supabase configuration from user provided credentials
const DEFAULT_SUPABASE_URL = 'https://vrbhoishctpxzkndgjiz.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_U698CDnMn6MVrYjCSJkcjw_q3p1Hg--';

const STORAGE_SUPABASE_URL = 'thcs_supabase_url';
const STORAGE_SUPABASE_KEY = 'thcs_supabase_key';

export function getSupabaseConfig(): { url: string; key: string } {
  const customUrl = localStorage.getItem(STORAGE_SUPABASE_URL);
  const customKey = localStorage.getItem(STORAGE_SUPABASE_KEY);

  const url = customUrl || (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const key = customKey || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;

  return { url: url.trim(), key: key.trim() };
}

export function saveSupabaseConfig(url: string, key: string) {
  localStorage.setItem(STORAGE_SUPABASE_URL, url.trim());
  localStorage.setItem(STORAGE_SUPABASE_KEY, key.trim());
  supabaseClientInstance = null; // reset client
}

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }

  const { url, key } = getSupabaseConfig();
  if (!url || !key) {
    return null;
  }

  try {
    supabaseClientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    return supabaseClientInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return { success: false, message: 'Chưa có thông tin cấu hình Supabase URL hoặc Anon Key' };
  }

  try {
    // Try to query accounts table or any public ping
    const { error } = await client.from('accounts').select('id').limit(1);
    if (error) {
      // If table doesn't exist yet, it still confirms connection reached Supabase
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Đã kết nối thành công tới Supabase! (Lưu ý: Cần tạo các bảng dữ liệu bằng mã SQL)',
        };
      }
      return { success: false, message: `Lỗi kết nối: ${error.message} (${error.code || ''})` };
    }
    return { success: true, message: 'Kết nối Supabase thành công và đã sẵn sàng đồng bộ dữ liệu!' };
  } catch (err: any) {
    return { success: false, message: `Không thể kết nối Supabase: ${err.message || err}` };
  }
}
