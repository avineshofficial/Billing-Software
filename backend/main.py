import os
import json
import uuid
import shutil
from datetime import datetime
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Hashi Ice Spot API")

# --- 1. CONFIGURATION ---
DATA_DIR = "data"
UPLOAD_DIR = "static/uploads"
PRODUCTS_FILE = os.path.join(DATA_DIR, "products.json")
MAX_FILE_SIZE = 40 * 1024 * 1024  # 40MB

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- 2. CORS - Allow Frontend to talk to Backend ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change to specific URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- 3. HELPERS ---
def read_json(path):
    if not os.path.exists(path): return []
    try:
        with open(path, "r") as f: return json.load(f)
    except: return []

def write_json(path, data):
    with open(path, "w") as f: json.dump(data, f, indent=4)

def get_active_sales_file():
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v") and f.endswith(".json")]
    if not files:
        f = os.path.join(DATA_DIR, "sales_v1.json")
        if not os.path.exists(f): write_json(f, [])
        return f
    files.sort(key=lambda x: int(x.split('_v')[1].split('.json')[0]))
    return os.path.join(DATA_DIR, files[-1])

# --- Update this in main.py ---
class Product(BaseModel):
    id: Optional[str] = None
    product_code: Optional[str] = "N/A"
    name: str  # Only name is strictly required to identify the item
    category: Optional[str] = "General"
    price: float = 0.0
    mrp: Optional[float] = 0.0
    gst_percentage: Optional[int] = 0
    stock: Optional[int] = 0 
    image_url: Optional[str] = ""

class CartItem(BaseModel):
    id: str
    name: str
    price: float = 0.0
    quantity: int = 1
    gst_percentage: Optional[int] = 0
    mrp: Optional[float] = 0.0

class SaleRequest(BaseModel):
    items: List[CartItem]
    total_amount: float = 0.0
    subtotal: float = 0.0
    tax: float = 0.0
    discount: float = 0.0
    savings: float = 0.0
    
# --- 5. PRODUCT ENDPOINTS ---
@app.get("/api/products")
def get_products(): return read_json(PRODUCTS_FILE)

@app.post("/api/products")
def add_product(p: Product):
    data = read_json(PRODUCTS_FILE)
    p.id = str(uuid.uuid4())
    data.append(p.dict())
    write_json(PRODUCTS_FILE, data)
    return p

@app.put("/api/products/{pid}")
def update_product(pid: str, up: Product):
    data = read_json(PRODUCTS_FILE)
    for i, item in enumerate(data):
        if str(item["id"]) == str(pid):
            up.id = pid
            data[i] = up.dict()
            write_json(PRODUCTS_FILE, data)
            return up
    raise HTTPException(status_code=404)

# --- Inside F:\Billing-Software\backend\main.py ---

@app.delete("/api/products/{product_id}") # Must be plural 'products'
def delete_product(product_id: str):
    products = read_json(PRODUCTS_FILE)
    # Convert everything to string to ensure a perfect match
    new_products = [p for p in products if str(p.get("id")) != str(product_id)]
    
    if len(products) == len(new_products):
        # If lengths are same, nothing was found to delete
        raise HTTPException(status_code=404, detail="Product ID not found")
        
    write_json(PRODUCTS_FILE, new_products)
    return {"message": "Product deleted successfully"}

# --- 6. SALES ENDPOINTS ---
@app.post("/api/sales")
def process_sale(sale: SaleRequest):
    products = read_json(PRODUCTS_FILE)
    for item in sale.items:
        for p in products:
            if str(p["id"]) == str(item.id):
                # We subtract stock but we DON'T block the sale if it's 0
                current_stock = int(p.get("stock", 0))
                p["stock"] = current_stock - int(item.quantity)
                break
    write_json(PRODUCTS_FILE, products)
    
    # Save the sale record (Same rotation logic as before)
    path = get_active_sales_file()
    sales = read_json(path)
    rec = sale.dict()
    rec["id"] = str(uuid.uuid4())
    rec["timestamp"] = datetime.now().isoformat()
    sales.append(rec)
    write_json(path, sales)
    return {"status": "success"}

@app.get("/api/sales")
def get_all_sales():
    merged = []
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v")]
    files.sort(key=lambda x: int(x.split('_v')[1].split('.json')[0]))
    for f in files: merged.extend(read_json(os.path.join(DATA_DIR, f)))
    return merged

@app.put("/api/sales/{sid}")
def update_sale(sid: str, sale: SaleRequest):
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v")]
    prods = read_json(PRODUCTS_FILE)
    for f in files:
        path = os.path.join(DATA_DIR, f)
        data = read_json(path)
        for i, s in enumerate(data):
            if str(s["id"]) == str(sid):
                for oi in s["items"]:
                    for p in prods:
                        if str(p["id"]) == str(oi["id"]): p["stock"] += oi["quantity"]
                
                if sale.total_amount <= 0: # Auto-delete on zero
                    data.pop(i)
                else:
                    # Apply new stock
                    for ni in sale.items:
                        for p in prods:
                            if str(p["id"]) == str(ni["id"]): p["stock"] -= ni["quantity"]
                    new_rec = sale.dict()
                    new_rec["id"] = sid
                    new_rec["timestamp"] = s["timestamp"]
                    data[i] = new_rec
                
                write_json(path, data)
                write_json(PRODUCTS_FILE, prods)
                return {"status": "updated"}
    raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)