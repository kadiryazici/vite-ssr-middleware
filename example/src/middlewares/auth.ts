import { defineMiddleware } from 'vite-ssr-middleware';

// dangerously simple auth handler
export default defineMiddleware('auth', ({ redirect, next, isClient, initialState }) => {
   const logged = initialState?.cookies?.logged === 'true' ? true : false;
   if (logged) return true;

   if (!isClient) {
      redirect('/');
      next();
   } else {
      next('/');
   }
   return false;
});
