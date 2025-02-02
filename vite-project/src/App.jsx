import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Homepage from "./components/pages/Homepage";
import FindLocationPage from "./components/pages/FindLocationPage";
import FireVulner from "./components/pages/FireVulner";
import "./index.css";


function App() {

  return (
    <BrowserRouter>
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/location" element={<FindLocationPage />} />
      <Route path="/fire-vulner" element={<FireVulner />} />
    </Routes>
    </BrowserRouter>
  )
}



export default App