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

app = FastAPI(title="Hashi Ice Spot Professional POS API")

# --- 1. CONFIGURATION & DIRECTORIES ---
DATA_DIR = "data"
UPLOAD_DIR = "static/uploads"
PRODUCTS_FILE = os.path.join(DATA_DIR, "products.json")
LOGS_FILE = os.path.join(DATA_DIR, "edit_logs.json")
CUSTOMERS_FILE = os.path.join(DATA_DIR, "customers.json")
MAX_FILE_SIZE = 40 * 1024 * 1024  # 40 Megabytes

# Ensure all necessary folders exist
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- 2. CORS SETUP (FIXES THE RED "BLOCKED BY CORS" ERROR) ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows both localhost and 127.0.0.1
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static folder (Keep this for existing images if any)
app.mount("/static", StaticFiles(directory="static"), name="static")

# --- 3. JSON HELPER FUNCTIONS ---

def read_json(filepath):
    if not os.path.exists(filepath):
        return []
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except:
        return []

def write_json(filepath, data):
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4)

# --- 4. DATA MODELS (FIXES THE 422 UNPROCESSABLE ENTITY ERROR) ---

class Customer(BaseModel):
    name: str
    phone: str
    points: int = 0

class Product(BaseModel):
    id: Optional[str] = None
    product_code: Optional[str] = "N/A"
    name: str
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
    discount: float = 0.0  # <--- NEW: Per-item discount amount

class SaleRequest(BaseModel):
    items: List[CartItem]
    total_amount: float = 0.0
    subtotal: float = 0.0
    tax: float = 0.0
    # We keep global discount/savings fields for reporting totals
    discount: float = 0.0 
    savings: float = 0.0
    bill_no: Optional[int] = None
    payment_method: str
    cash_amount: float = 0.0
    upi_amount: float = 0.0

# --- 5. LOGIC HELPERS (FILE ROTATION & BILL NUMBERS) ---

def read_all_sales_merged():
    merged_sales = []
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v") and f.endswith(".json")]
    files.sort(key=lambda x: int(x.split('_v')[1].split('.json')[0]))
    for file in files:
        merged_sales.extend(read_json(os.path.join(DATA_DIR, file)))
    return merged_sales

def get_next_bill_number():
    all_sales = read_all_sales_merged()
    if not all_sales:
        return 1
    nums = [s.get("bill_no", 0) for s in all_sales if isinstance(s.get("bill_no"), int)]
    return max(nums, default=0) + 1

def get_active_sales_file():
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v") and f.endswith(".json")]
    if not files:
        f = os.path.join(DATA_DIR, "sales_v1.json")
        if not os.path.exists(f): write_json(f, [])
        return f
    files.sort(key=lambda x: int(x.split('_v')[1].split('.json')[0]))
    return os.path.join(DATA_DIR, files[-1])

# --- 6. PRODUCT ENDPOINTS ---

@app.get("/api/products")
def get_products():
    return read_json(PRODUCTS_FILE)

@app.post("/api/products")
def add_product(p: Product):
    data = read_json(PRODUCTS_FILE)
    p.id = str(uuid.uuid4())
    data.append(p.dict())
    write_json(PRODUCTS_FILE, data)
    return p

@app.post("/api/products/bulk")
def add_products_bulk(products: List[Product]):
    data = read_json(PRODUCTS_FILE)
    for p in products:
        p.id = str(uuid.uuid4())
        data.append(p.dict())
    write_json(PRODUCTS_FILE, data)
    return {"status": "success"}

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

@app.delete("/api/products/{pid}")
def delete_product(pid: str):
    data = read_json(PRODUCTS_FILE)
    new_data = [p for p in data if str(p.get("id")) != str(pid)]
    write_json(PRODUCTS_FILE, new_data)
    return {"message": "Deleted"}

# --- 7. SALES ENDPOINTS ---

@app.post("/api/sales")
def process_sale(sale: SaleRequest):
    # A. Stock reduction
    prods = read_json(PRODUCTS_FILE)
    for item in sale.items:
        for p in prods:
            if str(p["id"]) == str(item.id):
                p["stock"] = int(p.get("stock", 0)) - int(item.quantity)
    write_json(PRODUCTS_FILE, prods)

    # B. Sequential Numbering
    next_no = get_next_bill_number()

    # C. Save to active file
    path = get_active_sales_file()
    sales_data = read_json(path)
    rec = sale.dict()
    rec["id"] = str(uuid.uuid4())
    rec["timestamp"] = datetime.now().isoformat()
    rec["bill_no"] = next_no
    sales_data.append(rec)
    write_json(path, sales_data)

    # D. 40MB Rotation Check
    if os.path.getsize(path) > MAX_FILE_SIZE:
        v = int(path.split('_v')[1].split('.json')[0])
        write_json(os.path.join(DATA_DIR, f"sales_v{v+1}.json"), [])

    return {"status": "success", "id": rec["id"], "bill_no": next_no}

@app.get("/api/sales")
def get_sales():
    return read_all_sales_merged()

# --- 8. EDIT BILL LOGIC WITH AUDIT LOGGING ---

@app.put("/api/sales/{sid}")
def update_sale(sid: str, updated_sale: SaleRequest):
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v")]
    prods = read_json(PRODUCTS_FILE)
    
    for f in files:
        path = os.path.join(DATA_DIR, f)
        data = read_json(path)
        for i, s in enumerate(data):
            if str(s["id"]) == str(sid):
                # --- NEW: Create a summary of product names for the log ---
                item_names = ", ".join([f"{item.quantity}x {item.name}" for item in updated_sale.items])
                
                # CREATE AUDIT LOG
                logs = read_json(LOGS_FILE)
                logs.append({
                    "id": str(uuid.uuid4()),
                    "timestamp": datetime.now().isoformat(),
                    "sale_id": sid,
                    "bill_no": s.get("bill_no", 0),
                    "old_total": s["total_amount"],
                    "new_total": updated_sale.total_amount,
                    "details": item_names # Now contains product names like "2x Badam, 1x Pista"
                })
                write_json(LOGS_FILE, logs)

                # Revert stock
                for oi in s["items"]:
                    for p in prods:
                        if str(p["id"]) == str(oi["id"]): p["stock"] += oi["quantity"]
                
                if updated_sale.total_amount <= 0 or not updated_sale.items:
                    data.pop(i)
                else:
                    for ni in updated_sale.items:
                        for p in prods:
                            if str(p["id"]) == str(ni.id): p["stock"] -= ni.quantity
                    
                    new_rec = updated_sale.dict()
                    new_rec["id"] = sid
                    new_rec["timestamp"] = s["timestamp"]
                    new_rec["bill_no"] = s.get("bill_no", 0)
                    data[i] = new_rec
                
                write_json(path, data)
                write_json(PRODUCTS_FILE, prods)
                return {"status": "updated"}
                
    raise HTTPException(status_code=404)

# --- 9. LOG ENDPOINTS ---

@app.get("/api/logs")
def get_logs():
    return read_json(LOGS_FILE)

@app.delete("/api/logs/{log_id}")
def delete_log(log_id: str):
    data = read_json(LOGS_FILE)
    new_data = [l for l in data if str(l.get("id")) != str(log_id)]
    write_json(LOGS_FILE, new_data)
    return {"status": "deleted"}


@app.get("/api/customers/{phone}")
def get_customer(phone: str):
    customers = read_json(CUSTOMERS_FILE)
    customer = next((c for c in customers if c["phone"] == phone), None)
    if not customer:
        return {"name": "", "phone": phone, "points": 0}
    return customer

@app.post("/api/customers")
def update_customer(customer: Customer):
    customers = read_json(CUSTOMERS_FILE)
    found = False
    for c in customers:
        if c["phone"] == customer.phone:
            c["name"] = customer.name
            c["points"] = customer.points
            found = True
            break
    if not found:
        customers.append(customer.dict())
    write_json(CUSTOMERS_FILE, customers)
    return {"status": "success"}

# --- 10. RUN SERVER ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)