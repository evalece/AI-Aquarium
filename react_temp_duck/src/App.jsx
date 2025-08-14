
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { useRef, useState } from "react";
// 3. Controlled Component 
// Render <-> DOM Caching 
// useState to store values, and DOM events (i.e., onChange) to update state 
// Hanlders best be at child level for min. re-render, though, state and function may come from parent 

// Enforce DOM update into memory update without re-render
//setState re-renders if not === ; hence, use callback function, allow dependency=[]

//Enforcer re-render (but advance)
// useReducer

//Interactivity- Rather fine chopping DOM for mini-update for better UX.
function App() {

// user input-> setInput (update state) -> React re-render (hence having new input in value)-> assign to 
// input value field for displaying

//onXXX => has a set of Attributes (advanced), if not used, omit:
  // onClick={(e) => setCount(count + 1)}
  // onClick={() => setCount(count + 1)}
  // onClick={handleClick}
function Parent(){
  const [input, SetInput]=useState("");
  return(
    <div>
      <div> your input: {input}</div>
      <input value={input}  
      onChange= {(e) => setInput(e.target.value)} />

    </div>
  );
}
  
 return (< Parent/>);

}

export default App
