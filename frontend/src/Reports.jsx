import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';

const API_URL = 'http://127.0.0.1:8000/api';

function Reports() {
  const [sales, setSales] = useState([]);
  const [editingSale, setEditingSale] = useState(null);

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    try {
      const res = await axios.get(`${API_URL}/sales`);
      setSales(res.data.reverse());
    } catch (err) { console.error("Error fetching sales:", err); }
  };

  // --- RECALCULATION LOGIC FOR EDITING ---
  const updateItemQty = (productId, delta) => {
    const updatedItems = editingSale.items.map(item => {
      if (item.id === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);

    // Recalculate everything based on new items
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
    try {
      await axios.put(`${API_URL}/sales/${editingSale.id}`, editingSale);
      alert("Bill Updated Successfully!");
      setEditingSale(null);
      fetchSales(); 
    } catch (err) {
      alert("Error: Update failed. Make sure all fields are valid.");
    }
  };

  // Income Summaries
  const now = new Date();
  const dailyIncome = sales.filter(s => new Date(s.timestamp).toDateString() === now.toDateString())
                           .reduce((sum, s) => sum + s.total_amount, 0);

  return (
    <div className="reports-page">
      <div className="report-summary-grid">
        <div className="summary-box daily">
          <h4>Today's Income</h4>
          <p>₹{(dailyIncome || 0).toFixed(2)}</p>
        </div>
      </div>

      {/* EDIT MODAL OVERLAY */}
      {editingSale && (
        <div className="edit-bill-overlay">
          <div className="edit-bill-modal">
            <h3>Edit Bill: {editingSale.id.slice(0, 8)}</h3>
            <div className="edit-items-list">
              {editingSale.items.map(item => (
                <div key={item.id} className="edit-item-row">
                  <div style={{flex: 1}}>
                    <strong>{item.name}</strong>
                    <div style={{fontSize: '0.75rem', color: '#666'}}>
                        Price: ₹{item.price} | MRP: ₹{item.mrp || item.price}
                    </div>
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
               <div style={{fontSize: '0.9rem', color: '#666', marginBottom: '5px'}}>
                  Subtotal: ₹{(editingSale.subtotal || 0).toFixed(2)} | Tax: ₹{(editingSale.tax || 0).toFixed(2)}
               </div>
               <div style={{fontSize: '1rem', color: '#16a34a', fontWeight: 'bold'}}>
                  Savings: ₹{(editingSale.savings || 0).toFixed(2)}
               </div>
               <h2 style={{margin: '10px 0'}}>Total: ₹{(editingSale.total_amount || 0).toFixed(2)}</h2>
               
               <div style={{display: 'flex', gap: '10px', marginTop: '15px'}}>
                    <button className="btn btn-danger" style={{flex: 1}} onClick={() => setEditingSale(null)}>Cancel</button>
                    <button className="btn btn-success" style={{flex: 2}} onClick={saveChanges}>Save Changes</button>
               </div>
            </div>
          </div>
        </div>
      )}

      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0'}}>
        <h2>Transaction History</h2>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Date & Time</th>
            <th>Items Sold</th>
            <th>Total Amount</th>
            <th>Customer Savings</th>
            <th style={{textAlign: 'center'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.filter(s => s.total_amount > 0).map(sale => (
            <tr key={sale.id}>
              <td>{new Date(sale.timestamp).toLocaleString()}</td>
              <td>
                {sale.items.map((i, idx) => (
                    <div key={idx} style={{fontSize: '0.85rem'}}>{i.quantity}x {i.name}</div>
                ))}
              </td>
              <td style={{fontWeight: 'bold'}}>₹{(sale.total_amount || 0).toFixed(2)}</td>
              <td style={{color: '#16a34a', fontWeight: '600'}}>
                ₹{(sale.savings || 0).toFixed(2)}
              </td>
              <td style={{textAlign: 'center'}}>
                {/* ONLY EDIT BUTTON REMAINS */}
                <button 
                  className="btn" 
                  style={{backgroundColor: '#3b82f6'}}
                  onClick={() => setEditingSale(JSON.parse(JSON.stringify(sale)))}
                >
                  Edit Bill
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