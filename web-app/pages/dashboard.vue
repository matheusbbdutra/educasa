<template>
  <div>
    <header class="bg-white shadow-sm p-4 flex justify-between items-center gap-2">
      <h1 class="text-lg md:text-2xl font-semibold text-gray-800 truncate">Dashboard</h1>
      <div class="flex gap-2">
        <button
          @click="showExportModal = true"
          class="flex items-center py-2 px-3 md:px-4 rounded-lg text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 shadow-sm transition-colors"
        >
          <Icon name="mdi:download" class="w-5 h-5" />
          <span class="hidden md:inline ml-2">Exportar</span>
        </button>
        <button
          @click="showModal = true"
          class="flex items-center py-2 px-3 md:px-4 rounded-lg text-white bg-red-600 hover:bg-red-700 shadow"
        >
          <Icon name="mdi:plus" class="w-5 h-5" />
          <span class="hidden md:inline ml-2">Novo Lançamento</span>
        </button>
      </div>
    </header>

    <div class="p-6 md:p-8">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h3 class="text-xl font-semibold text-gray-700">Relatório Mensal</h3>
          <p class="text-sm text-gray-500">Visualize apenas as despesas registradas</p>
        </div>
        <div class="flex items-center gap-2 sm:gap-3">
          <button
            class="p-2 sm:p-2 rounded-full bg-white shadow hover:bg-gray-50 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
            @click="changeMonth(-1)"
            aria-label="Mês anterior"
          >
            <Icon name="mdi:chevron-left" class="w-5 h-5 text-gray-700" />
          </button>
          <div class="text-center min-w-0 flex-1">
            <p class="text-xs uppercase text-gray-400 tracking-wide hidden sm:block">Mês selecionado</p>
            <p class="text-sm sm:text-base font-semibold text-gray-800 truncate">{{ selectedMonthLabel }}</p>
          </div>
          <button
            class="p-2 sm:p-2 rounded-full bg-white shadow hover:bg-gray-50 disabled:opacity-40 min-w-[40px] min-h-[40px] sm:min-w-[44px] sm:min-h-[44px]"
            :disabled="isNextMonthDisabled"
            @click="changeMonth(1)"
            aria-label="Próximo mês"
          >
            <Icon name="mdi:chevron-right" class="w-5 h-5 text-gray-700" />
          </button>
        </div>
      </div>

      <!-- Cards de Resumo -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0 p-3 rounded-full bg-red-100 text-red-600">
              <Icon name="mdi:cash-minus" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-500 truncate">Total do mês</p>
              <p class="text-xl md:text-2xl font-bold text-gray-900 truncate">{{ formatCurrency(monthlySummary.total) }}</p>
              <p class="text-xs text-gray-400 truncate">{{ monthlySummary.count }} lançamentos</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0 p-3 rounded-full bg-blue-100 text-blue-600">
              <Icon name="mdi:calendar-clock" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-500 truncate">Média diária</p>
              <p class="text-xl md:text-2xl font-bold text-gray-900 truncate">{{ formatCurrency(monthlySummary.average) }}</p>
              <p class="text-xs text-gray-400 truncate">{{ daysInSelectedMonth }} dias</p>
            </div>
          </div>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0 p-3 rounded-full bg-purple-100 text-purple-600">
              <Icon name="mdi:playlist-star" class="w-6 h-6" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-gray-500 truncate">Categoria destaque</p>
              <p class="text-xl md:text-2xl font-bold text-gray-900 truncate" :title="topCategory ? topCategory.name : 'Sem dados'">
                {{ topCategory ? topCategory.name : 'Sem dados' }}
              </p>
              <p class="text-xs text-gray-400 truncate" v-if="topCategory">
                {{ formatCurrency(topCategory.value) }}
              </p>
              <p class="text-xs text-gray-400 truncate" v-else>Sem despesas</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Gráficos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Gráfico de Despesas por Categoria -->
        <div class="bg-white p-6 rounded-lg shadow-md flex flex-col">
          <div class="mb-4">
            <h4 class="text-lg font-semibold text-gray-800 mb-1">Despesas por Categoria</h4>
            <p class="text-xs text-gray-500">{{ selectedMonthLabel }}</p>
          </div>
          <div v-if="!loading && expensesByCategory.length > 0" class="flex-1 flex items-center justify-center">
            <div class="w-full max-w-sm mx-auto">
              <canvas ref="categoryChartRef"></canvas>
            </div>
          </div>
          <div v-else-if="!loading" class="flex-1 flex items-center justify-center">
            <p class="text-gray-500">Sem dados para exibir</p>
          </div>

          <!-- Top 3 Categorias -->
          <div v-if="!loading && expensesByCategory.length > 0" class="mt-6 pt-4 border-t border-gray-200">
            <p class="text-sm font-medium text-gray-700 mb-3">Top 3 Categorias</p>
            <div class="space-y-2">
              <div
                v-for="(cat, index) in expensesByCategory.slice(0, 3)"
                :key="cat.name"
                class="flex items-center justify-between text-sm"
              >
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: chartColors[index] }"></div>
                  <span class="text-gray-700">{{ cat.name }}</span>
                </div>
                <span class="font-medium text-gray-900">{{ formatCurrency(cat.value) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Gráfico de Evolução Mensal -->
        <div class="bg-white p-6 rounded-lg shadow-md flex flex-col">
          <div class="mb-4">
            <h4 class="text-lg font-semibold text-gray-800 mb-1">Evolução de Despesas</h4>
            <p class="text-xs text-gray-500">Últimos 6 meses</p>
          </div>
          <div v-if="!loading" class="flex-1">
            <canvas ref="evolutionChartRef"></canvas>
          </div>

          <!-- Últimos 3 Meses -->
          <div v-if="!loading" class="mt-6 pt-4 border-t border-gray-200">
            <p class="text-sm font-medium text-gray-700 mb-3">Últimos 3 Meses</p>
            <div class="space-y-2">
              <div
                v-for="(month, index) in last3MonthsData"
                :key="month.label"
                class="flex items-center justify-between text-sm"
              >
                <div class="flex items-center gap-2">
                  <Icon
                    v-if="month.trend === 'up'"
                    name="mdi:trending-up"
                    class="w-4 h-4 text-red-500"
                  />
                  <Icon
                    v-else-if="month.trend === 'down'"
                    name="mdi:trending-down"
                    class="w-4 h-4 text-green-500"
                  />
                  <Icon
                    v-else
                    name="mdi:minus"
                    class="w-4 h-4 text-gray-400"
                  />
                  <span class="text-gray-700">{{ month.label }}</span>
                </div>
                <span class="font-medium text-gray-900">{{ formatCurrency(month.total) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Transações Recentes -->
      <div class="bg-white p-6 rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-4">
          <div>
            <h4 class="text-lg font-semibold text-gray-800">Lançamentos de {{ selectedMonthLabel }}</h4>
            <p class="text-xs text-gray-500">Somente despesas registradas</p>
          </div>
          <NuxtLink to="/transactions" class="text-blue-600 hover:text-blue-800 text-sm">
            Ver todas →
          </NuxtLink>
        </div>
        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-500">Carregando...</p>
        </div>
        <div v-else-if="monthlyTransactions.length === 0" class="text-center py-8">
          <Icon name="mdi:receipt-text-outline" class="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">Nenhuma despesa encontrada para este mês</p>
          <NuxtLink
            to="/transactions"
            class="mt-4 inline-block py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Registrar despesa
          </NuxtLink>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="transaction in monthlyTransactions.slice(0, 10)"
            :key="transaction.id"
            class="flex justify-between items-center p-3 border-b last:border-b-0"
          >
            <div>
              <p class="font-medium text-gray-900">{{ transaction.description }}</p>
              <p class="text-sm text-gray-500">
                {{ formatDate(transaction.date) }} - {{ transaction.subcategory?.category?.name || 'Sem categoria' }}
              </p>
            </div>
            <p class="font-semibold text-lg text-red-600">
              -{{ formatCurrency(transaction.amount) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Moderno -->
    <TransactionModal
      :is-open="showModal"
      :transaction="null"
      :categories="categories"
      @close="showModal = false"
      @save="handleSave"
    />

    <!-- Modal de Exportação -->
    <ExportModal
      :is-open="showExportModal"
      :auto-export-consent-value="userAutoExportConsent"
      @close="showExportModal = false"
      @export="handleExport"
    />
  </div>
</template>

<script setup lang="ts">
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

definePageMeta({
  layout: 'student'
})

const { token } = useAuth()
const { exportTransactions } = useExportCSV()
const loading = ref(true)
const showModal = ref(false)
const showExportModal = ref(false)
const transactions = ref<any[]>([])
const categories = ref<any[]>([])
const userAutoExportConsent = ref(false)
const categoryChartRef = ref<HTMLCanvasElement | null>(null)
const evolutionChartRef = ref<HTMLCanvasElement | null>(null)
let categoryChart: Chart | null = null
let evolutionChart: Chart | null = null

// Cores do gráfico
const chartColors = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6'
]

const now = new Date()
const selectedMonth = ref(now.getMonth())
const selectedYear = ref(now.getFullYear())

const daysInSelectedMonth = computed(() => {
  return new Date(selectedYear.value, selectedMonth.value + 1, 0).getDate()
})

const selectedMonthLabel = computed(() => {
  const date = new Date(selectedYear.value, selectedMonth.value, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const isNextMonthDisabled = computed(() => {
  const current = new Date()
  if (selectedYear.value > current.getFullYear()) return true
  if (selectedYear.value === current.getFullYear() && selectedMonth.value >= current.getMonth()) return true
  return false
})

const monthlyTransactions = computed(() => {
  return transactions.value.filter(t => {
    const tDate = new Date(t.date)
    return tDate.getMonth() === selectedMonth.value && tDate.getFullYear() === selectedYear.value
  })
})

const monthlySummary = computed(() => {
  const total = monthlyTransactions.value.reduce((sum, t) => sum + Number(t.amount), 0)
  return {
    total,
    average: daysInSelectedMonth.value ? total / daysInSelectedMonth.value : 0,
    count: monthlyTransactions.value.length
  }
})

const expensesByCategory = computed(() => {
  const categoryMap = new Map<string, number>()

  monthlyTransactions.value.forEach(t => {
    const categoryName = t.subcategory?.category?.name || 'Sem categoria'
    categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + Number(t.amount))
  })

  return Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value) // Ordenar por valor decrescente
})

const topCategory = computed(() => {
  if (!expensesByCategory.value.length) return null
  return expensesByCategory.value[0] // Já está ordenado, primeiro é o maior
})

const last3MonthsData = computed(() => {
  const months: { label: string, total: number, trend: 'up' | 'down' | 'neutral' }[] = []
  const now = new Date()

  for (let i = 2; i >= 0; i--) {
    const current = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const normalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)

    const total = transactions.value
      .filter(t => {
        const tDate = new Date(t.date)
        return tDate.getMonth() === current.getMonth() && tDate.getFullYear() === current.getFullYear()
      })
      .reduce((sum, t) => sum + Number(t.amount), 0)

    // Calcular tendência comparando com o mês anterior
    let trend: 'up' | 'down' | 'neutral' = 'neutral'
    if (months.length > 0) {
      const previousTotal = months[months.length - 1].total
      if (total > previousTotal) {
        trend = 'up'
      } else if (total < previousTotal) {
        trend = 'down'
      }
    }

    months.push({ label: normalizedLabel, total, trend })
  }

  return months
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('pt-BR')
}

const changeMonth = (offset: number) => {
  const reference = new Date(selectedYear.value, selectedMonth.value + offset, 1)
  const today = new Date()
  const current = new Date(today.getFullYear(), today.getMonth(), 1)
  if (reference > current) return

  selectedMonth.value = reference.getMonth()
  selectedYear.value = reference.getFullYear()
}

const fetchTransactions = async () => {
  loading.value = true
  try {
    const [transactionsData, categoriesData] = await Promise.all([
      $fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token.value}` }
      }),
      $fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
    ])

    transactions.value = transactionsData as any[]
    categories.value = categoriesData as any[]

    // Buscar consentimento de exportação do usuário
    try {
      const userData = await $fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token.value}` }
      }) as { autoExportConsent?: boolean }
      userAutoExportConsent.value = userData.autoExportConsent || false
    } catch (error) {
      console.error('Erro ao buscar consentimento:', error)
    }
  } catch (error) {
    console.error('Erro ao buscar dados:', error)
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  await fetchTransactions()
}

const handleExport = async ({ type, consent }: { type: 'download' | 'email', consent?: boolean }) => {
  if (type === 'download') {
    // Download direto - usar histórico completo
    const allTransactions = transactions.value

    if (allTransactions.length === 0) {
      alert('Nenhuma transação encontrada.')
      return
    }

    // Usar todas as transações (histórico completo)
    const firstDate = new Date(Math.min(...allTransactions.map(t => new Date(t.date).getTime())))
    const lastDate = new Date(Math.max(...allTransactions.map(t => new Date(t.date).getTime())))

    exportTransactions(allTransactions, firstDate, lastDate)

  } else {
    // Enviar por email
    try {
      // Salvar consentimento se fornecido
      if (consent !== undefined) {
        await $fetch('/api/user/export-consent', {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token.value}` },
          body: { consent }
        })
        userAutoExportConsent.value = consent

        // Se marcou consentimento, apenas salva e não envia email
        if (consent) {
          return
        }
      }

      // Solicitar exportação por email (apenas se NÃO marcou consentimento)
      await $fetch('/api/transactions/export-email', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` }
      })
    } catch (error: any) {
      const message = error.data?.message || 'Erro ao solicitar exportação'
      alert(message)
    }
  }
}

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
        backgroundColor: chartColors
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
              const value = context.parsed || 0
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

  const points: { label: string, total: number }[] = []
  const anchor = new Date(selectedYear.value, selectedMonth.value, 1)

  for (let i = 5; i >= 0; i--) {
    const current = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1)
    const label = current.toLocaleDateString('pt-BR', { month: 'short' })
    const normalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)

    const total = transactions.value
      .filter(t => {
        const tDate = new Date(t.date)
        return tDate.getMonth() === current.getMonth() && tDate.getFullYear() === current.getFullYear()
      })
      .reduce((sum, t) => sum + Number(t.amount), 0)

    points.push({ label: normalizedLabel, total })
  }

  evolutionChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: points.map(p => p.label),
      datasets: [
        {
          label: 'Despesas',
          data: points.map(p => p.total),
          borderColor: '#EF4444',
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          tension: 0.3,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom'
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

watch([transactions, selectedMonth, selectedYear], () => {
  nextTick(() => {
    createCategoryChart()
    createEvolutionChart()
  })
}, { deep: true })

onMounted(async () => {
  await fetchTransactions()
  nextTick(() => {
    createCategoryChart()
    createEvolutionChart()
  })
})

onBeforeUnmount(() => {
  if (categoryChart) categoryChart.destroy()
  if (evolutionChart) evolutionChart.destroy()
})
</script>
