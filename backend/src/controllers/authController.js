const User = require('../models/User');
const { isDbConnected } = require('../config/db');

// POST /api/auth/login
exports.login = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  const { email, password } = req.body;
  const cleanEmail = (email || '').trim().toLowerCase();

  try {
    const user = await User.findOne({
      $or: [{ email: cleanEmail }, { name: (email || '').trim() }],
      password: password
    }).lean();

    if (user) {
      if (user.status === 'locked') {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị tạm khóa' });
      }
      return res.json({
        message: 'Đăng nhập thành công',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatarUrl: user.avatarUrl || '/default-avatar.png',
          memberSince: user.createdAtStr || (user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '2024')
        }
      });
    }
    return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
  } catch (err) {
    console.error('[AuthController] Lỗi đăng nhập MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi đăng nhập MongoDB', message: err.message });
  }
};

// POST /api/auth/register hoặc POST /api/users
exports.register = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  const { name, email, phone, password, role, status, address, avatarUrl } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Họ và tên người dùng là bắt buộc' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ message: 'Email đăng nhập là bắt buộc' });
  }

  // 1. Kiểm tra định dạng số điện thoại 10 số
  const cleanPhone = (phone || '').trim();
  if (!cleanPhone) {
    return res.status(400).json({ message: 'Số điện thoại là bắt buộc, vui lòng nhập đủ 10 số' });
  }
  if (!/^0\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ message: 'Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0 (Ví dụ: 0905123456)' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();
  const finalAvatar = (avatarUrl && avatarUrl.trim()) ? avatarUrl.trim() : '/default-avatar.png';

  try {
    // 2. Kiểm tra trùng Email
    const existEmail = await User.findOne({ email: cleanEmail });
    if (existEmail) {
      return res.status(400).json({ message: `Email "${cleanEmail}" đã tồn tại trong hệ thống!` });
    }

    // 3. Kiểm tra trùng Tên người dùng
    const existName = await User.findOne({ name: cleanName });
    if (existName) {
      return res.status(400).json({ message: `Tên người dùng "${cleanName}" đã tồn tại trong hệ thống!` });
    }

    const newUser = {
      id: req.body.id || `usr-cust-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: role || 'customer',
      status: status || 'active',
      password: password || '123456',
      avatarUrl: finalAvatar,
      address: (address || '').trim(),
      createdAtStr: new Date().toLocaleDateString('vi-VN')
    };

    const created = await User.create(newUser);
    return res.status(201).json({ message: 'Thêm tài khoản thành công trên MongoDB', user: created });
  } catch (err) {
    console.error('[AuthController] Lỗi tạo tài khoản MongoDB:', err.message);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email hoặc ID đã tồn tại trong hệ thống' });
    }
    return res.status(500).json({ error: `Lỗi cơ sở dữ liệu MongoDB: ${err.message}` });
  }
};

// GET /api/users
exports.getUsers = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const formatted = users.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      avatarUrl: u.avatarUrl || '/default-avatar.png',
      address: u.address || '',
      createdAt: u.createdAtStr || (u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : '')
    }));
    return res.json({ source: 'mongodb', count: formatted.length, data: formatted });
  } catch (err) {
    console.error('[AuthController] Lỗi lấy danh sách user MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi lấy danh sách người dùng', message: err.message });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const updated = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản trong cơ sở dữ liệu' });
    }
    return res.json({ message: 'Cập nhật tài khoản thành công trên MongoDB', user: updated });
  } catch (err) {
    console.error('[AuthController] Lỗi cập nhật user MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi cập nhật tài khoản', message: err.message });
  }
};

// PUT /api/users/:id/status
exports.toggleUserStatus = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const updated = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: req.body.status } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản trong cơ sở dữ liệu' });
    }
    return res.json({ message: `Đã đổi trạng thái tài khoản thành ${req.body.status} trên MongoDB` });
  } catch (err) {
    console.error('[AuthController] Lỗi toggleUserStatus MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi cập nhật trạng thái tài khoản', message: err.message });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: 'Cơ sở dữ liệu MongoDB chưa kết nối' });
  }

  try {
    const deleted = await User.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản cần xóa' });
    }
    return res.json({ message: 'Xóa tài khoản thành công trên MongoDB' });
  } catch (err) {
    console.error('[AuthController] Lỗi xóa user MongoDB:', err.message);
    return res.status(500).json({ error: 'Lỗi xóa tài khoản', message: err.message });
  }
};
