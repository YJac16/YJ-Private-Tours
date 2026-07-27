/**
 * Seed idempotent production operator Auth users.
 *
 * Usage (from repo root, with service role in env):
 *   OPERATOR_ADMIN_PASSWORD='...' OPERATOR_DRIVER_PASSWORD='...' node scripts/seed-operator-auth-users.mjs
 *
 * Required env:
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPERATOR_ADMIN_PASSWORD
 *   OPERATOR_DRIVER_PASSWORD
 *
 * Accounts:
 *   yaseenjacobs97@gmail.com  → admin  → /admin/pricing
 *   yaseenjacobs@icloud.com   → driver → /driver
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

const adminPassword = process.env.OPERATOR_ADMIN_PASSWORD
const driverPassword = process.env.OPERATOR_DRIVER_PASSWORD

if (!url || !serviceKey) {
  console.error(
    'Missing SUPABASE_URL / NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
  )
  process.exit(1)
}

if (!adminPassword || !driverPassword) {
  console.error(
    'Set OPERATOR_ADMIN_PASSWORD and OPERATOR_DRIVER_PASSWORD (do not commit these).'
  )
  process.exit(1)
}

const sb = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const users = [
  {
    email: 'yaseenjacobs97@gmail.com',
    password: adminPassword,
    role: 'admin',
    full_name: 'Yaseen Jacobs',
  },
  {
    email: 'yaseenjacobs@icloud.com',
    password: driverPassword,
    role: 'driver',
    full_name: 'Yaseen Jacobs',
  },
]

async function findUserIdByEmail(email) {
  const target = email.toLowerCase()
  const perPage = 200
  let page = 1
  for (;;) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data.users || []
    const hit = users.find((u) => (u.email || '').toLowerCase() === target)
    if (hit) return hit.id
    // Also match identities (some projects store email only there)
    const viaIdentity = users.find((u) =>
      (u.identities || []).some(
        (id) =>
          String(id?.identity_data?.email || '').toLowerCase() === target
      )
    )
    if (viaIdentity) return viaIdentity.id
    if (!users.length || users.length < perPage) return null
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
    if (error) {
      // Race / soft-deleted / list pagination miss — recover by re-lookup
      if (error.code === 'email_exists' || /already been registered/i.test(error.message)) {
        userId = await findUserIdByEmail(u.email)
        if (!userId) throw error
        console.log(`found existing after create conflict: ${u.email}`)
      } else {
        throw error
      }
    } else {
      userId = data.user.id
      console.log(`created ${u.role}: ${u.email}`)
    }
  }

  if (userId) {
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
      // Prefer an unlinked row; otherwise repoint the primary/first driver row
      // so the real operator owns the live schedule (test driver keeps Auth user).
      const target =
        (drivers || []).find((d) => !d.user_id) || (drivers || [])[0]
      if (target) {
        const { error: linkErr } = await sb
          .from('drivers')
          .update({
            user_id: userId,
            full_name: u.full_name,
            name: u.full_name,
          })
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
          bio: 'Khayr Cape Experiences driver',
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

console.log('Done. Sign in with the operator emails (passwords from env, not logged).')
