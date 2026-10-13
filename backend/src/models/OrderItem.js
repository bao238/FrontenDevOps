const mongoose = require('mongoose');

// Bảng OrderItems (Chi tiết món hàng trong đơn)
// Khóa chính: id
// Khóa ngoại: orderId (tham chiếu Orders.id), productId (tham chiếu Products.id)
const orderItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true }, // Khóa chính (PK)
    orderId: { type: String, required: true, ref: 'Order', index: true }, // Khóa ngoại (FK -> Order.id)
    productId: { type: String, required: true, ref: 'Product', index: true }, // Khóa ngoại (FK -> Product.id)
    productName: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('OrderItem', orderItemSchema);
