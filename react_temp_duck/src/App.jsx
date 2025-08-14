
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useRef, useState } from "react";
/*
value={text} → render from state
onChange={(e) => setText(e.target.value)} → update state
*/
function App() {

  function Parent() {
    return (<Children value={2} />);

  }
  function Children({value}){
    return <h1>Child contains value={value}</h1>;
    
  }

  

  
 return (< Parent/>);

}

export default App
