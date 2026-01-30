<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Configurações do Administrador</h1>
    </div>

    <div class="max-w-2xl">
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

          <div class="bg-blue-50 rounded-md p-3">
            <label class="text-sm font-medium text-gray-700">Função</label>
            <p class="text-gray-900 mt-1 flex items-center">
              <Icon name="mdi:shield-account" class="w-5 h-5 mr-2 text-blue-600" />
              Administrador
            </p>
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
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
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

      <!-- Estatísticas do Sistema -->
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Icon name="mdi:chart-box" class="w-6 h-6 mr-2 text-green-600" />
          Estatísticas do Sistema
        </h2>

        <div v-if="statsLoading" class="text-center py-4">
          <p class="text-gray-500">Carregando estatísticas...</p>
        </div>
        <div v-else class="grid grid-cols-2 gap-4">
          <div class="bg-blue-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total de Turmas</p>
                <p class="text-3xl font-bold text-blue-600">{{ stats.turmas }}</p>
              </div>
              <Icon name="mdi:account-group" class="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>

          <div class="bg-green-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Total de Alunos</p>
                <p class="text-3xl font-bold text-green-600">{{ stats.alunos }}</p>
              </div>
              <Icon name="mdi:account" class="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>

          <div class="bg-purple-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Alunos Ativos</p>
                <p class="text-3xl font-bold text-purple-600">{{ stats.alunosAtivos }}</p>
              </div>
              <Icon name="mdi:account-check" class="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>

          <div class="bg-orange-50 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Alunos Sem Turma</p>
                <p class="text-3xl font-bold text-orange-600">{{ stats.alunosSemTurma }}</p>
              </div>
              <Icon name="mdi:account-alert" class="w-12 h-12 text-orange-600 opacity-50" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { token, fetchUser } = useAuth()

const profileSubmitting = ref(false)
const passwordSubmitting = ref(false)
const statsLoading = ref(true)
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

const stats = ref({
  turmas: 0,
  alunos: 0,
  alunosAtivos: 0,
  alunosSemTurma: 0
})

const loadUserData = async () => {
  try {
    const data = await $fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    profileForm.value = {
      name: data.name,
      email: data.email
    }
  } catch (err) {
    console.error('Erro ao carregar dados:', err)
  }
}

const loadStats = async () => {
  statsLoading.value = true
  try {
    const [turmasData, studentsData] = await Promise.all([
      $fetch('/api/admin/turmas', {
        headers: { Authorization: `Bearer ${token.value}` }
      }),
      $fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
    ])

    const turmas = turmasData as any[]
    const students = studentsData as any[]

    stats.value = {
      turmas: turmas.length,
      alunos: students.length,
      alunosAtivos: students.filter(s => s.turmaId).length,
      alunosSemTurma: students.filter(s => !s.turmaId).length
    }
  } catch (err) {
    console.error('Erro ao carregar estatísticas:', err)
  } finally {
    statsLoading.value = false
  }
}

const handleProfileSubmit = async () => {
  profileError.value = ''
  profileSuccess.value = ''
  profileSubmitting.value = true

  try {
    await $fetch('/api/admin/profile', {
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
    await $fetch('/api/admin/password', {
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
  loadStats()
})
</script>
