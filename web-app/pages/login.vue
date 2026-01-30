<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
      <div class="text-center">
        <h2 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent inline-block">
          💰 Educa.SA
        </h2>
      </div>
      <p class="text-center text-gray-600 font-medium">Educação Financeira na Sala de Ações</p>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="text-sm font-medium text-gray-700">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="voce@email.com"
            required
          />
        </div>

        <div>
          <label for="password" class="text-sm font-medium text-gray-700">Senha</label>
          <input
            v-model="password"
            type="password"
            id="password"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="••••••••"
            required
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <p v-if="error" class="text-sm text-center text-red-500">{{ error }}</p>

      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          Não tem uma conta?
          <NuxtLink to="/register" class="text-blue-600 hover:text-blue-500">
            Cadastre-se aqui
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { login, isAdmin } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    await login(email.value, password.value)

    // Redireciona baseado no tipo de usuário
    if (isAdmin.value) {
      await router.push('/admin')
    } else {
      await router.push('/dashboard')
    }
  } catch (e: any) {
    // Mostra apenas mensagens amigáveis, sem expor detalhes técnicos
    const errorMessage = e.data?.message || e.message || 'Erro ao fazer login'
    error.value = errorMessage.includes('prisma') || errorMessage.includes('database')
      ? 'Erro no servidor. Tente novamente mais tarde.'
      : errorMessage
  } finally {
    loading.value = false
  }
}
</script>
