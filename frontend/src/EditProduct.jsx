import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    product_code: '',
    name: '',
    category: '',
    price: '',
    mrp: '',
    gst_percentage: '0',
    stock: ''
  });

  // Fetch existing product data
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL}/products`);
        const p = res.data.find(item => str(item.id) === str(id));
        if (p) {
          setForm({
            product_code: p.product_code || '',
            name: p.name || '',
            category: p.category || '',
            price: p.price || '',
            mrp: p.mrp || '',
            gst_percentage: p.gst_percentage ? p.gst_percentage.toString() : '0',
            stock: p.stock || ''
          });
        }
      } catch (error) {
        console.error("Error loading product:", error);
      }
    };
    fetchProduct();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Product Name is required!");
      return;
    }

    // Prepare cleaned data for update
    const updatedData = {
      product_code: form.product_code.trim() || "N/A",
      name: form.name.trim(),
      category: form.category.trim() || "General",
      price: parseFloat(form.price) || 0,
      mrp: parseFloat(form.mrp) || 0,
      gst_percentage: parseInt(form.gst_percentage) || 0,
      stock: parseInt(form.stock) || 0,
      image_url: "" 
    };

    try {
      await axios.put(`${API_URL}/products/${id}`, updatedData);
      alert("Product updated successfully!");
      navigate('/admin');
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update product.");
    }
  };

  // Helper to safely compare IDs
  function str(val) { return String(val); }

  return (
    <div className="form-card" style={{ maxWidth: '850px' }}>
      <div className="form-header-pro" style={{ borderBottomColor: '#f59e0b' }}>
         <span className="step-badge" style={{ backgroundColor: '#f59e0b' }}>Edit Mode</span>
         <h2 className="form-title-pro">Update Inventory Item</h2>
      </div>

      <form onSubmit={handleSubmit} className="grid-form">
        {/* Row 1 */}
        <div className="form-group">
          <label>Product Code / SKU</label>
          <input 
            name="product_code" 
            value={form.product_code} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Product Name <span className="req">*</span></label>
          <input 
            name="name" 
            value={form.name} 
            onChange={handleChange} 
          />
        </div>

        {/* Row 2 */}
        <div className="form-group">
          <label>Category</label>
          <input 
            name="category" 
            value={form.category} 
            onChange={handleChange} 
          />
        </div>

        <div className="form-group">
          <label>Stock Quantity</label>
          <input 
            name="stock" 
            type="number" 
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
            value={form.price} 
            onChange={handleChange} 
          />
        </div>

        {/* Tax Row */}
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
           <button type="button" className="btn btn-danger" onClick={() => navigate('/admin')}>Discard Changes</button>
           <button type="submit" className="pay-button" style={{ marginTop: 0, backgroundColor: '#f59e0b' }}>Update Product</button>
        </div>
      </form>
    </div>
  );
}

export default EditProduct;