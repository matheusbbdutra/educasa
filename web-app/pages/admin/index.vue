<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
    </div>

    <div>
      <h3 class="text-xl font-semibold text-gray-700 mb-4">Visão Geral</h3>

      <!-- Cards de Resumo -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-blue-100 text-blue-600">
              <Icon name="mdi:account-group" class="w-6 h-6" />
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Total de Turmas</p>
              <p class="text-2xl font-bold text-gray-900">{{ turmas.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-green-100 text-green-600">
              <Icon name="mdi:account" class="w-6 h-6" />
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Total de Alunos</p>
              <p class="text-2xl font-bold text-gray-900">{{ students.length }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center">
            <div class="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Icon name="mdi:account-check" class="w-6 h-6" />
            </div>
            <div class="ml-4">
              <p class="text-sm text-gray-500">Alunos Ativos</p>
              <p class="text-2xl font-bold text-gray-900">{{ students.length }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabela de Turmas -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <h4 class="text-lg font-semibold text-gray-800 mb-4">Turmas Ativas</h4>
        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-500">Carregando...</p>
        </div>
        <div v-else-if="turmas.length === 0" class="text-center py-8">
          <p class="text-gray-500">Nenhuma turma cadastrada</p>
          <NuxtLink
            to="/admin/turmas"
            class="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Criar primeira turma
          </NuxtLink>
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
              <tr v-for="turma in turmas" :key="turma.id">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ turma.name }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ turma.students?.length || 0 }}
                </td>
                <td class="px-6 py-4 text-sm font-medium">
                  <button 
                    @click="showDetailsModal(turma)" 
                    type="button" 
                    class="flex items-center gap-2 px-3 py-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-md transition-colors"
                    title="Visualizar Escopo Financeiro da Turma"
                  >
                    <Icon name="mdi:chart-box-outline" class="w-5 h-5" />
                    <span class="font-medium">Escopo Financeiro</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de Detalhes da Turma -->
    <LazyTurmaDetailsModal
      v-if="detailsModalOpen"
      :turma="selectedTurma"
      @close="closeDetailsModal"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin'
})

const { token } = useAuth()
const loading = ref(true)
const turmas = ref<any[]>([])
const students = ref<any[]>([])

const detailsModalOpen = ref(false)
const selectedTurma = ref<any | null>(null)

const showDetailsModal = (turma: any) => {
  selectedTurma.value = turma
  detailsModalOpen.value = true
}

const closeDetailsModal = () => {
  detailsModalOpen.value = false
  selectedTurma.value = null
}

const fetchData = async () => {
  loading.value = true
  try {
    const [turmasData, studentsData] = await Promise.all([
      $fetch('/api/admin/turmas', {
        headers: { Authorization: `Bearer ${token.value}` }
      }),
      $fetch('/api/admin/students', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
    ])

    turmas.value = turmasData as any[]
    students.value = studentsData as any[]
  } catch (error) {
    console.error('Erro ao buscar dados:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>
