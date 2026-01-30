<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    @click.self="closeModal"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
      <!-- Header -->
      <div class="flex justify-between items-center mb-6">
        <h3 class="text-xl font-semibold text-gray-900">Exportar Dados</h3>
        <button
          @click="closeModal"
          class="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="space-y-4">
        <!-- Histórico completo -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p class="text-sm text-blue-800">
            <span class="font-medium">ℹ️ Histórico Completo</span><br>
            Esta exportação incluirá <strong>todas</strong> as suas transações
            desde o início, sem filtro de período.
          </p>
        </div>

        <!-- Opção de download/email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Como deseja receber os dados?
          </label>

          <div class="space-y-2">
            <label
              class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="exportType === 'download' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="exportType"
                value="download"
                class="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span class="font-medium text-gray-900">📥 Baixar arquivo CSV</span>
                <p class="text-sm text-gray-500">Download imediato no navegador</p>
              </div>
            </label>

            <label
              class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="exportType === 'email' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'"
            >
              <input
                type="radio"
                v-model="exportType"
                value="email"
                class="mr-3 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span class="font-medium text-gray-900">📧 Enviar por email</span>
                <p class="text-sm text-gray-500">Receber no email administrativo configurado</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Consentimento para exportação automática (só aparece se email) -->
        <div v-if="exportType === 'email'" class="bg-gray-50 rounded-lg p-4">
          <label class="flex items-start cursor-pointer">
            <input
              type="checkbox"
              v-model="autoExportConsent"
              class="mt-1 mr-3 text-blue-600 focus:ring-blue-500 rounded"
            />
            <div>
              <span class="font-medium text-gray-900">🗓️ Exportação automática mensal</span>
              <p class="text-sm text-gray-600 mt-1">
                Ao marcar esta opção, autorizo o sistema a enviar automaticamente
                meu histórico completo por email no fechamento de cada mês.
              </p>
              <p class="text-xs text-gray-500 mt-2">
                Você poderá revogar este consentimento a qualquer momento nas configurações.
              </p>
            </div>
          </label>
        </div>

        <!-- Aviso caso não consentiu -->
        <div v-if="exportType === 'email' && !autoExportConsent"
             class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p class="text-sm text-yellow-800">
            <span class="font-medium">⚠️ Exportação Manual</span><br>
            Você optou por <strong>não</strong> autorizar a exportação automática.
            Seus dados só serão enviados quando você solicitar manualmente.
          </p>
        </div>

        <!-- Mensagem de erro -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-sm text-red-800">{{ errorMessage }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex gap-3 mt-6">
        <button
          @click="closeModal"
          :disabled="isExporting"
          class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          Cancelar
        </button>
        <button
          @click="handleExport"
          :disabled="isExporting"
          class="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
        >
          <svg v-if="isExporting" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ isExporting ? 'Processando...' : exportType === 'download' ? 'Baixar CSV' : (autoExportConsent ? 'Salvar' : 'Enviar por Email') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  isOpen: boolean
  autoExportConsentValue?: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'export', data: { type: 'download' | 'email', consent?: boolean }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Estados
const exportType = ref<'download' | 'email'>('download')
const autoExportConsent = ref(false)
const isExporting = ref(false)
const errorMessage = ref('')

// Fechar modal
const closeModal = () => {
  console.log('closeModal', isExporting.value)
  if (!isExporting.value) {
    resetForm()
    emit('close')
  }
}

// Resetar formulário
const resetForm = () => {
  const hasConsent = props.autoExportConsentValue || false
  autoExportConsent.value = hasConsent
  // Se já tem consentimento, carrega com email selecionado, senão começa com download
  exportType.value = hasConsent ? 'email' : 'download'
  errorMessage.value = ''
  isExporting.value = false
}

// Exportar dados
const handleExport = async () => {
  try {
    isExporting.value = true
    errorMessage.value = ''

    // Se optou por email, incluir o consentimento
    const consent = exportType.value === 'email' ? autoExportConsent.value : undefined

    // Emitir evento de exportação
    emit('export', {
      type: exportType.value,
      consent
    })

    // Aguardar um pouco antes de fechar (para dar feedback visual)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Fechar modal após exportação
    closeModal()
  } catch (error) {
    console.error('Erro ao exportar:', error)
    errorMessage.value = 'Erro ao processar solicitação. Tente novamente.'
  } finally {
    isExporting.value = false
  }
}

// Inicializar quando o modal abrir
watch(() => props.isOpen, (newValue) => {
  if (newValue) {
    resetForm()
  }
})

// Atualizar consentimento quando a prop mudar
watch(() => props.autoExportConsentValue, (newValue) => {
  if (newValue !== undefined) {
    autoExportConsent.value = newValue
  }
})
</script>
