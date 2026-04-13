import { useState } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Billing from './Billing';
import AdminDashboard from './AdminDashboard';
import AddProduct from './AddProduct';
import EditProduct from './EditProduct';
import Reports from './Reports';
import AdminLogin from './AdminLogin';
import './App.css';
import BulkAddProduct from './BulkAddProduct';
import AuditLogs from './AuditLogs';

function App() {
  // Track if Admin is logged in
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('admin_authenticated') === 'true'
  );

  const logoutAdmin = () => {
    localStorage.removeItem('admin_authenticated');
    setIsAuthenticated(false);
    window.location.href = "/"; 
  };

  // --- PROTECTED ROUTE WRAPPER (Used ONLY for Admin now) ---
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };

  return (
    <>
      <nav className="navbar">
        <h2>நெருங்கிய கூட்டாளி</h2>
        <div className="nav-links">
          <NavLink to="/">POS</NavLink>
          
          {/* Everyone can see and click Reports now */}
          <NavLink to="/reports">Reports</NavLink>
          
          <NavLink to="/admin">Admin</NavLink>
          <NavLink to="/admin/logs">Edit Logs</NavLink>
          
          {/* Logout only shows if Admin is logged in */}
          {isAuthenticated && (
            <button onClick={logoutAdmin} className="btn-logout">Logout Admin</button>
          )}
        </div>
      </nav>

      <main className="container">
        <Routes>
          {/* 1. PUBLIC ROUTES (No Password) */}
          <Route path="/" element={<Billing />} />
          <Route path="/reports" element={<Reports />} />
          
          {/* 2. LOGIN ROUTE */}
          <Route 
            path="/login" 
            element={<AdminLogin setAuth={setIsAuthenticated} />} 
          />

          {/* 3. PROTECTED ADMIN ROUTES (Password Required) */}
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/add" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/admin/edit/:id" element={<ProtectedRoute><EditProduct /></ProtectedRoute>} />
          <Route path="/admin/logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
          <Route path="/admin/bulk-add" element={<ProtectedRoute><BulkAddProduct /></ProtectedRoute>} />
        </Routes>
      </main>
    </>
  );
}

export default App;