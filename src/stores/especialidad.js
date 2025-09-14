// src/stores/especialidad.js
import { defineStore } from 'pinia'
import { api } from 'boot/axios'

export const useEspecialidadStore = defineStore('especialidad', {
  state: () => ({
    especialidades: [],
  }),

  actions: {
    // 1️⃣ Listar especialidades filtradas por hospital
    async fetchEspecialidades(hospitalId) {
      try {
        const { data } = await api.get(`/especialidades?hospital_id=${hospitalId}`)
        this.especialidades = data
      } catch (err) {
        console.error('Error al cargar especialidades:', err)
      }
    },

    // 2️⃣ Añadir nueva especialidad
    async addEspecialidad(nuevaEspecialidad) {
      try {
        const { data } = await api.post('/especialidades', nuevaEspecialidad)
        this.especialidades.push(data)
        return data
      } catch (err) {
        console.error('Error al añadir especialidad:', err)
        throw err
      }
    },

    // 3️⃣ Actualizar especialidad existente
    async updateEspecialidad(id, updatedData) {
      try {
        const { data } = await api.put(`/especialidades/${id}`, updatedData)
        // Actualizamos el arreglo en memoria
        const index = this.especialidades.findIndex((e) => e.id === id)
        if (index !== -1) {
          this.especialidades[index] = data
        }
        return data
      } catch (err) {
        console.error('Error al actualizar especialidad:', err)
        throw err
      }
    },
  },
})
