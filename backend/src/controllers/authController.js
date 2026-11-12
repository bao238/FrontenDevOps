const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { JWT_EXPIRES_IN, signAccessToken, signRefreshToken } = require('../utils/jwt');

function formatAuthUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    avatarUrl: user.avatarUrl || '/default-avatar.png',
    address: user.address || '',
    memberSince:
      user.createdAtStr ||
      (user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : '2024')
  };
}

// POST /api/auth/login
exports.login = async (req, res, next) => {
  const { email, password } = req.body;
  const rawInput = (email || '').trim();
  const cleanEmail = rawInput.toLowerCase();

  if (!rawInput || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ Email/Số điện thoại và mật khẩu' });
  }

  try {
    const user = await User.findOne({
      $or: [
        { email: cleanEmail },
        { phone: rawInput },
        { name: rawInput }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    const { isMatch, needsRehash } = await verifyPassword(String(password), user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị tạm khóa' });
    }

    // Tự động băm lại nếu tài khoản cũ trong DB vẫn đang lưu mật khẩu dạng thô
    if (needsRehash) {
      user.password = await hashPassword(String(password));
      await user.save();
    }

    const token = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    return res.json({
      message: 'Đăng nhập thành công',
      token,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      user: formatAuthUser(user)
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/auth/me
exports.getMe = async (req, res) => {
  return res.json({
    success: true,
    user: formatAuthUser(req.user)
  });
};

// POST /api/auth/register hoặc POST /api/users
exports.register = async (req, res, next) => {
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
    return res.status(400).json({
      message: 'Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0 (Ví dụ: 0905123456)'
    });
  }

  const rawPassword = password ? String(password) : '123456';
  if (rawPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu phải có tối thiểu 6 ký tự' });
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

    const isAdminRequest = req.user?.role === 'admin';
    const newUser = {
      id: req.body.id || `usr-cust-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: isAdminRequest ? (role || 'customer') : 'customer',
      status: isAdminRequest ? (status || 'active') : 'active',
      password: rawPassword,
      avatarUrl: finalAvatar,
      address: (address || '').trim(),
      createdAtStr: new Date().toLocaleDateString('vi-VN')
    };

    const created = await User.create(newUser);
    const safeUser = created.toSafeObject();
    const token = signAccessToken(safeUser);
    const refreshToken = signRefreshToken(safeUser);

    return res.status(201).json({
      message: 'Thêm tài khoản thành công trên MongoDB',
      token,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN,
      user: safeUser
    });
  } catch (err) {
    return next(err);
  }
};

// GET /api/users (Hỗ trợ phân trang khi dữ liệu lớn)
exports.getUsers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const query = {};
    if (req.query.role && req.query.role !== 'all') {
      query.role = req.query.role;
    }
    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }
    if (req.query.search && req.query.search.trim()) {
      const q = req.query.search.trim();
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } }
      ];
    }

    const totalCount = await User.countDocuments(query);
    const totalAllCount = await User.countDocuments();

    // Thong ke nguoi dung theo vai tro va trang thai truc tiep tu MongoDB
    const [adminCount, staffCount, customerCount, lockedCount] = await Promise.all([
      User.countDocuments({ role: 'admin' }),
      User.countDocuments({ role: 'staff' }),
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ status: 'locked' })
    ]);

    const stats = {
      total: totalAllCount,
      adminCount,
      staffCount,
      customerCount,
      lockedCount
    };

    const users = await User.find(query)
      .select('-userPayload -profileBio -password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

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

    return res.json({
      source: 'mongodb',
      count: totalCount,
      totalAllCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: page,
      stats,
      data: formatted
    });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res, next) => {
  try {
    const isAdminRequest = req.user?.role === 'admin';
    const { name, email, phone, role, status, address, avatarUrl, password } = req.body;
    const updateData = {};
    if (name) updateData.name = String(name).trim();
    if (email) updateData.email = String(email).trim().toLowerCase();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (isAdminRequest && role) updateData.role = role;
    if (isAdminRequest && status) updateData.status = status;
    if (address !== undefined) updateData.address = String(address).trim();
    if (avatarUrl) updateData.avatarUrl = String(avatarUrl).trim();
    if (password && String(password).trim()) {
      const cleanPass = String(password).trim();
      if (cleanPass.length < 6) {
        return res.status(400).json({ message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
      }
      updateData.password = await hashPassword(cleanPass);
    }

    const targetId = req.params.id;
    const queryConditions = [
      { id: targetId },
      { email: (targetId || '').toLowerCase() }
    ];
    if (req.body.oldEmail) {
      queryConditions.push({ email: req.body.oldEmail.toLowerCase() });
    }
    if (req.body.id) {
      queryConditions.push({ id: req.body.id });
    }
    if (req.body.phone) {
      queryConditions.push({ phone: req.body.phone });
    }

    const updated = await User.findOneAndUpdate(
      { $or: queryConditions },
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản trong cơ sở dữ liệu' });
    }
    return res.json({ message: 'Cập nhật tài khoản thành công trên MongoDB', user: updated });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/users/:id/status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const nextStatus = req.body.status;
    if (!['active', 'locked'].includes(nextStatus)) {
      return res.status(400).json({ message: 'Trạng thái tài khoản không hợp lệ (chỉ nhận active hoặc locked)' });
    }
    if (req.user && req.user.id === req.params.id && nextStatus === 'locked') {
      return res.status(400).json({ message: 'Không thể tự khóa tài khoản Quản trị viên đang đăng nhập' });
    }

    const updated = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: { status: nextStatus } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản trong cơ sở dữ liệu' });
    }
    return res.json({ message: `Đã đổi trạng thái tài khoản thành ${nextStatus} trên MongoDB` });
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    const deleted = await User.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản cần xóa' });
    }
    return res.json({ message: 'Xóa tài khoản thành công trên MongoDB' });
  } catch (err) {
    return next(err);
  }
};
