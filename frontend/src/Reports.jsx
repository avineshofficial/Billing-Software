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
      // Reverse to show newest first
      setSales(res.data.reverse());
    } catch (err) {
      console.error("Error fetching sales:", err);
    }
  };

  // --- 1. DELETE FUNCTION ---
  const deleteSale = async (id) => {
    if (window.confirm("Are you sure you want to delete this record? This cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/sales/${id}`);
        fetchSales(); // Refresh the list after deleting
      } catch (err) {
        alert("Failed to delete the record. Check if backend is running.");
      }
    }
  };

  // --- 2. EDIT LOGIC ---
  const handleEditClick = (sale) => {
    setEditingSale(JSON.parse(JSON.stringify(sale)));
  };

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

    setEditingSale({
      ...editingSale,
      items: updatedItems,
      subtotal: newSubtotal,
      tax: newTax,
      total_amount: newSubtotal + newTax
    });
  };

  const saveChanges = async () => {
    try {
      await axios.put(`${API_URL}/sales/${editingSale.id}`, editingSale);
      alert("Bill Updated & Stock Adjusted!");
      setEditingSale(null);
      fetchSales();
    } catch (err) {
      alert("Error updating bill");
    }
  };

  // --- 3. INCOME CALCULATIONS ---
  const now = new Date();
  const dailyIncome = sales.filter(s => {
    const d = new Date(s.timestamp);
    return d.toDateString() === now.toDateString();
  }).reduce((sum, s) => sum + s.total_amount, 0);

  const monthlyIncome = sales.filter(s => {
    const d = new Date(s.timestamp);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, s) => sum + s.total_amount, 0);

  const yearlyIncome = sales.filter(s => {
    const d = new Date(s.timestamp);
    return d.getFullYear() === now.getFullYear();
  }).reduce((sum, s) => sum + s.total_amount, 0);

  const downloadExcel = () => {
    const excelData = sales.filter(s => s.total_amount > 0).map(s => ({
      "Date": new Date(s.timestamp).toLocaleString(),
      "Items": s.items.map(i => `${i.quantity}x ${i.name}`).join(", "),
      "Total Amount (₹)": s.total_amount.toFixed(2)
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sales Report");
    XLSX.writeFile(wb, "Hashi_Sales_Report.xlsx");
  };

  return (
    <div className="reports-page">
      {/* SUMMARY CONTAINERS */}
      <div className="report-summary-grid">
        <div className="summary-box daily">
          <h4>Today's Income</h4>
          <p>₹{dailyIncome.toFixed(2)}</p>
        </div>
        <div className="summary-box monthly">
          <h4>This Month</h4>
          <p>₹{monthlyIncome.toFixed(2)}</p>
        </div>
        <div className="summary-box yearly">
          <h4>This Year</h4>
          <p>₹{yearlyIncome.toFixed(2)}</p>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '30px 0' }}>
        <h2>Transaction History</h2>
        <button className="btn btn-excel" onClick={downloadExcel}>📥 Download Excel</button>
      </div>

      {/* EDIT MODAL */}
      {editingSale && (
        <div className="edit-bill-overlay">
          <div className="edit-bill-modal">
            <h3>Edit Bill Quantities</h3>
            <div className="edit-items-list">
              {editingSale.items.map(item => (
                <div key={item.id} className="edit-item-row">
                  <span>{item.name}</span>
                  <div className="qty-controls">
                    <div className="qty-input-group">
                      <button className="qty-btn" onClick={() => updateItemQty(item.id, -1)}>-</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => updateItemQty(item.id, 1)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="edit-footer">
              <h4>Total: ₹{editingSale.total_amount.toFixed(2)}</h4>
              <button className="btn btn-danger" onClick={() => setEditingSale(null)}>Cancel</button>
              <button className="btn btn-success" onClick={saveChanges} style={{marginLeft: '10px'}}>Update Bill</button>
            </div>
          </div>
        </div>
      )}

      {/* --- DATA TABLE WITH DELETE & FILTER --- */}
      <table className="data-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Items Sold</th>
            <th>Total Amount</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales
            .filter(sale => sale.total_amount > 0) // Automatically hides ₹0 or empty bills
            .map(sale => (
              <tr key={sale.id}>
                <td>{new Date(sale.timestamp).toLocaleString()}</td>
                <td>
                  {sale.items.map((i, idx) => (
                    <div key={idx} style={{fontSize: '0.85rem'}}>{i.quantity}x {i.name}</div>
                  ))}
                </td>
                <td style={{ fontWeight: 'bold' }}>₹{sale.total_amount.toFixed(2)}</td>
                <td style={{ textAlign: 'center' }}>
                  <button 
                    className="btn" 
                    style={{ marginRight: '10px', backgroundColor: '#3b82f6' }} 
                    onClick={() => handleEditClick(sale)}
                  >
                    Edit
                  </button>

                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

export default Reports;