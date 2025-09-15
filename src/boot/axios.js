// src/boot/axios.js
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
    // Si la respuesta tiene un error y el código de estado es 401 (Unauthorized)
    if (error.response?.status === 401) {
      console.error('Sesión expirada. Redirigiendo al login.')
      // Importamos el store del usuario para usar su acción de logout
      const userStore = useUserStore()
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
