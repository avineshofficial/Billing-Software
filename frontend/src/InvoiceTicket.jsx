import React, { forwardRef } from 'react';

const InvoiceTicket = forwardRef(({ 
  cart, 
  subtotal, 
  tax, 
  discount, 
  total, 
  savings, 
  billNo, 
  payMethod, 
  cash, 
  upi 
}, ref) => {
  return (
    <div ref={ref} style={{ 
      padding: '10px', 
      width: '280px', 
      fontFamily: "'Courier New', Courier, monospace", 
      color: '#000',
      backgroundColor: '#fff',
      lineHeight: '1.4',
      fontWeight: '900' // Maximum thickness for thermal print visibility
    }}>
      {/* --- STORE HEADER --- */}
      <h2 style={{ textAlign: 'center', margin: '0', fontSize: '22px', fontWeight: '900' }}>HASHI ICE SPOT</h2>
      <p style={{ textAlign: 'center', margin: '2px 0 10px 0', fontSize: '14px', fontWeight: 'bold' }}>TAX INVOICE</p>
      
      {/* --- BILL INFO --- */}
      <div style={{ fontSize: '12px', fontWeight: '900' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>INV NO: {billNo || "..."}</span>
            <span>{new Date().toLocaleDateString()}</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>TIME: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
         </div>
      </div>
      
      {/* THICK DASHED DIVIDER */}
      <div style={{ borderBottom: '2px dashed #000', margin: '8px 0' }}></div>
      
      {/* --- ITEMS TABLE --- */}
      <table style={{ width: '100%', fontSize: '11px', borderCollapse: 'collapse', fontWeight: '900' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #000' }}>
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
              <td style={{ padding: '6px 0', maxWidth: '85px', wordBreak: 'break-all', fontSize: '12px' }}>
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

      {/* DASHED DIVIDER */}
      <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }}></div>
      
      {/* --- BILL SUMMARY --- */}
      <div style={{ fontSize: '13px', fontWeight: '900' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <span>GST Tax:</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Discount:</span>
            <span>- ₹{discount.toFixed(2)}</span>
          </div>
        )}
        
        <div style={{ borderBottom: '2px solid #000', margin: '5px 0' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '900' }}>
          <span>NET PAYABLE:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }}></div>

      {/* --- NEW PAYMENT METHOD SECTION --- */}
      <div style={{ fontSize: '12px', fontWeight: '900' }}>
        <div>MODE OF PAY: {payMethod.toUpperCase()}</div>
        
        {payMethod === "Cash+UPI" && (
          <div style={{ marginLeft: '10px', marginTop: '4px', fontSize: '11px', borderLeft: '2px solid #000', paddingLeft: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>CASH PAID:</span>
                <span>₹{cash.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>UPI PAID:</span>
                <span>₹{upi.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderBottom: '2px dashed #000', margin: '10px 0' }}></div>

      {/* --- SAVINGS SECTION --- */}
      <div style={{ marginTop: '15px', textAlign: 'center', fontSize: '14px', fontWeight: '900' }}>
        You Have Saved ₹{savings.toFixed(2)}
      </div>

      {/* --- FOOTER --- */}
      <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', fontWeight: '900' }}>
        THANK YOU! VISIT AGAIN
      </p>
    </div>
  );
});

export default InvoiceTicket;