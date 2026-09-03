require('dotenv').config();

const base = {
  username: process.env.DB_USER || 'erp_user',
  // `??` (not `||`) so an intentionally-empty password (e.g. local root/no-password
  // dev setups) isn't silently overridden by the default.
  password: process.env.DB_PASSWORD ?? 'erp_password',
  database: process.env.DB_NAME || 'mini_erp',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: base,
  test: { ...base, database: `${base.database}_test` },
  production: base,
};
