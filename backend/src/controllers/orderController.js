const { getPool, isDbConnected, sql } = require('../config/db');
const { initialOrders } = require('../data/initialData');

let ordersMemory = [...initialOrders];

// GET /api/orders
exports.getOrders = async (req, res) => {
  const pool = getPool();
  if (isDbConnected() && pool) {
    try {
      const ordersRes = await pool.request().query('SELECT * FROM dbo.Orders ORDER BY created_at DESC');
      const itemsRes = await pool.request().query('SELECT * FROM dbo.OrderItems');

      const itemsByOrderId = {};
      itemsRes.recordset.forEach(item => {
        if (!itemsByOrderId[item.order_id]) itemsByOrderId[item.order_id] = [];
        itemsByOrderId[item.order_id].push({
          product: {
            id: item.product_id,
            name: item.product_name,
            price: Number(item.price),
            imageUrl: ''
          },
          quantity: item.quantity
        });
      });

      const orders = ordersRes.recordset.map(row => ({
        id: row.id,
        date: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
        customerInfo: {
          fullName: row.customer_name,
          phone: row.customer_phone,
          address: row.customer_address
        },
        items: itemsByOrderId[row.id] || [],
        totalAmount: Number(row.total_amount),
        paymentMethod: row.payment_method,
        status: row.status
      }));

      return res.json({ source: 'mssql-gearhost', count: orders.length, data: orders });
    } catch (err) {
      console.error('[OrderController] Lỗi truy vấn MSSQL:', err.message);
    }
  }

  return res.json({ source: 'memory-fallback', count: ordersMemory.length, data: ordersMemory });
};

// POST /api/orders
exports.createOrder = async (req, res) => {
  const { customerInfo, items, totalAmount, paymentMethod } = req.body;
  const newOrder = {
    id: `ORD-${Date.now().toString().slice(-6)}`,
    date: new Date().toISOString().split('T')[0],
    customerInfo: {
      fullName: customerInfo?.fullName || 'Khách vãng lai',
      phone: customerInfo?.phone || '',
      address: customerInfo?.address || ''
    },
    items: items || [],
    totalAmount: Number(totalAmount) || 0,
    paymentMethod: paymentMethod || 'Thanh toán khi nhận hàng (COD)',
    status: 'Đang xử lý'
  };

  const pool = getPool();
  if (isDbConnected() && pool) {
    const transaction = new sql.Transaction(pool);
    try {
      await transaction.begin();

      // 1. Thêm Order
      await new sql.Request(transaction)
        .input('id', sql.NVarChar(50), newOrder.id)
        .input('customer_name', sql.NVarChar(255), newOrder.customerInfo.fullName)
        .input('customer_phone', sql.NVarChar(50), newOrder.customerInfo.phone)
        .input('customer_address', sql.NVarChar(500), newOrder.customerInfo.address)
        .input('total_amount', sql.Decimal(18, 0), newOrder.totalAmount)
        .input('payment_method', sql.NVarChar(100), newOrder.paymentMethod)
        .input('status', sql.NVarChar(50), newOrder.status)
        .query(`
          INSERT INTO dbo.Orders (id, customer_name, customer_phone, customer_address, total_amount, payment_method, status)
          VALUES (@id, @customer_name, @customer_phone, @customer_address, @total_amount, @payment_method, @status)
        `);

      // 2. Thêm từng OrderItem
      for (const item of newOrder.items) {
        const prod = item.product || {};
        await new sql.Request(transaction)
          .input('order_id', sql.NVarChar(50), newOrder.id)
          .input('product_id', sql.NVarChar(50), prod.id || 'prod-custom')
          .input('product_name', sql.NVarChar(255), prod.name || 'Sản phẩm')
          .input('price', sql.Decimal(18, 0), Number(prod.price) || 0)
          .input('quantity', sql.Int, Number(item.quantity) || 1)
          .query(`
            INSERT INTO dbo.OrderItems (order_id, product_id, product_name, price, quantity)
            VALUES (@order_id, @product_id, @product_name, @price, @quantity)
          `);
      }

      await transaction.commit();
      return res.status(201).json({ message: 'Tạo đơn hàng thành công trên GearHost', data: newOrder });
    } catch (err) {
      await transaction.rollback();
      console.error('[OrderController] Lỗi Transaction MSSQL:', err.message);
    }
  }

  ordersMemory.unshift(newOrder);
  return res.status(201).json({ message: 'Tạo đơn hàng thành công', data: newOrder });
};

// PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const pool = getPool();
  if (isDbConnected() && pool) {
    try {
      await pool.request()
        .input('id', sql.NVarChar(50), id)
        .input('status', sql.NVarChar(50), status)
        .query('UPDATE dbo.Orders SET status = @status WHERE id = @id');

      return res.json({ message: 'Cập nhật trạng thái đơn thành công trên GearHost' });
    } catch (err) {
      console.error('[OrderController] Lỗi UPDATE trạng thái:', err.message);
    }
  }

  const order = ordersMemory.find(o => o.id === id);
  if (order) {
    order.status = status;
    return res.json({ message: 'Cập nhật trạng thái thành công', data: order });
  }
  return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
};

// DELETE /api/orders/:id
exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  const pool = getPool();
  if (isDbConnected() && pool) {
    try {
      await pool.request()
        .input('id', sql.NVarChar(50), id)
        .query('DELETE FROM dbo.Orders WHERE id = @id');
      return res.json({ message: 'Xóa đơn hàng thành công trên GearHost' });
    } catch (err) {
      console.error('[OrderController] Lỗi DELETE đơn hàng:', err.message);
    }
  }

  ordersMemory = ordersMemory.filter(o => o.id !== id);
  return res.json({ message: 'Xóa đơn hàng thành công' });
};

