// src/router/routes.js
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('src/pages/PageLogin.vue'),
  },
  {
    path: '/access-denied',
    name: 'AccessDenied',
    component: () => import('pages/AccesoDenegado.vue'),
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/dashboard' },
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('pages/PageDashboard.vue'),
        meta: { permission: 'acceso.dashboard' },
      },
      {
        path: 'gestion-hospital',
        name: 'gestion-hospital',
        component: () => import('pages/PageHospital.vue'),
        meta: { permission: 'acceso.gestion-hospital' },
      },
      {
        path: 'pacientes',
        name: 'pacientes',
        component: () => import('pages/PagePacientes.vue'),
        meta: { permission: 'acceso.pacientes' },
      },
      {
        path: 'usuarios-y-roles',
        name: 'usuarios-y-roles',
        component: () => import('pages/GestionUsuariosRolesPage.vue'),
        meta: { permission: 'acceso.usuarios-y-roles' },
      },
      {
        path: 'hospital',
        name: 'hospital',
        component: () => import('pages/PageHospital.vue'),
        meta: { permission: 'acceso.hospital' },
      },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    name: 'error404',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
