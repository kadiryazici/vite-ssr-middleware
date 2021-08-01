import { useContext } from 'vite-ssr/vue/';
import { NavigationGuardNext, RouteLocationNormalized } from 'vue-router';

type ViteSSRContext = ReturnType<typeof useContext>;
type RouterGuard = {
   to: RouteLocationNormalized;
   from: RouteLocationNormalized;
   next: NavigationGuardNext;
};

type CallbackParameters = RouterGuard;

type Callback = (
   params: ViteSSRContext & RouterGuard,
   properties: CustomProperties
) => boolean | Promise<boolean>;

export type Middleware = {
   name: string;
   handler: Callback;
};

export type MiddlewareRecord = (string | Middleware)[];
type CustomProperties = Record<any, any> | {};

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
export function defineMiddleware(name: string, fn: Callback): Middleware {
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
   properties: Record<string, any> = {}
): (params: CallbackParameters) => Promise<boolean> {
   return async (routerContext) => {
      const allContext = {
         ...context,
         ...routerContext
      };
      const routeMiddlewares = routerContext.to.meta
         .middlewares as MiddlewareRecord;
      if (!routeMiddlewares) {
         return false;
      }
      //@ts-ignore
      const middlewareArray: Middleware[] = routeMiddlewares
         .map((middleware) => {
            if (typeof middleware === 'string') {
               return middlewares.find((m) => m.name === middleware);
            }
            if (
               typeof middleware === 'object' &&
               middleware.name &&
               typeof middleware.handler === 'function'
            ) {
               return middleware;
            }
            return null;
         })
         .filter((m) => !!m);

      for (let index = 0; index < middlewareArray.length; index++) {
         const middleware = middlewareArray[index];
         const handler = middleware.handler(allContext, properties);
         if (typeof handler === 'boolean') {
            if (!handler) {
               return true;
            }
            continue;
         } else {
            const handlerValue = await handler;
            if (!handlerValue) {
               return true;
            }
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
export function middlewareHandler(
   context: ViteSSRContext,
   middlewares: Middleware[],
   properties: Record<string, any> = {}
) {
   return async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
   ) => {
      const middlewareHandler = createMiddlewareHandler(
         context,
         middlewares,
         properties
      );
      const isHandled = await middlewareHandler({
         to,
         from,
         next
      });
      if (!isHandled) {
         next();
      }
   };
}
