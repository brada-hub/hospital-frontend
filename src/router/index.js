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

    // Si hay token en localStorage pero store no cargada, cargar usuario
    if (!userStore.isLoggedIn && localStorage.getItem('token')) {
      try {
        await userStore.loadUser()
      } catch (error) {
        // registramos el error para debug y redirigimos al login
        console.warn('Router.beforeEach: userStore.loadUser failed', error)
        return next({ name: 'login' })
      }
    }

    const isAuthenticated = userStore.isLoggedIn

    // Páginas públicas
    const publicPages = ['login', 'AccessDenied']
    const isPublicPage = publicPages.includes(to.name)

    // Caso: no autenticado y página protegida
    if (!isAuthenticated && !isPublicPage) {
      return next({ name: 'login' })
    }
    if (userStore.user?.estado === 0) {
      await userStore.logout(false)
      return next({ name: 'login' })
    }

    // Caso: autenticado
    if (isAuthenticated) {
      // Si intenta visitar login, redirigir a su ruta accesible
      if (to.name === 'login') {
        const dest = userStore.findFirstAccessibleRoute()
        return next(dest)
      }

      // Si ruta requiere permiso y no lo tiene -> AccessDenied
      const requiredPermission = to.meta?.permission
      if (requiredPermission && !userStore.hasPermission(requiredPermission)) {
        return next({ name: 'AccessDenied' })
      }
    }

    // permitir navegación por defecto
    return next()
  })

  return Router
})
