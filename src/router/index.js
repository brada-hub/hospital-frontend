// src/router/index.js
import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useUserStore } from 'stores/user'

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Guard global definitivo y robusto
  Router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()

    // Si la ruta requiere autenticación, primero verificamos el estado de autenticación.
    if (to.meta.requiresAuth) {
      if (!userStore.isLoggedIn) {
        // El usuario no está logueado, lo redirigimos al login.
        await userStore.logout() // Limpiamos cualquier estado corrupto por si acaso
        return next('/login')
      }

      // Si el usuario ya está logueado, verificamos su objeto de usuario y permisos
      // antes de permitir el acceso.
      if (!userStore.user) {
        // Si no tenemos el objeto de usuario en el store, lo cargamos.
        // Esto previene errores de "undefined" en la lógica de permisos.
        await userStore.loadUser()
      }

      // Una vez que el usuario está autenticado y cargado,
      // verificamos si tiene el permiso necesario.
      const requiredPermission = to.meta.permission
      if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
        // El usuario no tiene el permiso necesario, lo redirigimos a la primera página que sí puede ver.
        const hasDashboardAccess = userStore.hasPermission('acceso.dashboard')
        const hasUsuariosAccess = userStore.hasPermission('acceso.usuarios-y-roles')

        if (hasDashboardAccess) {
          return next('/')
        } else if (hasUsuariosAccess) {
          return next('/usuarios-y-roles')
        } else {
          // Si no tiene acceso a NADA, lo mandamos al login.
          return next('/login')
        }
      }
    }

    // Si el usuario está logueado e intenta ir a la página de login, lo redirigimos al dashboard.
    if (to.path === '/login' && userStore.isLoggedIn) {
      return next('/')
    }

    // Si no hay restricciones o si se cumplen, continuamos la navegación.
    next()
  })

  return Router
})
