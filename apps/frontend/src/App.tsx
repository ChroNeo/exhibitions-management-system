import { Route, Routes } from 'react-router-dom';
import ExhibitionPage from './pages/ExManagePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<ExhibitionPage />} />
    </Routes>
  );
}

export default App;
