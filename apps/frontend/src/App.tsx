import { Route, Routes } from 'react-router-dom';
import './App.css'
import ExhibitionManagementPage from './pages/ExManagePage';


function App() {
  const x = 29;
  console.log(x);
  return (
    <>
      <Routes>
        <Route path="/" element={<ExhibitionManagementPage />} />
        {/* <Route path="/homepage" element{<HomePage/>}/> */}
      </Routes>
    </>
  )
}

export default App
