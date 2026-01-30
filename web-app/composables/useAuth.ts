export const useAuth = () => {
  const token = useState<string | null>('auth:token', () => null)
  const user = useState<any>('auth:user', () => null)

  const login = async (email: string, password: string) => {
    try {
      const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: { email, password }
      })

      token.value = data.token
      user.value = data.user

      // Salva no localStorage
      if (process.client) {
        localStorage.setItem('token', data.token)
      }

      return data
    } catch (error: any) {
      throw new Error(error.data?.message || 'Erro ao fazer login')
    }
  }

  const logout = () => {
    token.value = null
    user.value = null

    if (process.client) {
      localStorage.removeItem('token')
    }

    navigateTo('/login')
  }

  const fetchUser = async () => {
    if (!token.value) return null

    try {
      const data = await $fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token.value}`
        }
      })

      user.value = data
      return data
    } catch (error) {
      logout()
      return null
    }
  }

  const initAuth = async () => {
    if (process.client) {
      const savedToken = localStorage.getItem('token')
      if (savedToken) {
        token.value = savedToken
        await fetchUser()
      }
    }
  }

  return {
    token,
    user,
    login,
    logout,
    fetchUser,
    initAuth,
    isAuthenticated: computed(() => !!token.value),
    isAdmin: computed(() => user.value?.role === 'ADMIN'),
    isStudent: computed(() => user.value?.role === 'STUDENT'),
    isExternal: computed(() => user.value?.role === 'EXTERNAL')
  }
}
