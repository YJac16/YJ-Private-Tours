/**
 * Seed idempotent test Auth users for live sign-in checks.
 *
 * Usage (from repo root, with service role in env):
 *   node scripts/seed-test-auth-users.mjs
 *
 * Required env:
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Default test accounts:
 *   client@test.khayrcape.com / TestClient123!  → /account
 *   driver@test.khayrcape.com / TestDriver123!  → /driver
 *   admin@test.khayrcape.com  / TestAdmin123!   → /admin/pricing
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  const text = readFileSync(filePath, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

loadEnvFile(resolve(process.cwd(), '.env.local'))
loadEnvFile(resolve(process.cwd(), '.env'))
loadEnvFile(resolve(process.cwd(), '.env.production.local'))
loadEnvFile(resolve(process.cwd(), 'client/.env.local'))
loadEnvFile(resolve(process.cwd(), 'client/.env'))
loadEnvFile(resolve(process.cwd(), 'booking-app/.env.local'))
loadEnvFile(resolve(process.cwd(), 'booking-app/.env'))

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  )
  process.exit(1)
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const users = [
  {
    email: 'client@test.khayrcape.com',
    password: 'TestClient123!',
    role: 'client',
    full_name: 'Test Client',
  },
  {
    email: 'driver@test.khayrcape.com',
    password: 'TestDriver123!',
    role: 'driver',
    full_name: 'Test Driver',
  },
  {
    email: 'admin@test.khayrcape.com',
    password: 'TestAdmin123!',
    role: 'admin',
    full_name: 'Test Admin',
  },
]

async function findUserIdByEmail(email) {
  const perPage = 200
  let page = 1
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const hit = data.users.find(
      (u) => (u.email || '').toLowerCase() === email.toLowerCase()
    )
    if (hit) return hit.id
    if (!data.users.length || data.users.length < perPage) return null
    page += 1
  }
}

async function ensureUser(u) {
  let userId = await findUserIdByEmail(u.email)
  if (!userId) {
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
      app_metadata: { role: u.role },
    })
    if (error) throw error
    userId = data.user.id
    console.log(`created ${u.role}: ${u.email}`)
  } else {
    const { error } = await sb.auth.admin.updateUserById(userId, {
      password: u.password,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, role: u.role },
      app_metadata: { role: u.role },
    })
    if (error) throw error
    console.log(`updated ${u.role}: ${u.email}`)
  }

  const { error: profileErr } = await sb.from('profiles').upsert(
    {
      id: userId,
      role: u.role,
      email: u.email,
      full_name: u.full_name,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )
  if (profileErr) throw profileErr

  if (u.role === 'driver') {
    const { data: drivers, error: dErr } = await sb
      .from('drivers')
      .select('id, user_id, full_name, name')
      .order('created_at', { ascending: true })
      .limit(20)
    if (dErr) throw dErr

    const linked = (drivers || []).find((d) => d.user_id === userId)
    if (!linked) {
      const target =
        (drivers || []).find((d) => !d.user_id) || (drivers || [])[0]
      if (target) {
        const { error: linkErr } = await sb
          .from('drivers')
          .update({ user_id: userId })
          .eq('id', target.id)
        if (linkErr) throw linkErr
        console.log(`linked driver row ${target.id} → ${u.email}`)
      } else {
        const { error: insErr } = await sb.from('drivers').insert({
          name: u.full_name,
          full_name: u.full_name,
          is_active: true,
          languages: ['English'],
          years_experience: 5,
          bio: 'Test driver account',
          user_id: userId,
        })
        if (insErr) throw insErr
        console.log(`created driver row for ${u.email}`)
      }
    } else {
      console.log(`driver already linked (${linked.id})`)
    }
  }
}

for (const u of users) {
  await ensureUser(u)
}

console.log('Done. Test sign-in with the documented emails/passwords.')
