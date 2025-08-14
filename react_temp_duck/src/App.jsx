
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useRef, useState } from "react";

function App() {
// 2. Child -> Parent / AKA. Lift State Up
// Except useEffect, callback, hanlder or custom hook, 
// child use interactive HTML tag, hook parent handler as its props 

// when parent calls child in its JSX like...
// <Child xxx=ooo> child only sees xxx as "props that is passed to it"
// Summary in Parent => Child and Child => Parent, match xxx from either way. 
  function Parent() {
    function clickHandler(){
      console.log("clicked");
    }
    return (<Children hanldeClick={()=>clickHandler()}  />);
 
  }
  function Children({hanldeClick}){
    return (<div>
    
      <button onClick={hanldeClick}>
        Click Me  

      </button>
      </div>
    );

  }

  

  
 return (< Parent/>);

}

export default App
