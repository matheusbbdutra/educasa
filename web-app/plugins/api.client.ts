export default defineNuxtPlugin(() => {
  const { token } = useAuth()

  // Intercepta todas as requisições $fetch para adicionar o token
  const api = $fetch.create({
    onRequest({ options }) {
      if (token.value && process.client) {
        options.headers = options.headers || {}
        // @ts-ignore
        options.headers.Authorization = `Bearer ${token.value}`
      }
    }
  })

  return {
    provide: {
      api
    }
  }
})
