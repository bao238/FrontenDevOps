const User = require('../models/User');
const { hashPassword, verifyPassword } = require('../utils/password');
const { JWT_EXPIRES_IN, signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');

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
    const phoneNoSpace = rawInput.replace(/\s+/g, '');
    let formattedPhone = '';
    if (/^0\d{9}$/.test(phoneNoSpace)) {
      formattedPhone = `${phoneNoSpace.slice(0, 4)} ${phoneNoSpace.slice(4, 7)} ${phoneNoSpace.slice(7)}`;
    }

    const orConditions = [
      { email: cleanEmail },
      { phone: rawInput },
      { name: rawInput }
    ];
    if (phoneNoSpace && phoneNoSpace !== rawInput) {
      orConditions.push({ phone: phoneNoSpace });
    }
    if (formattedPhone && formattedPhone !== rawInput) {
      orConditions.push({ phone: formattedPhone });
    }

    const user = await User.findOne({ $or: orConditions });

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
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findOne({ id: req.user.id }).select('-password').lean();
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng' });
    }
    return res.json({
      success: true,
      user: formatAuthUser(user)
    });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/auth/me - Cập nhật hồ sơ cá nhân của người dùng đang đăng nhập
exports.updateMe = async (req, res, next) => {
  try {
    const { name, phone, address, avatarUrl } = req.body;
    const user = await User.findOne({ id: req.user.id });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy thông tin tài khoản người dùng' });
    }

    if (name && String(name).trim()) {
      const cleanName = String(name).trim();
      if (cleanName !== user.name) {
        const existName = await User.findOne({ name: cleanName, id: { $ne: user.id } });
        if (existName) {
          return res.status(400).json({ message: `Tên người dùng "${cleanName}" đã tồn tại trong hệ thống!` });
        }
        user.name = cleanName;
      }
    }

    if (phone !== undefined) {
      const cleanPhone = String(phone).trim();
      if (cleanPhone && cleanPhone !== user.phone) {
        const phoneNoSpace = cleanPhone.replace(/\s+/g, '');
        if (!/^0\d{9}$/.test(phoneNoSpace)) {
          return res.status(400).json({
            message: 'Số điện thoại không hợp lệ! Vui lòng nhập đúng 10 chữ số bắt đầu bằng số 0 (Ví dụ: 0905123456)'
          });
        }
        const phoneConditions = [
          { phone: cleanPhone },
          { phone: phoneNoSpace }
        ];
        if (/^0\d{9}$/.test(phoneNoSpace)) {
          phoneConditions.push({
            phone: `${phoneNoSpace.slice(0, 4)} ${phoneNoSpace.slice(4, 7)} ${phoneNoSpace.slice(7)}`
          });
        }
        const existPhone = await User.findOne({
          $or: phoneConditions,
          id: { $ne: user.id }
        });
        if (existPhone) {
          return res.status(400).json({ message: `Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản khác!` });
        }
        user.phone = cleanPhone;
      }
    }

    if (address !== undefined) {
      user.address = String(address).trim();
    }

    if (avatarUrl !== undefined && String(avatarUrl).trim()) {
      user.avatarUrl = String(avatarUrl).trim();
    }

    await user.save();

    return res.json({
      success: true,
      message: 'Cập nhật hồ sơ cá nhân thành công!',
      user: formatAuthUser(user)
    });
  } catch (err) {
    return next(err);
  }
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

  const isAdminRequest = Boolean(req.user?.role === 'admin' && req.baseUrl !== '/api/auth');
  const rawPassword = (password !== undefined && password !== null)
    ? String(password).trim()
    : (isAdminRequest ? '123456' : '');

  if (!rawPassword || rawPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu là bắt buộc và phải có tối thiểu 6 ký tự' });
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

    // 4. Kiểm tra trùng Số điện thoại
    const phoneNoSpace = cleanPhone.replace(/\s+/g, '');
    const phoneConditions = [{ phone: cleanPhone }];
    if (phoneNoSpace && phoneNoSpace !== cleanPhone) phoneConditions.push({ phone: phoneNoSpace });
    if (/^0\d{9}$/.test(phoneNoSpace)) {
      phoneConditions.push({
        phone: `${phoneNoSpace.slice(0, 4)} ${phoneNoSpace.slice(4, 7)} ${phoneNoSpace.slice(7)}`
      });
    }
    const existPhone = await User.findOne({ $or: phoneConditions });
    if (existPhone) {
      return res.status(400).json({ message: `Số điện thoại "${cleanPhone}" đã được sử dụng bởi tài khoản khác!` });
    }

    // Khóa gán role từ client: nếu không phải request từ Admin đã qua xác thực thì luôn gán role: 'customer' & status: 'active'
    const finalRole = isAdminRequest && role ? role : 'customer';
    const finalStatus = isAdminRequest && status ? status : 'active';

    const newUser = {
      id: req.body.id || `usr-cust-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: finalRole,
      status: finalStatus,
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
      message: isAdminRequest ? 'Thêm tài khoản thành công trên MongoDB' : 'Đăng ký tài khoản thành công',
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
      { returnDocument: 'after' }
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
      { returnDocument: 'after' }
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

// POST /api/auth/forgot-password - Yêu cầu cấp mã xác thực OTP khôi phục mật khẩu
exports.forgotPassword = async (req, res, next) => {
  try {
    const { emailOrPhone } = req.body;
    const cleanInput = (emailOrPhone || '').trim();
    const cleanEmail = cleanInput.toLowerCase();

    if (!cleanInput) {
      return res.status(400).json({ message: 'Vui lòng nhập Email hoặc Số điện thoại đã đăng ký' });
    }

    const phoneNoSpace = cleanInput.replace(/\s+/g, '');
    let formattedPhone = '';
    if (/^0\d{9}$/.test(phoneNoSpace)) {
      formattedPhone = `${phoneNoSpace.slice(0, 4)} ${phoneNoSpace.slice(4, 7)} ${phoneNoSpace.slice(7)}`;
    }

    const orConditions = [
      { email: cleanEmail },
      { phone: cleanInput }
    ];
    if (phoneNoSpace && phoneNoSpace !== cleanInput) {
      orConditions.push({ phone: phoneNoSpace });
    }
    if (formattedPhone && formattedPhone !== cleanInput) {
      orConditions.push({ phone: formattedPhone });
    }

    // Tìm kiếm tài khoản độc giả qua Email hoặc Số điện thoại
    const user = await User.findOne({ $or: orConditions });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản nào khớp với thông tin cung cấp' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản này hiện đang bị tạm khóa, vui lòng liên hệ quản trị viên' });
    }

    // Tạo mã xác thực ngẫu nhiên 6 chữ số có hiệu lực trong vòng 10 phút
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetPasswordOtp = otp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
    await user.save();

    return res.json({
      success: true,
      message: `Mã xác thực OTP của bạn là: ${otp} (Hiệu lực trong 10 phút). Vui lòng nhập mã này cùng mật khẩu mới.`,
      otp,
      email: user.email,
      phone: user.phone
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/auth/reset-password - Đặt lại mật khẩu mới với mã xác thực OTP
exports.resetPassword = async (req, res, next) => {
  try {
    const { emailOrPhone, otp, newPassword } = req.body;
    const cleanInput = (emailOrPhone || '').trim();
    const cleanEmail = cleanInput.toLowerCase();
    const cleanOtp = (otp || '').trim();
    const cleanPass = String(newPassword || '').trim();

    if (!cleanInput || !cleanOtp || !cleanPass) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin tài khoản, mã OTP và mật khẩu mới' });
    }

    if (cleanPass.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
    }

    const phoneNoSpace = cleanInput.replace(/\s+/g, '');
    let formattedPhone = '';
    if (/^0\d{9}$/.test(phoneNoSpace)) {
      formattedPhone = `${phoneNoSpace.slice(0, 4)} ${phoneNoSpace.slice(4, 7)} ${phoneNoSpace.slice(7)}`;
    }

    const orConditions = [
      { email: cleanEmail },
      { phone: cleanInput }
    ];
    if (phoneNoSpace && phoneNoSpace !== cleanInput) {
      orConditions.push({ phone: phoneNoSpace });
    }
    if (formattedPhone && formattedPhone !== cleanInput) {
      orConditions.push({ phone: formattedPhone });
    }

    // Tìm kiếm tài khoản
    const user = await User.findOne({ $or: orConditions });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản trong hệ thống' });
    }

    // Kiểm tra tính hợp lệ và thời hạn của mã OTP
    if (!user.resetPasswordOtp || user.resetPasswordOtp !== cleanOtp) {
      return res.status(400).json({ message: 'Mã xác thực OTP không chính xác, vui lòng thử lại' });
    }

    if (!user.resetPasswordExpires || new Date() > user.resetPasswordExpires) {
      return res.status(400).json({ message: 'Mã xác thực OTP đã hết hạn hiệu lực (10 phút), vui lòng yêu cầu mã mới' });
    }

    // Băm mật khẩu mới và lưu vào MongoDB, xóa mã OTP đã sử dụng
    user.password = await hashPassword(cleanPass);
    user.resetPasswordOtp = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({
      success: true,
      message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.'
    });
  } catch (err) {
    return next(err);
  }
};

// PUT /api/auth/change-password - Đổi mật khẩu an toàn khi người dùng đã đăng nhập
exports.changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const cleanOldPass = String(oldPassword || '').trim();
    const cleanNewPass = String(newPassword || '').trim();

    if (!cleanOldPass || !cleanNewPass) {
      return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới' });
    }

    if (cleanNewPass.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
    }

    if (cleanNewPass === cleanOldPass) {
      return res.status(400).json({ message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại' });
    }

    // Lấy thông tin tài khoản từ payload xác thực JWT
    const user = await User.findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản người dùng' });
    }

    // Kiểm tra mật khẩu hiện tại
    const { isMatch } = await verifyPassword(cleanOldPass, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không chính xác' });
    }

    // Cập nhật mật khẩu mới đã băm
    user.password = await hashPassword(cleanNewPass);
    await user.save();

    return res.json({
      success: true,
      message: 'Đổi mật khẩu thành công!'
    });
  } catch (err) {
    return next(err);
  }
};

// POST /api/auth/refresh - Cấp mới Access Token bằng Refresh Token
exports.refreshToken = async (req, res, next) => {
  const token =
    req.body?.refreshToken ||
    req.headers['x-refresh-token'] ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7).trim()
      : null);

  if (!token) {
    return res.status(400).json({ message: 'Vui lòng cung cấp Refresh Token' });
  }

  try {
    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Phiên đăng nhập (Refresh Token) đã hết hạn, vui lòng đăng nhập lại' });
      }
      return res.status(401).json({ message: 'Refresh Token không hợp lệ' });
    }

    if (!decoded || decoded.type !== 'refresh') {
      return res.status(401).json({ message: 'Token cung cấp không phải là Refresh Token hợp lệ' });
    }

    const user = await User.findOne({ id: decoded.id || decoded.sub });
    if (!user) {
      return res.status(401).json({ message: 'Tài khoản người dùng không còn tồn tại trong hệ thống' });
    }

    if (user.status === 'locked') {
      return res.status(403).json({ message: 'Tài khoản của bạn đã bị tạm khóa' });
    }

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);

    return res.json({
      success: true,
      message: 'Cấp mới Access Token thành công',
      token: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_EXPIRES_IN,
      user: formatAuthUser(user)
    });
  } catch (err) {
    return next(err);
  }
};
