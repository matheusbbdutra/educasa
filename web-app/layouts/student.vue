<template>
  <div class="relative min-h-screen">
    <!-- Mobile menu button -->
    <div class="bg-white text-gray-800 flex justify-between md:hidden border-b fixed top-0 left-0 right-0 z-40 safe-top">
      <div class="p-4 pt-6">
        <h2 class="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          💰 Educa.SA
        </h2>
      </div>
      <button @click="isSidebarOpen = !isSidebarOpen" class="p-4 pt-6 focus:outline-none focus:bg-gray-100">
        <Icon name="mdi:menu" class="h-6 w-6" />
      </button>
    </div>

    <!-- Sidebar -->
    <aside
      :class="[
        'bg-white w-64 py-7 px-2 flex flex-col fixed top-0 left-0 h-screen transform transition-transform duration-200 ease-in-out shadow-lg z-50 md:z-30',
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      ]"
    >
      <div class="px-4">
        <h2 class="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden md:block">
          💰 Educa.SA
        </h2>
      </div>
      <nav class="mt-6 flex-1 overflow-y-auto">
        <NuxtLink
          to="/dashboard"
          class="flex items-center px-4 py-3 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
          active-class="bg-blue-50 text-blue-600"
          @click="isSidebarOpen = false"
        >
          <Icon name="mdi:view-dashboard" class="w-5 h-5 mr-3" />
          Dashboard
        </NuxtLink>
        <NuxtLink
          to="/transactions"
          class="flex items-center px-4 py-3 mt-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
          active-class="bg-blue-50 text-blue-600"
          @click="isSidebarOpen = false"
        >
          <Icon name="mdi:receipt" class="w-5 h-5 mr-3" />
          Transações
        </NuxtLink>
        <NuxtLink
          to="/categories"
          class="flex items-center px-4 py-3 mt-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
          active-class="bg-blue-50 text-blue-600"
          @click="isSidebarOpen = false"
        >
          <Icon name="mdi:format-list-bulleted" class="w-5 h-5 mr-3" />
          Categorias
        </NuxtLink>
        <NuxtLink
          to="/settings"
          class="flex items-center px-4 py-3 mt-2 text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-md"
          active-class="bg-blue-50 text-blue-600"
          @click="isSidebarOpen = false"
        >
          <Icon name="mdi:cog" class="w-5 h-5 mr-3" />
          Configurações
        </NuxtLink>
      </nav>
      <div class="p-4">
        <button
          @click="handleLogout"
          class="flex items-center justify-center w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Icon name="mdi:logout" class="w-5 h-5 mr-2" />
          Sair
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="p-4 md:p-8 md:ml-64 pt-28 md:pt-8 overflow-y-auto bg-gray-100 min-h-screen">
      <slot />
    </main>

    <!-- Backdrop -->
    <div
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 bg-black opacity-50 z-40 md:hidden"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const { logout } = useAuth()
const isSidebarOpen = ref(false)

const handleLogout = () => {
  logout()
}
</script>
