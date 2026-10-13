const { getPool, isDbConnected, sql } = require('../config/db');

function mapDbProduct(row) {
  let specsObj = {};
  if (typeof row.specs === 'string') {
    try {
      specsObj = JSON.parse(row.specs);
    } catch {
      specsObj = {};
    }
  } else if (typeof row.specs === 'object' && row.specs !== null) {
    specsObj = row.specs;
  }

  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    originalPrice: Number(row.original_price),
    discountPercent: row.discount_percent,
    rating: Number(row.rating),
    reviewsCount: row.reviews_count,
    imageUrl: row.image_url,
    description: row.description,
    specs: specsObj,
    inStock: Boolean(row.in_stock),
    featured: Boolean(row.featured)
  };
}

// GET /api/products
exports.getProducts = async (req, res) => {
  const pool = getPool();
  if (!isDbConnected() || !pool) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu SQL Server chưa kết nối' });
  }

  try {
    const result = await pool.request().query('SELECT * FROM dbo.Products ORDER BY created_at DESC');
    const products = result.recordset.map(mapDbProduct);
    return res.json({ source: 'mssql', count: products.length, data: products });
  } catch (err) {
    console.error('[ProductController] Lỗi truy vấn MSSQL:', err.message);
    return res.status(500).json({ error: 'Lỗi truy vấn SQL Server', message: err.message });
  }
};

// GET /api/products/:id
exports.getProductById = async (req, res) => {
  const { id } = req.params;
  const pool = getPool();
  if (!isDbConnected() || !pool) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu SQL Server chưa kết nối' });
  }

  try {
    const result = await pool.request()
      .input('id', sql.NVarChar(50), id)
      .query('SELECT * FROM dbo.Products WHERE id = @id');

    if (result.recordset.length > 0) {
      return res.json({ source: 'mssql', data: mapDbProduct(result.recordset[0]) });
    }
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong cơ sở dữ liệu' });
  } catch (err) {
    console.error('[ProductController] Lỗi truy vấn MSSQL:', err.message);
    return res.status(500).json({ error: 'Lỗi truy vấn SQL Server', message: err.message });
  }
};

// POST /api/products
exports.createProduct = async (req, res) => {
  const pool = getPool();
  if (!isDbConnected() || !pool) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu SQL Server chưa kết nối' });
  }

  const newProduct = {
    id: req.body.id || `prod-${Date.now()}`,
    name: req.body.name,
    category: req.body.category || 'Phụ kiện',
    price: Number(req.body.price) || 0,
    originalPrice: Number(req.body.originalPrice) || Number(req.body.price) || 0,
    discountPercent: Number(req.body.discountPercent) || 0,
    rating: Number(req.body.rating) || 5.0,
    reviewsCount: Number(req.body.reviewsCount) || 0,
    imageUrl: req.body.imageUrl || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
    description: req.body.description || '',
    specs: req.body.specs || {},
    inStock: req.body.inStock !== false,
    featured: Boolean(req.body.featured)
  };

  try {
    await pool.request()
      .input('id', sql.NVarChar(50), newProduct.id)
      .input('name', sql.NVarChar(255), newProduct.name)
      .input('category', sql.NVarChar(100), newProduct.category)
      .input('price', sql.Decimal(18, 0), newProduct.price)
      .input('original_price', sql.Decimal(18, 0), newProduct.originalPrice)
      .input('discount_percent', sql.Int, newProduct.discountPercent)
      .input('rating', sql.Decimal(3, 1), newProduct.rating)
      .input('reviews_count', sql.Int, newProduct.reviewsCount)
      .input('image_url', sql.NVarChar(500), newProduct.imageUrl)
      .input('description', sql.NVarChar(sql.MAX), newProduct.description)
      .input('specs', sql.NVarChar(sql.MAX), JSON.stringify(newProduct.specs))
      .input('in_stock', sql.Bit, newProduct.inStock ? 1 : 0)
      .input('featured', sql.Bit, newProduct.featured ? 1 : 0)
      .query(`
        INSERT INTO dbo.Products (id, name, category, price, original_price, discount_percent, rating, reviews_count, image_url, description, specs, in_stock, featured)
        VALUES (@id, @name, @category, @price, @original_price, @discount_percent, @rating, @reviews_count, @image_url, @description, @specs, @in_stock, @featured)
      `);

    return res.status(201).json({ message: 'Tạo sản phẩm thành công trên SQL Server', data: newProduct });
  } catch (err) {
    console.error('[ProductController] Lỗi INSERT MSSQL:', err.message);
    return res.status(500).json({ error: 'Lỗi thêm sản phẩm vào SQL Server', message: err.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const pool = getPool();
  if (!isDbConnected() || !pool) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu SQL Server chưa kết nối' });
  }

  try {
    const result = await pool.request()
      .input('id', sql.NVarChar(50), id)
      .input('name', sql.NVarChar(255), updateData.name)
      .input('category', sql.NVarChar(100), updateData.category)
      .input('price', sql.Decimal(18, 0), updateData.price)
      .input('in_stock', sql.Bit, updateData.inStock !== undefined ? (updateData.inStock ? 1 : 0) : null)
      .query(`
        UPDATE dbo.Products
        SET name = COALESCE(@name, name),
            category = COALESCE(@category, category),
            price = COALESCE(@price, price),
            in_stock = COALESCE(@in_stock, in_stock)
        WHERE id = @id
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm trong cơ sở dữ liệu' });
    }
    return res.json({ message: 'Cập nhật sản phẩm thành công trên SQL Server' });
  } catch (err) {
    console.error('[ProductController] Lỗi UPDATE MSSQL:', err.message);
    return res.status(500).json({ error: 'Lỗi cập nhật sản phẩm', message: err.message });
  }
};

// DELETE /api/products/:id
exports.deleteProduct = async (req, res) => {
  const { id } = req.params;
  const pool = getPool();
  if (!isDbConnected() || !pool) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu SQL Server chưa kết nối' });
  }

  try {
    const result = await pool.request()
      .input('id', sql.NVarChar(50), id)
      .query('DELETE FROM dbo.Products WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm cần xóa' });
    }
    return res.json({ message: 'Xóa sản phẩm thành công trên SQL Server' });
  } catch (err) {
    console.error('[ProductController] Lỗi DELETE MSSQL:', err.message);
    return res.status(500).json({ error: 'Lỗi xóa sản phẩm', message: err.message });
  }
};
