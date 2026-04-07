import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';

function AdminDashboard() {
  const [products, setProducts] = useState([]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (error) { console.error(error); }
  };

 const deleteProduct = async (id) => {
  if (!id) return alert("Invalid Product ID");

  if (window.confirm("Are you sure you want to delete this product?")) {
    try {
      // FIX: Ensure it is 'products' (plural) and no extra slashes
      await axios.delete(`http://127.0.0.1:8000/api/products/${id}`); 
      
      alert("Deleted successfully");
      fetchProducts(); // Refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete failed! Check if your backend terminal is showing errors.");
    }
  }
};

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2>Inventory Management</h2>
        <Link to="/admin/add"><button className="btn btn-success">Add New Product</button></Link>
      </div>
      <table className="data-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Name</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map(p => (
            <tr key={p.id}>
              <td><small>{p.product_code}</small></td>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.stock}</td>
              <td>
                <Link to={`/admin/edit/${p.id}`}>
                  <button className="btn" style={{ marginRight: '10px' }}>Edit</button>
                </Link>
                {/* Ensure p.id is passed correctly here */}
                <button className="btn btn-danger" onClick={() => deleteProduct(p.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminDashboard;