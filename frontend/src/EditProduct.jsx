import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';
const BASE_URL = 'http://127.0.0.1:8000';

function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    gst_percentage: '18',
    stock: '',
    image_url: '' // Existing image path
  });
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL}/products`);
        const product = res.data.find(p => p.id === id);
        if (product) {
          setForm({
            name: product.name,
            category: product.category,
            price: product.price,
            gst_percentage: product.gst_percentage.toString(),
            stock: product.stock,
            image_url: product.image_url
          });
        }
      } catch (error) { console.error(error); }
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let finalImagePath = form.image_url;

    try {
      // 1. If a NEW file is selected, upload it first
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await axios.post(`${API_URL}/upload`, formData);
        finalImagePath = uploadRes.data.url;
      }

      // 2. Update the product with either the NEW or OLD image path
      await axios.put(`${API_URL}/products/${id}`, {
        ...form,
        image_url: finalImagePath,
        price: parseFloat(form.price),
        stock: parseInt(form.stock),
        gst_percentage: parseInt(form.gst_percentage)
      });
      navigate('/admin');
    } catch (error) {
      alert("Update failed");
    }
  };

  return (
    <div className="form-card">
      <h2 style={{ textAlign: 'center' }}>Edit Product</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Product Name</label>
          <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
        </div>

        <div className="form-group">
          <label>Category</label>
          <input value={form.category} onChange={e => setForm({...form, category: e.target.value})} required />
        </div>

        {/* IMAGE SECTION */}
        <div className="form-group">
          <label>Current Image</label>
          {form.image_url && (
            <img 
              src={`${BASE_URL}${form.image_url}`} 
              alt="Current" 
              style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', display: 'block', marginBottom: '10px' }} 
            />
          )}
          <label>Upload New Image (Optional)</label>
          <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} />
        </div>

        <div className="form-group">
          <label>Price (₹)</label>
          <input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} required />
        </div>

        <div className="form-group">
          <label>GST (%)</label>
          <select value={form.gst_percentage} onChange={e => setForm({...form, gst_percentage: e.target.value})}>
            <option value="5">5%</option>
            <option value="12">12%</option>
            <option value="18">18%</option>
          </select>
        </div>

        <div className="form-group">
          <label>Stock</label>
          <input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} required />
        </div>

        <button type="submit" className="pay-button" style={{ width: '100%' }}>Update Product</button>
      </form>
    </div>
  );
}

export default EditProduct;