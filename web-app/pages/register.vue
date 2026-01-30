<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-900">
    <div class="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-xl">
      <div class="text-center">
        <h2 class="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent inline-block">
          💰 Educa.SA
        </h2>
      </div>
      <p class="text-center text-gray-600 font-medium">Cadastre-se para controlar suas finanças</p>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label for="name" class="text-sm font-medium text-gray-700">Nome completo</label>
          <input
            v-model="form.name"
            type="text"
            id="name"
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Seu nome completo"
            required
          />
        </div>

        <div>
          <label for="email" class="text-sm font-medium text-gray-700">Email</label>
          <input
            v-model="form.email"
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
            v-model="form.password"
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
          {{ loading ? 'Criando conta...' : 'Criar conta' }}
        </button>
      </form>

      <p v-if="error" class="text-sm text-center text-red-500">{{ error }}</p>
      <p v-if="success" class="text-sm text-center text-green-500">{{ success }}</p>

      <div class="mt-4 text-center">
        <p class="text-sm text-gray-600">
          Já tem uma conta?
          <NuxtLink to="/login" class="text-blue-600 hover:text-blue-500">
            Entre aqui
          </NuxtLink>
        </p>
      </div>

      <div class="mt-4 p-4 bg-blue-50 rounded-md">
        <p class="text-xs text-gray-600">
          <strong>Nota:</strong> Você será cadastrado como participante externo.
          Caso seja um aluno, o administrador poderá ajustar sua conta posteriormente.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const router = useRouter()

const form = ref({
  name: '',
  email: '',
  password: ''
})

const error = ref('')
const success = ref('')
const loading = ref(false)

const handleRegister = async () => {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: form.value.name,
        email: form.value.email,
        password: form.value.password
      }
    })

    success.value = 'Conta criada com sucesso! Redirecionando para o login...'

    // Redireciona para login após 2 segundos
    setTimeout(() => {
      router.push('/login')
    }, 2000)

  } catch (e: any) {
    error.value = e.data?.message || 'Erro ao criar conta'
  } finally {
    loading.value = false
  }
}

</script>