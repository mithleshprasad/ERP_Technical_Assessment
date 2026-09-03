/**
 * Runs entirely on a worker thread so parsing, validating, and bulk-writing
 * a 100,000+ row CSV/Excel file never blocks the main Node.js event loop -
 * the HTTP server keeps handling other requests (including WebSocket
 * traffic) the whole time this runs. Uses a raw mysql2 connection (not
 * Sequelize) so it can issue efficient multi-row `INSERT ... VALUES ?`
 * batches instead of one round-trip per row.
 */
const { parentPort, workerData } = require('worker_threads');
const XLSX = require('xlsx');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const BATCH_SIZE = 1000;
const REQUIRED_HEADERS = ['product name', 'sku', 'price', 'opening stock'];

function normalizeHeader(cell) {
  return String(cell ?? '').trim().toLowerCase();
}

function parseRows(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false });
  if (rows.length === 0) return { headerIndex: null, dataRows: [] };

  const headerRow = rows[0].map(normalizeHeader);
  const headerIndex = {
    name: headerRow.indexOf('product name'),
    sku: headerRow.indexOf('sku'),
    price: headerRow.indexOf('price'),
    stock: headerRow.indexOf('opening stock'),
  };
  const missing = REQUIRED_HEADERS.filter((h) => !headerRow.includes(h));
  if (missing.length > 0) {
    throw new Error(`Missing required column(s): ${missing.join(', ')}`);
  }

  return { headerIndex, dataRows: rows.slice(1) };
}

async function fetchExistingSkus(connection, skus) {
  const existing = new Set();
  const uniqueSkus = Array.from(new Set(skus));
  for (let i = 0; i < uniqueSkus.length; i += 5000) {
    const chunk = uniqueSkus.slice(i, i + 5000);
    if (chunk.length === 0) continue;
    const [rows] = await connection.query('SELECT sku FROM products WHERE sku IN (?)', [chunk]);
    rows.forEach((r) => existing.add(r.sku));
  }
  return existing;
}

async function resolveDefaultWarehouseId(connection) {
  const [rows] = await connection.query('SELECT id FROM warehouses ORDER BY created_at ASC LIMIT 1');
  if (rows.length > 0) return rows[0].id;

  const id = uuidv4();
  const now = new Date();
  await connection.query('INSERT INTO warehouses (id, name, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
    id,
    'Main Warehouse',
    'Default',
    now,
    now,
  ]);
  return id;
}

async function insertBatch(connection, warehouseId, batch) {
  const now = new Date();

  await connection.beginTransaction();
  try {
    await connection.query('INSERT INTO products (id, name, sku, price, is_active, created_at, updated_at) VALUES ?', [
      batch.map((r) => [r.id, r.name, r.sku, r.price, 1, now, now]),
    ]);

    await connection.query(
      'INSERT INTO inventories (id, product_id, warehouse_id, available_quantity, reserved_quantity, created_at, updated_at) VALUES ?',
      [batch.map((r) => [uuidv4(), r.id, warehouseId, r.openingStock, 0, now, now])]
    );

    await connection.query(
      'INSERT INTO inventory_transactions (id, product_id, warehouse_id, type, quantity, reference_id, note, created_at) VALUES ?',
      [batch.map((r) => [uuidv4(), r.id, warehouseId, 'IN', r.openingStock, 'BULK_IMPORT', 'Bulk import opening stock', now])]
    );

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  }
}

async function run() {
  const { fileBuffer, dbConfig } = workerData;
  const connection = await mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
  });

  try {
    const { headerIndex, dataRows } = parseRows(Buffer.from(fileBuffer));

    const invalidRows = [];
    const candidates = [];
    const seenInFile = new Map(); // sku -> first row number seen

    dataRows.forEach((row, idx) => {
      const rowNumber = idx + 2; // header is row 1
      const name = String(row[headerIndex.name] ?? '').trim();
      const sku = String(row[headerIndex.sku] ?? '').trim();
      const rawPrice = row[headerIndex.price];
      const rawStock = row[headerIndex.stock];
      const price = Number(rawPrice);
      const openingStock = Number(rawStock);

      const reasons = [];
      if (!name) reasons.push('Product Name is required');
      if (!sku) reasons.push('SKU is required');
      if (rawPrice === '' || rawPrice === undefined || Number.isNaN(price) || price <= 0) {
        reasons.push('Price must be a positive number');
      }
      if (rawStock === '' || rawStock === undefined || Number.isNaN(openingStock) || openingStock < 0 || !Number.isInteger(openingStock)) {
        reasons.push('Opening Stock must be a non-negative integer');
      }
      if (sku && seenInFile.has(sku)) {
        reasons.push(`Duplicate SKU within file (also on row ${seenInFile.get(sku)})`);
      }

      if (reasons.length > 0) {
        invalidRows.push({ row: rowNumber, sku: sku || null, reasons });
        return;
      }

      seenInFile.set(sku, rowNumber);
      candidates.push({ row: rowNumber, id: uuidv4(), name, sku, price, openingStock });
    });

    const existingSkus = await fetchExistingSkus(connection, candidates.map((c) => c.sku));
    const validRows = [];
    for (const candidate of candidates) {
      if (existingSkus.has(candidate.sku)) {
        invalidRows.push({ row: candidate.row, sku: candidate.sku, reasons: ['SKU already exists in database'] });
      } else {
        validRows.push(candidate);
      }
    }

    const warehouseId = validRows.length > 0 ? await resolveDefaultWarehouseId(connection) : null;
    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      await insertBatch(connection, warehouseId, validRows.slice(i, i + BATCH_SIZE));
    }

    parentPort.postMessage({
      type: 'result',
      payload: {
        totalRows: dataRows.length,
        importedCount: validRows.length,
        failedCount: invalidRows.length,
        invalidRows: invalidRows.sort((a, b) => a.row - b.row),
      },
    });
  } catch (err) {
    parentPort.postMessage({ type: 'error', message: err.message });
  } finally {
    await connection.end();
  }
}

run();
