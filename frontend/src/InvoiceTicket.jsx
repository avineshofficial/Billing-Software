import React, { forwardRef } from 'react';

const InvoiceTicket = forwardRef(({ cart, subtotal, tax, total }, ref) => {
  return (
    <div ref={ref} style={{ padding: '20px', width: '280px', fontFamily: 'Courier, monospace', color: '#000' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '5px' }}>HASHI ICE SPOT</h2>
      <p style={{ textAlign: 'center', fontSize: '12px', margin: '0' }}>Tax Invoice</p>
      <div style={{ textAlign: 'center', fontSize: '12px' }}>{new Date().toLocaleString()}</div>
      
      <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
      
      <table style={{ width: '100%', fontSize: '12px' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th style={{ textAlign: 'left' }}>Item</th>
            <th style={{ textAlign: 'center' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Amt</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td>{item.name}<br/><small>GST {item.gst_percentage}%</small></td>
              <td style={{ textAlign: 'center' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span>Subtotal:</span>
        <span>₹{subtotal.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
        <span>Total Tax (GST):</span>
        <span>₹{tax.toFixed(2)}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 'bold', marginTop: '5px' }}>
        <span>GRAND TOTAL:</span>
        <span>₹{total.toFixed(2)}</span>
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
      <p style={{ textAlign: 'center', fontSize: '12px' }}>Thank you! Visit Again.</p>
    </div>
  );
});

export default InvoiceTicket;