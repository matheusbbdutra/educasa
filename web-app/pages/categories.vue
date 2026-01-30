<template>
  <div>
    <header class="bg-white shadow-sm p-4">
      <h1 class="text-2xl font-semibold text-gray-800">Categorias e Subcategorias</h1>
    </header>

    <div class="p-6 md:p-8">
      <div v-if="loading" class="text-center py-8">
        <p class="text-gray-500">Carregando...</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Coluna de Categorias -->
        <div class="bg-white rounded-lg shadow-md p-6">
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-gray-800">Categorias</h2>
          <p class="text-sm text-gray-500 mt-1">Categorias pré-configuradas do sistema</p>
        </div>

        <div v-if="categories.length === 0" class="text-center py-8">
          <Icon name="mdi:folder-outline" class="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">Nenhuma categoria encontrada</p>
        </div>

          <div v-else class="space-y-4">
            <!-- Categorias -->
            <div>
              <h3 class="text-lg font-medium text-gray-600 mb-2 border-b pb-1">Categorias de Despesa</h3>
              <div class="space-y-2">
                <div
                  v-for="category in expenseCategories"
                  :key="category.id"
                  @click="selectCategory(category)"
                  :class="getCategoryClass(category)"
                >
                  <div class="flex items-center">
                    <Icon name="mdi:arrow-down-bold-circle" class="w-6 h-6 text-red-600 mr-3" />
                    <div>
                      <p class="font-medium text-gray-900">
                        {{ category.name }}
                        <span v-if="category.isSystem" class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Sistema</span>
                      </p>
                      <p class="text-xs text-gray-500">{{ category.subcategories?.length || 0 }} subcategorias</p>
                    </div>
                  </div>
                  <!-- Categorias do sistema não podem ser editadas ou excluídas -->
                  <div v-if="!category.isSystem" class="flex space-x-2">
                    <button @click.stop="editCategory(category)" class="text-blue-600 hover:text-blue-900"><Icon name="mdi:pencil" class="w-5 h-5" /></button>
                    <button @click.stop="requestDeleteCategory(category)" class="text-red-600 hover:text-red-900"><Icon name="mdi:delete" class="w-5 h-5" /></button>
                  </div>
                </div>
                <p v-if="expenseCategories.length === 0" class="text-sm text-gray-400 pl-4">Nenhuma categoria de despesa.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Coluna de Subcategorias -->
        <div class="bg-white rounded-lg shadow-md p-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-semibold text-gray-800">Subcategorias</h2>
            <button
              v-if="selectedCategory"
              @click="openCreateSubcategoryModal"
              class="flex items-center py-2 px-4 rounded-lg text-white bg-green-600 hover:bg-green-700 shadow"
            >
              <Icon name="mdi:plus" class="w-5 h-5 mr-2" />
              Nova
            </button>
          </div>

          <div v-if="!selectedCategory" class="text-center py-8">
            <Icon name="mdi:arrow-left-circle-outline" class="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-500">Selecione uma categoria para ver suas subcategorias</p>
          </div>

          <div v-else-if="selectedCategory.subcategories?.length === 0" class="text-center py-8">
            <Icon name="mdi:tag-outline" class="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p class="text-gray-500">Nenhuma subcategoria encontrada</p>
            <p class="text-sm text-gray-400 mt-2">Clique em "Nova" para adicionar</p>
          </div>

          <div v-else class="space-y-2">
            <div class="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p class="text-sm text-gray-600">Categoria:</p>
              <p class="font-semibold text-purple-700">{{ selectedCategory.name }}</p>
            </div>

            <div
              v-for="sub in selectedCategory.subcategories"
              :key="sub.id"
              class="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div class="flex items-center">
                <Icon name="mdi:tag" class="w-5 h-5 text-green-600 mr-3" />
                <span class="font-medium text-gray-900">
                  {{ sub.name }}
                  <span v-if="sub.isSystem" class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Sistema</span>
                </span>
              </div>
              <!-- Subcategorias do sistema não podem ser editadas ou excluídas -->
              <div v-if="!sub.isSystem" class="flex space-x-2">
                <button
                  @click="editSubcategory(sub)"
                  class="text-blue-600 hover:text-blue-900"
                >
                  <Icon name="mdi:pencil" class="w-5 h-5" />
                </button>
                <button
                  @click="requestDeleteSubcategory(sub)"
                  class="text-red-600 hover:text-red-900"
                >
                  <Icon name="mdi:delete" class="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Categoria -->
    <div v-if="showCategoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-2xl font-semibold mb-6">
          {{ editingCategory ? 'Editar Categoria' : 'Nova Categoria' }}
        </h3>

        <form @submit.prevent="handleCategorySubmit" class="space-y-4">
          <div>
            <label for="category-name" class="text-sm font-medium text-gray-700">Nome da Categoria</label>
            <input
              id="category-name"
              v-model="categoryForm.name"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Ex: Alimentação"
              required
            />
          </div>

          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

          <div class="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              @click="closeCategoryModal"
              class="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="py-2 px-4 border border-transparent rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
            >
              {{ submitting ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Subcategoria -->
    <div v-if="showSubcategoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-2xl font-semibold mb-6">
          {{ editingSubcategory ? 'Editar Subcategoria' : 'Nova Subcategoria' }}
        </h3>

        <form @submit.prevent="handleSubcategorySubmit" class="space-y-4">
          <div>
            <label class="text-sm font-medium text-gray-700">Categoria</label>
            <input
              :value="selectedCategory?.name"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
              disabled
            />
          </div>

          <div>
            <label class="text-sm font-medium text-gray-700">Nome da Subcategoria</label>
            <input
              v-model="subcategoryForm.name"
              type="text"
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              placeholder="Ex: Restaurante"
              required
            />
          </div>

          <p v-if="error" class="text-sm text-red-500">{{ error }}</p>

          <div class="flex justify-end pt-4 space-x-3">
            <button
              type="button"
              @click="closeSubcategoryModal"
              class="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="submitting"
              class="py-2 px-4 border border-transparent rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {{ submitting ? 'Salvando...' : 'Salvar' }}
            </button>
          </div>
        </form>
      </div>
    </div>


    <!-- Modal de Confirmação -->
    <ConfirmModal
      :is-open="showConfirmModal"
      :title="confirmTitle"
      :message="confirmMessage"
      confirm-text="Excluir"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="closeConfirmModal"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'student'
})

const { token } = useAuth()
const loading = ref(true)
const showCategoryModal = ref(false)
const showSubcategoryModal = ref(false)
const submitting = ref(false)
const error = ref('')

const categories = ref<any[]>([])
const selectedCategory = ref<any | null>(null)
const editingCategory = ref<any | null>(null)
const editingSubcategory = ref<any | null>(null)

// Estado do modal de confirmação
const showConfirmModal = ref(false)
const confirmTitle = ref('')
const confirmMessage = ref('')
const itemToDelete = ref<{ type: 'category' | 'subcategory', id: string } | null>(null)

const categoryForm = ref({
  name: ''
})

const subcategoryForm = ref({
  name: ''
})

// Propriedade computada para facilitar o loop das categorias disponíveis
const expenseCategories = computed(() => categories.value)

const getCategoryClass = (category: any) => {
  return [
    'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
    selectedCategory.value?.id === category.id
      ? 'bg-purple-100 border-2 border-purple-500'
      : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
  ]
}

const fetchData = async () => {
  loading.value = true
  try {
    const data = await $fetch('/api/student/categories', {
      headers: { Authorization: `Bearer ${token.value}` }
    })

    categories.value = data as any[]

    if (selectedCategory.value) {
      const updated = categories.value.find(c => c.id === selectedCategory.value.id)
      selectedCategory.value = updated || null
    }
  } catch (err) {
    console.error('Erro ao buscar categorias:', err)
  } finally {
    loading.value = false
  }
}

const selectCategory = (category: any) => {
  selectedCategory.value = category
}

// Categoria
const openCreateCategoryModal = () => {
  editingCategory.value = null
  categoryForm.value = { name: '' }
  showCategoryModal.value = true
}

const editCategory = (category: any) => {
  editingCategory.value = category
  categoryForm.value = { name: category.name }
  showCategoryModal.value = true
}

const handleCategorySubmit = async () => {
  error.value = ''
  submitting.value = true

  try {
    if (editingCategory.value) {
      await $fetch(`/api/student/categories/${editingCategory.value.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body: categoryForm.value
      })
    } else {
      await $fetch('/api/student/categories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: categoryForm.value
      })
    }

    closeCategoryModal()
    await fetchData()
  } catch (err: any) {
    error.value = err.data?.message || 'Erro ao salvar categoria'
  } finally {
    submitting.value = false
  }
}

const requestDeleteCategory = (category: any) => {
  itemToDelete.value = { type: 'category', id: category.id }
  confirmTitle.value = 'Excluir Categoria'
  confirmMessage.value = `Tem certeza que deseja remover a categoria "${category.name}"? Todas as subcategorias e transações relacionadas serão afetadas.`
  showConfirmModal.value = true
}

const deleteCategory = async (id: string) => {
  try {
    await $fetch(`/api/student/categories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })

    if (selectedCategory.value?.id === id) {
      selectedCategory.value = null
    }

    await fetchData()
  } catch (err: any) {
    alert(err.data?.message || 'Erro ao remover categoria')
  }
}

const closeCategoryModal = () => {
  showCategoryModal.value = false
  editingCategory.value = null
  categoryForm.value = { name: '' }
  error.value = ''
}

// Subcategoria
const openCreateSubcategoryModal = () => {
  editingSubcategory.value = null
  subcategoryForm.value = { name: '' }
  showSubcategoryModal.value = true
}

const editSubcategory = (subcategory: any) => {
  editingSubcategory.value = subcategory
  subcategoryForm.value = { name: subcategory.name }
  showSubcategoryModal.value = true
}

const handleSubcategorySubmit = async () => {
  error.value = ''
  submitting.value = true

  try {
    if (editingSubcategory.value) {
      await $fetch(`/api/student/subcategories/${editingSubcategory.value.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token.value}` },
        body: subcategoryForm.value
      })
    } else {
      await $fetch('/api/student/subcategories', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token.value}` },
        body: {
          ...subcategoryForm.value,
          categoryId: selectedCategory.value.id
        }
      })
    }

    closeSubcategoryModal()
    await fetchData()
  } catch (err: any) {
    error.value = err.data?.message || 'Erro ao salvar subcategoria'
  } finally {
    submitting.value = false
  }
}

const requestDeleteSubcategory = (subcategory: any) => {
  itemToDelete.value = { type: 'subcategory', id: subcategory.id }
  confirmTitle.value = 'Excluir Subcategoria'
  confirmMessage.value = `Tem certeza que deseja remover a subcategoria "${subcategory.name}"? Todas as transações relacionadas serão afetadas.`
  showConfirmModal.value = true
}

const deleteSubcategory = async (id: string) => {
  try {
    await $fetch(`/api/student/subcategories/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token.value}` }
    })

    await fetchData()
  } catch (err: any) {
    alert(err.data?.message || 'Erro ao remover subcategoria')
  }
}

const confirmDelete = async () => {
  if (!itemToDelete.value) return

  if (itemToDelete.value.type === 'category') {
    await deleteCategory(itemToDelete.value.id)
  } else {
    await deleteSubcategory(itemToDelete.value.id)
  }
  
  closeConfirmModal()
}

const closeConfirmModal = () => {
  showConfirmModal.value = false
  itemToDelete.value = null
}

const closeSubcategoryModal = () => {
  showSubcategoryModal.value = false
  editingSubcategory.value = null
  subcategoryForm.value = { name: '' }
  error.value = ''
}

onMounted(() => {
  fetchData()
})
</script>
