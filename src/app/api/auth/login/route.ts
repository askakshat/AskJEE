import { supabase, jsonResponse, errorResponse } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) return errorResponse('Email and password required')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) return errorResponse('Invalid email or password', 401)

    const user = data.user
    return jsonResponse({
      user: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
        target_year: null,
        reminders_enabled: true,
      },
      token: data.session.access_token,
    })
  } catch (e: any) {
    return errorResponse(e.message || 'Login failed', 500)
  }
}
