import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

// All paths are relative — Vite proxies /realms/* and /admin/* to localhost:8180
// This avoids CORS entirely since requests are same-origin from the browser
const KEYCLOAK  = '/realms/techstore'
const ADMIN_URL = ''              // empty — paths like /admin/... are already relative
const CLIENT_ID = 'techstore-ui'
const TOKEN_KEY = 'ts_tokens'

const ADMIN_USER = 'admin'
const ADMIN_PASS = 'admin'

const AuthContext = createContext(null)

// ── JWT helpers ───────────────────────────────────────────────────────────
function parseJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
  } catch { return null }
}
function isExpired(token) {
  const p = parseJwt(token)
  return !p || Date.now() / 1000 > p.exp - 30
}
function buildProfile(accessToken) {
  const p = parseJwt(accessToken)
  if (!p) return null
  return {
    id:        p.sub,
    name:      p.name || `${p.given_name ?? ''} ${p.family_name ?? ''}`.trim(),
    firstName: p.given_name  ?? '',
    lastName:  p.family_name ?? '',
    email:     p.email       ?? '',
    roles:     p.realm_access?.roles ?? [],
    isAdmin:   p.realm_access?.roles?.includes('ADMIN') ?? false,
  }
}

// ── Keycloak API ──────────────────────────────────────────────────────────
async function keycloakToken(params) {
  const res = await fetch(`${KEYCLOAK}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...params })
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error_description || err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

async function keycloakRegister(firstName, lastName, email, password) {
  // Admin token must come from the MASTER realm (system admin), not the techstore realm
  // NOTE: In production this should be a backend endpoint, not client-side
  const masterTokenRes = await fetch(`${ADMIN_URL}/realms/master/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:  'admin-cli',
      grant_type: 'password',
      username:   ADMIN_USER,  // 'admin'
      password:   ADMIN_PASS,  // 'admin' — master realm admin password from docker-compose
    })
  })
  if (!masterTokenRes.ok) {
    const err = await masterTokenRes.json().catch(() => ({}))
    throw new Error(err.error_description || 'Could not obtain admin token for registration')
  }
  const adminTokenRes = await masterTokenRes.json()

  const res = await fetch(`${ADMIN_URL}/admin/realms/techstore/users`, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${adminTokenRes.access_token}`
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email,
      username:      email,
      enabled:       true,
      emailVerified: true,
      credentials:   [{ type: 'password', value: password, temporary: false }],
    })
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.errorMessage || err.error || `Registration failed (${res.status})`)
  }
}

// ── AuthProvider ──────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [tokens,  setTokens]  = useState(() => {
    try { return JSON.parse(localStorage.getItem(TOKEN_KEY)) } catch { return null }
  })
  const [profile, setProfile] = useState(() => {
    try {
      const t = JSON.parse(localStorage.getItem(TOKEN_KEY))
      return t ? buildProfile(t.access_token) : null
    } catch { return null }
  })
  const refreshTimer = useRef(null)

  useEffect(() => {
    if (tokens) {
      localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens))
      setProfile(buildProfile(tokens.access_token))
      scheduleRefresh(tokens)
    } else {
      localStorage.removeItem(TOKEN_KEY)
      setProfile(null)
    }
    return () => clearTimeout(refreshTimer.current)
  }, [tokens])

  function scheduleRefresh(t) {
    clearTimeout(refreshTimer.current)
    const p = parseJwt(t.access_token)
    if (!p || !t.refresh_token) return
    const ms = (p.exp - Date.now() / 1000 - 60) * 1000
    if (ms <= 0) return
    refreshTimer.current = setTimeout(async () => {
      try {
        setTokens(await keycloakToken({ grant_type: 'refresh_token', refresh_token: t.refresh_token }))
      } catch { setTokens(null) }
    }, ms)
  }

  const login = useCallback(async (email, password) => {
    const t = await keycloakToken({
      grant_type: 'password',
      username:   email.trim(),
      password,
      scope:      'openid profile email'
    })
    setTokens(t)
    return buildProfile(t.access_token)
  }, [])

  const register = useCallback(async (firstName, lastName, email, password) => {
    await keycloakRegister(firstName, lastName, email, password)
    return login(email, password)
  }, [login])

  const logout = useCallback(() => {
    clearTimeout(refreshTimer.current)
    setTokens(null)
  }, [])

  // Update the current user's own profile via Keycloak Account API
  const updateProfile = useCallback(async ({ firstName, lastName, email }) => {
    const t = tokens
    if (!t?.access_token) throw new Error('Not authenticated')
    const res = await fetch(`${KEYCLOAK}/account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${t.access_token}`
      },
      body: JSON.stringify({ firstName, lastName, email })
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.errorMessage || err.error || `Update failed (${res.status})`)
    }
    // Re-fetch a fresh token so profile reflects the changes
    const fresh = await keycloakToken({
      grant_type: 'refresh_token',
      refresh_token: t.refresh_token
    })
    setTokens(fresh)
  }, [tokens])

  // Change password — requires current password verification
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    const t = tokens
    if (!t?.access_token) throw new Error('Not authenticated')
    const p = buildProfile(t.access_token)
    // Re-authenticate to verify current password
    await keycloakToken({ grant_type: 'password', username: p.email, password: currentPassword, scope: 'openid' })
    // Now update via admin API
    const masterRes = await fetch(`/realms/master/protocol/openid-connect/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: 'admin-cli', grant_type: 'password', username: ADMIN_USER, password: ADMIN_PASS })
    })
    const masterToken = await masterRes.json()
    const res = await fetch(`/admin/realms/techstore/users/${p.id}/reset-password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${masterToken.access_token}` },
      body: JSON.stringify({ type: 'password', value: newPassword, temporary: false })
    })
    if (!res.ok) throw new Error('Password change failed')
  }, [tokens])

  const authFetch = useCallback(async (url, options = {}) => {
    let t = tokens
    if (t && isExpired(t.access_token) && t.refresh_token) {
      try {
        t = await keycloakToken({ grant_type: 'refresh_token', refresh_token: t.refresh_token })
        setTokens(t)
      } catch { setTokens(null); t = null }
    }
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(t?.access_token ? { Authorization: `Bearer ${t.access_token}` } : {})
      }
    })
  }, [tokens])

  return (
    <AuthContext.Provider value={{ profile, login, register, logout, authFetch, updateProfile, changePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
