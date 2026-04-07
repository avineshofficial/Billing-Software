import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';

function AddProduct() {
  const [form, setForm] = useState({
    product_code: '',
    name: '',
    category: '',
    price: '',
    mrp: '',
    gst_percentage: '18',
    stock: ''
  });
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/products`, {
        ...form,
        price: parseFloat(form.price),
        mrp: parseFloat(form.mrp),
        stock: parseInt(form.stock),
        gst_percentage: parseInt(form.gst_percentage)
      });
      navigate('/admin');
    } catch (err) {
      alert("Error saving product.");
    }
  };

  return (
    <div className="form-card" style={{maxWidth: '800px'}}>
      <h2 style={{textAlign: 'center', color: 'var(--primary-color)'}}>Add New Inventory Item</h2>
      <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
        
        <div className="form-group">
          <label>Product Code / SKU</label>
          <input name="product_code" placeholder="e.g. HS-101" value={form.product_code} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Product Name</label>
          <input name="name" placeholder="e.g. Vanilla Chocolate" value={form.name} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input name="category" placeholder="e.g. Ice Cream" value={form.category} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Stock Quantity</label>
          <input name="stock" type="number" placeholder="100" value={form.stock} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>MRP (₹)</label>
          <input name="mrp" type="number" step="0.01" placeholder="150" value={form.mrp} onChange={handleChange} required />
        </div>

        <div className="form-group">
          <label>Sales Price (₹) <small>(Base Price)</small></label>
          <input name="price" type="number" step="0.01" placeholder="120" value={form.price} onChange={handleChange} required />
        </div>

        <div className="form-group" style={{gridColumn: 'span 2'}}>
          <label>Tax Name (GST %)</label>
          <select name="gst_percentage" value={form.gst_percentage} onChange={handleChange} className="form-select">
            <option value="0">GST 0%</option>
            <option value="5">GST 5%</option>
            <option value="12">GST 12%</option>
            <option value="18">GST 18%</option>
          </select>
        </div>

        <button type="submit" className="pay-button" style={{gridColumn: 'span 2'}}>
          Save Product to Database
        </button>
      </form>
    </div>
  );
}

export default AddProduct;