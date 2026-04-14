import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = 'http://127.0.0.1:8000/api';

function Reports() {
  const [sales, setSales] = useState([]);
  const [editingSale, setEditingSale] = useState(null);

  // --- NEW DATE STATES ---
  // Defaulting both to today's date (YYYY-MM-DD format)
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_URL}/sales`);
      setSales(res.data.reverse()); 
    } catch (err) { console.error("Error fetching sales:", err); }
  };

  // --- INCOME CALCULATIONS (Fixed Totals) ---
  const now = new Date();
  
  const dailyIncome = sales.filter(s => new Date(s.timestamp).toDateString() === now.toDateString())
                           .reduce((sum, s) => sum + (s.total_amount || 0), 0);

  const monthlyIncome = sales.filter(s => {
    const d = new Date(s.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, s) => sum + (s.total_amount || 0), 0);

  const yearlyIncome = sales.filter(s => new Date(s.timestamp).getFullYear() === now.getFullYear())
                           .reduce((sum, s) => sum + (s.total_amount || 0), 0);

  // --- NEW FILTER LOGIC: DATE RANGE ---
  const getFilteredSales = () => {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    return sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= start && saleDate <= end;
    });
  };

  const filteredSalesList = getFilteredSales();

  // --- EDIT LOGIC (Recalculation) ---
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
    const currentDisc = editingSale.discount || 0;

    setEditingSale({
      ...editingSale,
      items: updatedItems,
      subtotal: newSubtotal,
      tax: newTax,
      total_amount: Math.max(0, (newSubtotal + newTax) - currentDisc),
      savings: (newMrpTotal - newSubtotal) + currentDisc
    });
  };

  const saveChanges = async () => {
    try {
      await axios.put(`${API_URL}/sales/${editingSale.id}`, editingSale);
      alert("Bill Updated Successfully!");
      setEditingSale(null);
      fetchSales(); 
    } catch (err) { alert("Update failed"); }
  };

  const downloadExcel = () => {
    const excelData = filteredSalesList.map(s => ({
      "Date": new Date(s.timestamp).toLocaleString(),
      "Bill No": s.bill_no,
      "Items": s.items.map(i => `${i.quantity}x ${i.name}`).join(", "),
      "Total Amount": s.total_amount.toFixed(2),
      "Pay Mode": s.payment_method
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, `Sales_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="reports-page">
      {/* 1. TOP SUMMARY CONTAINERS */}
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

      {/* 2. UPDATED DATE RANGE FILTER BAR */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>From:</label>
          <input 
            type="date" 
            className="date-input" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
          <label>To:</label>
          <input 
            type="date" 
            className="date-input" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
          />
        </div>
        <button className="btn btn-excel" onClick={downloadExcel}>📥 Download Excel Report</button>
      </div>

      <div style={{ margin: '20px 0' }}>
        <h2 style={{margin:0}}>Bill History ({filteredSalesList.length} bills found)</h2>
      </div>

      {/* 3. TRANSACTION TABLE */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Bill No</th>
            <th>Items</th>
            <th>Total Amount</th>
            <th>Mode</th>
            <th style={{textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredSalesList.length > 0 ? (
            filteredSalesList.map(sale => (
              <tr key={sale.id}>
                <td style={{fontSize: '0.85rem'}}>{new Date(sale.timestamp).toLocaleString()}</td>
                <td><strong>#{sale.bill_no}</strong></td>
                <td>
                  {sale.items.map((i, idx) => (
                    <div key={idx} style={{fontSize: '0.8rem'}}>{i.quantity}x {i.name}</div>
                  ))}
                </td>
                <td style={{ fontWeight: 'bold' }}>₹{(sale.total_amount || 0).toFixed(2)}</td>
                <td><span className="pay-badge">{sale.payment_method}</span></td>
                <td style={{textAlign: 'center'}}>
                  <button className="btn" onClick={() => setEditingSale(JSON.parse(JSON.stringify(sale)))}>Edit Bill</button>
                </td>
              </tr>
            ))
          ) : (
            <tr><td colSpan="6" style={{textAlign:'center', padding: '40px', color: '#999'}}>No data available for selected dates.</td></tr>
          )}
        </tbody>
      </table>

      {/* EDIT MODAL */}
      {editingSale && (
        <div className="edit-bill-overlay">
          <div className="edit-bill-modal">
            <div className="edit-modal-header">
                <h3>Edit Bill # {editingSale.bill_no}</h3>
                <button className="close-x" onClick={() => setEditingSale(null)}>&times;</button>
            </div>
            <div className="edit-items-list">
              {editingSale.items.map(item => (
                <div key={item.id} className="edit-item-row">
                  <div style={{flex: 1}}>
                    <strong>{item.name}</strong>
                    <div style={{fontSize: '0.7rem', color: '#666'}}>₹{item.price} per unit</div>
                  </div>
                  <div className="qty-controls">
                    <div className="qty-input-group">
                      <button className="qty-btn" onClick={() => updateItemQty(item.id, -1)}>−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateItemQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="edit-footer">
               <h2 style={{margin: '0 0 15px 0'}}>New Total: ₹{(editingSale.total_amount || 0).toFixed(2)}</h2>
               <div style={{display: 'flex', gap: '10px'}}>
                    <button className="btn btn-danger" style={{flex: 1}} onClick={() => setEditingSale(null)}>Cancel</button>
                    <button className="btn btn-success" style={{flex: 2}} onClick={saveChanges}>Update Bill</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reports;