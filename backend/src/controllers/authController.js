const { getPool, isDbConnected, sql } = require('../config/db');
const { initialUsers } = require('../data/initialData');

let usersMemory = [...initialUsers];

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  const pool = getPool();

  if (isDbConnected() && pool) {
    try {
      const result = await pool.request()
        .input('email', sql.NVarChar(255), email)
        .input('password', sql.NVarChar(255), password)
        .query('SELECT * FROM dbo.Users WHERE email = @email AND password = @password');

      if (result.recordset.length > 0) {
        const user = result.recordset[0];
        if (user.status === 'locked') {
          return res.status(403).json({ message: 'Tài khoản của bạn đã bị tạm khóa' });
        }
        return res.json({
          message: 'Đăng nhập thành công (GearHost)',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            avatarUrl: user.avatar_url,
            memberSince: user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '2024'
          }
        });
      }
      return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    } catch (err) {
      console.error('[AuthController] Lỗi MSSQL Login:', err.message);
    }
  }

  // Fallback memory
  const user = usersMemory.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
  }
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
      avatarUrl: user.avatarUrl,
      memberSince: user.createdAt
    }
  });
};

// POST /api/auth/register / POST /api/users
exports.register = async (req, res) => {
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

  const finalAvatar = (avatarUrl && avatarUrl.trim()) ? avatarUrl.trim() : '/images/default-avatar.png';

  const pool = getPool();
  if (isDbConnected() && pool) {
    try {
      // 2. Kiểm tra trùng Email
      const checkEmail = await pool.request()
        .input('email', sql.NVarChar(255), email.trim().toLowerCase())
        .query('SELECT id FROM dbo.Users WHERE LOWER(email) = @email');
      if (checkEmail.recordset.length > 0) {
        return res.status(400).json({ message: `Email "${email.trim()}" đã tồn tại trong hệ thống!` });
      }

      // 3. Kiểm tra trùng Tên người dùng
      const checkName = await pool.request()
        .input('name', sql.NVarChar(255), name.trim().toLowerCase())
        .query('SELECT id FROM dbo.Users WHERE LOWER(name) = @name');
      if (checkName.recordset.length > 0) {
        return res.status(400).json({ message: `Tên người dùng "${name.trim()}" đã tồn tại trong hệ thống!` });
      }

      const newUser = {
        id: req.body.id || `usr-cust-${Date.now()}`,
        name: name.trim(),
        email: email.trim(),
        phone: cleanPhone,
        role: role || 'customer',
        status: status || 'active',
        password: password || '123456',
        avatarUrl: finalAvatar,
        address: (address || '').trim(),
        createdAt: new Date().toLocaleDateString('vi-VN')
      };

      await pool.request()
        .input('id', sql.NVarChar(50), newUser.id)
        .input('name', sql.NVarChar(255), newUser.name)
        .input('email', sql.NVarChar(255), newUser.email)
        .input('phone', sql.NVarChar(50), newUser.phone)
        .input('role', sql.NVarChar(50), newUser.role)
        .input('status', sql.NVarChar(50), newUser.status)
        .input('password', sql.NVarChar(255), newUser.password)
        .input('avatar_url', sql.NVarChar(500), newUser.avatarUrl)
        .input('address', sql.NVarChar(500), newUser.address)
        .query(`
          INSERT INTO dbo.Users (id, name, email, phone, role, status, password, avatar_url, address)
          VALUES (@id, @name, @email, @phone, @role, @status, @password, @avatar_url, @address)
        `);

      return res.status(201).json({ message: 'Thêm tài khoản thành công', user: newUser });
    } catch (err) {
      console.error('[AuthController] Lỗi MSSQL Register/AddUser:', err.message);
      if (err.message.includes('UNIQUE KEY') || err.message.includes('PRIMARY KEY')) {
        return res.status(400).json({ message: 'Email đã tồn tại trong hệ thống' });
      }
      return res.status(400).json({ message: `Lỗi cơ sở dữ liệu: ${err.message}` });
    }
  }

  // Fallback memory
  if (usersMemory.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) {
    return res.status(400).json({ message: `Email "${email.trim()}" đã tồn tại trong hệ thống!` });
  }
  if (usersMemory.some(u => u.name.toLowerCase() === name.trim().toLowerCase())) {
    return res.status(400).json({ message: `Tên người dùng "${name.trim()}" đã tồn tại trong hệ thống!` });
  }

  const newUser = {
    id: req.body.id || `usr-cust-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    phone: cleanPhone,
    role: role || 'customer',
    status: status || 'active',
    password: password || '123456',
    avatarUrl: finalAvatar,
    address: (address || '').trim(),
    createdAt: new Date().toLocaleDateString('vi-VN')
  };
  usersMemory.push(newUser);
  return res.status(201).json({ message: 'Thêm tài khoản thành công', user: newUser });
};

// GET /api/users
exports.getUsers = async (req, res) => {
  const pool = getPool();
  if (isDbConnected() && pool) {
    try {
      const result = await pool.request().query('SELECT id, name, email, phone, role, status, avatar_url, address, created_at FROM dbo.Users ORDER BY created_at DESC');
      const users = result.recordset.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        avatarUrl: u.avatar_url,
        address: u.address,
        createdAt: u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : ''
      }));
      return res.json({ source: 'mssql-gearhost', count: users.length, data: users });
    } catch (err) {
      console.error('[AuthController] Lỗi MSSQL getUsers:', err.message);
    }
  }

  return res.json({ source: 'memory-fallback', count: usersMemory.length, data: usersMemory });
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, phone, role, address } = req.body;
  const pool = getPool();

  if (isDbConnected() && pool) {
    try {
      await pool.request()
        .input('id', sql.NVarChar(50), id)
        .input('name', sql.NVarChar(255), name)
        .input('phone', sql.NVarChar(50), phone)
        .input('role', sql.NVarChar(50), role)
        .input('address', sql.NVarChar(500), address)
        .query(`
          UPDATE dbo.Users
          SET name = COALESCE(@name, name),
              phone = COALESCE(@phone, phone),
              role = COALESCE(@role, role),
              address = COALESCE(@address, address)
          WHERE id = @id
        `);
      return res.json({ message: 'Cập nhật tài khoản thành công trên GearHost' });
    } catch (err) {
      console.error('[AuthController] Lỗi MSSQL updateUser:', err.message);
    }
  }

  const idx = usersMemory.findIndex(u => u.id === id);
  if (idx !== -1) {
    usersMemory[idx] = { ...usersMemory[idx], ...req.body };
    return res.json({ message: 'Cập nhật tài khoản thành công', user: usersMemory[idx] });
  }
  return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
};

// PUT /api/users/:id/status
exports.toggleUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const pool = getPool();

  if (isDbConnected() && pool) {
    try {
      await pool.request()
        .input('id', sql.NVarChar(50), id)
        .input('status', sql.NVarChar(50), status)
        .query('UPDATE dbo.Users SET status = @status WHERE id = @id');
      return res.json({ message: `Đã đổi trạng thái tài khoản thành ${status} trên GearHost` });
    } catch (err) {
      console.error('[AuthController] Lỗi MSSQL toggleUserStatus:', err.message);
    }
  }

  const user = usersMemory.find(u => u.id === id);
  if (user) {
    user.status = status;
    return res.json({ message: 'Cập nhật trạng thái thành công', user });
  }
  return res.status(404).json({ message: 'Không tìm thấy tài khoản' });
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  const pool = getPool();

  if (isDbConnected() && pool) {
    try {
      await pool.request()
        .input('id', sql.NVarChar(50), id)
        .query('DELETE FROM dbo.Users WHERE id = @id');
      return res.json({ message: 'Xóa tài khoản thành công trên GearHost' });
    } catch (err) {
      console.error('[AuthController] Lỗi MSSQL deleteUser:', err.message);
    }
  }

  usersMemory = usersMemory.filter(u => u.id !== id);
  return res.json({ message: 'Xóa tài khoản thành công' });
};
