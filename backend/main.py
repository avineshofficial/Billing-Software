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
MAX_FILE_SIZE = 40 * 1024 * 1024  # 40 Megabytes

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# --- 2. JSON HELPER FUNCTIONS ---

def read_json(filepath):
    if not os.path.exists(filepath): return []
    try:
        with open(filepath, "r") as f: return json.load(f)
    except: return []

def write_json(filepath, data):
    with open(filepath, "w") as f: json.dump(data, f, indent=4)

# --- 3. FILE ROTATION LOGIC (40MB LIMIT) ---

def get_active_sales_file():
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v") and f.endswith(".json")]
    if not files:
        initial_file = os.path.join(DATA_DIR, "sales_v1.json")
        if not os.path.exists(initial_file): write_json(initial_file, [])
        return initial_file
    files.sort(key=lambda x: int(x.split('_v')[1].split('.json')[0]))
    return os.path.join(DATA_DIR, files[-1])

def read_all_sales_merged():
    merged_sales = []
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v") and f.endswith(".json")]
    files.sort(key=lambda x: int(x.split('_v')[1].split('.json')[0]))
    for file in files:
        path = os.path.join(DATA_DIR, file)
        merged_sales.extend(read_json(path))
    return merged_sales

# --- 4. DATA MODELS ---

class Product(BaseModel):
    id: Optional[str] = None
    product_code: Optional[str] = "N/A"  # Added default value
    name: str
    category: str
    price: float
    mrp: Optional[float] = 0.0           # Added default value
    gst_percentage: int
    stock: int

class CartItem(BaseModel):
    id: str
    name: str
    price: float
    quantity: int
    gst_percentage: Optional[int] = 0

class SaleRequest(BaseModel):
    items: List[CartItem]
    total_amount: float
    subtotal: float
    tax: float
    discount: float
    savings: float # Ensure this is included

# --- 5. ENDPOINTS ---

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    extension = file.filename.split(".")[-1]
    unique_filename = f"{uuid.uuid4()}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"url": f"/static/uploads/{unique_filename}"}

@app.get("/api/products")
def get_products(): return read_json(PRODUCTS_FILE)

@app.post("/api/products")
def add_product(product: Product):
    products = read_json(PRODUCTS_FILE)
    product.id = str(uuid.uuid4())
    products.append(product.dict())
    write_json(PRODUCTS_FILE, products)
    return product

@app.put("/api/products/{product_id}")
def update_product(product_id: str, updated_product: Product):
    products = read_json(PRODUCTS_FILE)
    for i, p in enumerate(products):
        if str(p["id"]) == str(product_id):
            updated_product.id = product_id
            products[i] = updated_product.dict()
            write_json(PRODUCTS_FILE, products)
            return updated_product
    raise HTTPException(status_code=404)

@app.delete("/api/products/{product_id}")
def delete_product(product_id: str):
    products = read_json(PRODUCTS_FILE)
    new_products = [p for p in products if str(p["id"]) != str(product_id)]
    write_json(PRODUCTS_FILE, new_products)
    return {"message": "Deleted"}

@app.post("/api/sales")
def process_sale(sale: SaleRequest):
    products = read_json(PRODUCTS_FILE)
    for item in sale.items:
        for p in products:
            if str(p["id"]) == str(item.id):
                p["stock"] = max(0, int(p.get("stock", 0)) - int(item.quantity))
                break
    write_json(PRODUCTS_FILE, products)

    active_file = get_active_sales_file()
    sales_data = read_json(active_file)
    sale_record = sale.dict()
    sale_record["id"] = str(uuid.uuid4())
    sale_record["timestamp"] = datetime.now().isoformat()
    sales_data.append(sale_record)
    write_json(active_file, sales_data)
    
    if os.path.getsize(active_file) > MAX_FILE_SIZE:
        current_version = int(active_file.split('_v')[1].split('.json')[0])
        write_json(os.path.join(DATA_DIR, f"sales_v{current_version + 1}.json"), [])
        
    return {"message": "Success", "id": sale_record["id"]}

@app.get("/api/sales")
def get_sales(): return read_all_sales_merged()

# --- CRITICAL: UPDATED EDIT LOGIC (AUTO-DELETE ON ZERO) ---
@app.put("/api/sales/{sale_id}")
def update_sale(sale_id: str, updated_sale: SaleRequest):
    products = read_json(PRODUCTS_FILE)
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v") and f.endswith(".json")]
    
    sale_processed = False
    for file in files:
        path = os.path.join(DATA_DIR, file)
        sales = read_json(path)
        
        for i, s in enumerate(sales):
            if str(s["id"]) == str(sale_id):
                # 1. Revert Old Stock
                for old_item in s["items"]:
                    for p in products:
                        if str(p["id"]) == str(old_item["id"]):
                            p["stock"] = int(p.get("stock", 0)) + int(old_item["quantity"])
                
                # 2. Check for Zero Amount Deletion
                if updated_sale.total_amount <= 0 or not updated_sale.items:
                    sales.pop(i)
                    write_json(path, sales)
                    write_json(PRODUCTS_FILE, products)
                    return {"message": "Record deleted due to zero amount"}

                # 3. Apply New Stock
                for new_item in updated_sale.items:
                    for p in products:
                        if str(p["id"]) == str(new_item.id):
                            p["stock"] = max(0, int(p.get("stock", 0)) - int(new_item.quantity))
                
                # 4. Update full record with new totals
                new_data = updated_sale.dict()
                new_data["id"] = sale_id
                new_data["timestamp"] = s["timestamp"] 
                sales[i] = new_data
                
                write_json(path, sales)
                write_json(PRODUCTS_FILE, products)
                sale_processed = True
                break
        if sale_processed: break
        
    if not sale_processed: raise HTTPException(status_code=404)
    return {"message": "Updated successfully"}

@app.delete("/api/sales/{sale_id}")
def delete_sale(sale_id: str):
    files = [f for f in os.listdir(DATA_DIR) if f.startswith("sales_v") and f.endswith(".json")]
    for file in files:
        path = os.path.join(DATA_DIR, file)
        sales = read_json(path)
        filtered = [s for s in sales if str(s["id"]) != str(sale_id)]
        if len(sales) != len(filtered):
            write_json(path, filtered)
            return {"message": "Deleted"}
    raise HTTPException(status_code=404)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)