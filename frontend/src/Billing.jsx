import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import InvoiceTicket from './InvoiceTicket';
import './Billing.css';

const API_URL = 'http://127.0.0.1:8000/api';

function Billing() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [discountPercent, setDiscountPercent] = useState(""); 
  
  // 1. REF FOR PRINTER - Used to target the receipt
  const printRef = useRef();

  // 2. PERSISTENCE: Load cart from browser memory
  const [cart, setCart] = useState(() => {
    const saved = localStorage.getItem('hashi_pos_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // 3. PERSISTENCE: Save cart to memory whenever it changes
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
    // REMOVED: Stock limit check. You can add as many as you want.
    setCart(cart.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i));
  } else {
    // Even if p.stock is 0, we allow adding to cart
    setCart([...cart, { ...p, quantity: 1 }]);
  }
};

  const updateQty = (id, delta) => {
  setCart(cart.map(item => {
    if (item.id === id) {
      const newQty = item.quantity + delta;
      // Allows unlimited quantity increase
      return newQty > 0 ? { ...item, quantity: newQty } : item;
    }
    return item;
  }));
};

  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));

  // --- 4. CALCULATIONS ---
  const subtotal = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
  
  const totalTax = cart.reduce((sum, i) => {
    const taxRate = i.gst_percentage || 0;
    return sum + ((i.price * taxRate / 100) * i.quantity);
  }, 0);

  const totalMrpValue = cart.reduce((sum, i) => sum + ((i.mrp || i.price) * i.quantity), 0);

  const preDiscountTotal = subtotal + totalTax;
  const discPercentValue = parseFloat(discountPercent) || 0;
  const discountAmount = preDiscountTotal * (discPercentValue / 100);
  
  const grandTotal = Math.max(0, preDiscountTotal - discountAmount);
  const totalSavings = (totalMrpValue - subtotal) + discountAmount;

  // --- 5. PRINT HOOK CONFIGURATION (FIXED) ---
  const handlePrint = useReactToPrint({
    contentRef: printRef, // Fixed property for latest react-to-print
    onAfterPrint: () => {
        // Reset POS state after successful print
        setCart([]);
        setDiscountPercent("");
        localStorage.removeItem('hashi_pos_cart');
        fetchProducts(); // Refresh stock numbers from backend
    }
  });

  const checkout = async () => {
    if (cart.length === 0) return;
    try {
      // Step A: Save sale record to Database
      await axios.post(`${API_URL}/sales`, { 
        items: cart, 
        total_amount: grandTotal, 
        subtotal, 
        tax: totalTax,
        discount: discountAmount,
        savings: totalSavings 
      });
      
      // Step B: Trigger the Print Dialog
      handlePrint(); 
      
    } catch (e) { 
        alert("Checkout failed. Check if Backend server is running."); 
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.product_code && p.product_code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="billing-layout">
      {/* LEFT: Product Selection Area */}
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
                  <span className="mrp-striked">₹{p.mrp || p.price}</span>
                  <span className="sale-price">₹{p.price}</span>
               </div>
               <small>Tax: {p.gst_percentage}% | Stock: {p.stock}</small>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: Cart & Summary Area */}
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
            <span>Discount (%)</span>
            <input 
                type="number" 
                className="discount-input" 
                value={discountPercent} 
                placeholder="0"
                min="0"
                max="100"
                onKeyDown={(e) => ["-", "+", "e", "E"].includes(e.key) && e.preventDefault()}
                onChange={(e) => setDiscountPercent(e.target.value)} 
            />
          </div>

          <div className="summary-row grand-total">
            <span>Grand Total</span>
            <span>₹{grandTotal.toFixed(2)}</span>
          </div>
          
          <div className="savings-highlight">
            Total Savings: ₹{totalSavings.toFixed(2)}
          </div>

          <button className="pay-button" onClick={checkout} disabled={cart.length === 0}>
            Pay & Print Receipt
          </button>
        </div>
      </div>

      {/* 
        6. PRINT FIX: Wrapping the InvoiceTicket in a div that holds the Ref.
        We hide it from the screen view using 'display: none' but it stays in the DOM 
        so react-to-print can capture it correctly.
      */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>
          <InvoiceTicket 
            cart={cart} 
            subtotal={subtotal} 
            tax={totalTax} 
            discount={discountAmount} 
            total={grandTotal}
            savings={totalSavings} 
          />
        </div>
      </div>
    </div>
  );
}

export default Billing;