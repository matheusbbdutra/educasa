<template>
  <div>
    <header class="bg-white shadow-sm p-4 flex justify-between items-center gap-2">
      <h1 class="text-lg md:text-2xl font-semibold text-gray-800 truncate">Transações</h1>
      <button
        @click="showModal = true"
        class="flex items-center py-2 px-3 md:px-4 rounded-lg text-white bg-red-600 hover:bg-red-700 shadow"
      >
        <Icon name="mdi:plus" class="w-5 h-5" />
        <span class="hidden md:inline ml-2">Novo Lançamento</span>
      </button>
    </header>

    <div class="p-6 md:p-8">
      <!-- Filtros -->
      <div class="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          v-model="searchTerm"
          type="text"
          class="px-4 py-2 border border-gray-300 rounded-md"
          placeholder="Buscar por descrição..."
        />
        <select
          v-model="filterCategory"
          class="px-4 py-2 border border-gray-300 rounded-md"
        >
          <option value="">Todas as categorias</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <!-- Resumo -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Total de Despesas</p>
              <p class="text-2xl font-bold text-red-600">R$ {{ totalExpense.toFixed(2) }}</p>
            </div>
            <Icon name="mdi:cash-minus" class="w-12 h-12 text-red-600" />
          </div>
        </div>
        <div class="bg-white p-4 rounded-lg shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500">Lançamentos filtrados</p>
              <p class="text-2xl font-bold text-gray-800">{{ filteredTransactions.length }}</p>
            </div>
            <Icon name="mdi:playlist-check" class="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      <!-- Lista de Transações -->
      <div class="bg-white rounded-lg shadow-md">
        <div v-if="loading" class="text-center py-8">
          <p class="text-gray-500">Carregando...</p>
        </div>
        <div v-else-if="filteredTransactions.length === 0" class="text-center py-8">
          <Icon name="mdi:receipt-text-outline" class="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">Nenhuma transação encontrada</p>
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subcategoria</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="transaction in filteredTransactions" :key="transaction.id">
                <td class="px-6 py-4 text-sm text-gray-900">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ transaction.description }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ transaction.subcategory?.category?.name || '-' }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ transaction.subcategory?.name || '-' }}
                </td>
                <td class="px-6 py-4 text-sm text-right font-medium text-red-600">
                  - R$ {{ parseFloat(transaction.amount).toFixed(2) }}
                </td>
                <td class="px-6 py-4 text-sm text-center space-x-2">
                  <button @click="editTransaction(transaction)" class="text-blue-600 hover:text-blue-900">
                    <Icon name="mdi:pencil" class="w-5 h-5" />
                  </button>
                  <button @click="deleteTransaction(transaction.id)" class="text-red-600 hover:text-red-900">
                    <Icon name="mdi:delete" class="w-5 h-5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal Moderno -->
    <TransactionModal
      :is-open="showModal"
      :transaction="editingTransaction"
      :categories="categories"
      @close="closeModal"
      @save="handleSave"
    />

    <!-- Modal de Confirmação de Exclusão -->
    <ConfirmModal
      :is-open="showConfirmDelete"
      title="Excluir Transação"
      message="Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita."
      confirm-text="Excluir"
      cancel-text="Cancelar"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="showConfirmDelete = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'student'
})

const { token } = useAuth()
const loading = ref(true)
const showModal = ref(false)
const showConfirmDelete = ref(false)
const transactionToDelete = ref<string | null>(null)
const searchTerm = ref('')
const filterCategory = ref('')

const transactions = ref<any[]>([])
const categories = ref<any[]>([])
const editingTransaction = ref<any | null>(null)

const filteredTransactions = computed(() => {
  let result = transactions.value

  if (searchTerm.value) {
    const term = searchTerm.value.toLowerCase()
    result = result.filter(t => t.description.toLowerCase().includes(term))
  }

  if (filterCategory.value) {
    result = result.filter(t => t.subcategory?.categoryId === filterCategory.value)
  }

  return result
})

const totalExpense = computed(() => {
  return filteredTransactions.value
    .reduce((sum, t) => sum + parseFloat(t.amount), 0)
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

const fetchData = async () => {
  loading.value = true
  try {
    const [transactionsData, categoriesData] = await Promise.all([
      $fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token.value}` }
      }),
      $fetch('/api/student/categories', {
        headers: { Authorization: `Bearer ${token.value}` }
      })
    ])

    transactions.value = transactionsData as any[]
    categories.value = categoriesData as any[]

  } catch (err) {
    console.error('Erro ao buscar dados:', err)
  } finally {
    loading.value = false
  }
}

const editTransaction = (transaction: any) => {
  editingTransaction.value = transaction
  showModal.value = true
}

const handleSave = async () => {
  await fetchData()
}

const deleteTransaction = (id: string) => {
  transactionToDelete.value = id
  showConfirmDelete.value = true
}

const confirmDelete = async () => {
  if (!transactionToDelete.value) return

  try {
    await $fetch(`/api/student/transactions/${transactionToDelete.value}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })

    showConfirmDelete.value = false
    transactionToDelete.value = null
    await fetchData()
  } catch (err: any) {
    showConfirmDelete.value = false
    alert(err.data?.message || 'Erro ao remover transação')
  }
}

const closeModal = () => {
  showModal.value = false
  editingTransaction.value = null
}

onMounted(() => {
  fetchData()
})
</script>
