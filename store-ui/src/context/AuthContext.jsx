import { createContext, useContext, useCallback } from 'react'
import { useAuth0 } from '@auth0/auth0-react'

const AuthContext = createContext(null)

// Maps Auth0 user object + custom roles claim to the same profile shape
// the rest of the app already expects.
function buildProfile(user, roles = []) {
  if (!user) return null
  return {
    id:        user.sub,
    name:      user.name        ?? '',
    firstName: user.given_name  ?? '',
    lastName:  user.family_name ?? '',
    email:     user.email       ?? '',
    roles,
    isAdmin:   roles.includes('ADMIN'),
  }
}

export function AuthProvider({ children }) {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0()

  // Auth0 stores custom roles under a namespaced claim to avoid conflicts
  const roles = user?.['https://mrhdigital.com/roles'] ?? []
  const profile = isAuthenticated ? buildProfile(user, roles) : null

  const login = useCallback(() => {
    loginWithRedirect()
  }, [loginWithRedirect])

  const logout = useCallback(() => {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } })
  }, [auth0Logout])

  // Attaches a fresh Bearer token to every API call
  const authFetch = useCallback(async (url, options = {}) => {
    let headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    if (isAuthenticated) {
      try {
        const token = await getAccessTokenSilently()
        headers.Authorization = `Bearer ${token}`
      } catch { /* unauthenticated fallback */ }
    }
    return fetch(url, { ...options, headers })
  }, [isAuthenticated, getAccessTokenSilently])

  // Profile updates go via Auth0 Management API — requires a backend proxy endpoint
  // to avoid exposing the Management API token client-side. Wire up /api/account in
  // order-service or a dedicated account-service when ready.
  const updateProfile = useCallback(async ({ firstName, lastName, email }) => {
    const res = await authFetch('/api/account/profile', {
      method: 'PATCH',
      body: JSON.stringify({ firstName, lastName, email }),
    })
    if (!res.ok) throw new Error(`Profile update failed (${res.status})`)
  }, [authFetch])

  // Password changes are handled by Auth0's hosted Change Password flow.
  // Redirect the user to Auth0's reset page instead of doing it client-side.
  const changePassword = useCallback(async () => {
    await loginWithRedirect({ authorizationParams: { prompt: 'login' } })
  }, [loginWithRedirect])

  return (
    <AuthContext.Provider value={{
      profile,
      loading: isLoading,
      login,
      logout,
      authFetch,
      updateProfile,
      changePassword,
      // register is handled by Auth0's hosted signup page
      register: login,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
