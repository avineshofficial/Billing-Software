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
      padding: '0px 2px 10px 10px', // Added 10px left padding to prevent erasing
      width: '210px', // Further reduced to safely fit within paper margins
      fontFamily: "'Courier New', Courier, 'Arial Unicode MS', sans-serif", 
      color: '#000',
      backgroundColor: '#fff',
      lineHeight: '1.1',
      fontWeight: '900',
      margin: '0'
    }}>
      {/* Printer Command to remove browser margins */}
      <style>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          body { margin: 0; padding: 0; }
        }
      `}</style>

      {/* --- STORE HEADER --- */}
      <h2 style={{ textAlign: 'center', margin: '5px 0 0 0', fontSize: '14px', fontWeight: '900' }}>நெருங்கிய கூட்டாளி</h2>
      <p style={{ textAlign: 'center', margin: '0', fontSize: '11px' }}>நிறுவனம்</p>
      
      {/* --- ADDRESS --- */}
      <div style={{ textAlign: 'center', fontSize: '8px', fontWeight: '900', marginBottom: '5px' }}>
        <div>7/39 B FISH MARKET STREET</div>
        <div>PARAMAKUDI - 623707</div>
        <div>PH: 9677794269, 7540038675</div>
        <div style={{ marginTop: '2px', border: '1px solid #000', display: 'inline-block', padding: '0 2px' }}>
          GST: 33QEQPS8844G1ZG
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '3px 0' }}></div>
      
      {/* --- BILL INFO --- */}
      <div style={{ fontSize: '9px', fontWeight: '900' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>INV:#{billNo || "0"}</span>
            <span>{new Date().toLocaleDateString()}</span>
         </div>
         <div style={{ textAlign: 'left' }}>
            TIME:{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
      
      <div style={{ borderBottom: '1px dashed #000', margin: '3px 0' }}></div>
      
      {/* --- ITEMS TABLE (Extreme Width Optimization) --- */}
      <table style={{ width: '100%', fontSize: '8px', borderCollapse: 'collapse', fontWeight: '900', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #000' }}>
            <th align="left" style={{ width: '38%' }}>ITEM</th>
            <th align="right" style={{ width: '17%' }}>MRP</th>
            <th align="right" style={{ width: '17%' }}>PRC</th>
            <th align="center" style={{ width: '8%' }}>Q</th>
            <th align="right" style={{ width: '20%' }}>TOT</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => (
            <tr key={index}>
              <td style={{ padding: '2px 0', overflow: 'hidden', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                {item.name}
              </td>
              <td align="right">{item.mrp || item.price}</td>
              <td align="right">{item.price}</td>
              <td align="center">{item.quantity}</td>
              <td align="right">{(item.price * item.quantity).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ borderBottom: '1px dashed #000', margin: '3px 0' }}></div>
      
      {/* --- SUMMARY --- */}
      <div style={{ fontSize: '9px', fontWeight: '900' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>GST Tax:</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Discount:</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}
        
        <div style={{ borderTop: '1px solid #000', marginTop: '3px', paddingTop: '2px', display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
          <span>NET PAYABLE:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }}></div>

      <div style={{ fontSize: '9px' }}>
        MODE: {payMethod.toUpperCase()}
      </div>

      <div style={{ borderBottom: '1px dashed #000', margin: '4px 0' }}></div>

      {/* --- SAVINGS --- */}
      <div style={{ textAlign: 'center', fontSize: '10px' }}>
        You Have Saved ₹{savings.toFixed(2)}
      </div>

      <p style={{ textAlign: 'center', marginTop: '10px', fontSize: '9px', fontWeight: 'bold' }}>
        THANK YOU! VISIT AGAIN
      </p>
    </div>
  );
});

export default InvoiceTicket;