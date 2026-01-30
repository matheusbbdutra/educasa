<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">Usuários Externos</h1>
      <button
        @click="openCreateModal"
        class="flex items-center py-2 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 shadow"
      >
        <Icon name="mdi:account-plus" class="w-5 h-5 mr-2" />
        Adicionar Usuário Externo
      </button>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p class="mt-4 text-gray-600">Carregando...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-700 font-medium mb-3">{{ error }}</p>
      <button
        @click="loadData"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
      >
        Tentar Novamente
      </button>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Lista de Usuários -->
      <div class="bg-white rounded-lg shadow mb-6">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Gerenciar Usuários Externos</h3>
        </div>

        <div v-if="externalUsers.length === 0" class="text-center py-8">
          <p class="text-gray-500">Nenhum usuário externo encontrado</p>
          <p class="text-sm text-gray-400 mt-2">Os usuários que se cadastrarem aparecerão aqui</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastro</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="user in externalUsers" :key="user.id">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {{ user.name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ user.email }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(user.createdAt) }}
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                  <div class="flex gap-2">
                    <button
                      @click="openFinancialModal(user)"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                      title="Visualizar Dashboard Financeiro"
                    >
                      <Icon name="mdi:chart-box-outline" class="w-4 h-4" />
                      <span class="font-medium">Dashboard Financeiro</span>
                    </button>
                    <button
                      @click="openConvertModal(user)"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                      title="Converter para Aluno"
                    >
                      <Icon name="mdi:account-convert" class="w-4 h-4" />
                      <span class="font-medium">Converter para Aluno</span>
                    </button>
                    <button
                      @click="deleteExternalUser(user.id)"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                      title="Excluir Usuário"
                    >
                      <Icon name="mdi:delete" class="w-4 h-4" />
                      <span class="font-medium">Excluir</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Criação -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Adicionar Usuário Externo</h3>

        <form @submit.prevent="createExternalUser" class="space-y-4">
          <div>
            <label for="createName" class="block text-sm font-medium text-gray-700 mb-2">
              Nome completo
            </label>
            <input
              v-model="createForm.name"
              id="createName"
              type="text"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label for="createEmail" class="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              v-model="createForm.email"
              id="createEmail"
              type="email"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label for="createPassword" class="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              v-model="createForm.password"
              id="createPassword"
              type="password"
              class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mínimo 6 caracteres"
              required
              minlength="6"
            />
          </div>

          <div v-if="createError" class="p-3 bg-red-50 text-red-700 text-sm rounded-md">
            {{ createError }}
          </div>

          <div v-if="createSuccess" class="p-3 bg-green-50 text-green-700 text-sm rounded-md">
            {{ createSuccess }}
          </div>

          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="closeCreateModal"
              :disabled="creating"
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="creating"
              class="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {{ creating ? 'Criando...' : 'Criar Usuário' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Conversão -->
    <div v-if="showConvertModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Converter para Aluno</h3>

        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-2">
            Converter <strong>{{ selectedUser?.name }}</strong> de participante externo para aluno.
          </p>
        </div>

        <div class="mb-4">
          <label for="turmaSelect" class="block text-sm font-medium text-gray-700 mb-2">
            Selecione a turma
          </label>
          <select
            v-model="convertForm.turmaId"
            id="turmaSelect"
            class="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Selecione uma turma</option>
            <option v-for="turma in turmas" :key="turma.id" :value="turma.id">
              {{ turma.name }}
            </option>
          </select>
        </div>

        <div v-if="convertError" class="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md">
          {{ convertError }}
        </div>

        <div class="flex justify-end space-x-3">
          <button
            @click="closeConvertModal"
            :disabled="converting"
            class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            @click="convertToStudent"
            :disabled="!convertForm.turmaId || converting"
            class="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {{ converting ? 'Convertendo...' : 'Converter' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de Dashboard Financeiro -->
    <LazyUserFinancialModal
      v-if="showFinancialModal"
      :user="selectedFinancialUser"
      @close="closeFinancialModal"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const externalUsers = ref<any[]>([])
const turmas = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const showConvertModal = ref(false)
const selectedUser = ref<any>(null)
const convertForm = ref({
  turmaId: ''
})
const converting = ref(false)
const convertError = ref('')

const showCreateModal = ref(false)
const createForm = ref({
  name: '',
  email: '',
  password: ''
})
const creating = ref(false)
const createError = ref('')
const createSuccess = ref('')

const showFinancialModal = ref(false)
const selectedFinancialUser = ref<any>(null)

const loadData = async () => {
  loading.value = true
  error.value = ''

  const { token } = useAuth()

  try {
    const headers = token.value ? { Authorization: `Bearer ${token.value}` } : {}

    const [usersResponse, turmasResponse] = await Promise.all([
      $fetch('/api/admin/external-users', { headers }),
      $fetch('/api/turmas', { headers })
    ])

    externalUsers.value = usersResponse || []
    turmas.value = turmasResponse || []
  } catch (err: any) {
    console.error('Erro ao carregar dados:', err)
    error.value = err.data?.message || err.message || 'Erro ao carregar dados'
  } finally {
    loading.value = false
  }
}

const openCreateModal = () => {
  createForm.value = {
    name: '',
    email: '',
    password: ''
  }
  createError.value = ''
  createSuccess.value = ''
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createForm.value = {
    name: '',
    email: '',
    password: ''
  }
  createError.value = ''
  createSuccess.value = ''
}

const createExternalUser = async () => {
  creating.value = true
  createError.value = ''
  createSuccess.value = ''

  const { token } = useAuth()

  try {
    const headers = token.value ? { Authorization: `Bearer ${token.value}` } : {}

    await $fetch('/api/auth/register', {
      method: 'POST',
      headers,
      body: {
        name: createForm.value.name,
        email: createForm.value.email,
        password: createForm.value.password
      }
    })

    createSuccess.value = 'Usuário criado com sucesso!'

    // Recarrega a lista
    await loadData()

    // Fecha o modal após 1 segundo
    setTimeout(() => {
      closeCreateModal()
    }, 1000)
  } catch (err: any) {
    createError.value = err.data?.message || err.message || 'Erro ao criar usuário'
  } finally {
    creating.value = false
  }
}

const openConvertModal = (user: any) => {
  selectedUser.value = user
  convertForm.value.turmaId = ''
  convertError.value = ''
  showConvertModal.value = true
}

const closeConvertModal = () => {
  showConvertModal.value = false
  selectedUser.value = null
  convertForm.value.turmaId = ''
  convertError.value = ''
}

const convertToStudent = async () => {
  if (!selectedUser.value || !convertForm.value.turmaId) return

  converting.value = true
  convertError.value = ''

  const { token } = useAuth()

  try {
    const headers = token.value ? { Authorization: `Bearer ${token.value}` } : {}

    await $fetch(`/api/admin/external-users/${selectedUser.value.id}`, {
      method: 'PUT',
      headers,
      body: {
        role: 'STUDENT',
        turmaId: convertForm.value.turmaId
      }
    })

    await loadData()
    closeConvertModal()
  } catch (err: any) {
    convertError.value = err.data?.message || 'Erro ao converter usuário'
  } finally {
    converting.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const deleteExternalUser = async (userId: string) => {
  if (!confirm('Tem certeza que deseja excluir este usuário externo? Esta ação não pode ser desfeita e todos os dados financeiros serão perdidos.')) {
    return
  }

  const { token } = useAuth()

  try {
    const headers = token.value ? { Authorization: `Bearer ${token.value}` } : {}

    await $fetch(`/api/admin/external-users/${userId}`, {
      method: 'DELETE',
      headers
    })

    await loadData()
  } catch (err: any) {
    alert(err.data?.message || 'Erro ao excluir usuário externo')
  }
}

const openFinancialModal = (user: any) => {
  selectedFinancialUser.value = user
  showFinancialModal.value = true
}

const closeFinancialModal = () => {
  showFinancialModal.value = false
  selectedFinancialUser.value = null
}

onMounted(() => {
  loadData()
})
</script>
