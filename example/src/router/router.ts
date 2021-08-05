import { RouteRecordRaw } from 'vue-router';

export const routes: RouteRecordRaw[] = [
   {
      path: '/',
      name: 'Home',
      component: () => import('../Pages/Home'),
      meta: {
         middlewares: ['logger']
      }
   },
   {
      path: '/secret',
      name: 'Secret',
      component: () => import('../Pages/Secret'),
      meta: {
         middlewares: ['logger', 'auth']
      }
   }
];
