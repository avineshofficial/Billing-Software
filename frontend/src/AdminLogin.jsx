import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. Accept setAuth as a prop
function AdminLogin({ setAuth }) {
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const ADMIN_PASSWORD = "admin123"; // In production, use environment variables or secure vaults!

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('admin_authenticated', 'true');
      
      // 2. Update the parent state instantly
      setAuth(true); 
      
      navigate('/admin'); 
    } else {
      alert("Incorrect Admin Password!");
      setPassword('');
    }
  };

  return (
    <div className="form-card" style={{marginTop: '100px', maxWidth: '400px'}}>
      <h2 style={{textAlign: 'center'}}>Admin Access</h2>
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <input 
            type="password" 
            placeholder="Enter Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            style={{textAlign: 'center'}}
            autoFocus
            required 
          />
        </div>
        <button type="submit" className="pay-button" style={{width: '100%'}}>Login</button>
      </form>
    </div>
  );
}

export default AdminLogin;