import { defineMiddleware } from 'vite-ssr-middleware';

// Logs visiting page
export default defineMiddleware('logger', async ({ isClient, to }) => {
   if (isClient) {
      const text = `%cVisiting: %c${to.path}`;
      const styles = [`color: rgb(0, 255, 0)`, `color: magenta`];
      console.log(text, ...styles);
      return true;
   }

   const { green, magenta } = await import('chalk');
   const text = `${green('Visiting')}: ${magenta(to.path)}`;
   console.log(text);
   return true;
});
