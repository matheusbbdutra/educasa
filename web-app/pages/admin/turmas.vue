<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">Gerenciar Turmas</h1>
      <button
        @click="showModal = true"
        class="flex items-center py-2 px-4 rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow"
      >
        <Icon name="mdi:plus" class="w-5 h-5 mr-2" />
        Criar Turma
      </button>
    </div>

    <div>
      <!-- Filtro -->
      <div class="mb-4">
        <input
          v-model="searchTerm"
          type="text"
          class="block w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder="Filtrar turmas por nome..."
        />
      </div>

      <!-- Tabela -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-500">Carregando...</p>
        </div>
        <div v-else-if="filteredTurmas.length === 0" class="text-center py-8">
          <p class="text-gray-500">Nenhuma turma encontrada</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome da Turma
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nº de Alunos
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="turma in filteredTurmas" :key="turma.id">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ turma.name }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ turma.students?.length || 0 }}
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                  <div class="flex gap-2">
                    <button
                      @click="editTurma(turma)"
                      type="button"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                      title="Editar Turma"
                    >
                      <Icon name="mdi:pencil" class="w-4 h-4" />
                      <span class="font-medium">Editar</span>
                    </button>
                    <button
                      @click="deleteTurma(turma.id)"
                      type="button"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                      title="Remover Turma"
                    >
                      <Icon name="mdi:delete" class="w-4 h-4" />
                      <span class="font-medium">Remover</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Criar/Editar Turma -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-2xl font-semibold mb-6">{{ editingTurma ? 'Editar Turma' : 'Criar Nova Turma' }}</h3>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Nome da Turma</label>
            <input
              v-model="form.name"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Ex: Turma A - 2025"
              required
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Descrição (Opcional)</label>
            <textarea
              v-model="form.description"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              rows="3"
            ></textarea>
          </div>

          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

          <div class="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              @click="closeModal"
              class="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="py-2 px-4 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {{ submitting ? (editingTurma ? 'Salvando...' : 'Criando...') : (editingTurma ? 'Salvar' : 'Criar Turma') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal de Confirmação de Exclusão -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-xl font-semibold mb-4">Confirmar Exclusão</h3>
        <p class="text-gray-600 mb-6">Tem certeza que deseja excluir esta turma? Esta ação não pode ser desfeita.</p>

        <div class="flex justify-end space-x-3">
          <button
            @click="showDeleteModal = false"
            class="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            @click="confirmDelete"
            :disabled="deleting"
            class="py-2 px-4 border border-transparent rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {{ deleting ? 'Excluindo...' : 'Excluir' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { token } = useAuth()
const loading = ref(true)
const showModal = ref(false)
const showDeleteModal = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const error = ref('')
const searchTerm = ref('')

const turmaToDelete = ref<string | null>(null)
const turmas = ref<any[]>([])
const editingTurma = ref<any | null>(null)

const form = ref({
  name: '',
  description: ''
})

const filteredTurmas = computed(() => {
  if (!searchTerm.value) return turmas.value

  const term = searchTerm.value.toLowerCase()
  return turmas.value.filter((t) => t.name.toLowerCase().includes(term))
})

const closeModal = () => {
  showModal.value = false
  editingTurma.value = null
  form.value = {
    name: '',
    description: ''
  }
  error.value = ''
}

const editTurma = (turma: any) => {
  editingTurma.value = turma
  form.value = {
    name: turma.name,
    description: turma.description || ''
  }
  showModal.value = true
}

const deleteTurma = (id: string) => {
  turmaToDelete.value = id
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  if (!turmaToDelete.value) return

  deleting.value = true
  try {
    await $fetch(`/api/admin/turmas/${turmaToDelete.value}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })

    showDeleteModal.value = false
    turmaToDelete.value = null
    await fetchData()
  } catch (err: any) {
    alert(err.data?.message || 'Erro ao excluir turma')
  } finally {
    deleting.value = false
  }
}

const handleSubmit = async () => {
  submitting.value = true
  error.value = ''

  try {
    if (editingTurma.value) {
      // Editar turma existente
      await $fetch(`/api/admin/turmas/${editingTurma.value.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body: form.value
      })
    } else {
      // Criar nova turma
      await $fetch('/api/admin/turmas', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: form.value
      })
    }

    closeModal()
    await fetchData()
  } catch (err: any) {
    error.value = err.data?.message || 'Erro ao salvar turma'
  } finally {
    submitting.value = false
  }
}

const fetchData = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/admin/turmas', {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    turmas.value = data as any[]
  } catch (error) {
    console.error('Erro ao buscar turmas:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>