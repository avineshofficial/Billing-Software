import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useReactToPrint } from 'react-to-print';
import InvoiceTicket from './InvoiceTicket';
import './Billing.css';

const API_URL = 'http://127.0.0.1:8000/api';

function Billing() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  
  // --- 1. PERSISTENCE LOGIC: Load cart from LocalStorage on startup ---
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('hashi_pos_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const printRef = useRef();

  // --- 2. PERSISTENCE LOGIC: Save cart to LocalStorage whenever it changes ---
  useEffect(() => {
    localStorage.setItem('hashi_pos_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_URL}/products`);
      setProducts(res.data);
    } catch (error) { console.error(error); }
  };

  // Find and replace this function in Billing.jsx
const getImageUrl = (path) => {
  if (!path) return "https://via.placeholder.com/150?text=No+Image";
  // If it's a local path like /static/uploads/..., add the backend URL
  if (path.startsWith('/static')) {
    return `http://localhost:8000${path}`;
  }
  return path; // Fallback for old Drive links
};

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return alert("Out of stock!");
      setCart(cart.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      if (product.stock < 1) return alert("Out of stock!");
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        const stock = products.find(p => p.id === id)?.stock || 999;
        if (newQty > stock) { alert("Insufficient stock!"); return item; }
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalTax = cart.reduce((sum, item) => {
    const taxRate = item.gst_percentage || 0;
    return sum + ((item.price * taxRate / 100) * item.quantity);
  }, 0);
  const grandTotal = subtotal + totalTax;

  const handlePrint = useReactToPrint({ content: () => printRef.current });

  const checkout = async () => {
  // 1. Strict Validation: Stop if cart is empty
  if (cart.length === 0) {
    alert("Cannot generate an empty bill. Please add products first.");
    return;
  }

  try {
    // 2. Send Data to Backend
    await axios.post(`${API_URL}/sales`, { 
      items: cart, 
      total_amount: grandTotal,
      subtotal: subtotal, 
      tax: totalTax 
    });

    // 3. Trigger Print
    handlePrint();

    // 4. Clear Cart and Local Storage
    setCart([]);
    localStorage.removeItem('hashi_pos_cart');

    // 5. CRITICAL: Refresh product list to show reduced stock on screen
    fetchProducts(); 

    alert("Sale Completed Successfully!");
  } catch (error) {
    console.error("Checkout error:", error);
    alert("Checkout failed. Check if backend is running.");
  }
};

  return (
    <div className="billing-layout">
      <div className="product-grid-container">
        <div className="search-container">
          <input 
            type="text" 
            className="search-input"
            placeholder="Search items or categories..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button className="clear-search" onClick={() => setSearchTerm("")}>&times;</button>}
        </div>

        <div className="product-grid">
          {filteredProducts.map((p) => (
            <div key={p.id} className="product-card" onClick={() => addToCart(p)}>
  <div className="image-container">
    {/* Try to load the image. If it fails, the onError will hide it and show the initials */}
    {p.image_url ? (
      <img src={getImageUrl(p.image_url)} className="product-image" alt={p.name} />
    ) : null}
    
    {/* This colored box only shows if the image fails or is missing */}
    <div className="fallback-box" style={{ display: p.image_url ? 'none' : 'flex' }}>
      {p.name.charAt(0).toUpperCase()}
    </div>

    <span className="category-tag">{p.category}</span>
  </div>
  <h4>{p.name}</h4>
  <p>₹{p.price.toFixed(2)} <small>+ {p.gst_percentage}% GST</small></p>
  <small>Stock: {p.stock}</small>
</div>
          ))}
          {filteredProducts.length === 0 && <div className="no-results">No items found</div>}
        </div>
      </div>

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
                <div className="tax-info">₹{item.price} | GST: {item.gst_percentage}%</div>
              </div>
              <div className="qty-controls">
                <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                <span className="qty-val">{item.quantity}</span>
                <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                <button className="remove-btn" onClick={() => removeFromCart(item.id)}>&times;</button>
              </div>
            </div>
          ))}
        </div>

        <div className="billing-summary">
          <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="summary-row"><span>Total GST</span><span>₹{totalTax.toFixed(2)}</span></div>
          <div className="summary-row grand-total"><span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          <button 
  className="pay-button" 
  onClick={checkout} 
  // This physically disables the button so no click event can trigger
  disabled={cart.length === 0} 
  style={{ 
    cursor: cart.length === 0 ? 'not-allowed' : 'pointer',
    opacity: cart.length === 0 ? 0.6 : 1 
  }}
>
  {cart.length === 0 ? "Add Items to Bill" : "Pay & Print Receipt (₹" + grandTotal.toFixed(2) + ")"}
</button>
        </div>
      </div>

      <div style={{ display: 'none' }}>
        <InvoiceTicket ref={printRef} cart={cart} subtotal={subtotal} tax={totalTax} total={grandTotal} />
      </div>
    </div>
  );
}

export default Billing;