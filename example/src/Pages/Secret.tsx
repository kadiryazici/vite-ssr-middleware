import { defineComponent } from 'vue';

export default defineComponent({
   name: 'Secret Page',
   render() {
      return (
         <>
            <h2>Welcome To Secret Page</h2>
            <p>you should only see this page if you are authenticated</p>
         </>
      );
   }
});
