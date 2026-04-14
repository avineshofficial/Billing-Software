import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import InvoiceTicket from './InvoiceTicket';
import ManualEntryBar from './ManualEntryBar'; 
import './Billing.css';

const API_URL = 'http://127.0.0.1:8000/api';

function Billing() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastBillId, setLastBillId] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  const [showSummary, setShowSummary] = useState(true);

  // Customer Loyalty States
  const [custName, setCustName] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custPoints, setCustPoints] = useState(0);
  const [useRedeem, setUseRedeem] = useState(false);

  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashPaid, setCashPaid] = useState("");
  const [upiPaid, setUpiPaid] = useState("");

  const printRef = useRef();

  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('hashi_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('hashi_pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (e) { console.error("Fetch error", e); }
  };

  useEffect(() => {
    if (custPhone.length === 10) {
      axios.get(`${API_URL}/customers/${custPhone}`).then(res => {
        setCustName(res.data.name || "");
        setCustPoints(res.data.points || 0);
      }).catch(() => {
        setCustName("");
        setCustPoints(0);
      });
    }
  }, [custPhone]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => { setIsPrinting(false); },
  });

  useEffect(() => {
    if (isPrinting && lastBillId && printRef.current) {
      handlePrint();
    }
  }, [isPrinting, lastBillId]);

  const clearPOS = () => {
    if (window.confirm("Clear current bill?")) {
      setCart([]); setLastBillId(""); setAmountReceived(""); setCustName("");
      setCustPhone(""); setCustPoints(0); setUseRedeem(false);
      setCashPaid(""); setUpiPaid("");
      localStorage.removeItem('hashi_pos_cart');
      fetchProducts();
    }
  };

  const addToCart = (p) => {
    const existingItem = cart.find(item => item.id === p.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...p, quantity: 1, discount: 0 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(i => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)));
  };

  const updateItemDiscountPercent = (id, percent) => {
    setCart(cart.map(item => 
      item.id === id ? { ...item, discount: parseFloat(percent) || 0 } : item
    ));
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

  // --- CALCULATIONS ---
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalTax = cart.reduce((sum, i) => sum + ((i.price * (i.gst_percentage || 0) / 100) * i.quantity), 0);
  const totalMrpValue = cart.reduce((sum, i) => sum + ((i.mrp || i.price) * i.quantity), 0);
  const totalLineDiscountAmount = cart.reduce((sum, i) => {
    return sum + ((i.price * i.quantity) * (parseFloat(i.discount) || 0) / 100);
  }, 0);

  const redeemDiscount = (useRedeem && custPoints >= 100) ? 100 : 0;
  const grandTotal = Math.max(0, (subtotal + totalTax) - totalLineDiscountAmount - redeemDiscount);
  const totalSavings = (totalMrpValue - subtotal) + totalLineDiscountAmount + redeemDiscount;
  const balanceToReturn = amountReceived ? (parseFloat(amountReceived) - grandTotal) : 0;

  // Split Helper
  const currentSplitTotal = (parseFloat(cashPaid) || 0) + (parseFloat(upiPaid) || 0);
  const remainingSplit = grandTotal - currentSplitTotal;

  // --- STRICT CHECKOUT LOGIC ---
  const checkout = async () => {
    if (cart.length === 0) return;

    let finalCash = 0;
    let finalUpi = 0;

    if (paymentMethod === "Cash") {
      finalCash = grandTotal;
    } else if (paymentMethod === "UPI") {
      finalUpi = grandTotal;
    } else {
      // SPLIT VALIDATION
      finalCash = parseFloat(cashPaid) || 0;
      finalUpi = parseFloat(upiPaid) || 0;
      const combined = finalCash + finalUpi;
      
      // Strict check: difference must be less than 0.01
      if (Math.abs(combined - grandTotal) > 0.01) {
        return alert(`Payment Mismatch!\nPaid: ₹${combined.toFixed(2)}\nNet Total: ₹${grandTotal.toFixed(2)}\nDifference: ₹${(grandTotal - combined).toFixed(2)}`);
      }
    }

    const saleData = {
      items: cart, 
      total_amount: Number(grandTotal.toFixed(2)),
      subtotal: Number(subtotal.toFixed(2)), 
      tax: Number(totalTax.toFixed(2)),
      discount: Number((totalLineDiscountAmount + redeemDiscount).toFixed(2)), 
      savings: Number(totalSavings.toFixed(2)),
      payment_method: paymentMethod, 
      cash_amount: Number(finalCash.toFixed(2)), 
      upi_amount: Number(finalUpi.toFixed(2))
    };

    try {
      if (custPhone.length === 10) {
        let newPoints = custPoints;
        if (grandTotal >= 1500) newPoints += 5;
        if (useRedeem) newPoints -= 100;
        await axios.post(`${API_URL}/customers`, { name: custName, phone: custPhone, points: newPoints });
      }
      const response = await axios.post(`${API_URL}/sales`, saleData);
      if (response.data.bill_no) {
        setLastBillId(response.data.bill_no);
        setIsPrinting(true);
      }
    } catch (e) { alert("Checkout failed. Server error."); }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="billing-layout">
      <div className="product-grid-container">
        <ManualEntryBar onAddManual={addToCart} />
        <div className="search-container">
          <input className="search-input" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="product-grid">
          {filteredProducts.map((p) => {
            const inCart = cart.find(i => i.id === p.id)?.quantity || 0;
            return (
              <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                {inCart > 0 && <div className="card-qty-badge">{inCart}</div>}
                <div className="p-badge">{p.category}</div>
                <h4>{p.name}</h4>
                <div className="p-prices"><span className="mrp-striked">₹{p.mrp}</span><span className="sale-price">₹{p.price}</span></div>
                <div className="p-card-details"><span>GST: {p.gst_percentage}%</span><span>Stock: {p.stock}</span></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cart-panel">
        <div className="customer-loyalty-box">
           <input type="text" placeholder="Phone" value={custPhone} onChange={(e)=>setCustPhone(e.target.value)} className="loyalty-input" />
           <input type="text" placeholder="Name" value={custName} onChange={(e)=>setCustName(e.target.value)} className="loyalty-input" />
           <div className="loyalty-footer">
             <div className="points-display">Pts: {custPoints}</div>
             {custPoints >= 100 && (
               <button className={`redeem-btn ${useRedeem ? 'active' : ''}`} onClick={()=>setUseRedeem(!useRedeem)}>Redeem</button>
             )}
           </div>
        </div>

        <div className="cart-header">
          <h3>Bill Items ({cart.length})</h3>
          <button type="button" className="btn-logout" onClick={clearPOS}>New Bill</button>
        </div>

        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div style={{flex: 1}}>
                <strong>{item.name}</strong>
                <div className="item-controls-row">
                    <div className="item-disc-box">
                        <label>%</label>
                        <input type="number" className="item-disc-input" value={item.discount} onChange={(e) => updateItemDiscountPercent(item.id, e.target.value)} />
                    </div>
                    <div className="qty-input-group">
                      <button type="button" className="qty-btn" onClick={() => updateQty(item.id, -1)}>-</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button type="button" className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>&times;</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="billing-summary-container">
          <div className="summary-toggle" onClick={() => setShowSummary(!showSummary)}>
            <span>Summary & Payment</span>
            <span className={`arrow ${showSummary ? 'up' : 'down'}`}>▼</span>
          </div>
          
          {showSummary && (
            <div className="billing-summary">
              <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
              <div className="summary-row"><span>GST Tax</span><span>₹{totalTax.toFixed(2)}</span></div>
              <div className="summary-row"><span>Discount</span><span style={{color: 'red'}}>-₹{totalLineDiscountAmount.toFixed(2)}</span></div>
              
              <div className="payment-grid">
                <button type="button" className={`pay-meth-btn ${paymentMethod === 'Cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('Cash')}>Cash</button>
                <button type="button" className={`pay-meth-btn ${paymentMethod === 'UPI' ? 'active' : ''}`} onClick={() => setPaymentMethod('UPI')}>UPI</button>
                <button type="button" className={`pay-meth-btn ${paymentMethod === 'Cash+UPI' ? 'active' : ''}`} onClick={() => setPaymentMethod('Cash+UPI')}>Split</button>
              </div>

              {paymentMethod === "Cash+UPI" && (
                <div className="split-inputs">
                   <div style={{display: 'flex', flexDirection: 'column'}}>
                     <label style={{fontSize: '0.7rem'}}>Cash Amount</label>
                     <input type="number" value={cashPaid} onChange={(e)=>setCashPaid(e.target.value)} />
                   </div>
                   <div style={{display: 'flex', flexDirection: 'column'}}>
                     <label style={{fontSize: '0.7rem'}}>UPI Amount</label>
                     <input type="number" value={upiPaid} onChange={(e)=>setUpiPaid(e.target.value)} />
                   </div>
                   <div style={{gridColumn: 'span 2', textAlign: 'center', color: remainingSplit === 0 ? 'green' : 'red', fontSize: '0.8rem', fontWeight: 'bold'}}>
                     {remainingSplit === 0 ? "✓ Perfect Match" : `Remaining: ₹${remainingSplit.toFixed(2)}`}
                   </div>
                </div>
              )}

              <div className="balance-calculator">
                <input type="number" placeholder="Amt Received" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
                <div className="balance-val">Balance: ₹{balanceToReturn > 0 ? balanceToReturn.toFixed(2) : '0.00'}</div>
              </div>
            </div>
          )}

          <div className="summary-row grand-total">
            <span>NET TOTAL</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          <button type="button" className="pay-button" onClick={checkout} disabled={cart.length === 0 || isPrinting}>
            {isPrinting ? "Opening Preview..." : "Pay & Print Receipt"}
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef}>
          <InvoiceTicket 
            cart={cart} subtotal={subtotal} tax={totalTax} discount={totalLineDiscountAmount + redeemDiscount} 
            total={grandTotal} savings={totalSavings} billNo={lastBillId} 
            payMethod={paymentMethod} cash={parseFloat(cashPaid) || (paymentMethod === "Cash" ? grandTotal : 0)} 
            upi={parseFloat(upiPaid) || (paymentMethod === "UPI" ? grandTotal : 0)}
            custName={custName} custPhone={custPhone} pointsBalance={custPoints}
            pointsEarned={grandTotal >= 1500 ? 5 : 0} redeemUsed={useRedeem}
          />
        </div>
      </div>
    </div>
  );
}

export default Billing;