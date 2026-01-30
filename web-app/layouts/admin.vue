<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Mobile Top Bar -->
    <div class="bg-gray-900 text-gray-100 flex justify-between md:hidden fixed top-0 left-0 right-0 z-40 safe-top">
      <div class="p-4 pt-6">
        <div class="flex items-center gap-2">
          <img src="/logosa.png" alt="Educa.SA" class="h-8 w-auto" />
          <h2 class="text-xl font-bold">Educa.SA</h2>
        </div>
        <p class="text-xs text-gray-400">Painel Administrativo</p>
      </div>
      <button @click="sidebarOpen = !sidebarOpen" class="p-4 pt-6 focus:outline-none focus:bg-gray-800">
        <Icon name="mdi:menu" class="h-6 w-6" />
      </button>
    </div>

    <!-- Backdrop -->
    <div
      v-if="sidebarOpen"
      @click="sidebarOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
    ></div>

    <!-- Sidebar -->
    <aside
      :class="[
        'fixed top-0 left-0 w-64 h-screen bg-gray-900 text-gray-300 flex flex-col z-50 transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <!-- Close button (mobile only) -->
      <button
        @click="sidebarOpen = false"
        class="absolute top-4 right-4 text-gray-400 hover:text-white md:hidden"
      >
        <Icon name="mdi:close" class="w-6 h-6" />
      </button>

      <div class="px-4 py-7 pt-20 md:pt-7">
        <div class="hidden md:block">
          <img src="/logosa.png" alt="Educa.SA Logo" class="h-16 w-auto object-contain" />
        </div>
        <p class="text-xs text-gray-400 mt-1 hidden md:block">Painel Administrativo</p>
      </div>

      <nav class="flex-1 px-2 overflow-y-auto">
        <NuxtLink
          to="/admin"
          exact
          @click="sidebarOpen = false"
          class="flex items-center px-4 py-3 hover:bg-gray-700 rounded-md transition-colors"
          active-class="bg-gray-700 text-white"
        >
          <Icon name="mdi:view-dashboard" class="w-5 h-5 mr-3" />
          Dashboard
        </NuxtLink>
        <NuxtLink
          to="/admin/turmas"
          @click="sidebarOpen = false"
          class="flex items-center px-4 py-3 mt-2 hover:bg-gray-700 rounded-md transition-colors"
          active-class="bg-gray-700 text-white"
        >
          <Icon name="mdi:account-group" class="w-5 h-5 mr-3" />
          Turmas
        </NuxtLink>
        <NuxtLink
          to="/admin/alunos"
          @click="sidebarOpen = false"
          class="flex items-center px-4 py-3 mt-2 hover:bg-gray-700 rounded-md transition-colors"
          active-class="bg-gray-700 text-white"
        >
          <Icon name="mdi:account" class="w-5 h-5 mr-3" />
          Alunos
        </NuxtLink>
        <NuxtLink
          to="/admin/external-users"
          @click="sidebarOpen = false"
          class="flex items-center px-4 py-3 mt-2 hover:bg-gray-700 rounded-md transition-colors"
          active-class="bg-gray-700 text-white"
        >
          <Icon name="mdi:account-multiple" class="w-5 h-5 mr-3" />
          Usuários Externos
        </NuxtLink>
        <NuxtLink
          to="/admin/settings"
          @click="sidebarOpen = false"
          class="flex items-center px-4 py-3 mt-2 hover:bg-gray-700 rounded-md transition-colors"
          active-class="bg-gray-700 text-white"
        >
          <Icon name="mdi:cog" class="w-5 h-5 mr-3" />
          Configurações
        </NuxtLink>
      </nav>

      <div class="p-4">
        <button
          @click="handleLogout"
          class="flex items-center justify-center w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium text-white transition-colors"
        >
          <Icon name="mdi:logout" class="w-5 h-5 mr-2" />
          Sair
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="md:ml-64 p-4 md:p-8 overflow-y-auto pt-28 md:pt-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const { logout } = useAuth()

const sidebarOpen = ref(false)

const handleLogout = () => {
  logout()
}
</script>
