import { Routes, Route, NavLink } from 'react-router-dom';
import Billing from './Billing';
import AdminDashboard from './AdminDashboard';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import Reports from './Reports';
import './App.css';

function App() {
  return (
    <>
      <nav className="navbar">
        <h2>Hashi Ice Spot</h2>
        <div className="nav-links">
          <NavLink to="/">POS</NavLink>
          <NavLink to="/admin">Admin</NavLink>
          <NavLink to="/reports">Reports</NavLink>
        </div>
      </nav>

      <main className="container">
        <Routes>
          <Route path="/" element={<Billing />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/add" element={<AddProduct />} />
          <Route path="/admin/edit/:id" element={<EditProduct />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </>
  );
}

export default App;