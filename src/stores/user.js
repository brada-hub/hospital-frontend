import { defineStore } from 'pinia'
import { api } from 'boot/axios'
// import axios from 'axios' // ✅ Importar axios para CSRF (ELIMINADO: Usamos Token)
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import routesConfig from 'src/router/routes'

export const useUserStore = defineStore('user', () => {
  const router = useRouter()
  const $q = useQuasar()

  // Estado
  const user = ref(null)
  const token = ref(null)
  const hospital = ref(null)
  const loading = ref(false)

  // Evitar cargas concurrentes
  let loadUserPromise = null

  // Inactividad
  const inactivityTimer = ref(null)
  const countdownTimer = ref(null)
  const inactivityLimit = 15 * 60 * 1000 // 15 min
  const countdownSeconds = 5

  // Getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // Permisos
  const hasPermission = (permission) => {
    if (!user.value) return false

    // 1. Revisa si el usuario tiene un permiso directo (permitido/denegado). Esto tiene prioridad.
    const userPerm = (user.value.permissions || []).find((p) => p.nombre === permission)
    if (userPerm) {
      return userPerm.pivot?.estado === 'permitido'
    }

    // 2. Si no hay permiso directo, revisa si el rol del usuario tiene el permiso.
    const rolePerms = user.value.rol?.permissions || []

    // CAMBIADO: La lógica ahora es más simple y correcta.
    // Simplemente comprueba si un permiso con ese nombre existe en la lista del rol.
    return rolePerms.some((p) => p.nombre === permission)
  }

  // Encontrar primera ruta accesible
  const findFirstAccessibleRoute = () => {
    if (!user.value) return { name: 'AccessDenied' }

    const mainRoutes = routesConfig.find((r) => r.path === '/')?.children || []

    const findInList = (list) => {
      for (const route of list) {
        if (route.name && route.meta?.permission && hasPermission(route.meta.permission))
          return { name: route.name }
        if (route.children?.length) {
          const found = findInList(route.children)
          if (found) return found
        }
      }
      return null
    }

    return findInList(mainRoutes) || { name: 'AccessDenied' }
  }

  // --------------------------
  // Auth actions
  // --------------------------
  const login = async (email, password) => {
    loading.value = true
    try {
      // 🔐 PASO 1: Obtener CSRF cookie de Sanctum (sin /api)
      // 🔐 PASO 1: (ELIMINADO) No usamos Cookies en Cross-Domain. Usamos Token.
      // await axios.get(...)

      // 🔐 PASO 2: Hacer login con las credenciales
      const { data } = await api.post('/login', { email, password })

      if (data.user.estado === 0) {
        throw 'Tu cuenta está desactivada. Contacta al administrador.'
      }

      token.value = data.access_token
      user.value = data.user
      hospital.value = data.user.hospital

      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      localStorage.setItem('hospital', JSON.stringify(hospital.value))

      api.defaults.headers.common.Authorization = `Bearer ${token.value}`

      initInactivityWatcher()

      const destination = findFirstAccessibleRoute()
      $q.notify({ type: 'positive', message: 'Bienvenido' })

      return destination
    } catch (err) {
      logout(false)

      // Normalizamos el mensaje
      const message =
        typeof err === 'string'
          ? err
          : err?.response?.data?.message || err?.message || 'Error en login'

      throw message
    } finally {
      loading.value = false
    }
  }

  const logout = async (redirectToLogin = true) => {
    try {
      if (token.value) {
        // Usamos una condición para evitar el bucle de logout si el token ya es inválido
        if (api.defaults.headers.common.Authorization) {
          await api.post('/logout')
        }
      }
    } catch (e) {
      console.warn('Logout server error (ignorable if token was already invalid)', e)
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

    if (redirectToLogin) router.push({ name: 'login' })
  }

  // --------------------------
  // Load user
  // --------------------------
  const loadUser = async () => {
    if (loadUserPromise) return loadUserPromise

    loadUserPromise = (async () => {
      const localToken = localStorage.getItem('token')
      if (!localToken) {
        loadUserPromise = null
        return false
      }

      try {
        token.value = localToken
        api.defaults.headers.common.Authorization = `Bearer ${localToken}`

        const { data } = await api.get('/me')
        const fetchedUser = data.user

        if (fetchedUser?.estado === 0) {
          logout(false)
          throw { type: 'account_disabled', message: 'Tu cuenta fue desactivada' }
        }

        user.value = fetchedUser
        hospital.value = fetchedUser.hospital

        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.setItem('hospital', JSON.stringify(hospital.value))

        initInactivityWatcher()
        return true
      } catch (error) {
        console.warn('loadUser failed', error)
        logout()
        return false
      } finally {
        loadUserPromise = null
      }
    })()

    return loadUserPromise
  }

  // --------------------------
  // Inactividad
  // --------------------------
  const initInactivityWatcher = () => {
    window.removeEventListener('mousemove', resetInactivityTimer)
    window.removeEventListener('keydown', resetInactivityTimer)
    window.removeEventListener('click', resetInactivityTimer)

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

    inactivityTimer.value = setTimeout(
      () => {
        startCountdown()
      },
      inactivityLimit - countdownSeconds * 1000,
    )
  }

  const startCountdown = () => {
    let secondsLeft = countdownSeconds

    const notif = $q.notify({
      message: `Se cerrará sesión en ${secondsLeft} segundos por inactividad`,
      color: 'red',
      timeout: 0,
      actions: [{ label: 'Mantener sesión', color: 'white', handler: resetInactivityTimer }],
    })

    countdownTimer.value = setInterval(() => {
      secondsLeft--
      notif.update({ message: `Se cerrará sesión en ${secondsLeft} segundos por inactividad` })

      if (secondsLeft <= 0) {
        clearInterval(countdownTimer.value)
        notif.dismiss()
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
    hasPermission,
    login,
    logout,
    loadUser,
    findFirstAccessibleRoute,
  }
})
