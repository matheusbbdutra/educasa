<template>
  <div class="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
      <header class="p-5 border-b border-gray-200 flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-800">Detalhes da Turma: {{ turma.name }}</h2>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-800">
          <Icon name="mdi:close" class="w-7 h-7" />
        </button>
      </header>

      <!-- Navegação de Período -->
      <div class="border-b border-gray-200 bg-gray-50 p-4">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">Análise de Período</h3>
            <p class="text-sm text-gray-500">Selecione o período para analisar os gastos</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <button
              class="p-2 rounded-full bg-white shadow hover:bg-gray-50 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
              @click="changeMonth(-1)"
              aria-label="Mês anterior"
            >
              <Icon name="mdi:chevron-left" class="w-5 h-5 text-gray-700" />
            </button>
            <div class="text-center min-w-0 flex-1 sm:flex-initial">
              <p class="text-xs uppercase text-gray-400 tracking-wide hidden sm:block">Mês selecionado</p>
              <p class="text-sm sm:text-base font-semibold text-gray-800 truncate">{{ selectedMonthLabel }}</p>
            </div>
            <button
              class="p-2 rounded-full bg-white shadow hover:bg-gray-50 disabled:opacity-40 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
              :disabled="isNextMonthDisabled"
              @click="changeMonth(1)"
              aria-label="Próximo mês"
            >
              <Icon name="mdi:chevron-right" class="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </div>

      <div class="flex-grow flex flex-col md:flex-row overflow-hidden">
        <!-- Navegação Mobile -->
        <div class="md:hidden border-b border-gray-200 bg-gray-50">
          <div class="px-4 py-3">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-800">Aluno</h3>
              <div class="flex items-center gap-2">
                <button
                  class="p-2 rounded-full bg-white shadow hover:bg-gray-50 disabled:opacity-40 min-w-[40px] min-h-[40px]"
                  :disabled="!canGoPrev"
                  @click="goToPreviousStudent"
                  aria-label="Aluno anterior"
                >
                  <Icon name="mdi:chevron-left" class="w-5 h-5 text-gray-700" />
                </button>
                <div class="text-center min-w-0 flex-1">
                  <p class="text-sm font-semibold text-gray-800 truncate">{{ selectedStudent?.name || 'Selecione um aluno' }}</p>
                </div>
                <button
                  class="p-2 rounded-full bg-white shadow hover:bg-gray-50 disabled:opacity-40 min-w-[40px] min-h-[40px]"
                  :disabled="!canGoNext"
                  @click="goToNextStudent"
                  aria-label="Próximo aluno"
                >
                  <Icon name="mdi:chevron-right" class="w-5 h-5 text-gray-700" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar de Alunos (desktop) -->
        <aside class="hidden md:block md:w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto">
          <h3 class="text-lg font-semibold p-4 border-b border-gray-200">Alunos ({{ sortedStudents.length }})</h3>
          <ul>
            <li
              v-for="student in sortedStudents"
              :key="student.id"
              @click="selectStudent(student)"
              :class="['p-4 cursor-pointer hover:bg-blue-50', { 'bg-blue-100 text-blue-800 font-semibold': selectedStudent?.id === student.id }]"
            >
              {{ student.name }}
            </li>
          </ul>
        </aside>

        <!-- Conteúdo do Aluno -->
        <main class="flex-1 p-6 overflow-y-auto">
          <div v-if="!selectedStudent" class="flex items-center justify-center h-full">
            <p class="text-gray-500 text-lg">Selecione um aluno para ver os detalhes.</p>
          </div>
          <div v-else>
            <div class="flex justify-between items-start mb-6">
              <div>
                <h3 class="text-3xl font-bold text-gray-800">{{ selectedStudent.name }}</h3>
                <p class="text-gray-600">{{ selectedStudent.email }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-500">Total gasto no período</p>
                <p class="text-2xl font-bold text-red-600">
                  {{ formatCurrency(totalExpense) }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ selectedMonthLabel }}
                </p>
              </div>
            </div>

            <!-- Gráficos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <!-- Gráfico de Despesas por Categoria -->
              <div class="bg-white p-4 md:p-6 rounded-lg shadow-md flex flex-col">
                <div class="mb-4">
                  <h4 class="text-lg font-semibold text-gray-800 mb-1">Despesas por Categoria</h4>
                  <p class="text-xs text-gray-500">{{ selectedMonthLabel }}</p>
                </div>
                <div v-if="!loadingTransactions && expensesByCategory.length > 0" class="flex-1 flex items-center justify-center">
                  <div class="w-full max-w-sm mx-auto">
                    <canvas ref="categoryChartRef"></canvas>
                  </div>
                </div>
                <div v-else-if="!loadingTransactions" class="flex-1 flex items-center justify-center">
                  <p class="text-gray-500">Sem dados para exibir</p>
                </div>
              </div>

              <!-- Gráfico de Gastos Mensais -->
              <div class="bg-white p-4 md:p-6 rounded-lg shadow-md flex flex-col">
                <div class="mb-4">
                  <h4 class="text-lg font-semibold text-gray-800 mb-1">Evolução de Gastos</h4>
                  <p class="text-xs text-gray-500">Últimos 6 meses</p>
                </div>
                <div v-if="!loadingTransactions" class="flex-1">
                  <canvas ref="evolutionChartRef"></canvas>
                </div>
              </div>
            </div>

            <!-- Tabela de Transações -->
            <div>
              <h4 class="text-xl font-semibold mb-4">Transações de {{ selectedMonthLabel }}</h4>
              <div v-if="loadingTransactions" class="text-center">
                <p>Carregando transações...</p>
              </div>
              <div v-else-if="transactions.length === 0" class="text-center">
                <p>Nenhuma transação encontrada para este aluno no período selecionado.</p>
              </div>
              <div v-else class="overflow-x-auto border rounded-lg">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-100">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="t in transactions" :key="t.id">
                      <td class="px-6 py-4">{{ t.description }}</td>
                      <td class="px-6 py-4 text-gray-500">{{ t.subcategory?.category?.name || 'Sem categoria' }}</td>
                      <td class="px-6 py-4 text-red-600">
                        -{{ formatCurrency(parseFloat(t.amount)) }}
                      </td>
                      <td class="px-6 py-4">{{ new Date(t.date).toLocaleDateString('pt-BR') }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const props = defineProps({
  turma: {
    type: Object,
    required: true
  }
})

defineEmits(['close'])

const { token } = useAuth()
const selectedStudent = ref<any | null>(null)
const transactions = ref<any[]>([])
const allTransactions = ref<any[]>([])
const loadingTransactions = ref(false)

// Controle de mês
const now = new Date()
const selectedMonth = ref(now.getMonth())
const selectedYear = ref(now.getFullYear())

// Gráficos
const categoryChartRef = ref<HTMLCanvasElement | null>(null)
const evolutionChartRef = ref<HTMLCanvasElement | null>(null)
let categoryChart: Chart | null = null
let evolutionChart: Chart | null = null

// Cores dos gráficos
const chartColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
]

const sortedStudents = computed(() => {
  if (!props.turma.students) return []
  return [...props.turma.students].sort((a, b) => a.name.localeCompare(b.name))
})

const currentStudentIndex = computed(() => {
  if (!selectedStudent.value) return -1
  return sortedStudents.value.findIndex(student => student.id === selectedStudent.value.id)
})

const canGoPrev = computed(() => currentStudentIndex.value > 0)
const canGoNext = computed(() => currentStudentIndex.value !== -1 && currentStudentIndex.value < sortedStudents.value.length - 1)

const selectedMonthLabel = computed(() => {
  const date = new Date(selectedYear.value, selectedMonth.value, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const isNextMonthDisabled = computed(() => {
  const current = new Date()
  const selected = new Date(selectedYear.value, selectedMonth.value, 1)
  const currentMonth = new Date(current.getFullYear(), current.getMonth(), 1)
  return selected >= currentMonth
})


const changeMonth = (offset: number) => {
  const reference = new Date(selectedYear.value, selectedMonth.value + offset, 1)
  const today = new Date()
  const current = new Date(today.getFullYear(), today.getMonth(), 1)
  if (reference > current) return

  selectedMonth.value = reference.getMonth()
  selectedYear.value = reference.getFullYear()
}

const selectStudent = async (student: any) => {
  selectedStudent.value = student
  await fetchTransactions(student.id)
}

const goToPreviousStudent = () => {
  if (!canGoPrev.value) return
  const target = sortedStudents.value[currentStudentIndex.value - 1]
  if (target) {
    selectStudent(target)
  }
}

const goToNextStudent = () => {
  if (!canGoNext.value) return
  const target = sortedStudents.value[currentStudentIndex.value + 1]
  if (target) {
    selectStudent(target)
  }
}

const fetchTransactions = async (studentId: string) => {
  loadingTransactions.value = true
  try {
    // Buscar transações do aluno específico
    const data = await $fetch(`/api/admin/students/${studentId}/transactions`, {
      headers: { Authorization: `Bearer ${token.value}` }
    })
    allTransactions.value = data as any[]

    // Filtrar transações pelo mês selecionado
    filterTransactionsByMonth()
  } catch (error) {
    console.error('Erro ao buscar transações do aluno:', error)
    allTransactions.value = []
    transactions.value = []
  } finally {
    loadingTransactions.value = false
  }
}

const filterTransactionsByMonth = () => {
  if (!allTransactions.value.length) {
    transactions.value = []
    return
  }

  transactions.value = allTransactions.value.filter(t => {
    const tDate = new Date(t.date)
    return tDate.getMonth() === selectedMonth.value && tDate.getFullYear() === selectedYear.value
  })
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const totalExpense = computed(() => transactions.value.reduce((sum, t) => sum + parseFloat(t.amount), 0))

const topCategory = computed(() => {
  if (!expensesByCategory.value.length) return null
  return expensesByCategory.value[0] // Já está ordenado, primeiro é o maior
})

const expensesByCategory = computed(() => {
  const categoryMap = new Map<string, number>()

  transactions.value.forEach(t => {
    const categoryName = t.subcategory?.category?.name || 'Sem categoria'
    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Number(t.amount))
  })

  return Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
})

const evolutionData = computed(() => {
  const points: { label: string, total: number }[] = []
  const anchor = new Date(selectedYear.value, selectedMonth.value, 1)

  for (let i = 5; i >= 0; i--) {
    const current = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
    const label = current.toLocaleDateString('pt-BR', { month: 'short' })
    const normalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)

    const total = allTransactions.value
      .filter(t => {
        const tDate = new Date(t.date)
        return tDate.getMonth() === current.getMonth() && tDate.getFullYear() === current.getFullYear()
      })
      .reduce((sum, t) => sum + Number(t.amount), 0)

    points.push({ label: normalizedLabel, total })
  }

  return points
})

// Watch para atualizar transações quando o mês mudar
watch([selectedMonth, selectedYear], () => {
  if (selectedStudent.value) {
    filterTransactionsByMonth()
  }
})

const createCategoryChart = () => {
  if (!categoryChartRef.value || expensesByCategory.value.length === 0) {
    if (categoryChart) {
      categoryChart.destroy()
      categoryChart = null
    }
    return
  }

  if (categoryChart) {
    categoryChart.destroy()
  }

  const ctx = categoryChartRef.value.getContext('2d')
  if (!ctx) return

  const total = expensesByCategory.value.reduce((sum, c) => sum + c.value, 0)

  categoryChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: expensesByCategory.value.map(c => c.name),
      datasets: [{
        data: expensesByCategory.value.map(c => c.value),
        backgroundColor: chartColors.slice(0, expensesByCategory.value.length)
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1.5,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 10,
            font: {
              size: 11
            }
          }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const label = context.label || ''
              const value = context.parsed
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
              const formattedValue = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(value)

              return `${label}: ${formattedValue} (${percentage}%)`
            }
          }
        }
      }
    }
  })
}

const createEvolutionChart = () => {
  if (!evolutionChartRef.value) return

  if (evolutionChart) {
    evolutionChart.destroy()
  }

  const ctx = evolutionChartRef.value.getContext('2d')
  if (!ctx) return

  evolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: evolutionData.value.map(p => p.label),
      datasets: [{
        label: 'Despesas',
        data: evolutionData.value.map(p => p.total),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.15)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const value = context.parsed.y
              const formattedValue = new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(value)
              return `Despesas: ${formattedValue}`
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function(value) {
              return 'R$ ' + value
            }
          }
        }
      }
    }
  })
}

// Watch para atualizar gráficos quando os dados mudarem
watch([expensesByCategory, evolutionData], () => {
  nextTick(() => {
    createCategoryChart()
    createEvolutionChart()
  })
}, { deep: true })

// Watch para atualizar transações quando o mês mudar
watch([selectedMonth, selectedYear], () => {
  if (selectedStudent.value && allTransactions.value.length > 0) {
    filterTransactionsByMonth()
  }
})

// Auto-seleciona o primeiro aluno da lista se houver algum
watch(() => props.turma, (newTurma) => {
  if (newTurma && newTurma.students && newTurma.students.length > 0) {
    selectStudent(sortedStudents.value[0])
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (categoryChart) categoryChart.destroy()
  if (evolutionChart) evolutionChart.destroy()
})
</script>
