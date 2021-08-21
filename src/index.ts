import { useContext, Context } from 'vite-ssr/vue/';
import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

interface ViteSSRContext extends Context {}
interface RouterGuard {
   to: RouteLocationNormalized;
   from: RouteLocationNormalized;
   next: NavigationGuardNext;
}

interface HandlerParameters extends RouterGuard {}
interface MiddlewareHandler {
   (params: ViteSSRContext & RouterGuard, properties: CustomProperties): boolean | Promise<boolean>;
}
export interface Middleware {
   name: string;
   handler: MiddlewareHandler;
}

export type MiddlewareRecord = (string | Middleware)[];
export interface CustomProperties {
   [key: string]: any;
}

/**
 * 
 * @param name Unique name for middleware
 * @param fn Handler function
 * @param properties Optional properties
 * @example ```ts
   import {defineMiddleware} from 'vite-plugin-middleware'
   const authMiddleware = defineMiddleware('authMiddleware', (context) => true)
 * ```
 */
export function defineMiddleware(name: string, fn: MiddlewareHandler): Middleware {
   return {
      name,
      handler: fn
   };
}

/**
 * @description Creates middleware handler to handle middlewares manually.
 * @param middlewares List of all middlewars
 * @param properties Properties those can be accessible in middlewares
 * @returns Async function that returns a promise<boolean>, if value is true it means `next()` is handled by middlewares, if false it means `next()` is not handled by middlewares
 * @example ```ts
   export default viteSSR(App, {routes}, (context) => {
               const middlewareHandler = createMiddlewareHandler([authMiddleWare]);
               router.beforeEach(async (to, from, next) => {b
                        const isHandled = await middlewareHandler({...params, to, from, next});
                        if (!isHandled) {
                           next();
                        }
                  });
   })
 * ```
 */
export function createMiddlewareHandler(
   context: ViteSSRContext,
   middlewares: Middleware[],
   properties?: CustomProperties
) {
   return async (routerContext: HandlerParameters) => {
      const allContext = {
         ...context,
         ...routerContext
      };
      const routeMiddlewares = routerContext.to.meta.middlewares as MiddlewareRecord;
      if (!routeMiddlewares) {
         return false;
      }
      //@ts-ignore
      const middlewareArray: Middleware[] = routeMiddlewares
         .map((middleware) => {
            if (typeof middleware === 'string') return middlewares.find((m) => m.name === middleware);

            if (typeof middleware === 'object' && middleware.name && typeof middleware.handler === 'function')
               return middleware;

            return null;
         })
         .filter(Boolean);

      for (let index = 0; index < middlewareArray.length; index++) {
         const middleware = middlewareArray[index];
         const handler = middleware.handler(allContext, properties || {});
         if (typeof handler === 'boolean') {
            if (!handler) return true;
            continue;
         } else {
            const handlerValue = await handler;
            if (!handlerValue) return true;
            continue;
         }
      }
      return false;
   };
}
/**
 * @description Single handler that does the job of {@link createMiddlewareHandler} automatically.
 * @see {@link createMiddlewareHandler} Example Code
 * @param context Vite-SSR context
 * @param middlewares Middleware array
 * @param properties Properties those can be accessible in middlewares
 * @returns a function which will be handled by `router.beforeEach`
 * @example ```ts
   export default viteSSR(App, {routes}, (context) => {
               router.beforeEach(middlewareHandler(context, [authMiddleware, someMiddleware]));
   })
 * ```
 */
export function middlewareHandler(context: ViteSSRContext, middlewares: Middleware[], properties?: CustomProperties) {
   return async (to: RouteLocationNormalized, from: RouteLocationNormalized, next: NavigationGuardNext) => {
      const middlewareHandler = createMiddlewareHandler(context, middlewares, properties);
      const isHandled = await middlewareHandler({ to, from, next });
      if (!isHandled) {
         next();
      }
   };
}
