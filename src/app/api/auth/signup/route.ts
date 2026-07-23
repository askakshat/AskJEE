import { supabase, jsonResponse, errorResponse } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()
    if (!email || !password) return errorResponse('Email and password required')
    if (password.length < 6) return errorResponse('Password must be at least 6 characters')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name: name || undefined } },
    })

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('already exists'))
        return errorResponse('Email already registered', 409)
      return errorResponse(error.message)
    }

    const user = data.user
    return jsonResponse({
      user: {
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || null,
        target_year: null,
        reminders_enabled: true,
      },
      token: data.session?.access_token || null,
    }, 201)
  } catch (e: any) {
    return errorResponse(e.message || 'Signup failed', 500)
  }
}
