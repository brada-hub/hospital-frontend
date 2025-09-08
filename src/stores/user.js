// src/stores/user.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    token: null,
    hospital: null, // Agregamos el estado para el hospital
    loading: false,
    inactivityTimer: null,
    countdownTimer: null,
    inactivityLimit: 15 * 60 * 1000, //15 min
    //30 * 1000, // 30 segundos
  }),

  actions: {
    // Login
    async login(email, password) {
      this.loading = true
      try {
        const { data } = await api.post('/login', { email, password })

        this.user = data.user
        this.token = data.access_token

        // Llamar a la API para obtener los detalles del hospital
        const hospitalData = await this.getHospitalDetails(data.user.hospital_id) // Usamos el hospital_id de la respuesta
        this.hospital = hospitalData // Guardamos los detalles del hospital en el store

        // Guardar en localStorage
        localStorage.setItem('token', this.token)
        localStorage.setItem('user', JSON.stringify(this.user))
        localStorage.setItem('hospital', JSON.stringify(this.hospital)) // Guardamos el hospital también

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

    // Obtener los detalles del hospital usando el hospital_id
    async getHospitalDetails(hospital_id) {
      try {
        const { data } = await api.get(`/hospital-details/${hospital_id}`)
        return data // Devuelve los detalles del hospital
      } catch (err) {
        console.error('Error al obtener los detalles del hospital:', err)
        throw err
      }
    },

    // Logout
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
      this.hospital = null // Limpiar el hospital también
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('hospital') // Eliminar hospital de localStorage
      delete api.defaults.headers.common['Authorization']

      // Limpiar timers
      clearTimeout(this.inactivityTimer)
      clearInterval(this.countdownTimer)

      this.router.push('/login')
    },

    // Cargar el usuario y hospital desde localStorage
    loadUser() {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      const hospital = localStorage.getItem('hospital')

      if (token && user && hospital) {
        this.token = token
        this.user = JSON.parse(user)
        this.hospital = JSON.parse(hospital) // Cargar el hospital desde localStorage
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`

        // Iniciar watcher de inactividad
        this.initInactivityWatcher()
      } else {
        this.user = null
        this.token = null
        this.hospital = null // Limpiar el hospital también
        delete api.defaults.headers.common['Authorization']
      }
    },

    // =========================
    // 🔒 Inactividad
    // =========================
    initInactivityWatcher() {
      clearTimeout(this.inactivityTimer)
      clearInterval(this.countdownTimer)

      // Registrar eventos de actividad
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
      }, this.inactivityLimit - 5000) // Inicia cuenta regresiva 5s antes
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
