import { defineComponent } from 'vue';
export default defineComponent({
   name: 'HomePage',
   render() {
      return (
         <>
            <h2>Welcome to Home Page</h2>
            <p>
               Check console on client side and server side for logger
               middleware
            </p>
            <p>
               Press Login button to add <b>logged=true</b> option to cookies
               for auth middleware and then reload the page
            </p>
            <br />
            <button onClick={() => (document.cookie = 'logged=true')}>
               Login
            </button>
         </>
      );
   }
});
