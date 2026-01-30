import { createCustomError } from '~/server/utils/error'

export default defineEventHandler(async (event) => {
  // Bloquear criação de categorias
  // As categorias são globais e pré-configuradas pelo sistema
  throw createCustomError(
    403,
    'Não é permitido criar categorias. As categorias são pré-configuradas pelo sistema.'
  )
})
