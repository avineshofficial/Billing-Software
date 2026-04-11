import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://127.0.0.1:8000/api';

function BulkAddProduct() {
  const navigate = useNavigate();
  // Start with 5 empty rows
  const [rows, setRows] = useState([
    { name: '', product_code: '', category: '', mrp: '', price: '', stock: '', gst_percentage: '0' },
    { name: '', product_code: '', category: '', mrp: '', price: '', stock: '', gst_percentage: '0' },
    { name: '', product_code: '', category: '', mrp: '', price: '', stock: '', gst_percentage: '0' },
    { name: '', product_code: '', category: '', mrp: '', price: '', stock: '', gst_percentage: '0' },
    { name: '', product_code: '', category: '', mrp: '', price: '', stock: '', gst_percentage: '0' },
  ]);

  const handleInputChange = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const addMoreRows = () => {
    setRows([...rows, { name: '', product_code: '', category: '', mrp: '', price: '', stock: '', gst_percentage: '0' }]);
  };

  const removeRow = (index) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validProducts = rows.filter(r => r.name.trim() !== "").map(r => ({
      ...r,
      mrp: parseFloat(r.mrp) || 0,
      price: parseFloat(r.price) || 0,
      stock: parseInt(r.stock) || 0,
      gst_percentage: parseInt(r.gst_percentage) || 0,
    }));

    if (validProducts.length === 0) return alert("Please enter at least one product name.");

    try {
      await axios.post(`${API_URL}/products/bulk`, validProducts);
      alert(`${validProducts.length} Products added!`);
      navigate('/admin');
    } catch (error) {
      alert("Error saving bulk products.");
    }
  };

  return (
    <div className="bulk-container">
  <div className="admin-header">
    <h2>Bulk Add Products</h2>
    <div style={{ display: 'flex', gap: '12px' }}>
      <button className="btn-add-row" onClick={addMoreRows}>+ Add Row</button>
      <button className="btn-save-all" onClick={handleSubmit}>Save All Products</button>
    </div>
  </div>

  <div className="bulk-table-wrapper">
    <table className="bulk-table">
      <thead>
        <tr>
          <th>Product Name *</th>
          <th>Code</th>
          <th>Category</th>
          <th>MRP</th>
          <th>Sale Price</th>
          <th>Stock</th>
          <th>GST %</th>
          <th></th>
        </tr>
      </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              <td><input value={row.name} onChange={(e) => handleInputChange(index, 'name', e.target.value)} placeholder="Item Name" /></td>
              <td><input value={row.product_code} onChange={(e) => handleInputChange(index, 'product_code', e.target.value)} placeholder="Code" /></td>
              <td><input value={row.category} onChange={(e) => handleInputChange(index, 'category', e.target.value)} placeholder="Category" /></td>
              <td><input type="number" value={row.mrp} onChange={(e) => handleInputChange(index, 'mrp', e.target.value)} placeholder="0" /></td>
              <td><input type="number" value={row.price} onChange={(e) => handleInputChange(index, 'price', e.target.value)} placeholder="0" /></td>
              <td><input type="number" value={row.stock} onChange={(e) => handleInputChange(index, 'stock', e.target.value)} placeholder="0" /></td>
              <td>
                <select value={row.gst_percentage} onChange={(e) => handleInputChange(index, 'gst_percentage', e.target.value)}>
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                </select>
              </td>
              <td><button className="remove-row" onClick={() => removeRow(index)}>&times;</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
   </div>
  );
}

export default BulkAddProduct;