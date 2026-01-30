import { getUserFromEvent } from '../utils/auth'
import { createCustomError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  const path = event.path

  // Rotas públicas
  const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/turmas', '/api/health', '/api/_nuxt_icon']

  if (publicRoutes.some(route => path.startsWith(route))) {
    return
  }

  // Rotas da API que precisam autenticação
  if (path.startsWith('/api/')) {
    const user = await getUserFromEvent(event)

    if (!user) {
      throw createCustomError(401, 'Não autorizado')
    }

    // Adiciona o usuário ao contexto do evento
    event.context.user = user

    // Protege as rotas de admin
    if (path.startsWith('/api/admin')) {
      if (user.role !== 'ADMIN') {
        throw createCustomError(403, 'Acesso negado')
      }
    }
  }
})
