import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = 'http://127.0.0.1:8000/api';

function Reports() {
  const [sales, setSales] = useState([]);
  const [editingSale, setEditingSale] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_URL}/sales`);
      // Sort newest transactions to the top
      setSales(res.data.reverse());
    } catch (err) {
      console.error("Error fetching sales:", err);
    }
  };

  // --- INCOME CALCULATIONS ---
  const now = new Date();
  
  // 1. Today's Income
  const dailyIncome = sales.filter(s => {
    const saleDate = new Date(s.timestamp);
    return saleDate.toDateString() === now.toDateString();
  }).reduce((sum, s) => sum + (s.total_amount || 0), 0);

  // 2. This Month's Income
  const monthlyIncome = sales.filter(s => {
    const saleDate = new Date(s.timestamp);
    return saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear();
  }).reduce((sum, s) => sum + (s.total_amount || 0), 0);

  // 3. This Year's Income
  const yearlyIncome = sales.filter(s => {
    const saleDate = new Date(s.timestamp);
    return saleDate.getFullYear() === now.getFullYear();
  }).reduce((sum, s) => sum + (s.total_amount || 0), 0);


  // --- EDIT BILL LOGIC (Recalculates everything in real-time) ---
  const updateItemQty = (productId, delta) => {
    const updatedItems = editingSale.items.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);

    const newSubtotal = updatedItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const newTax = updatedItems.reduce((sum, i) => sum + (i.price * (i.gst_percentage || 0) / 100 * i.quantity), 0);
    const newMrpTotal = updatedItems.reduce((sum, i) => sum + ((i.mrp || i.price) * i.quantity), 0);

    const currentDiscount = editingSale.discount || 0;
    const newTotal = Math.max(0, (newSubtotal + newTax) - currentDiscount);
    const newSavings = (newMrpTotal - newSubtotal) + currentDiscount;

    setEditingSale({
      ...editingSale,
      items: updatedItems,
      subtotal: newSubtotal,
      tax: newTax,
      total_amount: newTotal,
      savings: newSavings
    });
  };

  const saveChanges = async () => {
    // Ensure all numeric fields are actually numbers before sending
    const cleanedData = {
      ...editingSale,
      total_amount: parseFloat(editingSale.total_amount) || 0,
      subtotal: parseFloat(editingSale.subtotal) || 0,
      tax: parseFloat(editingSale.tax) || 0,
      discount: parseFloat(editingSale.discount) || 0,
      savings: parseFloat(editingSale.savings) || 0,
      // Clean the items to match the backend model exactly
      items: editingSale.items.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price) || 0,
        quantity: parseInt(item.quantity) || 0,
        gst_percentage: parseInt(item.gst_percentage) || 0,
        mrp: parseFloat(item.mrp || item.price) || 0
      }))
    };

    try {
      await axios.put(`${API_URL}/sales/${editingSale.id}`, cleanedData);
      alert("Bill Updated Successfully!");
      setEditingSale(null);
      fetchSales(); 
    } catch (err) {
      console.error("Update error detail:", err.response?.data);
      alert("Error: Update failed. Check browser console for details.");
    }
  };

  const downloadExcel = () => {
    const excelData = sales.filter(s => s.total_amount > 0).map(s => ({
      "Date": new Date(s.timestamp).toLocaleString(),
      "Items": s.items.map(i => `${i.quantity}x ${i.name}`).join(", "),
      "Total Amount (₹)": (s.total_amount || 0).toFixed(2),
      "Savings (₹)": (s.savings || 0).toFixed(2)
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Hashi Sales Report");
    XLSX.writeFile(wb, `Sales_Report_${now.toLocaleDateString()}.xlsx`);
  };

  return (
    <div className="reports-container">
      {/* 1. TOP INCOME CONTAINERS */}
      <div className="report-summary-grid">
        <div className="summary-box daily">
          <h4>TODAY'S INCOME</h4>
          <p>₹{dailyIncome.toFixed(2)}</p>
        </div>
        <div className="summary-box monthly">
          <h4>THIS MONTH</h4>
          <p>₹{monthlyIncome.toFixed(2)}</p>
        </div>
        <div className="summary-box yearly">
          <h4>THIS YEAR</h4>
          <p>₹{yearlyIncome.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '30px 0 20px 0' }}>
        <h2 style={{margin: 0}}>Transaction History</h2>
        <button className="btn btn-excel" onClick={downloadExcel}>📥 Download Excel Report</button>
      </div>

      {/* EDIT MODAL */}
      {editingSale && (
  <div className="edit-bill-overlay">
    <div className="edit-bill-modal">
      
      {/* 1. Header (Fixed) */}
      <div className="edit-modal-header">
        <h3>Edit Bill Items</h3>
        <p style={{ fontSize: '0.8rem', color: '#666' }}>Sale ID: {editingSale.id}</p>
      </div>

      {/* 2. Scrollable List (Scrolls when items > screen) */}
      <div className="edit-items-list">
        {editingSale.items.map(item => (
          <div key={item.id} className="edit-item-row">
            <div style={{ flex: 1 }}>
              <strong>{item.name}</strong>
              <div style={{ fontSize: '0.7rem' }}>₹{item.price} / unit</div>
            </div>
            <div className="qty-controls">
              <div className="qty-input-group">
                <button type="button" className="qty-btn" onClick={() => updateItemQty(item.id, -1)}>−</button>
                <span className="qty-val">{item.quantity}</span>
                <button type="button" className="qty-btn" onClick={() => updateItemQty(item.id, 1)}>+</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Footer (Fixed at bottom) */}
      <div className="edit-footer">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span>Tax: ₹{editingSale.tax.toFixed(2)}</span>
          <span style={{ fontWeight: 'bold' }}>New Total: ₹{editingSale.total_amount.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setEditingSale(null)}>Cancel</button>
          <button type="button" className="btn btn-success" style={{ flex: 2 }} onClick={saveChanges}>Update Bill</button>
        </div>
      </div>

    </div>
  </div>
)}

      {/* DATA TABLE */}
      <table className="data-table">
        <thead>
          <tr>
            <th>DATE & TIME</th>
            <th>ITEMS SOLD</th>
            <th>TOTAL AMOUNT</th>
            <th>CUSTOMER SAVINGS</th>
            <th style={{textAlign: 'center'}}>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {sales.filter(s => s.total_amount > 0).map(sale => (
            <tr key={sale.id}>
              <td>{new Date(sale.timestamp).toLocaleString()}</td>
              <td>{sale.items.map((i,idx) => <div key={idx} style={{fontSize: '0.85rem'}}>{i.quantity}x {i.name}</div>)}</td>
              <td style={{ fontWeight: 'bold' }}>₹{(sale.total_amount || 0).toFixed(2)}</td>
              <td style={{color: '#11b981', fontWeight: '600'}}>₹{(sale.savings || 0).toFixed(2)}</td>
              <td style={{textAlign: 'center'}}>
                <button className="btn" onClick={() => setEditingSale(JSON.parse(JSON.stringify(sale)))}>Edit Bill</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;