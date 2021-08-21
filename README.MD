### Vite-SSR-Middleware

This plugin adds [Nuxt](https://nuxtjs.org/) like middleware feature to [Vite-SSR](https://github.com/frandiox/vite-ssr) only for Vue.

## Installation

This package requires `vite-ssr` and `vue-router@next` as peer dependency.<br>
Download it from npm `(p)npm install vite-ssr-middleware` or `yarn add vite-ssr-middleware`.<br>

## Usage

Usage is simple, there is no need to register this package like `vueApp.use()`.

### Creating Middleware

A middleware can have 3 arguments, 2 of them are necessary and 1 is optional.<br>
First parameter is unique name to middleware `string`<br>
Second parameter is handler `(context, properties) => boolean | Promise<boolean>`<br>
Third parameter is optional object, which can be defined in root handler `object`

Every middleware has to return `boolean`. If middleware returns `true` chaining will continue.<br>
If middleware returns `false` chaining will stop.<br>
Return `false` to use `next()` and `redirect()` inside middlewares. If returned value is `true` and `next()` or `redirect()` is used `vue-router` will throw error.

```ts
import { defineMiddleware } from 'vite-ssr-middleware';
import { useStore } from '../stores/mainStore';

// context is Vite-SSR context. Simply return type of useContext() from vite-ssr.
// Properties are empty object by default and can be customized in root handler.
export const authMiddleware = defineMiddleware('auth', (context, properties) => {
   // Vite-SSR 0.12.0 available context values
   const {
      next, // from vue-router
      to, // from vue-router
      from, // from vue-router
      isClient,
      request,
      redirect,
      initialState,
      url,
      writeResponse,
      response
   } = context;

   // Check if middleware runs on client side.
   // import.meta.env.SSR can be used here.
   if (isClient) {
      // we are going to talk about this later.
      const store = useStore(properties.pinia);
      if (store.auth) return true; // continue chaining

      // if user not signed in
      next('/login');
      return false; // Stop chaining because NEXT is used.
   }

   // if not client, it is server
   const authorization = request.headers.authorization;
   const isOK = CheckUserTokenAndReturnFalseOrTrue(authorization);
   if (isOk) return true; // token is correct, return true to continue chaining

   // In server side we have to use redirect() function and next() together.
   // on server side redirect() handles navigation but if next() is not called after,
   // it does not work and stuck on same page.
   redirect('/login');
   next();
   return false; // return false and stop chaining because next is used.
});
```

### Creating Middleware Handler

There are 2 middleware handlers. One is simple and the other one is needed to be handled.<br>
Handlers need `vite-ssr` context, `vue-router` guard arguments and all middlewares as array.<br>
And can take `properties` as argument. `properties` can be accessible from any middleware.

#### Simple Handler

```ts
import { viteSSR } from 'vite-ssr';
import { middlewareHandler } from 'vite-ssr-middleware';
import App from './App.vue';
import { routes } from './routes';

// Store example with pinia
import { createPinia } from 'pinia';

// Import middlewares
import { authMiddleware } from '../middlewares/authMiddleware';

export default viteSSR(App, { routes }, (context) => {
   const { app, router } = context;

   const pinia = createPinia();
   app.use(pinia);

   // middlewareHandler must be used inside router.beforeEach
   const handler = middlewareHandler(context, [authMiddleware], {
      // this property is accessible in each middleware
      pinia
   });
   router.beforeEach(handler);
   //...
});
```

### A Little Complex Handler

This handler is to create a handler function. Handler function will return `true` or `false`.<br><br>
If handler function returns `true` it means a middleware returned `false` and blocked chaining.<br>
Basically in this tutorial if `false` is returned from middleware it means `next()` or `redirect()` is called. You can use it for your own purpose<br><br>
If handler returns `false` it means none of middlewares called `next()`, so we have to call it manually.

```ts
import { viteSSR } from 'vite-ssr';
import { createMiddlewareHandler } from 'vite-ssr-middleware';
import App from './App.vue';
import { routes } from './routes';

// Store example with pinia
import { createPinia } from 'pinia';

// Import middlewares
import { authMiddleware } from '../middlewares/authMiddleware';

export default viteSSR(App, { routes }, (context) => {
   const { app, router } = context;

   const pinia = createPinia();
   app.use(pinia);

   // middlewareHandler must be used inside router.beforeEach
   // I pass pinia as property here because some middlewares need it.
   const handler = createMiddlewareHandler(context, [authMiddleware], {
      pinia
   });
   router.beforeEach(async (to, from, next) => {
      // if any one of middlewares returned false, isNextHandled = true
      // in this tutorial, return false means NEXT is used.
      // you can customize this for your own purpose.
      const isNextHandled = await handler({ to, from, next });

      if (isNextHandled) return;
      next();
   });
   //...
});
```

### Defining Middlewares for Routes

To define middleware for routes we have to use `middlewares` array inside of `route.meta`.<br>
Middlewares array can store the `value` of middleware and `name` of it as string.<br>
This package does not remove middleware duplications!!!!

```ts
import { RouteRecordRaw } from 'vue-router';
import { authMiddleware } from '../middlewares/authMiddleware';

const routes = [
   {
      path: '/settings',
      component: () => import('./Settings.vue'),
      meta: {
         middlewares: [authMiddleware]
      }
   },
   {
      path: '/topsecret',
      component: () => import('./SecretPage.vue'),
      meta: {
         middlewares: ['auth'] // name of the middleware (first parameter)
      }
   }
];
```

### Typed Custom Properties

You can create your own types for properties inside middlewares.

##### middlewares.d.ts

This file should `ALWAYS!` import something or export something. If no import or export provided this will break all types.

```ts
//or import something
import { App } from 'vue';

declare module 'vite-ssr-middleware' {
   interface CustomProperties {
      propertyForMiddleware: string;
   }
}
// a garbage type just to make this file as a module.
export type Integer = number;
```

### Importing Middlewares Dynamically

Thanks to vite's `import.meta.globEager` function we can import files inside a directory so we won't import middlewares by hand.

I am assuming that we have a directory called `middlewares` and every file inside of this folder has `default` export which is middleware.<br>
Check: [Glob Import](https://vitejs.dev/guide/features.html#glob-import)

```ts
import { viteSSR } from 'vite-ssr/vue';
import { middlewareHandler, Middleware } from 'vite-ssr-middleware';
import App from './App.vue';
import { routes } from './routes';
import type { Middleware } from 'vite-ssr-middleware';

export default viteSSR(App, { routes }, (context) => {
   const { router } = context;

   // glob import will return an object of imports.
   // key is path and value is exported data.
   /**
    * Example: {
    *    './middlewares/authMiddleware.ts': {
    *       default: middlewareData,
    *    },
    *    './middlewares/loggerMiddleware.ts': {
    *       default: loggerMiddlewareData,
    *    },
    * }
    */
   const midwareGlob = import.meta.globEager('./middlewares/*.ts');
   const middlewares: Middleware[] = Object.keys(midwareGlob).map((key) => midwareGlob[key].default);
   const handler = middlewareHandler(context, middlewares);
   router.beforeEach(handler);
});
```

##### authMiddleware.ts

```ts
export default defineMiddleware('auth', () => true);
```

##### loggerMiddleware.ts

```ts
export default defineMiddleware('logger', () => true);
```

### Vite Plugin Pages Example

If you are using [vite-plugin-pages](https://github.com/hannoeru/vite-plugin-pages) we cannot import middlewares and directly use them.<br>
But this library supports name of middlewares so we can use them.

```html
<!-- I have to use prettier-ignore thanks to prettier :) -->
<!-- prettier-ignore -->
<route lang="yaml"> <!-- OR json or json5 -->
meta:
   middlewares:
      - auth
      - logger
</route>
```

# Notes

Middlewares are called by array queue.<br>
Use handler inside of `viteSSR` function.
