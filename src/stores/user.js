// src/stores/user.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    inactivityTimer: null,
    countdownTimer: null,
    inactivityLimit: 30 * 1000, // 30 segundos
  }),

  actions: {
    async login(email, password) {
      this.loading = true
      try {
        const { data } = await api.post('/login', { email, password })

        this.user = data.user
        this.token = data.access_token

        // Guardar en localStorage
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))

        // Configurar headers
        api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`

        // Iniciar control de inactividad
        this.initInactivityWatcher()

        // Redirigir al dashboard
        this.router.push('/dashboard')

        return true
      } catch (err) {
        throw err.response?.data?.message || 'Error en login'
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        if (this.token) {
          await api.post('/logout', {}, { headers: { Authorization: `Bearer ${this.token}` } })
        }
      } catch {
        // ignorar error
      }

      this.user = null
      this.token = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      delete api.defaults.headers.common['Authorization']

      // limpiar timers
      clearTimeout(this.inactivityTimer)
      clearInterval(this.countdownTimer)

      this.router.push('/login')
    },

    loadUser() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')

      if (token && user) {
        this.token = token
        this.user = JSON.parse(user)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        // iniciar watcher de inactividad
        this.initInactivityWatcher()
      } else {
        this.user = null
        this.token = null
        delete api.defaults.headers.common['Authorization']
      }
    },

    // =========================
    // 🔒 Inactividad
    // =========================
    initInactivityWatcher() {
      clearTimeout(this.inactivityTimer)
      clearInterval(this.countdownTimer)

      // registrar eventos de actividad
      window.addEventListener('mousemove', this.resetInactivityTimer)
      window.addEventListener('keydown', this.resetInactivityTimer)
      window.addEventListener('click', this.resetInactivityTimer)

      this.resetInactivityTimer()
    },

    resetInactivityTimer() {
      clearTimeout(this.inactivityTimer)
      clearInterval(this.countdownTimer)

      this.inactivityTimer = setTimeout(() => {
        this.startCountdown()
      }, this.inactivityLimit - 5000) // inicia cuenta regresiva 5s antes
    },

    startCountdown() {
      let secondsLeft = 5

      const notif = this.$q.notify({
        message: `Se cerrará sesión en ${secondsLeft} segundos por inactividad`,
        color: 'red',
        timeout: 0,
        actions: [
          {
            label: 'Mantener sesión',
            color: 'white',
            handler: () => {
              this.resetInactivityTimer()
            },
          },
        ],
      })

      this.countdownTimer = setInterval(() => {
        secondsLeft--
        notif({
          message: `Se cerrará sesión en ${secondsLeft} segundos por inactividad`,
        })

        if (secondsLeft <= 0) {
          clearInterval(this.countdownTimer)
          this.logout()
        }
      }, 1000)
    },
  },
})
