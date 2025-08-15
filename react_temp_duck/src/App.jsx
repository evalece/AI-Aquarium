
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useRef, useState } from "react";
//5. callback for onXxx Pattern (i.e., onClick/onAction)
// Parent passes Action handler to Children, Children "callback" parents when actions triggered,
// allowing centralized control in parent 
function App() {

function Parent(){
  function clickHandler(id){
      console.log("clicked on item "+ id);
  }

// or <Child id={1} handleClick={() => clickHandler({ id: 1 })} />
  return(
    <Child id={0 } handleClick={()=>clickHandler(0)}/>
    );
}

function Child({id, handleClick}){

  return (
    <div> 
      <button onClick={handleClick}>
        Press me
      </button>


    </div>


  )

}
  
 return (< Parent/>);

}

export default App
