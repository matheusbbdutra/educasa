<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl w-full max-w-md shadow-2xl">
      <!-- Header -->
      <div class="flex justify-between items-center p-6 border-b">
        <h2 class="text-2xl font-bold text-gray-800">
          {{ transaction ? 'Editar Lançamento' : 'Novo Lançamento' }}
        </h2>
        <button @click="close" class="text-gray-400 hover:text-gray-600">
          <Icon name="mdi:close" class="w-6 h-6" />
        </button>
      </div>

      <!-- Content -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <!-- Descrição -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
          <input
            v-model="form.description"
            type="text"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ex: Almoço no restaurante"
            required
          />
        </div>

        <!-- Valor -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Valor</label>
          <div class="relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
            <input
              v-model="displayValue"
              @input="handleValueInput"
              type="text"
              class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              placeholder="0,00"
              required
            />
          </div>
          <button
            type="button"
            class="mt-2 flex items-center text-sm font-medium text-blue-600 hover:text-blue-800"
            @click="toggleCalculator"
          >
            <Icon name="mdi:calculator-variant" class="w-4 h-4 mr-1" />
            {{ showCalculator ? 'Ocultar calculadora' : 'Usar calculadora' }}
          </button>

          <div
            v-if="showCalculator"
            class="mt-3 border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-3"
          >
            <div class="flex items-center justify-between text-lg font-semibold text-gray-800">
              <span>{{ calculatorInput || '0' }}</span>
              <span class="text-xs text-gray-500">Use + e - nas contas</span>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <button
                v-for="key in calculatorKeys"
                :key="key"
                type="button"
                @click="handleCalculatorPress(key)"
                :class="[
                  'py-2 rounded-lg text-center font-semibold transition-colors shadow-sm',
                  key === '+' || key === '-' ? 'bg-blue-100 text-blue-700' :
                  key === '=' ? 'bg-green-100 text-green-700' :
                  key === 'C' ? 'bg-red-100 text-red-700' :
                  key === '⌫' ? 'bg-gray-200 text-gray-700' :
                  'bg-white text-gray-800 hover:bg-gray-100'
                ]"
              >
                {{ key }}
              </button>
            </div>
            <button
              type="button"
              class="w-full py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 flex items-center justify-center"
              @click="applyCalculatorResult"
            >
              <Icon name="mdi:equal" class="w-4 h-4 mr-1" />
              Aplicar resultado
            </button>
            <p class="text-xs text-gray-500">Monte operações simples (+ e -) para calcular valores antes de lançar.</p>
          </div>
        </div>

        <!-- Data e Hora -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Data</label>
            <input
              v-model="form.date"
              type="date"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Hora</label>
            <input
              v-model="form.time"
              type="time"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>

        <!-- Categoria e Subcategoria -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Categoria
              <span class="text-xs text-gray-500">({{ filteredCategories.length }} disponíveis)</span>
            </label>
            <select
              v-model="form.categoryId"
              @change="onCategoryChange"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Selecione...</option>
              <option v-for="cat in filteredCategories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Subcategoria
              <span class="text-xs text-gray-500">({{ subcategories.length }} disponíveis)</span>
            </label>
            <select
              v-model="form.subcategoryId"
              :disabled="!form.categoryId"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              required
            >
              <option value="">Selecione...</option>
              <option v-for="sub in subcategories" :key="sub.id" :value="sub.id">
                {{ sub.name }}
              </option>
            </select>
          </div>
        </div>

        <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

        <!-- Footer -->
        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            @click="close"
            class="px-6 py-3 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            :disabled="submitting || !isFormValid"
            class="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {{ submitting ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  transaction?: any
  categories: any[]
}>()

const emit = defineEmits<{
  close: []
  save: [data: any]
}>()

const { token } = useAuth()
const submitting = ref(false)
const error = ref('')
const displayValue = ref('')
const showCalculator = ref(false)
const calculatorInput = ref('')
const calculatorKeys = [
  '7', '8', '9', '+',
  '4', '5', '6', '-',
  '1', '2', '3', '⌫',
  '0', '00', '.', 'C',
  '='
]

const form = ref({
  description: '',
  amount: 0,
  date: new Date().toISOString().split('T')[0],
  time: new Date().toTimeString().slice(0, 5),
  categoryId: '',
  subcategoryId: ''
})

const filteredCategories = computed(() => {
  return props.categories
})

const subcategories = computed(() => {
  if (!form.value.categoryId) return []
  const category = props.categories.find(c => c.id === form.value.categoryId)
  return category?.subcategories || []
})

const isFormValid = computed(() => {
  return form.value.description &&
    form.value.amount > 0 &&
    form.value.subcategoryId &&
    form.value.date &&
    form.value.time
})

const toggleCalculator = () => {
  showCalculator.value = !showCalculator.value
}

const handleCalculatorPress = (key: string) => {
  if (key === 'C') {
    calculatorInput.value = ''
    return
  }

  if (key === '⌫') {
    calculatorInput.value = calculatorInput.value.slice(0, -1)
    return
  }

  if (key === '=') {
    applyCalculatorResult()
    return
  }

  if (key === '+' || key === '-') {
    if (!calculatorInput.value || /[+\-]$/.test(calculatorInput.value)) return
    calculatorInput.value += key
    return
  }

  if (key === '.') {
    const segments = calculatorInput.value.split(/[+\-]/)
    const currentSegment = segments[segments.length - 1] || ''
    if (currentSegment.includes('.')) return
  }

  calculatorInput.value += key
}

const evaluateCalculatorInput = (): number | null => {
  let expression = calculatorInput.value.replace(/,/g, '.')

  if (!expression) return null

  while (/[+\-]$/.test(expression)) {
    expression = expression.slice(0, -1)
  }

  if (!expression || !/^[0-9+.\-]+$/.test(expression)) return null

  try {
    // eslint-disable-next-line no-new-func
    const result = Number(new Function(`return ${expression}`)())
    if (!Number.isFinite(result)) return null
    return result < 0 ? 0 : result
  } catch (error) {
    console.error('Erro ao calcular expressão:', error)
    return null
  }
}

const applyCalculatorResult = () => {
  const value = evaluateCalculatorInput()
  if (value === null) return

  form.value.amount = value
  displayValue.value = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
  calculatorInput.value = value.toString()
  showCalculator.value = false
}

const handleValueInput = (e: any) => {
  let value = e.target.value.replace(/\D/g, '')
  calculatorInput.value = ''

  if (!value) {
    displayValue.value = ''
    form.value.amount = 0
    return
  }

  // Limitar a 10 dígitos
  if (value.length > 10) {
    value = value.slice(0, 10)
  }

  // Converter para número com 2 casas decimais
  const numValue = parseInt(value) / 100
  form.value.amount = numValue

  // Formatar para exibição
  displayValue.value = numValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const onCategoryChange = () => {
  form.value.subcategoryId = ''
}

const close = () => {
  resetForm()
  emit('close')
}

const resetForm = () => {
  displayValue.value = ''
  calculatorInput.value = ''
  showCalculator.value = false
  form.value = {
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    categoryId: '',
    subcategoryId: ''
  }
  error.value = ''
}

const handleSubmit = async () => {
  if (!isFormValid.value) return

  error.value = ''
  submitting.value = true

  try {
    const dateTime = new Date(`${form.value.date}T${form.value.time}`)

    const body = {
      description: form.value.description,
      amount: form.value.amount,
      date: dateTime.toISOString(),
      subcategoryId: form.value.subcategoryId
    }

    if (props.transaction) {
      await $fetch(`/api/transactions/${props.transaction.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body
      })
    } else {
      await $fetch('/api/transactions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body
      })
    }

    emit('save', body)
    close()
  } catch (err: any) {
    error.value = err.data?.message || 'Erro ao salvar transação'
  } finally {
    submitting.value = false
  }
}

watch(() => props.isOpen, (newVal) => {
  if (newVal && props.transaction) {
    // Preencher form com dados da transação para editar
    const date = new Date(props.transaction.date)
    form.value = {
      description: props.transaction.description,
      amount: Number(props.transaction.amount),
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
      categoryId: props.transaction.subcategory?.categoryId || '',
      subcategoryId: props.transaction.subcategoryId
    }

    // Formatar valor para exibição
    displayValue.value = Number(props.transaction.amount).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
    calculatorInput.value = ''
    showCalculator.value = false
  } else if (newVal) {
    resetForm()
  }

  // Debug: verificar categorias
})
</script>
