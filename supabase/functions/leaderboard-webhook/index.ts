import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PassedUser {
  user_id: string;
  display_name: string | null;
  total_points: number;
}

interface PushTokenRecord {
  user_id: string;
  token: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Leaderboard webhook received payload:', JSON.stringify(payload))

    // We only care about UPDATE events on the leaderboard table
    if (payload.type !== 'UPDATE' || payload.table !== 'leaderboard') {
      return new Response(
        JSON.stringify({ message: 'Ignore non-UPDATE or non-leaderboard events' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const newRecord = payload.record
    const oldRecord = payload.old_record

    const userId = newRecord.user_id
    const displayName = newRecord.display_name || 'Someone'
    const newPoints = newRecord.total_points || 0
    const oldPoints = oldRecord.total_points || 0

    // Only trigger if points increased
    if (newPoints <= oldPoints) {
      return new Response(
        JSON.stringify({ message: 'Points did not increase, skipping' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Supabase environment variables are missing')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Find users who were passed.
    // A user is passed if their total_points is in the range [oldPoints, newPoints)
    // and they are not the user who updated their score.
    const { data: passedUsers, error: queryError } = await supabaseClient
      .from('leaderboard')
      .select('user_id, display_name, total_points')
      .neq('user_id', userId)
      .gte('total_points', oldPoints)
      .lt('total_points', newPoints)
      .order('total_points', { ascending: false }) // Notify the person closest to the top of the range first
      .limit(3) // Limit to top 3 to prevent spamming too many people

    if (queryError) {
      console.error('Error querying passed users:', queryError)
      return new Response(
        JSON.stringify({ error: 'Failed to query passed users', details: queryError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!passedUsers || passedUsers.length === 0) {
      console.log('No users were passed in this update.')
      return new Response(
        JSON.stringify({ message: 'No users passed', sent: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const passedUsersCast = (passedUsers || []) as PassedUser[]
    console.log(`Users passed: ${passedUsersCast.map(u => `${u.display_name || 'Someone'} (${u.total_points} pts)`).join(', ')}`)

    // Now, for each passed user, fetch their push tokens
    const passedUserIds = passedUsersCast.map(u => u.user_id)
    const { data: tokensData, error: tokenError } = await supabaseClient
      .from('push_tokens')
      .select('user_id, token')
      .in('user_id', passedUserIds)

    if (tokenError) {
      console.error('Error fetching push tokens:', tokenError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens', details: tokenError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!tokensData || tokensData.length === 0) {
      console.log('No push tokens registered for any of the passed users.')
      return new Response(
        JSON.stringify({ message: 'Passed users have no push tokens registered', sent: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Map user_id to display_name for messaging
    const userNames = new Map(passedUsersCast.map(u => [u.user_id, u.display_name || 'Someone']))

    // Build notifications payload for Expo
    const tokensDataCast = (tokensData || []) as PushTokenRecord[]
    const messages = tokensDataCast.map((item) => {
      return {
        to: item.token,
        sound: 'default',
        title: "You've been passed! 🏃‍♂️",
        body: `${displayName} just passed you on the leaderboard with ${newPoints.toLocaleString()} points. Open GreenLume to reclaim your rank!`,
        data: {
          type: 'leaderboard',
          passedBy: userId,
          newPoints: newPoints
        },
      }
    })

    console.log(`Sending leaderboard notifications to ${messages.length} token(s)`)

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
      JSON.stringify({ message: 'Leaderboard update processed and notifications sent', result, sent: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Leaderboard Webhook Error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal Server Error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
