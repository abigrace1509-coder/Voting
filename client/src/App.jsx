import { Link, Route, Routes } from 'react-router-dom';
import AdminPage from './pages/AdminPage.jsx';
import HomePage from './pages/HomePage.jsx';
import VoterPage from './pages/VoterPage.jsx';

export default function App() {
  return (
    <div className="container py-4">
      <h2 className="mb-3">Identity-First Voting Portal (MERN)</h2>
      <nav className="mb-4 d-flex gap-3">
        <Link to="/">Home</Link>
        <Link to="/admin">Admin</Link>
        <Link to="/voter">Voter</Link>
      </nav>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/voter" element={<VoterPage />} />
      </Routes>
    </div>
  );
}
