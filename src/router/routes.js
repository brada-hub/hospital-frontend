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
        meta: { permission: 'acceso.dashboard', title: 'Dashboard Principal' },
      },
      {
        path: 'gestion-hospital',
        name: 'gestion-hospital',
        component: () => import('pages/PageHospital.vue'),
        meta: { permission: 'acceso.gestion-hospital', title: 'Gestión de Hospital' },
      },
      // CORREGIDO: La ruta 'pacientes' ahora apunta a su componente correcto.
      {
        path: 'pacientes',
        name: 'GestionPacientes', // Nombre actualizado para mayor claridad
        component: () => import('pages/PagePaciente.vue'),
        meta: { permission: 'acceso.pacientes', title: 'Gestión de Pacientes' },
      },
      {
        path: 'admision',
        name: 'Admision',
        component: () => import('pages/AdmisionPage.vue'),
        meta: { permission: 'acceso.admision', title: 'Admisión de Pacientes' },
      },
      // CORREGIDO: La ruta de medicamentos ahora apunta al componente correcto.
      {
        path: 'medicamentos',
        name: 'GestionMedicamentos',
        component: () => import('pages/MedicamentosPage.vue'),
        meta: { permission: 'acceso.medicamentos', title: 'Gestión de Farmacia' },
      },
      {
        path: 'usuarios-y-roles',
        name: 'usuarios-y-roles',
        component: () => import('pages/GestionUsuariosRolesPage.vue'),
        meta: { permission: 'acceso.usuarios-y-roles', title: 'Gestión de Usuarios y Roles' },
      },

      {
        path: 'mis-pacientes',
        name: 'MisPacientes',
        component: () => import('pages/MisPacientesPage.vue'),
        meta: { permission: 'acceso.mis-pacientes', title: 'Mis Pacientes Asignados' },
      },
      {
        path: 'estacion-enfermeria',
        name: 'EstacionEnfermeria',
        component: () => import('pages/EstacionEnfermeriaPage.vue'),
        meta: { permission: 'acceso.estacion-enfermeria', title: 'Estación de Enfermería' },
      },
      {
        path: 'mi-internacion',
        name: 'MiInternacion',
        component: () => import('pages/MiInternacionPage.vue'), // ← Componente diferente
        meta: { permission: 'acceso.mi-internacion', title: 'Mi Internación' },
      },
      {
        path: 'nutricion',
        name: 'Nutricion',
        component: () => import('pages/NutricionPage.vue'),
        meta: { permission: 'acceso.nutricion', title: 'Panel de Nutrición' },
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
