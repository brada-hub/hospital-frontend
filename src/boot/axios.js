import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { useUserStore } from 'stores/user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // Ej: http://localhost:8000/api
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ✅ Interceptor para añadir token a las solicitudes
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 📌 Interceptor para manejar respuestas del servidor
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, no hacemos nada.
    return response
  },
  async (error) => {
    // CAMBIADO: Se añade una condición para evitar el bucle de logout.
    // Solo se ejecuta el logout si el error 401 NO vino de la ruta '/logout'.
    if (error.response?.status === 401 && !error.config.url.endsWith('/logout')) {
      console.error('Sesión expirada. Redirigiendo al login.')
      const userStore = useUserStore()
      // Es importante que el store esté disponible, puede que necesites
      // inicializarlo fuera si hay problemas de contexto.
      await userStore.logout()
    }
    // Rechazamos la promesa para que el error pueda ser manejado por el componente que hizo la llamada
    return Promise.reject(error)
  },
)

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
