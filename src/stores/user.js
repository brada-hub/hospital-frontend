// src/stores/user.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

export const useUserStore = defineStore('user', () => {
  const router = useRouter()
  const $q = useQuasar()

  // Estado
  const user = ref(null)
  const token = ref(null)
  const hospital = ref(null)
  const loading = ref(false)
  const inactivityTimer = ref(null)
  const countdownTimer = ref(null)
  const inactivityLimit = 15 * 60 * 1000 // 15 min

  // =========================
  // Getters
  // =========================
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // =========================
  // Acciones
  // =========================
  // 📌 CORRECCIÓN: hasPermission ahora es una función directa del store
  const hasPermission = (permission) => {
    const currentUser = user.value
    // Verificación defensiva antes de acceder a propiedades
    if (!currentUser) {
      return false
    }

    // 1. Verificar permisos individuales del usuario
    const userPermission = currentUser.permissions?.find((p) => p.nombre === permission)
    if (userPermission) {
      return userPermission.pivot.estado === 'permitido'
    }

    // 2. Si no hay permiso individual, verificar permisos del rol
    const rolePermissions = currentUser.rol?.permissions || []
    return rolePermissions.some((p) => p.nombre === permission)
  }

  const login = async (email, password) => {
    loading.value = true
    try {
      const { data } = await api.post('/login', { email, password })

      token.value = data.access_token
      user.value = data.user
      hospital.value = data.user.hospital

      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      localStorage.setItem('hospital', JSON.stringify(hospital.value))

      api.defaults.headers.common.Authorization = `Bearer ${token.value}`

      initInactivityWatcher()

      router.push('/dashboard')

      return true
    } catch (err) {
      logout()
      throw err.response?.data?.message || 'Error en login'
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      if (token.value) {
        await api.post('/logout', {}, { headers: { Authorization: `Bearer ${token.value}` } })
      }
    } catch {
      // ignorar error
    }

    user.value = null
    token.value = null
    hospital.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('hospital')
    delete api.defaults.headers.common.Authorization

    clearTimeout(inactivityTimer.value)
    clearInterval(countdownTimer.value)

    router.push('/login')
  }

  const loadUser = () => {
    const localToken = localStorage.getItem('token')
    const localUser = localStorage.getItem('user')
    const localHospital = localStorage.getItem('hospital')

    if (localToken && localUser && localHospital) {
      try {
        token.value = localToken
        user.value = JSON.parse(localUser)
        hospital.value = JSON.parse(localHospital)
        api.defaults.headers.common.Authorization = `Bearer ${localToken}`
        initInactivityWatcher()
      } catch (e) {
        console.error('Error parsing localStorage:', e)
        logout()
      }
    } else {
      logout()
    }
  }

  // =========================
  // 🔒 Inactividad
  // =========================
  const initInactivityWatcher = () => {
    clearTimeout(inactivityTimer.value)
    clearInterval(countdownTimer.value)

    window.addEventListener('mousemove', resetInactivityTimer)
    window.addEventListener('keydown', resetInactivityTimer)
    window.addEventListener('click', resetInactivityTimer)

    resetInactivityTimer()
  }

  const resetInactivityTimer = () => {
    clearTimeout(inactivityTimer.value)
    clearInterval(countdownTimer.value)

    inactivityTimer.value = setTimeout(() => {
      startCountdown()
    }, inactivityLimit - 5000)
  }

  const startCountdown = () => {
    let secondsLeft = 5

    const notif = $q.notify({
      message: `Se cerrará sesión en ${secondsLeft} segundos por inactividad`,
      color: 'red',
      timeout: 0,
      actions: [
        {
          label: 'Mantener sesión',
          color: 'white',
          handler: () => {
            resetInactivityTimer()
          },
        },
      ],
    })

    countdownTimer.value = setInterval(() => {
      secondsLeft--
      notif({
        message: `Se cerrará sesión en ${secondsLeft} segundos por inactividad`,
      })

      if (secondsLeft <= 0) {
        clearInterval(countdownTimer.value)
        logout()
      }
    }, 1000)
  }

  return {
    user,
    token,
    hospital,
    loading,
    inactivityTimer,
    countdownTimer,
    isLoggedIn,
    hasPermission, // 📌 Ahora es una función normal
    login,
    logout,
    loadUser,
  }
})
