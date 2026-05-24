import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, title, body, data } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are missing')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Fetch push tokens for the specified userId
    const { data: tokensData, error: dbError } = await supabaseClient
      .from('push_tokens')
      .select('token')
      .eq('user_id', userId)

    if (dbError) {
      console.error('Database error fetching push tokens:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tokensData || tokensData.length === 0) {
      console.log(`No push tokens found for user: ${userId}`)
      return new Response(
        JSON.stringify({ message: 'No push tokens registered for this user', sent: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare notifications payload for Expo
    const messages = tokensData.map((item) => ({
      to: item.token,
      sound: 'default',
      title: title || 'GreenLume Notification',
      body: body || 'You have a new update!',
      data: data || {},
    }))

    console.log(`Sending notifications to ${messages.length} token(s) for user: ${userId}`)

    // Send request to Expo Push API
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    const result = await response.json()
    console.log('Expo Push API response:', JSON.stringify(result))

    return new Response(
      JSON.stringify({ message: 'Notification payload sent to Expo', result, sent: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
