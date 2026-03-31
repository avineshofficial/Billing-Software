import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';

function AddProduct() {
  // 1. Initial state - we set a default, but it will change on user input
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    gst_percentage: '5', // Default starting value
    stock: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();

  // 2. Universal handler for all inputs and select boxes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value // This dynamically updates name, category, OR gst_percentage
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalImagePath = "";

    try {
      // Upload Image if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await axios.post(`${API_URL}/upload`, formData);
        finalImagePath = uploadRes.data.url;
      }

      // 3. Save the Product
      await axios.post(`${API_URL}/products`, {
        ...form,
        image_url: finalImagePath,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        // Ensure we send the value CURRENTLY in the form state
        gst_percentage: parseInt(form.gst_percentage) 
      });
      
      navigate('/admin');
    } catch (err) {
      console.error(err);
      alert("Error saving product. Please try again.");
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ textAlign: 'center', color: 'var(--primary-color)' }}>Add New Product</h2>
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label>Product Name</label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
            placeholder="e.g. Vanilla Scoop" 
            required 
          />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input 
            name="category" 
            value={form.category} 
            onChange={handleChange} 
            placeholder="e.g. Ice Cream" 
            required 
          />
        </div>

        <div className="form-group">
          <label>Product Image</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={e => setSelectedFile(e.target.files[0])} 
          />
        </div>

        <div className="form-group">
          <label>Base Price (₹)</label>
          <input 
            name="price" 
            type="number" 
            step="0.01" 
            value={form.price} 
            onChange={handleChange} 
            required 
          />
        </div>

        {/* --- FIXED GST SELECT --- */}
        <div className="form-group">
          <label>GST Percentage (%)</label>
          <select 
            name="gst_percentage" 
            value={form.gst_percentage} 
            onChange={handleChange} 
            className="form-select"
          >
            <option value="5">5% GST</option>
            <option value="12">12% GST</option>
            <option value="18">18% GST</option>
            <option value="28">28% GST</option>
          </select>
        </div>

        <div className="form-group">
          <label>Stock Quantity</label>
          <input 
            name="stock" 
            type="number" 
            value={form.stock} 
            onChange={handleChange} 
            required 
          />
        </div>

        <button type="submit" className="pay-button" style={{ width: '100%', marginTop: '10px' }}>
          Save Product
        </button>
      </form>
    </div>
  );
}

export default AddProduct;