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

# --- 4. MODELS ---
class Product(BaseModel):
    id: Optional[str] = None
    product_code: Optional[str] = "N/A"
    name: str
    category: str
    price: float
    mrp: Optional[float] = 0.0
    gst_percentage: int
    stock: int
    image_url: Optional[str] = ""

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    gst_percentage: Optional[int] = 0
    mrp: Optional[float] = 0.0

class SaleRequest(BaseModel):
    items: List[CartItem]
    total_amount: float
    subtotal: float
    tax: float
    discount: float
    savings: float

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

# --- 6. SALES ENDPOINTS ---
@app.post("/api/sales")
def process_sale(sale: SaleRequest):
    # Stock Update
    prods = read_json(PRODUCTS_FILE)
    for item in sale.items:
        for p in prods:
            if str(p["id"]) == str(item.id):
                p["stock"] = max(0, int(p.get("stock", 0)) - int(item.quantity))
    write_json(PRODUCTS_FILE, prods)

    # Save Sale
    path = get_active_sales_file()
    sales = read_json(path)
    rec = sale.dict()
    rec["id"] = str(uuid.uuid4())
    rec["timestamp"] = datetime.now().isoformat()
    sales.append(rec)
    write_json(path, sales)

    # Rotation check
    if os.path.getsize(path) > MAX_FILE_SIZE:
        v = int(path.split('_v')[1].split('.json')[0])
        write_json(os.path.join(DATA_DIR, f"sales_v{v+1}.json"), [])

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
                # Revert old stock
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