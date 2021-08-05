import { defineComponent } from 'vue';
import { RouterView } from 'vue-router';
import { Navbar } from './components/Navbar';

export const App = defineComponent({
   name: 'App',
   render() {
      return (
         <>
            <Navbar />
            <RouterView />
         </>
      );
   }
});
