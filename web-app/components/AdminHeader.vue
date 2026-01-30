<template>
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <h1 class="text-xl font-semibold text-gray-900">{{ title }}</h1>

        <nav class="flex space-x-4">
          <NuxtLink
            to="/admin"
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            :class="{ 'bg-blue-100 text-blue-700': $route.path === '/admin' }"
          >
            Dashboard
          </NuxtLink>
          <NuxtLink
            to="/admin/alunos"
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            :class="{ 'bg-blue-100 text-blue-700': $route.path === '/admin/alunos' }"
          >
            Alunos
          </NuxtLink>
          <NuxtLink
            to="/admin/turmas"
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            :class="{ 'bg-blue-100 text-blue-700': $route.path === '/admin/turmas' }"
          >
            Turmas
          </NuxtLink>
          <NuxtLink
            to="/admin/external-users"
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            :class="{ 'bg-blue-100 text-blue-700': $route.path === '/admin/external-users' }"
          >
            Usuários Externos
          </NuxtLink>
          <NuxtLink
            to="/admin/settings"
            class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            :class="{ 'bg-blue-100 text-blue-700': $route.path === '/admin/settings' }"
          >
            Configurações
          </NuxtLink>
        </nav>

        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-700">{{ user?.name }}</span>
          <button
            @click="logout"
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const props = defineProps<{
  title: string
}>()

const { user, logout } = useAuth()
</script>