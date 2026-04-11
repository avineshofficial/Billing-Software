import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const deleteProduct = async (id) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(`${API_URL}/products/${id}`);
        fetchProducts();
      } catch (error) {
        alert("Delete failed.");
      }
    }
  };

  // --- IMPROVED FILTER LOGIC ---
  const filteredProducts = products.filter((p) => {
    const search = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) ||
      (p.product_code && p.product_code.toLowerCase().includes(search)) ||
      (p.category && p.category.toLowerCase().includes(search))
    );
  });

  return (
    <div className="admin-container">
  <div className="admin-header">
    <div>
      <h2>Inventory Management</h2>
      <p className="results-count">Showing {filteredProducts.length} products</p>
    </div>
    {/* Main Primary Action on the right */}
    
  </div>

  <div className="admin-action-bar">
    <Link to="/admin/bulk-add">
      <button className="btn btn-primary" style={{backgroundColor: '#3b82f6'}}>📦 Bulk Add</button>
    </Link>
    {/* Optional: Remove or keep this button if you like it here too */}
    <Link to="/admin/add">
      <button className="btn" style={{backgroundColor: '#10b981', color: 'white'}}>+ Single Add</button>
    </Link>
  </div>

      {/* --- BETTER SEARCH BAR --- */}
      <div className="admin-search-wrapper">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input 
            type="text" 
            className="admin-search-input"
            placeholder="Search by Product Name, Code (SKU), or Category..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm("")}>&times;</button>
          )}
        </div>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>MRP</th>
              <th>Sale Price</th>
              <th>Stock</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <tr key={p.id}>
                  <td><code className="code-label">{p.product_code || 'N/A'}</code></td>
                  <td><strong>{p.name}</strong></td>
                  <td><span className="cat-badge">{p.category}</span></td>
                  <td className="text-muted">₹{p.mrp}</td>
                  <td className="text-primary">₹{p.price}</td>
                  <td className={p.stock < 10 ? 'text-danger' : ''}>
                    {p.stock}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <Link to={`/admin/edit/${p.id}`}>
                      <button className="btn-edit">Edit</button>
                    </Link>
                    <button className="btn-del" onClick={() => deleteProduct(p.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">No products found matching "{searchTerm}"</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;