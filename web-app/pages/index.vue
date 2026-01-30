<template>
  <div class="flex items-center justify-center min-h-screen">
    <p>Redirecionando...</p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

const { isAuthenticated, isAdmin } = useAuth()

onMounted(() => {
  if (isAuthenticated.value) {
    navigateTo(isAdmin.value ? '/admin' : '/dashboard')
  } else {
    navigateTo('/login')
  }
})
</script>
