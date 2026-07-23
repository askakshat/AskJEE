import { supabase, jsonResponse } from '@/lib/supabase'

export async function POST() {
  // Client handles signOut() directly via supabase.auth.signOut()
  // This endpoint exists for compatibility
  return jsonResponse({ ok: true })
}
