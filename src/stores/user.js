// src/stores/user.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import routesConfig from 'src/router/routes' // config de rutas (array)

export const useUserStore = defineStore('user', () => {
  const router = useRouter()
  const $q = useQuasar()

  // estado
  const user = ref(null)
  const token = ref(null)
  const hospital = ref(null)
  const loading = ref(false)

  // para evitar cargas concurrentes de usuario
  let loadUserPromise = null

  // Inactividad (mantengo tu lógica anterior)
  const inactivityTimer = ref(null)
  const countdownTimer = ref(null)
  const inactivityLimit = 15 * 60 * 1000 // 15 min

  // getters
  const isLoggedIn = computed(() => !!token.value && !!user.value)

  // --------------------------
  // Permisos - función central
  // --------------------------
  const hasPermission = (permission) => {
    if (!user.value) return false

    // 1) permisos individuales del usuario
    const userPerm = (user.value.permissions || []).find((p) => p.nombre === permission)
    if (userPerm) {
      // chequear pivot.estado (defensivo)
      return userPerm.pivot?.estado === 'permitido'
    }

    // 2) permisos desde el rol (si el rol tiene pivot o no)
    const rolePerms = user.value.rol?.permissions || []
    // verificar pivot si existe en cada permiso del rol
    return rolePerms.some((p) => {
      if (p.nombre !== permission) return false
      // si tiene pivot en el permiso del rol, respetarlo; si no, considerarlo permitido
      return p.pivot ? p.pivot.estado === 'permitido' : true
    })
  }

  // --------------------------
  // Find first accessible route
  // --------------------------
  const findFirstAccessibleRoute = () => {
    if (!user.value) {
      return { name: 'AccessDenied' }
    }

    // rutas hijas del layout '/'
    const mainRoutes = routesConfig.find((r) => r.path === '/')?.children || []

    // recursiva para soportar children
    const findInList = (list) => {
      for (const route of list) {
        // consideramos solo rutas con name (evitar redirect vacío)
        if (route.name && route.meta?.permission) {
          if (hasPermission(route.meta.permission)) {
            return { name: route.name }
          }
        }
        // si la ruta no tiene permiso listado, podríamos considerarla pública dentro del layout
        // (opcional) si querés priorizar rutas sin meta.permission, descomenta:
        // if (route.name && !route.meta?.permission) return { name: route.name }

        if (route.children?.length) {
          const found = findInList(route.children)
          if (found) return found
        }
      }
      return null
    }

    const destination = findInList(mainRoutes)
    return destination || { name: 'AccessDenied' }
  }

  // --------------------------
  // Auth actions
  // --------------------------
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

      // decimos la ruta que corresponde
      const destination = findFirstAccessibleRoute()

      $q.notify({ type: 'positive', message: 'Bienvenido' })

      // devuelve objeto destino al componente que llamó (no empujamos aquí)
      return destination
    } catch (err) {
      // limpiar estado
      logout(false)
      const message = err?.response?.data?.message || err.message || 'Error en login'
      throw message
    } finally {
      loading.value = false
    }
  }

  const logout = async (redirectToLogin = true) => {
    try {
      if (token.value) {
        await api.post('/logout', {}, { headers: { Authorization: `Bearer ${token.value}` } })
      }
    } catch (e) {
      // ignorar error de logout en servidor
      console.warn('Logout server error', e)
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

    if (redirectToLogin) {
      router.push({ name: 'login' })
    }
  }

  // --------------------------
  // Load user (try /me first)
  // --------------------------
  const loadUser = async () => {
    // si ya hay promesa en curso, retornarla
    if (loadUserPromise) return loadUserPromise

    loadUserPromise = (async () => {
      const localToken = localStorage.getItem('token')
      const localUser = localStorage.getItem('user')
      const localHospital = localStorage.getItem('hospital')

      if (!localToken) {
        // nada que hacer
        loadUserPromise = null
        return false
      }

      // preferimos validar /me si el backend lo permite
      try {
        token.value = localToken
        api.defaults.headers.common.Authorization = `Bearer ${localToken}`

        // intenta pedir /me (si tu backend no tiene endpoint, comentalo)
        const { data } = await api.get('/me')
        user.value = data.user ?? JSON.parse(localUser || 'null')
        hospital.value = data.user?.hospital ?? JSON.parse(localHospital || 'null')

        // persistir en localStorage en caso de que /me tenga datos más frescos
        localStorage.setItem('user', JSON.stringify(user.value))
        localStorage.setItem('hospital', JSON.stringify(hospital.value))

        initInactivityWatcher()
        loadUserPromise = null
        return true
      } catch (error) {
        // registramos el error para debug y hacemos fallback a localStorage
        console.warn('loadUser: /me request failed, falling back to localStorage.', error)

        try {
          if (localUser && localHospital) {
            token.value = localToken
            user.value = JSON.parse(localUser)
            hospital.value = JSON.parse(localHospital)
            api.defaults.headers.common.Authorization = `Bearer ${localToken}`
            initInactivityWatcher()
            loadUserPromise = null
            return true
          }
        } catch (parseError) {
          console.error('loadUser: error parsing localStorage user/hospital', parseError)
        }

        // si falla todo, limpiar
        logout()
        loadUserPromise = null
        return false
      }
    })()

    return loadUserPromise
  }
  // --------------------------
  // Inactivity watcher (tu lógica)
  // --------------------------
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
    hasPermission,
    login,
    logout,
    loadUser,
    findFirstAccessibleRoute,
  }
})
