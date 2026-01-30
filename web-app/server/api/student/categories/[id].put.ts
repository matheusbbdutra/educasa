import { createCustomError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  // Bloquear edição de categorias
  // As categorias são globais e pré-configuradas pelo sistema
  throw createCustomError(
    403,
    'Não é permitido editar categorias. As categorias são pré-configuradas pelo sistema.'
  )
})
