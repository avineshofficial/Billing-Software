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
    gst_percentage: '0', // Default starting value
    stock: ''
  });
  
  const navigate = useNavigate();

  // Unified change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Only Name is absolutely required
    if (!form.name.trim()) {
      alert("Product Name is required!");
      return;
    }

    // Prepare data with fallbacks (Flexible Logic)
    const cleanedData = {
      product_code: form.product_code.trim() || "N/A",
      name: form.name.trim(),
      category: form.category.trim() || "General",
      price: parseFloat(form.price) || 0,
      mrp: parseFloat(form.mrp) || 0,
      gst_percentage: parseInt(form.gst_percentage) || 0,
      stock: parseInt(form.stock) || 0,
      image_url: "" // No image as per requirement
    };

    try {
      await axios.post(`${API_URL}/products`, cleanedData);
      alert("Product added to inventory!");
      navigate('/admin');
    } catch (error) {
      console.error("Save error:", error.response?.data);
      alert("Error saving product. Check backend connection.");
    }
  };

  return (
    <div className="form-card" style={{ maxWidth: '850px' }}>
      <div className="form-header-pro">
         <span className="step-badge">1. General</span>
         <h2 className="form-title-pro">Add New Inventory Item</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid-form">
        {/* Row 1 */}
        <div className="form-group">
          <label>Product Code / SKU <small>(Optional)</small></label>
          <input 
            name="product_code" 
            placeholder="e.g. HS-101" 
            value={form.product_code} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Product Name <span className="req">*</span></label>
          <input 
            name="name" 
            placeholder="e.g. Vanilla Chocolate Scoop" 
            value={form.name} 
            onChange={handleChange} 
          />
        </div>

        {/* Row 2 */}
        <div className="form-group">
          <label>Category</label>
          <input 
            name="category" 
            placeholder="e.g. Ice Cream, Shakes" 
            value={form.category} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Initial Stock Quantity</label>
          <input 
            name="stock" 
            type="number" 
            placeholder="0" 
            value={form.stock} 
            onChange={handleChange} 
          />
        </div>

        {/* Row 3 */}
        <div className="form-group">
          <label>MRP (₹)</label>
          <input 
            name="mrp" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={form.mrp} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Sales Item Price (Base ₹)</label>
          <input 
            name="price" 
            type="number" 
            step="0.01" 
            placeholder="0.00" 
            value={form.price} 
            onChange={handleChange} 
          />
        </div>

        {/* Full Width Row */}
        <div className="form-group full-width">
          <label>Tax Name (GST %)</label>
          <select 
            name="gst_percentage" 
            value={form.gst_percentage} 
            onChange={handleChange} 
            className="form-select"
          >
            <option value="0">0% (Tax Free)</option>
            <option value="5">GST 5%</option>
            <option value="12">GST 12%</option>
            <option value="18">GST 18%</option>
            <option value="28">GST 28%</option>
          </select>
        </div>

        <div className="form-actions full-width">
           <button type="button" className="btn btn-danger" onClick={() => navigate('/admin')}>Cancel</button>
           <button type="submit" className="pay-button" style={{ marginTop: 0 }}>Save Product</button>
        </div>
      </form>
    </div>
  );
}

export default AddProduct;