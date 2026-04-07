import React, { forwardRef } from 'react';

const InvoiceTicket = forwardRef(({ cart, subtotal, tax, discount, total, savings }, ref) => {
  return (
    <div ref={ref} style={{ 
      padding: '15px', 
      width: '280px', 
      fontFamily: "'Courier New', Courier, monospace", 
      color: '#000',
      backgroundColor: '#fff',
      lineHeight: '1.4'
    }}>
      <h2 style={{ textAlign: 'center', margin: '0', fontSize: '18px' }}>HASHI ICE SPOT</h2>
      <p style={{ textAlign: 'center', fontSize: '11px', margin: '2px 0' }}>TAX INVOICE</p>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', margin: '10px 0' }}>
         <span>{new Date().toLocaleDateString()}</span>
         <span>{new Date().toLocaleTimeString()}</span>
      </div>
      
      <div style={{ borderBottom: '1px dashed #000', marginBottom: '8px' }}></div>
      
      <table style={{ width: '100%', fontSize: '10px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th align="left">ITEM</th>
            <th align="right">MRP</th>
            <th align="right">PRICE</th>
            <th align="center">QTY</th>
            <th align="right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: '4px 0' }}>{item.name.toUpperCase()}</td>
              <td align="right">{item.mrp}</td>
              <td align="right">{item.price}</td>
              <td align="center">{item.quantity}</td>
              <td align="right">{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderBottom: '1px dashed #000', margin: '8px 0' }}></div>
      
      <div style={{ fontSize: '11px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span><span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>GST Tax:</span><span>₹{tax.toFixed(2)}</span>
        </div>
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Discount:</span><span>- ₹{discount.toFixed(2)}</span>
          </div>
        )}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: '15px', 
          fontWeight: 'bold', 
          marginTop: '5px', 
          borderTop: '1px solid #000', 
          paddingTop: '5px' 
        }}>
          <span>NET PAYABLE:</span><span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      {/* SIMPLIFIED SAVINGS LINE */}
      <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
        You Have Saved ₹{savings.toFixed(2)}
      </div>

      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', fontWeight: 'bold' }}>
        THANK YOU! VISIT AGAIN
      </p>
    </div>
  );
});

export default InvoiceTicket;