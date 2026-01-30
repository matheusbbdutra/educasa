export default defineNuxtPlugin(async () => {
  const { initAuth } = useAuth()

  // Inicializa auth do localStorage antes de qualquer navegação
  await initAuth()
})
