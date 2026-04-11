import React, { useState } from 'react';

function ManualEntryBar({ onAddManual }) {
  const [manualName, setManualName] = useState("");
  const [manualPrice, setManualPrice] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!manualPrice || parseFloat(manualPrice) <= 0) return;

    // Create a "Fake" product object
    const manualItem = {
      id: `manual-${Date.now()}`, // Unique temporary ID
      name: manualName || "Misc. Item",
      price: parseFloat(manualPrice),
      mrp: parseFloat(manualPrice),
      gst_percentage: 0, // Usually small items are handled as net
      category: "MANUAL",
      stock: 999
    };

    onAddManual(manualItem);
    
    // Reset inputs
    setManualName("");
    setManualPrice("");
  };

  return (
    <div className="manual-entry-bar">
      <form onSubmit={handleAdd} className="manual-form">
        <span className="manual-label">Quick Add:</span>
        <input 
          type="text" 
          placeholder="Item Name (Optional)" 
          value={manualName}
          onChange={(e) => setManualName(e.target.value)}
          className="manual-input-name"
        />
        <input 
          type="number" 
          placeholder="Amount (₹)" 
          value={manualPrice}
          onChange={(e) => setManualPrice(e.target.value)}
          className="manual-input-price"
          required
        />
        <button type="submit" className="manual-add-btn">Add to Bill</button>
      </form>
    </div>
  );
}

export default ManualEntryBar;