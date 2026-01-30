<template>
  <div class="min-h-screen bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Teste de Integração com Sentry</h1>
      
      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Status do Sentry</h2>
        <div class="space-y-2">
          <p class="text-sm">
            <span class="font-medium">DSN Configurado:</span> 
            <span :class="sentryStatus.dsn ? 'text-green-600' : 'text-red-600'">
              {{ sentryStatus.dsn ? 'Sim' : 'Não' }}
            </span>
          </p>
          <p class="text-sm">
            <span class="font-medium">Ambiente:</span> 
            <span class="text-blue-600">{{ sentryStatus.environment }}</span>
          </p>
          <p class="text-sm">
            <span class="font-medium">Sentry Disponível:</span> 
            <span :class="sentryStatus.available ? 'text-green-600' : 'text-red-600'">
              {{ sentryStatus.available ? 'Sim' : 'Não' }}
            </span>
          </p>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Testes de Erro</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            @click="testJavaScriptError"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Testar Erro JavaScript
          </button>
          
          <button
            @click="testAsyncError"
            class="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
          >
            Testar Erro Assíncrono
          </button>
          
          <button
            @click="testApiError"
            class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Testar Erro de API
          </button>
          
          <button
            @click="testCustomError"
            class="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
          >
            Testar Erro Customizado
          </button>
          
          <button
            @click="testBreadcrumb"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Testar Breadcrumb
          </button>
          
          <button
            @click="testUserContext"
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Testar Contexto de Usuário
          </button>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">Logs do Teste</h2>
        <div class="bg-gray-100 rounded p-4 h-64 overflow-y-auto">
          <div v-if="logs.length === 0" class="text-gray-500 text-sm">
            Nenhum log ainda. Execute um teste acima.
          </div>
          <div v-for="(log, index) in logs" :key="index" class="mb-2 text-sm">
            <span class="text-gray-600">{{ log.timestamp }}</span>
            <span :class="getLogClass(log.type)" class="ml-2">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { Logger } = useLogger()
const { user } = useAuth()

const sentryStatus = ref({
  dsn: false,
  environment: 'unknown',
  available: false
})

const logs = ref<Array<{
  timestamp: string
  message: string
  type: 'info' | 'error' | 'success'
}>>([])

function addLog(message: string, type: 'info' | 'error' | 'success' = 'info') {
  logs.value.unshift({
    timestamp: new Date().toLocaleTimeString(),
    message,
    type
  })
}

function getLogClass(type: string) {
  switch (type) {
    case 'error': return 'text-red-600'
    case 'success': return 'text-green-600'
    default: return 'text-blue-600'
  }
}

function checkSentryStatus() {
  const config = useRuntimeConfig()
  
  sentryStatus.value = {
    dsn: !!config.sentry?.dsn,
    environment: config.sentry?.environment || 'unknown',
    available: process.client && !!(window as any).Sentry
  }
}

function testJavaScriptError() {
  addLog('Disparando erro JavaScript...', 'info')
  
  try {
    // Força um erro JavaScript
    const obj = null as any
    obj.someProperty.someMethod()
  } catch (error) {
    Logger.error(error as Error, {
      testType: 'javascript_error',
      timestamp: new Date().toISOString()
    })
    addLog('Erro JavaScript capturado e enviado para o Sentry', 'success')
  }
}

function testAsyncError() {
  addLog('Disparando erro assíncrono...', 'info')
  
  // Simula um erro assíncrono
  setTimeout(() => {
    try {
      throw new Error('Este é um erro assíncrono de teste')
    } catch (error) {
      Logger.error(error as Error, {
        testType: 'async_error',
        timestamp: new Date().toISOString()
      })
      addLog('Erro assíncrono capturado e enviado para o Sentry', 'success')
    }
  }, 1000)
}

async function testApiError() {
  addLog('Disparando erro de API...', 'info')
  
  try {
    // Tenta acessar uma API que não existe
    await $fetch('/api/non-existent-endpoint', {
      headers: {
        Authorization: `Bearer fake-token`
      }
    })
  } catch (error) {
    Logger.apiError(error, '/api/non-existent-endpoint', 'GET')
    addLog('Erro de API capturado e enviado para o Sentry', 'success')
  }
}

function testCustomError() {
  addLog('Disparando erro customizado...', 'info')
  
  const customError = new Error('Este é um erro customizado de teste')
  customError.name = 'CustomTestError'
  
  Logger.error(customError, {
    testType: 'custom_error',
    feature: 'sentry_testing',
    severity: 'high',
    timestamp: new Date().toISOString()
  })
  
  addLog('Erro customizado capturado e enviado para o Sentry', 'success')
}

function testBreadcrumb() {
  addLog('Adicionando breadcrumbs...', 'info')
  
  Logger.info('Iniciando processo de teste', { step: 1 })
  Logger.info('Validando dados', { step: 2 })
  Logger.info('Processando requisição', { step: 3 })
  Logger.warn('Alerta durante o processo', { step: 4, warning: true })
  
  addLog('Breadcrumbs adicionados com sucesso', 'success')
}

function testUserContext() {
  addLog('Configurando contexto de usuário...', 'info')
  
  if (user.value) {
    Logger.setUser(user.value)
    Logger.setTag('test_session', 'sentry_integration_test')
    Logger.setContext('test_environment', {
      feature: 'sentry_testing',
      userRole: user.value.role,
      testTimestamp: new Date().toISOString()
    })
    
    addLog(`Contexto de usuário configurado: ${user.value.name} (${user.value.role})`, 'success')
  } else {
    // Cria um usuário de teste
    const testUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'TEST'
    }
    
    Logger.setUser(testUser)
    Logger.setTag('test_session', 'sentry_integration_test')
    Logger.setContext('test_environment', {
      feature: 'sentry_testing',
      userRole: testUser.role,
      testTimestamp: new Date().toISOString()
    })
    
    addLog(`Contexto de usuário de teste configurado: ${testUser.name} (${testUser.role})`, 'success')
  }
}

onMounted(() => {
  checkSentryStatus()
  addLog('Página de teste carregada', 'info')
})
</script>