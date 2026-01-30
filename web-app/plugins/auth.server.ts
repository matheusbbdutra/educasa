export default defineNuxtPlugin(async (nuxtApp) => {
  const { user } = useAuth()

  // On server, user is populated from the server middleware
  const event = nuxtApp.ssrContext?.event
  if (event && event.context.user) {
    user.value = event.context.user
  }
})
