import { DefineComponent } from 'vue';
declare module '*.vue' {
   // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-types
   const component: DefineComponent<{}, {}, any>;
   export default component;
}

declare module 'vite-ssr-middleware' {
   interface CustomProperties {
      secretValue: string;
   }
}
