/**
 * Kopiku POS - Backend (ZERO dependency)
 * Hanya memakai modul bawaan Node.js
 * Database: data/db.json
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const PORT = process.env.PORT || 3000;
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "db.json");
const publicDir = path.join(__dirname, "public");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ===== SIMPLE HASH (SHA256 + salt) =====
function hashPassword(password) {
  const salt = "kopiku-salt-2024";
  return crypto.createHash("sha256").update(salt + password).digest("hex");
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

const defaultProducts = [
  { id: 1, name: "Espresso", category: "Kopi Hitam", price: 18000, stock: 100, image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=300&fit=crop" },
  { id: 2, name: "Americano", category: "Kopi Hitam", price: 22000, stock: 80, image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=300&fit=crop" },
  { id: 3, name: "Cappuccino", category: "Kopi Susu", price: 28000, stock: 90, image: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=300&fit=crop" },
  { id: 4, name: "Cafe Latte", category: "Kopi Susu", price: 30000, stock: 85, image: "https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=400&h=300&fit=crop" },
  { id: 5, name: "Caramel Macchiato", category: "Kopi Susu", price: 35000, stock: 70, image: "https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=400&h=300&fit=crop" },
  { id: 6, name: "Vanilla Latte", category: "Kopi Susu", price: 33000, stock: 75, image: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=300&fit=crop" },
  { id: 7, name: "Mocha", category: "Kopi Susu", price: 34000, stock: 65, image: "https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&h=300&fit=crop" },
  { id: 8, name: "Affogato", category: "Spesial", price: 38000, stock: 40, image: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop" },
  { id: 9, name: "Cold Brew", category: "Kopi Dingin", price: 27000, stock: 60, image: "https://images.unsplash.com/photo-1517701604599-bb87b152cc43?w=400&h=300&fit=crop" },
  { id: 10, name: "Iced Latte", category: "Kopi Dingin", price: 32000, stock: 70, image: "https://images.unsplash.com/photo-1461023058943-7074cd78b1a0?w=400&h=300&fit=crop" },
  { id: 11, name: "Iced Americano", category: "Kopi Dingin", price: 25000, stock: 75, image: "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=400&h=300&fit=crop" },
  { id: 12, name: "Matcha Latte", category: "Non-Kopi", price: 32000, stock: 55, image: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=400&h=300&fit=crop" },
  { id: 13, name: "Hot Chocolate", category: "Non-Kopi", price: 28000, stock: 50, image: "https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?w=400&h=300&fit=crop" },
  { id: 14, name: "Red Velvet", category: "Non-Kopi", price: 30000, stock: 45, image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=300&fit=crop" },
  { id: 15, name: "Croissant", category: "Snack", price: 22000, stock: 40, image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=300&fit=crop" },
  { id: 16, name: "Banana Bread", category: "Snack", price: 25000, stock: 35, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop" },
  { id: 17, name: "Brownies", category: "Snack", price: 20000, stock: 50, image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&h=300&fit=crop" },
  { id: 18, name: "French Fries", category: "Snack", price: 18000, stock: 60, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop" },
];

function loadDB() {
  if (!fs.existsSync(dbPath)) {
    const initial = {
      admin_password: hashPassword("admin123"),
      products: defaultProducts,
      orders: [],
      nextProductId: 19,
      nextOrderId: 1,
    };
    fs.writeFileSync(dbPath, JSON.stringify(initial, null, 2));
    console.log("Database dibuat: " + dbPath);
    return initial;
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function saveDB(db) {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function nowStr() {
  return new Date().toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function sendJSON(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 12 * 1024 * 1024) {
        reject(new Error("Body terlalu besar"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(new Error("JSON tidak valid"));
      }
    });
    req.on("error", reject);
  });
}

function mimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
  };
  return map[ext] || "application/octet-stream";
}

function serveStatic(req, res, pathname) {
  let filePath = path.join(publicDir, pathname === "/" ? "index.html" : pathname);
  if (!filePath.startsWith(publicDir)) {
    sendJSON(res, 403, { success: false, message: "Forbidden" });
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(publicDir, "index.html");
  }
  const stream = fs.createReadStream(filePath);
  res.writeHead(200, { "Content-Type": mimeType(filePath) });
  stream.pipe(res);
  stream.on("error", () => {
    res.writeHead(404);
    res.end("Not found");
  });
}

async function handleAPI(req, res, pathname, query) {
  const method = req.method;

  // PRODUCTS
  if (pathname === "/api/products" && method === "GET") {
    const db = loadDB();
    return sendJSON(res, 200, { success: true, data: db.products });
  }

  if (pathname === "/api/products" && method === "POST") {
    const body = await readBody(req);
    const db = loadDB();
    if (!body.name || !body.category || body.price == null) {
      return sendJSON(res, 400, { success: false, message: "Nama, kategori, dan harga wajib" });
    }
    const product = {
      id: db.nextProductId++,
      name: body.name,
      category: body.category,
      price: parseInt(body.price),
      stock: parseInt(body.stock) || 0,
      image: body.image || null,
    };
    db.products.push(product);
    saveDB(db);
    return sendJSON(res, 201, { success: true, data: product });
  }

  const productMatch = pathname.match(/^\/api\/products\/(\d+)$/);
  if (productMatch && method === "PUT") {
    const body = await readBody(req);
    const db = loadDB();
    const id = parseInt(productMatch[1]);
    const p = db.products.find((x) => x.id === id);
    if (!p) return sendJSON(res, 404, { success: false, message: "Produk tidak ditemukan" });
    if (body.name != null) p.name = body.name;
    if (body.category != null) p.category = body.category;
    if (body.price != null) p.price = parseInt(body.price);
    if (body.stock != null) p.stock = parseInt(body.stock);
    if (body.image !== undefined) p.image = body.image;
    saveDB(db);
    return sendJSON(res, 200, { success: true, data: p });
  }

  if (productMatch && method === "DELETE") {
    const db = loadDB();
    const id = parseInt(productMatch[1]);
    const before = db.products.length;
    db.products = db.products.filter((x) => x.id !== id);
    if (db.products.length === before) {
      return sendJSON(res, 404, { success: false, message: "Produk tidak ditemukan" });
    }
    saveDB(db);
    return sendJSON(res, 200, { success: true, message: "Produk dihapus" });
  }

  // ORDERS
  if (pathname === "/api/orders" && method === "GET") {
    const db = loadDB();
    const limit = parseInt(query.limit) || 100;
    return sendJSON(res, 200, { success: true, data: db.orders.slice(0, limit) });
  }

  if (pathname === "/api/orders" && method === "POST") {
    const body = await readBody(req);
    const db = loadDB();
    const items = body.items || [];
    if (!items.length) return sendJSON(res, 400, { success: false, message: "Keranjang kosong" });

    for (const item of items) {
      if (item.product_id) {
        const product = db.products.find((p) => p.id === item.product_id);
        if (!product) return sendJSON(res, 400, { success: false, message: "Produk tidak ditemukan" });
        if (product.stock < item.qty) {
          return sendJSON(res, 400, {
            success: false,
            message: "Stok " + (item.product_name || product.name) + " tidak cukup",
          });
        }
      }
    }

    for (const item of items) {
      if (item.product_id) {
        const product = db.products.find((p) => p.id === item.product_id);
        product.stock = Math.max(0, product.stock - parseInt(item.qty));
      }
    }

    const order = {
      id: db.nextOrderId++,
      order_code: "ORD-" + Date.now().toString().slice(-8),
      customer: body.customer || "Pelanggan",
      order_type: body.order_type || "Dine-in",
      table_number: body.table_number || "-",
      note: body.note || "-",
      subtotal: parseInt(body.subtotal),
      tax: parseInt(body.tax),
      discount: parseInt(body.discount) || 0,
      total: parseInt(body.total),
      payment_method: body.payment_method,
      amount_received: parseInt(body.amount_received) || parseInt(body.total),
      change_amount: parseInt(body.change_amount) || 0,
      items: items.map((i) => ({
        product_id: i.product_id || null,
        product_name: i.product_name || i.name,
        price: parseInt(i.price),
        qty: parseInt(i.qty),
      })),
      created_at: nowStr(),
    };

    db.orders.unshift(order);
    saveDB(db);
    return sendJSON(res, 201, { success: true, data: order });
  }

  // STATS
  if (pathname === "/api/stats" && method === "GET") {
    const db = loadDB();
    const todayStr = new Date().toLocaleDateString("id-ID", {
      day: "2-digit", month: "short", year: "numeric",
    });
    const todayList = db.orders.filter(
      (o) => (o.created_at || "").includes(todayStr)
    );
    const todayRevenue = todayList.reduce((s, o) => s + (o.total || 0), 0);
    const totalRevenue = db.orders.reduce((s, o) => s + (o.total || 0), 0);
    const itemCount = {};
    todayList.forEach((o) => {
      (o.items || []).forEach((i) => {
        const n = i.product_name || i.name;
        itemCount[n] = (itemCount[n] || 0) + (i.qty || 0);
      });
    });
    const bestSellers = Object.entries(itemCount)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    return sendJSON(res, 200, {
      success: true,
      data: {
        todayRevenue,
        todayCount: todayList.length,
        totalRevenue,
        totalCount: db.orders.length,
        bestSellers,
        recentOrders: db.orders.slice(0, 8),
      },
    });
  }

  // ADMIN
  if (pathname === "/api/admin/login" && method === "POST") {
    const body = await readBody(req);
    const db = loadDB();
    if (!verifyPassword(body.password || "", db.admin_password)) {
      return sendJSON(res, 401, { success: false, message: "Password salah" });
    }
    return sendJSON(res, 200, { success: true, message: "Login berhasil", token: "admin-ok" });
  }

  if (pathname === "/api/admin/change-password" && method === "POST") {
    const body = await readBody(req);
    const db = loadDB();
    if (!body.newPassword || body.newPassword.length < 4) {
      return sendJSON(res, 400, { success: false, message: "Password baru minimal 4 karakter" });
    }
    if (!verifyPassword(body.currentPassword || "", db.admin_password)) {
      return sendJSON(res, 401, { success: false, message: "Password saat ini salah" });
    }
    db.admin_password = hashPassword(body.newPassword);
    saveDB(db);
    return sendJSON(res, 200, { success: true, message: "Password berhasil diubah" });
  }

  sendJSON(res, 404, { success: false, message: "API tidak ditemukan" });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  try {
    const base = "http://" + (req.headers.host || "localhost");
    const url = new URL(req.url, base);
    const pathname = url.pathname;

    if (pathname.startsWith("/api/")) {
      const query = Object.fromEntries(url.searchParams.entries());
      await handleAPI(req, res, pathname, query);
    } else {
      serveStatic(req, res, pathname);
    }
  } catch (err) {
    console.error(err);
    sendJSON(res, 500, { success: false, message: err.message || "Server error" });
  }
});

loadDB();
server.listen(PORT, () => {
  console.log("");
  console.log("========================================");
  console.log("  KOPIKU POS Server berjalan!");
  console.log("========================================");
  console.log("  URL      : http://localhost:" + PORT);
  console.log("  Database : " + dbPath);
  console.log("  Password : admin123 (default)");
  console.log("========================================");
  console.log("");
});
