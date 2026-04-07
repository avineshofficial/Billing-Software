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

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`${API_URL}/products`);
        const p = res.data.find(product => product.id === id);
        if (p) {
          setForm({
            // Provide fallback values for old data
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
        console.error("Failed to fetch product", error);
      }
    };
    fetchProduct();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.put(`${API_URL}/products/${id}`, {
      ...form,
      price: parseFloat(form.price),
      mrp: parseFloat(form.mrp),
      stock: parseInt(form.stock),
      gst_percentage: parseInt(form.gst_percentage)
    });
    navigate('/admin');
  };

  return (
    <div className="form-card" style={{maxWidth: '800px'}}>
      <h2>Edit Inventory Item</h2>
      <form onSubmit={handleSubmit} style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px'}}>
        <div className="form-group"><label>Product Code</label><input name="product_code" value={form.product_code} onChange={e => setForm({...form, product_code: e.target.value})} /></div>
        <div className="form-group"><label>Product Name</label><input name="name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></div>
        <div className="form-group"><label>Category</label><input name="category" value={form.category} onChange={e => setForm({...form, category: e.target.value})} /></div>
        <div className="form-group"><label>Stock</label><input name="stock" type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
        <div className="form-group"><label>MRP (₹)</label><input name="mrp" type="number" value={form.mrp} onChange={e => setForm({...form, mrp: e.target.value})} /></div>
        <div className="form-group"><label>Sales Price (₹)</label><input name="price" type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} /></div>
        <div className="form-group" style={{gridColumn: 'span 2'}}>
          <label>Tax Name (GST %)</label>
          <select name="gst_percentage" value={form.gst_percentage} onChange={e => setForm({...form, gst_percentage: e.target.value})}>
            <option value="0">GST 0%</option>
            <option value="5">GST 5%</option>
            <option value="12">GST 12%</option>
            <option value="18">GST 18%</option>
          </select>
        </div>
        <button type="submit" className="pay-button" style={{gridColumn: 'span 2'}}>Update Product</button>
      </form>
    </div>
  );
}

export default EditProduct;