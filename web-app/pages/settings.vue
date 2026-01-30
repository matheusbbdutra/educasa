<template>
  <div>
    <header class="bg-white shadow-sm p-4">
      <h1 class="text-2xl font-semibold text-gray-800">Configurações</h1>
    </header>

    <div class="p-6 md:p-8 max-w-2xl">
      <!-- Informações Pessoais -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="mdi:account-circle" class="w-6 h-6 mr-2 text-blue-600" />
          Informações Pessoais
        </h2>

        <form @submit.prevent="handleProfileSubmit" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              v-model="profileForm.name"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Email</label>
            <input
              v-model="profileForm.email"
              type="email"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div v-if="user?.turma" class="bg-gray-50 rounded-md p-3">
            <label class="text-sm font-medium text-gray-700">Turma</label>
            <p class="text-gray-900 mt-1">{{ user.turma.name }}</p>
          </div>

          <p v-if="profileError" class="text-sm text-red-500">{{ profileError }}</p>
          <p v-if="profileSuccess" class="text-sm text-green-600">{{ profileSuccess }}</p>

          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="profileSubmitting"
              class="py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {{ profileSubmitting ? 'Salvando...' : 'Salvar Alterações' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Alterar Senha -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="mdi:lock-reset" class="w-6 h-6 mr-2 text-orange-600" />
          Alterar Senha
        </h2>

        <form @submit.prevent="handlePasswordSubmit" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Senha Atual</label>
            <input
              v-model="passwordForm.currentPassword"
              type="password"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Nova Senha</label>
            <input
              v-model="passwordForm.newPassword"
              type="password"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              minlength="6"
              required
            />
            <p class="text-xs text-gray-500 mt-1">Mínimo de 6 caracteres</p>
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
            <input
              v-model="passwordForm.confirmPassword"
              type="password"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <p v-if="passwordError" class="text-sm text-red-500">{{ passwordError }}</p>
          <p v-if="passwordSuccess" class="text-sm text-green-600">{{ passwordSuccess }}</p>

          <div class="flex justify-end">
            <button
              type="submit"
              :disabled="passwordSubmitting"
              class="py-2 px-4 border border-transparent rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
            >
              {{ passwordSubmitting ? 'Alterando...' : 'Alterar Senha' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'student'
})

const { token, user: authUser, fetchUser } = useAuth()

const user = ref<any>(null)
const profileSubmitting = ref(false)
const passwordSubmitting = ref(false)
const profileError = ref('')
const profileSuccess = ref('')
const passwordError = ref('')
const passwordSuccess = ref('')

const profileForm = ref({
  name: '',
  email: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const loadUserData = async () => {
  try {
    const data = await $fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    user.value = data
    profileForm.value = {
      name: data.name,
      email: data.email
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
  }
}

const handleProfileSubmit = async () => {
  profileError.value = ''
  profileSuccess.value = ''
  profileSubmitting.value = true

  try {
    await $fetch('/api/student/profile', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: profileForm.value
    })

    profileSuccess.value = 'Informações atualizadas com sucesso!'
    await fetchUser()
    await loadUserData()

    setTimeout(() => {
      profileSuccess.value = ''
    }, 3000)
  } catch (err: any) {
    profileError.value = err.data?.message || 'Erro ao atualizar informações'
  } finally {
    profileSubmitting.value = false
  }
}

const handlePasswordSubmit = async () => {
  passwordError.value = ''
  passwordSuccess.value = ''

  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    passwordError.value = 'As senhas não coincidem'
    return
  }

  if (passwordForm.value.newPassword.length < 6) {
    passwordError.value = 'A nova senha deve ter no mínimo 6 caracteres'
    return
  }

  passwordSubmitting.value = true

  try {
    await $fetch('/api/student/password', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token.value}` },
      body: {
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      }
    })

    passwordSuccess.value = 'Senha alterada com sucesso!'
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }

    setTimeout(() => {
      passwordSuccess.value = ''
    }, 3000)
  } catch (err: any) {
    passwordError.value = err.data?.message || 'Erro ao alterar senha'
  } finally {
    passwordSubmitting.value = false
  }
}

onMounted(() => {
  loadUserData()
})
</script>
