import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/student',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { role: 'student' },
    children: [
      {
        path: '',
        redirect: '/student/dashboard'
      },
      {
        path: 'dashboard',
        name: 'StudentDashboard',
        component: () => import('@/views/student/Dashboard.vue')
      },
      {
        path: 'repair',
        name: 'StudentRepair',
        component: () => import('@/views/student/RepairForm.vue')
      },
      {
        path: 'my-repairs',
        name: 'StudentMyRepairs',
        component: () => import('@/views/student/MyRepairs.vue')
      },
      {
        path: 'evaluate/:id',
        name: 'StudentEvaluate',
        component: () => import('@/views/student/Evaluate.vue')
      }
    ]
  },
  {
    path: '/dispatcher',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { role: 'dispatcher' },
    children: [
      {
        path: '',
        redirect: '/dispatcher/dashboard'
      },
      {
        path: 'dashboard',
        name: 'DispatcherDashboard',
        component: () => import('@/views/dispatcher/Dashboard.vue')
      },
      {
        path: 'pool',
        name: 'DispatcherPool',
        component: () => import('@/views/dispatcher/WorkOrderPool.vue')
      },
      {
        path: 'events',
        name: 'DispatcherEvents',
        component: () => import('@/views/dispatcher/EventManagement.vue')
      },
      {
        path: 'analytics',
        name: 'DispatcherAnalytics',
        component: () => import('@/views/dispatcher/Analytics.vue')
      },
      {
        path: 'assign/:id',
        name: 'DispatcherAssign',
        component: () => import('@/views/dispatcher/AssignWorkOrder.vue')
      }
    ]
  },
  {
    path: '/worker',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { role: 'worker' },
    children: [
      {
        path: '',
        redirect: '/worker/dashboard'
      },
      {
        path: 'dashboard',
        name: 'WorkerDashboard',
        component: () => import('@/views/worker/Dashboard.vue')
      },
      {
        path: 'my-orders',
        name: 'WorkerMyOrders',
        component: () => import('@/views/worker/MyOrders.vue')
      },
      {
        path: 'available',
        name: 'WorkerAvailable',
        component: () => import('@/views/worker/AvailableOrders.vue')
      },
      {
        path: 'building-events',
        name: 'WorkerBuildingEvents',
        component: () => import('@/views/worker/BuildingEvents.vue')
      },
      {
        path: 'complete/:id',
        name: 'WorkerComplete',
        component: () => import('@/views/worker/CompleteOrder.vue')
      }
    ]
  },
  {
    path: '/dorm-manager',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { role: 'dormManager' },
    children: [
      {
        path: '',
        redirect: '/dorm-manager/dashboard'
      },
      {
        path: 'dashboard',
        name: 'DormManagerDashboard',
        component: () => import('@/views/dorm-manager/Dashboard.vue')
      },
      {
        path: 'building-progress',
        name: 'DormManagerBuildingProgress',
        component: () => import('@/views/dorm-manager/BuildingProgress.vue')
      }
    ]
  },
  {
    path: '/spare-parts',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { role: 'sparePartsManager' },
    children: [
      {
        path: '',
        redirect: '/spare-parts/dashboard'
      },
      {
        path: 'dashboard',
        name: 'SparePartsDashboard',
        component: () => import('@/views/spare-parts/Dashboard.vue')
      },
      {
        path: 'inventory',
        name: 'SparePartsInventory',
        component: () => import('@/views/spare-parts/Inventory.vue')
      },
      {
        path: 'delayed-orders',
        name: 'SparePartsDelayedOrders',
        component: () => import('@/views/spare-parts/DelayedOrders.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  if (to.path === '/login') {
    next()
  } else {
    if (!userStore.isLoggedIn) {
      next('/login')
    } else {
      if (to.meta.role && to.meta.role !== userStore.currentRole) {
        next(`/${userStore.currentRole}/dashboard`)
      } else {
        next()
      }
    }
  }
})

export default router
