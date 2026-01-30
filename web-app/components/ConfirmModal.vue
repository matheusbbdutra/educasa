<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="onCancel"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-fade-in">
      <!-- Header -->
      <div class="flex items-start mb-4">
        <div
          class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
          :class="iconBackgroundClass"
        >
          <Icon :name="iconName" class="w-6 h-6" :class="iconClass" />
        </div>
        <div class="ml-4 flex-1">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ title }}
          </h3>
          <p class="text-sm text-gray-600 mt-1">
            {{ message }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex gap-3 mt-6">
        <button
          @click="onCancel"
          :disabled="isLoading"
          class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ cancelText }}
        </button>
        <button
          @click="onConfirm"
          :disabled="isLoading"
          class="flex-1 px-4 py-2 rounded-lg transition-all font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          :class="confirmButtonClass"
        >
          <svg
            v-if="isLoading"
            class="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isLoading ? 'Processando...' : confirmText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirmar ação',
  message: 'Tem certeza que deseja continuar?',
  confirmText: 'Confirmar',
  cancelText: 'Cancelar',
  variant: 'danger'
})

const emit = defineEmits<Emits>()

const isLoading = ref(false)

const iconName = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'mdi:alert-circle'
    case 'warning':
      return 'mdi:alert'
    case 'info':
      return 'mdi:information'
    default:
      return 'mdi:alert-circle'
  }
})

const iconClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'text-red-600'
    case 'warning':
      return 'text-yellow-600'
    case 'info':
      return 'text-blue-600'
    default:
      return 'text-red-600'
  }
})

const iconBackgroundClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-100'
    case 'warning':
      return 'bg-yellow-100'
    case 'info':
      return 'bg-blue-100'
    default:
      return 'bg-red-100'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-600 hover:bg-red-700 text-white'
    case 'warning':
      return 'bg-yellow-600 hover:bg-yellow-700 text-white'
    case 'info':
      return 'bg-blue-600 hover:bg-blue-700 text-white'
    default:
      return 'bg-red-600 hover:bg-red-700 text-white'
  }
})

const onConfirm = () => {
  if (!isLoading.value) {
    emit('confirm')
  }
}

const onCancel = () => {
  if (!isLoading.value) {
    emit('cancel')
  }
}

// Fechar modal com ESC
const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.isOpen && !isLoading.value) {
    onCancel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
})

// Observar mudanças no prop isOpen para resetar loading
watch(() => props.isOpen, (newValue) => {
  if (!newValue) {
    isLoading.value = false
  }
})
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
