const bcrypt = require('bcryptjs');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
const BCRYPT_PREFIX_REGEX = /^\$2[aby]\$\d{2}\$/;

/**
 * Kiểm tra xem chuỗi mật khẩu đã được băm theo chuẩn bcrypt hay chưa.
 */
function isBcryptHash(value) {
  return typeof value === 'string' && BCRYPT_PREFIX_REGEX.test(value);
}

/**
 * Tạo salt ngẫu nhiên và băm mật khẩu bằng bcryptjs.
 */
async function hashPassword(plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string') {
    throw new Error('Mật khẩu cần mã hóa không hợp lệ');
  }
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Đối chiếu mật khẩu người dùng nhập với mật khẩu lưu trong DB.
 * Hỗ trợ tương thích ngược nếu tài khoản cũ chưa được băm bcrypt.
 */
async function verifyPassword(plainPassword, storedPassword) {
  if (!plainPassword || !storedPassword) {
    return { isMatch: false, needsRehash: false };
  }

  if (isBcryptHash(storedPassword)) {
    const isMatch = await bcrypt.compare(plainPassword, storedPassword);
    return { isMatch, needsRehash: false };
  }

  const isMatch = plainPassword === storedPassword;
  return { isMatch, needsRehash: isMatch };
}

module.exports = {
  SALT_ROUNDS,
  isBcryptHash,
  hashPassword,
  verifyPassword
};
