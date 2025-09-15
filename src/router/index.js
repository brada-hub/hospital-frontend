// src/router/index.js
import { route } from 'quasar/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'
import { useUserStore } from 'stores/user'

export default route(function (/* { store, ssrContext } */) {
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

  Router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)

    // Intenta cargar el usuario desde localStorage si no está en la tienda (útil en recargas de página)
    if (!userStore.isLoggedIn && localStorage.getItem('token')) {
      await userStore.loadUser()
    }

    const isAuthenticated = userStore.isLoggedIn

    // CASO 1: La ruta requiere autenticación
    if (requiresAuth) {
      if (!isAuthenticated) {
        // 1a: No está autenticado -> a la página de login
        return next({ name: 'login' })
      }

      // 1b: Está autenticado, ahora revisamos permisos
      const requiredPermission = to.meta.permission
      if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
        // No tiene el permiso requerido -> a la página de Acceso Denegado
        return next({ name: 'AccessDenied' })
      }
    }

    // CASO 2: El usuario ya está logueado e intenta ir a /login
    if (to.name === 'login' && isAuthenticated) {
      // Lo mandamos al dashboard para que no vea el login de nuevo
      return next({ name: 'dashboard' })
    }

    // Si todo está bien, permite la navegación
    next()
  })

  return Router
})
