import { defineComponent, CSSProperties } from 'vue';
import { RouterLink } from 'vue-router';

const style: CSSProperties = {
   display: 'flex',
   alignItems: 'center',
   justifyContent: 'center',
   width: '100%',
   height: '50px',
   fontSize: '26px',
   gap: '15px'
};

export const Navbar = defineComponent({
   name: 'Navbar',
   render() {
      return (
         <div id="navbar" style={style}>
            <RouterLink to="/">Home</RouterLink>
            <RouterLink to="/secret">Secret</RouterLink>
         </div>
      );
   }
});
