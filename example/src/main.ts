import { viteSSR } from 'vite-ssr/vue';
import { middlewareHandler, Middleware } from 'vite-ssr-middleware';
import { App } from './App';
import { routes } from './router/router';
import { createHead } from '@vueuse/head';

import type { IncomingMessage } from 'http';

const middlewareGlob = import.meta.globEager('./middlewares/*.ts');

export default viteSSR(App, { routes }, (context) => {
   const { isClient, app, router, initialState, request } = context;
   const head = createHead();
   app.use(head);

   //Simple Cookie Parser
   if (!isClient) {
      const req = request as IncomingMessage;
      const cookies = req.headers.cookie
         ?.split(';')
         .map((v) => {
            const cookiesplit = v.split('=');
            const cookieName = cookiesplit[0];
            const cookieValue = cookiesplit[1];

            return {
               [cookieName]: cookieValue
            };
         })
         .reduce((acc, currentValue) => {
            for (const [key, name] of Object.entries(currentValue)) {
               acc[key] = name;
            }
            return acc;
         }, {});
      initialState.cookies = cookies;
   }

   //importing middlewares
   const middlewares: Middleware[] = Object.keys(middlewareGlob).map(
      (key) => middlewareGlob[key].default
   );
   router.beforeEach(middlewareHandler(context, middlewares));
   return {
      head
   };
});
