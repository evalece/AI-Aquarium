
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useRef, useState } from "react";
/*
value={text} → render from state
onChange={(e) => setText(e.target.value)} → update state
*/
function App() {
  
  // user input for temperature list for hysteresis testing 
  const temperaturesRef = useRef([]);
  const [currentInput, SetCurrentInput]=useState(""); 

  function handleAdd(e){
      e.preventDefault(); // stop form submit from reloading the page
      const v = parseFloat(currentInput);
      if (Number.isNaN(v)) return; // ignore invalid input
      temperaturesRef.current.push(v);
      setCurrentInput("");  
  }
  function TestTemp(){ // capture latest DOM input before user presses submit
    return (
      <div>
      <form onSubmit={handleAdd}>
        <label> Input Temperature Series for Hysteresis Testing
          <input type ="text" 
          value={currentInput}
          onChange={(e) => SetCurrentInput(e.target.value)  
          }
          />
            </label>
        <button type='submit'> 
          Submit/ Add 
        </button>
      
      </form>
      </div>
    );
  }
 return <TestTemp />;

}

export default App
