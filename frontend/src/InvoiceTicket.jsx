import React, { forwardRef } from 'react';

const InvoiceTicket = forwardRef(({ cart, subtotal, tax, discount, total, savings }, ref) => {
  return (
    <div ref={ref} style={{ 
      padding: '10px', 
      width: '280px', 
      fontFamily: "'Courier New', Courier, monospace", 
      color: '#000',
      backgroundColor: '#fff',
      lineHeight: '1.2'
    }}>
      {/* HEADER */}
      <h2 style={{ textAlign: 'center', margin: '0', fontSize: '20px', fontWeight: 'bold' }}>HASHI ICE SPOT</h2>
      <p style={{ textAlign: 'center', margin: '2px 0 10px 0', fontSize: '12px' }}>TAX INVOICE</p>
      
      {/* DATE & TIME */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '5px' }}>
         <span>Date: {new Date().toLocaleDateString()}</span>
         <span>Time: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
      
      <div style={{ borderBottom: '1px dashed #000', marginBottom: '5px' }}></div>
      
      {/* TABLE HEADER */}
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th align="left" style={{ paddingBottom: '5px' }}>ITEM</th>
            <th align="right">MRP</th>
            <th align="right">PRICE</th>
            <th align="center">QTY</th>
            <th align="right">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: '5px 0', maxWidth: '80px', wordBreak: 'break-all' }}>
                {item.name.toUpperCase()}
              </td>
              <td align="right">{item.mrp || item.price}</td>
              <td align="right">{item.price}</td>
              <td align="center">{item.quantity}</td>
              <td align="right">{(item.price * item.quantity).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>
      
      {/* SUMMARY */}
      <div style={{ fontSize: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
          <span>GST Tax (18%):</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
            <span>Discount:</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
        )}
        
        <div style={{ borderBottom: '1px dashed #000', margin: '5px 0' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: 'bold' }}>
          <span>NET PAYABLE:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '10px 0' }}></div>

      {/* SAVINGS SECTION */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '13px', fontWeight: 'bold' }}>
        You Have Saved ₹{savings.toFixed(2)}
      </div>

      {/* FOOTER */}
      <p style={{ textAlign: 'center', marginTop: '25px', fontSize: '11px', fontWeight: 'bold' }}>
        THANK YOU! VISIT AGAIN
      </p>
    </div>
  );
});

export default InvoiceTicket;