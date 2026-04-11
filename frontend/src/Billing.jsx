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
  const [discountPercent, setDiscountPercent] = useState(""); 
  const [lastBillId, setLastBillId] = useState("");
  const [isPrinting, setIsPrinting] = useState(false);
  const [amountReceived, setAmountReceived] = useState("");
  
  // --- NEW PAYMENT STATES ---
  const [paymentMethod, setPaymentMethod] = useState("Cash"); // Default
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
    } catch (e) { console.error(e); }
  };

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
    if (window.confirm("Start new order?")) {
      setCart([]);
      setDiscountPercent("");
      setLastBillId("");
      setPaymentMethod("Cash");
      setCashPaid("");
      setUpiPaid("");
      localStorage.removeItem('hashi_pos_cart');
      fetchProducts();
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  const totalTax = cart.reduce((sum, i) => sum + ((i.price * (i.gst_percentage || 0) / 100) * i.quantity), 0);
  const totalMrpValue = cart.reduce((sum, i) => sum + ((i.mrp || i.price) * i.quantity), 0);
  const preDiscountTotal = subtotal + totalTax;
  const currentDiscountAmount = preDiscountTotal * ((parseFloat(discountPercent) || 0) / 100);
  const grandTotal = Math.max(0, preDiscountTotal - currentDiscountAmount);
  const totalSavings = (totalMrpValue - subtotal) + currentDiscountAmount;
  const balanceToReturn = amountReceived ? (parseFloat(amountReceived) - grandTotal) : 0;

  const checkout = async () => {
    if (cart.length === 0) return;

    // Validate Split Payment
    let finalCash = 0;
    let finalUpi = 0;

    if (paymentMethod === "Cash") finalCash = grandTotal;
    else if (paymentMethod === "UPI") finalUpi = grandTotal;
    else {
      finalCash = parseFloat(cashPaid) || 0;
      finalUpi = parseFloat(upiPaid) || 0;
      if (Math.abs((finalCash + finalUpi) - grandTotal) > 0.1) {
        return alert(`Split total (₹${(finalCash + finalUpi).toFixed(2)}) must equal Net Total (₹${grandTotal.toFixed(2)})`);
      }
    }

    const saleData = {
      items: cart,
      total_amount: Number(grandTotal),
      subtotal: Number(subtotal),
      tax: Number(totalTax),
      discount: Number(currentDiscountAmount),
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
    } catch (e) { alert("Checkout failed"); }
  };

  const addToCart = (p) => {
    const ex = cart.find(i => i.id === p.id);
    if (ex) setCart(cart.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    else setCart([...cart, { ...p, quantity: 1 }]);
  };

  return (
    <div className="billing-layout">
      <div className="product-grid-container">
        <ManualEntryBar onAddManual={(item) => addToCart(item)} />
        <div className="search-container">
          <input className="search-input" placeholder="Search..." onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <div className="product-grid">
          {products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map((p) => {
            const inCart = cart.find(i => i.id === p.id)?.quantity || 0;
            return (
              <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
                {inCart > 0 && <div className="card-qty-badge">{inCart}</div>}
                <div className="p-badge">{p.category}</div>
                <h4>{p.name}</h4>
                <div className="p-prices"><span className="mrp-striked">₹{p.mrp}</span><span className="sale-price">₹{p.price}</span></div>
                <div className="p-details"><span>Tax: {p.gst_percentage}%</span><span>Stock: {p.stock}</span></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cart-panel">
        <div className="cart-header">
          <h3>Order List ({cart.length})</h3>
          <button type="button" className="btn-logout" onClick={clearPOS}>New</button>
        </div>

        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info"><strong>{item.name}</strong></div>
              <div className="qty-controls">
                <div className="qty-input-group">
                  <button type="button" className="qty-btn" onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, quantity: Math.max(1, i.quantity - 1)} : i))}>-</button>
                  <span className="qty-val">{item.quantity}</span>
                  <button type="button" className="qty-btn" onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, quantity: i.quantity + 1} : i))}>+</button>
                </div>
                <button type="button" className="remove-btn" onClick={() => setCart(cart.filter(i => i.id !== item.id))}>&times;</button>
              </div>
            </div>
          ))}
        </div>

        <div className="billing-summary">
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>GST Tax</span><span>₹{totalTax.toFixed(2)}</span></div>
          <div className="summary-row">
            <span>Discount (%)</span>
            <input type="number" className="discount-input" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} />
          </div>
          
          {/* --- PAYMENT METHOD SECTION --- */}
          <div className="payment-section">
            <label className="section-label">Payment Method</label>
            <div className="payment-grid">
              <button type="button" className={`pay-meth-btn ${paymentMethod === 'Cash' ? 'active' : ''}`} onClick={() => setPaymentMethod('Cash')}>Cash</button>
              <button type="button" className={`pay-meth-btn ${paymentMethod === 'UPI' ? 'active' : ''}`} onClick={() => setPaymentMethod('UPI')}>UPI</button>
              <button type="button" className={`pay-meth-btn ${paymentMethod === 'Cash+UPI' ? 'active' : ''}`} onClick={() => setPaymentMethod('Cash+UPI')}>Split</button>
            </div>

            {paymentMethod === "Cash+UPI" && (
              <div className="split-inputs">
                <input type="number" placeholder="Cash Amount" value={cashPaid} onChange={(e) => setCashPaid(e.target.value)} />
                <input type="number" placeholder="UPI Amount" value={upiPaid} onChange={(e) => setUpiPaid(e.target.value)} />
              </div>
            )}
          </div>

          <div className="summary-row grand-total">
            <span>NET TOTAL</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          <div className="balance-calculator">
  <div className="balance-row">
    <span>Amount Received:</span>
    <input 
      type="number" 
      className="received-input" 
      value={amountReceived} 
      placeholder="₹0"
      onChange={(e) => setAmountReceived(e.target.value)} 
    />
  </div>
  <div className={`balance-row return-box ${balanceToReturn > 0 ? 'active' : ''}`}>
    <span>Balance to Give:</span>
    <span className="balance-amount">₹{balanceToReturn > 0 ? balanceToReturn.toFixed(2) : '0.00'}</span>
  </div>
</div>

          <button type="button" className="pay-button" onClick={checkout} disabled={cart.length === 0 || isPrinting}>
            {isPrinting ? "Printing..." : "Pay & Print Receipt"}
          </button>
        </div>
      </div>

      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={printRef}>
          <InvoiceTicket 
            cart={cart} subtotal={subtotal} tax={totalTax} 
            discount={currentDiscountAmount} total={grandTotal} 
            savings={totalSavings} billNo={lastBillId}
            payMethod={paymentMethod} cash={parseFloat(cashPaid) || 0} upi={parseFloat(upiPaid) || 0}
          />
        </div>
      </div>
    </div>
  );
}

export default Billing;