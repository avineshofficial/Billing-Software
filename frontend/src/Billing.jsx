import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import InvoiceTicket from './InvoiceTicket';
import './Billing.css';

const API_URL = 'http://127.0.0.1:8000/api';

function Billing() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [discount, setDiscount] = useState(""); 
  const printRef = useRef();

  // 1. PERSISTENCE: Load cart from browser memory
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('hashi_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // 2. PERSISTENCE: Save cart to memory whenever it changes
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

  const addToCart = (p) => {
    const ex = cart.find(i => i.id === p.id);
    if (ex) {
      if (ex.quantity >= p.stock) return alert("Out of stock!");
      setCart(cart.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (p.stock < 1) return alert("Out of stock!");
      setCart([...cart, { ...p, quantity: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const stockLimit = products.find(p => p.id === id)?.stock || 999;
        if (newQty > stockLimit) { alert("Stock limit reached!"); return item; }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

  // --- 3. PROFESSIONAL CALCULATIONS ---
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  
  const totalTax = cart.reduce((sum, i) => {
    const taxRate = i.gst_percentage || 0;
    return sum + ((i.price * taxRate / 100) * i.quantity);
  }, 0);

  // Calculate total value at MRP to show savings
  const totalMrpValue = cart.reduce((sum, i) => sum + (i.mrp * i.quantity), 0);

  const currentDiscount = parseFloat(discount) || 0;
  const preDiscountTotal = subtotal + totalTax;
  const grandTotal = Math.max(0, preDiscountTotal - currentDiscount);
  const totalSavings = (totalMrpValue - subtotal) + currentDiscount;

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const checkout = async () => {
    if (cart.length === 0) return;
    try {
      await axios.post(`${API_URL}/sales`, { 
        items: cart, 
        total_amount: grandTotal, 
        subtotal, 
        tax: totalTax,
        discount: currentDiscount,
        savings: totalSavings 
      });
      
      handlePrint(); // Print Receipt
      
      // Reset POS
      setCart([]);
      setDiscount(0);
      localStorage.removeItem('hashi_pos_cart');
      fetchProducts(); // Refresh stock
    } catch (e) { alert("Checkout failed"); }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="billing-layout">
      {/* LEFT: Product Grid */}
      <div className="product-grid-container">
        <div className="search-container">
          <input 
            className="search-input" 
            placeholder="Search by name or product code..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="product-grid">
          {filteredProducts.map((p) => (
            <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
               <span className="p-code">{p.product_code || 'N/A'}</span>
               <h4>{p.name}</h4>
               <div className="p-prices">
                  <span className="mrp-striked">₹{p.mrp}</span>
                  <span className="sale-price">₹{p.price}</span>
               </div>
               <small>Tax: {p.gst_percentage}% | Stock: {p.stock}</small>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Cart Panel */}
      <div className="cart-panel">
        <div className="cart-header">
          <h3>Current Order</h3>
          <span className="item-count">{cart.length} Items</span>
        </div>

        <div className="cart-items">
          {cart.map(item => (
            <div key={item.id} className="cart-item">
              <div className="cart-item-info">
                <strong>{item.name}</strong>
                <div className="tax-info">MRP: ₹{item.mrp} | Price: ₹{item.price}</div>
              </div>
              <div className="qty-controls">
                <div className="qty-input-group">
                  <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                  <span className="qty-val">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                </div>
                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>&times;</button>
              </div>
            </div>
          ))}
        </div>

        <div className="billing-summary">
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>GST Tax</span><span>₹{totalTax.toFixed(2)}</span></div>
          
          <div className="summary-row discount-row">
  <span>Manual Discount (₹)</span>
  <input 
    type="number" 
    className="discount-input" 
    value={discount} 
    placeholder="0" // Shows 0 only as a hint
    min="0"         // Prevents clicking down into negatives
    onKeyDown={(e) => {
      // Prevents typing '-', 'e' (scientific notation), and '+'
      if (["-", "+", "e", "E"].includes(e.key)) {
        e.preventDefault();
      }
    }}
    onChange={(e) => {
      const val = e.target.value;
      // Allows empty string (clearing the box) or positive numbers only
      if (val === "" || parseFloat(val) >= 0) {
        setDiscount(val);
      }
    }} 
  />
</div>

          <div className="summary-row grand-total">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          
          <div className="savings-highlight">
            You are saving ₹{totalSavings.toFixed(2)} on this bill!
          </div>

          <button className="pay-button" onClick={checkout} disabled={cart.length === 0}>
            Pay & Print Receipt
          </button>
        </div>
      </div>

      {/* Hidden Receipt Component */}
      <div style={{ display: 'none' }}>
        <InvoiceTicket 
          ref={printRef} 
          cart={cart} 
          subtotal={subtotal} 
          tax={totalTax} 
          discount={currentDiscount} 
          total={grandTotal}
          savings={totalSavings} 
        />
      </div>
    </div>
  );
}

export default Billing;