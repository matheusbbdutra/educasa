<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-gray-900">Gerenciar Alunos</h1>
      <button
        @click="showModal = true"
        class="flex items-center py-2 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 shadow"
      >
        <Icon name="mdi:account-plus" class="w-5 h-5 mr-2" />
        Adicionar Aluno
      </button>
    </div>

    <div>
      <!-- Filtro -->
      <div class="mb-4">
        <input
          v-model="searchTerm"
          type="text"
          class="block w-full px-4 py-2 border border-gray-300 rounded-md"
          placeholder="Filtrar alunos por nome, email ou turma..."
        />
      </div>

      <!-- Tabela -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-500">Carregando...</p>
        </div>
        <div v-else-if="filteredStudents.length === 0" class="text-center py-8">
          <p class="text-gray-500">Nenhum aluno encontrado</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nome Aluno
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Turma
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="student in filteredStudents" :key="student.id">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ student.name }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ student.email }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ student.turma?.name || 'Sem turma' }}
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                  <div class="flex gap-2">
                    <button
                      @click="editStudent(student)"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors"
                      title="Editar Aluno"
                    >
                      <Icon name="mdi:pencil" class="w-4 h-4" />
                      <span class="font-medium">Editar</span>
                    </button>
                    <button
                      @click="deleteStudent(student.id)"
                      class="flex items-center gap-1.5 px-3 py-1.5 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-md transition-colors"
                      title="Remover Aluno"
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

    <!-- Modal -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-2xl font-semibold mb-6">{{ editingStudent ? 'Editar Aluno' : 'Adicionar Novo Aluno' }}</h3>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Nome Completo</label>
            <input
              v-model="form.name"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Email do Aluno</label>
            <input
              v-model="form.email"
              type="email"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div v-if="!editingStudent">
            <label class="text-sm font-medium text-gray-700">Senha Provisória</label>
            <input
              v-model="form.password"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div v-else>
            <label class="text-sm font-medium text-gray-700">Nova Senha (deixe vazio para não alterar)</label>
            <input
              v-model="form.password"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Digite apenas se quiser alterar a senha"
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Vincular à Turma</label>
            <select
              v-model="form.turmaId"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Selecione uma turma...</option>
              <option v-for="turma in turmas" :key="turma.id" :value="turma.id">
                {{ turma.name }}
              </option>
            </select>
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
              class="py-2 px-4 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {{ submitting ? (editingStudent ? 'Salvando...' : 'Adicionando...') : (editingStudent ? 'Salvar' : 'Adicionar Aluno') }}
            </button>
          </div>
        </form>
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
const submitting = ref(false)
const error = ref('')
const searchTerm = ref('')

const students = ref<any[]>([])
const turmas = ref<any[]>([])
const editingStudent = ref<any | null>(null)

const form = ref({
  name: '',
  email: '',
  password: '',
  turmaId: ''
})

const filteredStudents = computed(() => {
  if (!searchTerm.value) return students.value

  const term = searchTerm.value.toLowerCase()
  return students.value.filter(
    (s) =>
      s.name.toLowerCase().includes(term) ||
      s.email.toLowerCase().includes(term) ||
      s.turma?.name.toLowerCase().includes(term)
  )
})

const fetchData = async () => {
  loading.value = true
  try {
    const [studentsData, turmasData] = await Promise.all([
      $fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token.value}` }
      }),
      $fetch('/api/admin/turmas', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
    ])

    students.value = studentsData as any[]
    turmas.value = turmasData as any[]
  } catch (err) {
    console.error('Erro ao buscar dados:', err)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  error.value = ''
  submitting.value = true

  try {
    const body: any = {
      name: form.value.name,
      email: form.value.email,
      turmaId: form.value.turmaId || undefined
    }

    // Só adiciona password se não estiver editando, ou se estiver editando e preencheu
    if (!editingStudent.value || form.value.password) {
      body.password = form.value.password
    }

    if (editingStudent.value) {
      // Editar
      await $fetch(`/api/admin/students/${editingStudent.value.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body
      })
    } else {
      // Criar
      await $fetch('/api/admin/students', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body
      })
    }

    closeModal()
    await fetchData()
  } catch (err: any) {
    error.value = err.data?.message || `Erro ao ${editingStudent.value ? 'editar' : 'adicionar'} aluno`
  } finally {
    submitting.value = false
  }
}

const editStudent = (student: any) => {
  editingStudent.value = student
  form.value = {
    name: student.name,
    email: student.email,
    password: '',
    turmaId: student.turmaId || ''
  }
  showModal.value = true
}

const deleteStudent = async (id: string) => {
  if (!confirm('Tem certeza que deseja remover este aluno? Todas as suas transações e categorias serão removidas.')) return

  try {
    await $fetch(`/api/admin/students/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })

    await fetchData()
  } catch (err: any) {
    alert(err.data?.message || 'Erro ao remover aluno')
  }
}

const closeModal = () => {
  showModal.value = false
  editingStudent.value = null
  form.value = {
    name: '',
    email: '',
    password: '',
    turmaId: ''
  }
  error.value = ''
}

onMounted(() => {
  fetchData()
})
</script>
