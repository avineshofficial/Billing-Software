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
      padding: '0px 5px 10px 5px', 
      width: '230px', 
      fontFamily: "'Courier New', Courier, 'Arial Unicode MS', sans-serif", 
      color: '#000',
      backgroundColor: '#fff',
      lineHeight: '1.2',
      fontWeight: '900', 
      margin: '0'
    }}>
      {/* --- PRINTER CSS RESET --- */}
      <style>{`
        @media print {
          @page { margin: 0; size: 58mm auto; }
          body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
        }
      `}</style>

      {/* --- STORE HEADER (TAMIL) --- */}
      <h2 style={{ textAlign: 'center', margin: '5px 0 0 0', fontSize: '18px', fontWeight: '900' }}>நெருங்கிய கூட்டாளி</h2>
      <p style={{ textAlign: 'center', margin: '0', fontSize: '13px', fontWeight: '900' }}>நிறுவனம்</p>
      
      {/* --- CONTACT & ADDRESS --- */}
      <div style={{ textAlign: 'center', fontSize: '9px', fontWeight: '900', marginBottom: '5px' }}>
        <div>7/39 B FISH MARKET STREET</div>
        <div>PARAMAKUDI - 623707</div>
        <div>PH: 9677794269, 7540038675</div>
        <div style={{ marginTop: '2px', border: '1.5px solid #000', display: 'inline-block', padding: '1px 4px' }}>
          GST: 33QEQPS8844G1ZG
        </div>
      </div>

      <div style={{ borderBottom: '2px dashed #000', margin: '4px 0' }}></div>
      
      {/* --- BILL INFO --- */}
      <div style={{ fontSize: '10px', fontWeight: '900' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>INV:#{billNo || "0"}</span>
            <span>{new Date().toLocaleDateString()}</span>
         </div>
         <div style={{ textAlign: 'left' }}>
            TIME:{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
         </div>
      </div>
      
      <div style={{ borderBottom: '2px dashed #000', margin: '4px 0' }}></div>
      
      {/* --- ITEMS TABLE --- */}
      <table style={{ width: '100%', fontSize: '9px', borderCollapse: 'collapse', fontWeight: '900', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ borderBottom: '1.5px solid #000' }}>
            <th align="left" style={{ width: '40%' }}>ITEM</th>
            <th align="right" style={{ width: '18%' }}>MRP</th>
            <th align="right" style={{ width: '18%' }}>PRC</th>
            <th align="center" style={{ width: '8%' }}>Q</th>
            <th align="right" style={{ width: '16%' }}>TOT</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => {
            // Calculate item total minus the specific discount for this item
            const itemLineTotal = (item.price * item.quantity) - (item.discount || 0);
            return (
              <tr key={index}>
                <td style={{ 
                  padding: '4px 0', 
                  overflow: 'hidden', 
                  textTransform: 'uppercase', 
                  fontSize: '9px',
                  wordBreak: 'break-all' 
                }}>
                  {item.name}
                </td>
                <td align="right">{item.mrp || item.price}</td>
                <td align="right">{item.price}</td>
                <td align="center">{item.quantity}</td>
                <td align="right">{itemLineTotal.toFixed(0)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ borderBottom: '2px dashed #000', margin: '5px 0' }}></div>
      
      {/* --- SUMMARY SECTION --- */}
      <div style={{ fontSize: '11px', fontWeight: '900' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
          <span>GST Tax:</span>
          <span>₹{tax.toFixed(2)}</span>
        </div>
        
        {/* Total Discount (Sum of all item-wise discounts) */}
        {discount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Total Disc:</span>
            <span>-₹{discount.toFixed(2)}</span>
          </div>
        )}
        
        <div style={{ 
            borderTop: '2.5px solid #000', 
            marginTop: '5px', 
            paddingTop: '3px', 
            display: 'flex', 
            justifyContent: 'space-between', 
            fontSize: '15px' 
        }}>
          <span>NET PAYABLE:</span>
          <span>₹{total.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ borderBottom: '2px dashed #000', margin: '6px 0' }}></div>

      {/* --- PAYMENT MODE & BREAKDOWN --- */}
      <div style={{ fontSize: '10px', fontWeight: '900' }}>
        <div>MODE: {payMethod.toUpperCase()}</div>
        {payMethod === "Cash+UPI" && (
          <div style={{ marginTop: '3px', borderLeft: '3px solid #000', paddingLeft: '5px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>CASH PAID:</span><span>₹{cash.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>UPI PAID:</span><span>₹{upi.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ borderBottom: '2px dashed #000', margin: '6px 0' }}></div>

      {/* --- SAVINGS BOX --- */}
      <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: '900' }}>
        You Have Saved ₹{savings.toFixed(2)}
      </div>

      {/* --- FOOTER --- */}
      <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '11px', fontWeight: 'bold' }}>
        THANK YOU! VISIT AGAIN
      </p>
    </div>
  );
});

export default InvoiceTicket;