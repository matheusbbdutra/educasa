export default defineNuxtRouteMiddleware(async (to, from) => {
  const { user, initAuth } = useAuth()

  const isAdminRoute = to.path.startsWith('/admin')
  const publicRoutes = ['/login', '/register']
  const isProtectedRoute = !isAdminRoute && !publicRoutes.includes(to.path)

  // Em client-only routes ou rotas protegidas, aguarda inicialização do auth
  if (process.client && !user.value) {
    if (isAdminRoute || isProtectedRoute) {
      await initAuth()
    }
  }

  if (user.value) {
    const isAdmin = user.value.role === 'ADMIN'
    if (isAdmin && !isAdminRoute) {
      if (to.path !== '/admin') {
        return navigateTo('/admin')
      }
    } else if (!isAdmin && isAdminRoute) {
      return navigateTo('/dashboard')
    }
  } else {
    if (isAdminRoute || isProtectedRoute) {
      if (to.path !== '/login') {
        return navigateTo('/login')
      }
    }
  }
})
