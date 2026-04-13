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
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [cashPaid, setCashPaid] = useState("");
  const [upiPaid, setUpiPaid] = useState("");

  const printRef = useRef();

  // 1. PERSISTENCE: Load cart from memory
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('hashi_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Save cart whenever it changes
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

  // --- 2. PRINT CONFIGURATION (FIXED: NO AUTO-CLEAR) ---
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    onAfterPrint: () => {
      // We only reset the printing status, NOT the cart
      setIsPrinting(false); 
    },
  });

  // Trigger print automatically once Backend returns Bill No
  useEffect(() => {
    if (isPrinting && lastBillId && printRef.current) {
      handlePrint();
    }
  }, [isPrinting, lastBillId]);

  // Use this button manually when the customer is gone
  const clearPOS = () => {
    if(window.confirm("Clear current list and start new bill?")) {
        setCart([]);
        setLastBillId("");
        setAmountReceived("");
        setPaymentMethod("Cash");
        setCashPaid("");
        setUpiPaid("");
        localStorage.removeItem('hashi_pos_cart');
        fetchProducts(); // Refresh stock
    }
  };

  // --- 3. UNIVERSAL SEARCH LOGIC ---
  const filteredProducts = products.filter(p => {
    const search = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(search) || 
      (p.category && p.category.toLowerCase().includes(search)) || 
      (p.product_code && p.product_code.toLowerCase().includes(search)) ||
      (p.price && p.price.toString().includes(search)) ||
      (p.mrp && p.mrp.toString().includes(search))
    );
  });

  // --- 4. CART ACTIONS ---
  const addToCart = (p) => {
    const ex = cart.find(i => i.id === p.id);
    if (ex) {
      setCart(cart.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { ...p, quantity: 1, discount: 0 }]);
    }
  };

  const updateItemDiscount = (id, discValue) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        return { ...item, discount: parseFloat(discValue) || 0 };
      }
      return item;
    }));
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(i => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)));
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

  // --- 5. CALCULATIONS ---
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalTax = cart.reduce((sum, i) => sum + ((i.price * (i.gst_percentage || 0) / 100) * i.quantity), 0);
  const totalMrpValue = cart.reduce((sum, i) => sum + ((i.mrp || i.price) * i.quantity), 0);
  
  const totalLineDiscount = cart.reduce((sum, i) => sum + (parseFloat(i.discount) || 0), 0);
  
  const grandTotal = Math.max(0, (subtotal + totalTax) - totalLineDiscount);
  const totalSavings = (totalMrpValue - subtotal) + totalLineDiscount;
  const balanceToReturn = amountReceived ? (parseFloat(amountReceived) - grandTotal) : 0;

  // --- 6. CHECKOUT LOGIC ---
  const checkout = async () => {
    if (cart.length === 0) return;

    let finalCash = 0;
    let finalUpi = 0;
    if (paymentMethod === "Cash") finalCash = grandTotal;
    else if (paymentMethod === "UPI") finalUpi = grandTotal;
    else {
      finalCash = parseFloat(cashPaid) || 0;
      finalUpi = parseFloat(upiPaid) || 0;
      if (Math.abs((finalCash + finalUpi) - grandTotal) > 1) {
        return alert("Split amounts must equal Net Total!");
      }
    }

    const saleData = {
      items: cart,
      total_amount: Number(grandTotal),
      subtotal: Number(subtotal),
      tax: Number(totalTax),
      discount: Number(totalLineDiscount),
      savings: Number(totalSavings),
      payment_method: paymentMethod,
      cash_amount: finalCash,
      upi_amount: finalUpi
    };

    try {
      const response = await axios.post(`${API_URL}/sales`, saleData);
      if (response.data.bill_no) {
        setLastBillId(response.data.bill_no);
        setIsPrinting(true); 
      }
    } catch (e) { alert("Checkout failed. Is backend running?"); }
  };

  return (
    <div className="billing-layout">
      {/* LEFT AREA: Product Grid */}
      <div className="product-grid-container">
        
        <ManualEntryBar onAddManual={(item) => addToCart(item)} />

        <div className="search-container">
          <input 
            className="search-input" 
            placeholder="Search by Name, Category, Price or Code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>

        <div className="product-grid">
          {filteredProducts.map((p) => {
            const inCart = cart.find(i => i.id === p.id)?.quantity || 0;
            return (
              <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                {inCart > 0 && <div className="card-qty-badge">{inCart}</div>}
                <div className="p-badge">{p.category}</div>
                <h4>{p.name}</h4>
                <div className="p-prices">
                  <span className="mrp-striked">₹{p.mrp}</span>
                  <span className="sale-price">₹{p.price}</span>
                </div>
                <div className="p-details">
                  <span>Tax: {p.gst_percentage}%</span>
                  <span>Stock: {p.stock}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT AREA: Cart Panel */}
      <div className="cart-panel">
        <div className="cart-header">
          <h3>Bill List ({totalItemsCount} Items)</h3>
          <button type="button" className="btn-logout" onClick={clearPOS}>Clear All</button>
        </div>

        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item" style={{flexDirection: 'column', alignItems: 'flex-start'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '5px'}}>
                <strong>{item.name}</strong>
                <span>₹{(item.price * item.quantity).toFixed(2)}</span>
              </div>
              
              <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
                <div className="item-disc-box">
                    <label>Disc ₹</label>
                    <input 
                        type="number" 
                        className="item-disc-input" 
                        value={item.discount} 
                        onChange={(e) => updateItemDiscount(item.id, e.target.value)}
                    />
                </div>

                <div className="qty-controls">
                  <div className="qty-input-group">
                    <button type="button" className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                    <span className="qty-val">{item.quantity}</span>
                    <button type="button" className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                  </div>
                  <button type="button" className="remove-btn" onClick={() => removeFromCart(item.id)}>&times;</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="billing-summary">
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>GST Tax</span><span>₹{totalTax.toFixed(2)}</span></div>
          <div className="summary-row"><span>Discount</span><span style={{color: '#dc2626'}}>- ₹{totalLineDiscount.toFixed(2)}</span></div>
          
          <div className="payment-section">
            <div className="payment-grid">
              <button type="button" className={`pay-meth-btn ${paymentMethod === 'Cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('Cash')}>Cash</button>
              <button type="button" className={`pay-meth-btn ${paymentMethod === 'UPI' ? 'active' : ''}`} onClick={() => setPaymentMethod('UPI')}>UPI</button>
              <button type="button" className={`pay-meth-btn ${paymentMethod === 'Cash+UPI' ? 'active' : ''}`} onClick={() => setPaymentMethod('Cash+UPI')}>Split</button>
            </div>
            {paymentMethod === "Cash+UPI" && (
              <div className="split-inputs">
                <input type="number" placeholder="Cash" value={cashPaid} onChange={(e) => setCashPaid(e.target.value)} />
                <input type="number" placeholder="UPI" value={upiPaid} onChange={(e) => setUpiPaid(e.target.value)} />
              </div>
            )}
          </div>

          <div className="balance-calculator">
            <div className="balance-row">
                <span>Received:</span>
                <input type="number" className="received-input" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} />
            </div>
            <div className={`balance-row return-box ${balanceToReturn > 0 ? 'active' : ''}`}>
              <span>Balance:</span><span className="balance-amount">₹{balanceToReturn > 0 ? balanceToReturn.toFixed(2) : '0.00'}</span>
            </div>
          </div>

          <div className="summary-row grand-total"><span>NET TOTAL</span><span>₹{grandTotal.toFixed(2)}</span></div>
          
          <button type="button" className="pay-button" onClick={checkout} disabled={cart.length === 0 || isPrinting}>
            {isPrinting ? "Opening Preview..." : "Pay & Print Receipt (Preview)"}
          </button>
        </div>
      </div>

      {/* GHOST PRINT AREA */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef}>
          <InvoiceTicket 
            cart={cart} subtotal={subtotal} tax={totalTax} 
            discount={totalLineDiscount} total={grandTotal} 
            savings={totalSavings} billNo={lastBillId} 
            payMethod={paymentMethod} cash={parseFloat(cashPaid) || (paymentMethod === "Cash" ? grandTotal : 0)} 
            upi={parseFloat(upiPaid) || (paymentMethod === "UPI" ? grandTotal : 0)}
          />
        </div>
      </div>
    </div>
  );
}

export default Billing;