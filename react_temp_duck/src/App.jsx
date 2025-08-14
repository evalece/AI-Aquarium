
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useRef, useState } from "react";
// 4.Props Composition

//（Props Composition） pattern, it 2 functions agreeing on key names. 
// One responsible for sending, and another for recieving.
// React const: shallow immutable: no reassign or rebind (reference unchange), but values
//            are mutable.

//One way Dataflow in JS: Parent-> Child preferred; i.e., Child cannot change parent state, if so 
// changes setState reference; also JS pass by copy of reference
function App() {

function Parent(){

  const person={
    name: "eva",
    ip: "0.0.0",
    age:"0",
    
   }

return(
  <Child person={person}/>
  );
}

function Child({person}){

  return (
    <div>
      <p>
        {person.name}
      </p>
      <p>
        {person.ip}
      </p>
          <p>
        {person.age}
      </p>

    </div>
  )

}
  
 return (< Parent/>);

}

export default App
