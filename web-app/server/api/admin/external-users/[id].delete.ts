import prisma from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
    try {
        // Verificar autenticação
        const authHeader = getHeader(event, 'authorization')
        if (!authHeader) {
            throw createError({
                statusCode: 401,
                message: 'Não autorizado'
            })
        }

        const userId = event.context.params?.id
        if (!userId) {
            throw createError({
                statusCode: 400,
                message: 'ID do usuário não fornecido'
            })
        }

        // Verificar se o usuário existe e é EXTERNAL
        const user = await prisma.user.findUnique({
            where: { id: userId }
        })

        if (!user) {
            throw createError({
                statusCode: 404,
                message: 'Usuário não encontrado'
            })
        }

        if (user.role !== 'EXTERNAL') {
            throw createError({
                statusCode: 400,
                message: 'Apenas usuários externos podem ser deletados por este endpoint'
            })
        }

        // Deletar o usuário (cascade irá deletar categorias, subcategorias e transações)
        await prisma.user.delete({
            where: { id: userId }
        })

        return {
            success: true,
            message: 'Usuário externo deletado com sucesso'
        }
    } catch (error: any) {
        console.error('Erro ao deletar usuário externo:', error)
        throw createError({
            statusCode: error.statusCode || 500,
            message: error.message || 'Erro ao deletar usuário externo'
        })
    }
})
