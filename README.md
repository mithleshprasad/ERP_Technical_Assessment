# Mini ERP - Order & Inventory Management System

A backend system (plus a small React admin UI) that manages products, inventory, sales orders and
double-entry accounting while safely handling concurrent stock updates.

Stack: **Node.js, Express, JavaScript (no TypeScript), MySQL + Sequelize, Redis, Socket.IO, React (Vite), Docker.**

---

## 1. Project Setup

### Option A - Docker (recommended, matches the assessment requirement)

```bash
docker-compose up --build
```

This starts four containers:

| Service  | Purpose                          | Port                    |
|----------|-----------------------------------|--------------------------|
| mysql    | MySQL 8 database                  | 3306                     |
| redis    | Redis 7 cache / rate limiter      | 6379                     |
| backend  | Express API + Socket.IO           | 4000                     |
| frontend | React admin UI (built, served by nginx) | 5173               |

The backend container automatically runs `sequelize-cli db:migrate` and `db:seed:all` on startup
(see `backend/Dockerfile`), so the database schema and demo data are ready as soon as the health
checks pass. No manual `.env` file is required to get started - `docker-compose.yml` ships with
working defaults; copy `.env.example` to `.env` at the repo root only if you want to override them
(e.g. a real `JWT_SECRET` for anything beyond local demo use).

Once containers are up:
- API base URL: `http://localhost:4000/api`
- Frontend: `http://localhost:5173`
- Health check: `GET http://localhost:4000/api/health`

**Demo accounts** (seeded, password for all: `Password@123`):

| Email              | Role        |
|--------------------|-------------|
| admin@erp.test     | ADMIN       |
| manager@erp.test   | MANAGER     |
| sales@erp.test     | SALES_USER  |

Seeded stock: **Product A starts at 5 units** - exactly the quantity used in the assessment's
concurrency scenario (see §5).

### Option B - Run locally without Docker

Requires a local MySQL 8 and Redis instance.

```bash
cd backend
cp .env.example .env        # edit DB_HOST/REDIS_HOST to localhost, etc.
npm install
npm run migrate
npm run seed
npm run dev                 # nodemon, http://localhost:4000

cd ../frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

---

## 2. Architecture

Layered, monolithic Express app - one process, one MySQL database, one Redis instance. Chosen over
microservices/event-driven because the whole domain (products, inventory, orders, accounting) needs
strong transactional consistency, and a single relational transaction is the simplest way to
guarantee that (see §6 and §9).

```
Request
  -> routes/*            (URL -> handler wiring, per-route RBAC + validation)
  -> middleware/*         (JWT auth, role check, Joi validation, rate limiting)
  -> controllers/*        (HTTP <-> service glue, no business logic)
  -> services/*           (business logic, transactions, cache, sockets)
  -> models/* (Sequelize) (schema + associations)
  -> MySQL / Redis
```

- `services/inventory.service.js` - stock mutation logic, including the atomic conditional UPDATE
  used for concurrency-safe deduction.
- `services/order.service.js` - orchestrates the full order flow inside one DB transaction.
- `services/accounting.service.js` - double-entry journal entry creation.
- `services/cache.service.js` - Redis get/set/invalidate helpers, fails open (never throws) so a
  Redis outage degrades performance, not availability.
- `services/socket.service.js` - Socket.IO singleton; `inventory_updated` broadcast.
- `workers/importWorker.js` - CSV/Excel bulk import, runs on a `worker_threads` worker so a
  100,000+ row file never blocks the main event loop (§10).

The React frontend (`frontend/`) is a thin admin client - not part of the graded backend spec, added
as a bonus to exercise every endpoint. It uses React Query for request caching/deduping, a single
shared Socket.IO connection, and memoized row components so live stock updates only re-render the
row that changed (see `frontend/src/components/InventoryRow.jsx`).

---

## 3. Database Schema

All tables use UUID primary keys and `snake_case` columns (`underscored: true` in Sequelize).

```
users(id, name, email UNIQUE, password_hash, role ENUM[ADMIN,MANAGER,SALES_USER], timestamps)

warehouses(id, name UNIQUE, location, timestamps)

products(id, name, sku UNIQUE, price, is_active, timestamps, deleted_at)   -- soft delete

inventories(id, product_id FK, warehouse_id FK, available_quantity, reserved_quantity, timestamps)
  UNIQUE(product_id, warehouse_id)

inventory_transactions(id, product_id FK, warehouse_id FK, type ENUM[IN,OUT,ADJUSTMENT],
                        quantity, reference_id, note, created_at)

orders(id, customer_id, status ENUM[PENDING,COMPLETED,FAILED,CANCELLED], total_amount,
       created_by FK -> users, timestamps)

order_items(id, order_id FK, product_id FK, quantity, unit_price, subtotal, timestamps)

journal_entries(id, reference_id, date, description, created_at)

journal_entry_lines(id, journal_entry_id FK, account, debit, credit, created_at)
```

**Indexes** (see `backend/src/migrations/`):
- `products`: unique on `sku`, index on `name` (search).
- `inventories`: unique composite on `(product_id, warehouse_id)` - this is also the row the
  concurrency-safe UPDATE locks (§5).
- `orders`: single-column indexes on `customer_id`, `status`, `created_at`, plus a **composite
  `(status, created_at)`** index for the paginated, filtered, recency-sorted `GET /orders` query
  (§11).
- `order_items` / `inventory_transactions`: indexed on their foreign keys for join and lookup speed.

---

## 4. API Documentation

Full request/response examples are in [`postman_collection.json`](./postman_collection.json)
(import into Postman; run **Auth > Login** first, its test script stores the JWT into a collection
variable so every other request authenticates automatically).

All routes are prefixed with `/api`. All except `/auth/*` and `/health` require
`Authorization: Bearer <token>`.

| Method | Path                    | Roles                          | Notes |
|--------|-------------------------|---------------------------------|-------|
| POST   | /auth/register          | public                          | `role` defaults to `SALES_USER` - see Assumptions |
| POST   | /auth/login             | public                          | returns `{ token, user }` |
| POST   | /products               | ADMIN, MANAGER                  | |
| GET    | /products               | any authenticated               | paginated + `search`, Redis-cached |
| GET    | /products/:id           | any authenticated               | |
| PUT    | /products/:id           | ADMIN, MANAGER                  | |
| DELETE | /products/:id           | ADMIN                            | soft delete |
| POST   | /products/import        | ADMIN, MANAGER                  | multipart `file`, CSV/XLSX (§10) |
| POST   | /inventory/add-stock    | ADMIN, MANAGER                  | |
| GET    | /inventory/:productId   | any authenticated                | Redis-cached, key `inventory:product:{productId}` |
| POST   | /inventory/adjust       | ADMIN, MANAGER                  | signed delta, blocks negative stock |
| POST   | /orders                 | ADMIN, MANAGER, SALES_USER      | the concurrency-critical endpoint (§5) |
| GET    | /orders                 | ADMIN, MANAGER                  | pagination + status/customer/date filters (§11) |
| GET    | /orders/:id             | ADMIN, MANAGER                  | added beyond the spec, used by the frontend |

---

## 5. Concurrency Handling (the "5 units, two orders of 5" scenario)

**Strategy: atomic conditional `UPDATE`, inside a DB transaction, no application-level lock.**

`services/inventory.service.js#atomicDeductStock`:

```sql
UPDATE inventories
SET available_quantity = available_quantity - :quantity, updated_at = NOW()
WHERE product_id = :productId AND warehouse_id = :warehouseId
  AND available_quantity >= :quantity;
```

Why this is safe under concurrency, without ever calling `SELECT ... FOR UPDATE` explicitly:

1. The check (`available_quantity >= :quantity`) and the write (the decrement) are **one
   statement**. There is no gap between "read the value" and "write the new value" for application
   code to race inside.
2. InnoDB takes an **exclusive row lock** on the matched `inventories` row for the duration of the
   `UPDATE`, as part of the transaction it runs in. If two transactions try to update the same
   `(product_id, warehouse_id)` row at the same time, the second one physically blocks at the
   database level until the first commits or rolls back.
3. When the second transaction's `UPDATE` finally runs, it re-evaluates the `WHERE` clause against
   the **now-committed** value, not a stale snapshot (UPDATE performs a "current read" even under
   REPEATABLE READ). If the first order already took all 5 units, the second `UPDATE` matches 0 rows.
4. Zero affected rows is treated as "insufficient stock" and the whole order transaction is rolled
   back (see §6) - the order is never created as COMPLETED, no accounting entry exists for it, and
   stock is left untouched. Nothing can decrement into negative territory, because the guard is
   checked atomically with the write, not before it.

So for `Product A = 5`, two simultaneous `Order 1: qty 5` / `Order 2: qty 5` requests: whichever
`UPDATE` reaches MySQL first wins (5 -> 0, 1 row affected), the other is blocked, then re-checked
against 0 remaining stock (0 rows affected) and fails with `409 Conflict - Insufficient stock`.
Exactly one order succeeds; stock never goes negative.

> **Verified live** against a real MySQL-wire-compatible InnoDB database (see §15): firing two
> genuinely concurrent `POST /orders` requests for `quantity: 5` each against the seeded Product A
> (starting stock 5) returned one `201 COMPLETED` order and one `409 "Insufficient stock for
> product 'Product A' (requested 5)"`. Final `available_quantity` was exactly `0`. The `orders`
> table ended up with **only** the winning order row - the losing request's transaction left no
> partial `orders`/`order_items`/`journal_entries` rows at all, confirming the rollback in §6 is
> complete, not just the stock check.

**Why atomic UPDATE over `SELECT ... FOR UPDATE` + application check:** fewer round trips (one
statement instead of a locking SELECT followed by an UPDATE), and correctness doesn't depend on the
application remembering to re-check the value after acquiring the lock - the database enforces the
invariant directly in the `WHERE` clause.

**What happens when one request fails:** its entire `sequelize.transaction(...)` callback throws,
Sequelize issues `ROLLBACK`, and the order row, any order items, inventory transactions, and journal
entries created earlier *in that same call* are undone. The client gets a `409` with a clear message;
no partial state is ever visible to other requests (see §6/§9).

`adjustStock` uses the same pattern for manual corrections, guarding
`(available_quantity + :delta) >= 0` so a negative adjustment can't drive stock below zero either.

---

## 6. Transaction Handling

The entire order flow (`services/order.service.js#createOrder`) runs inside **one**
`sequelize.transaction(...)`:

```
BEGIN
  validate products exist & are active
  INSERT order (status = PENDING)
  for each item:
    atomic UPDATE inventories ...            -- throws/rolls back on insufficient stock
    INSERT order_items
    INSERT inventory_transactions (type OUT)
  INSERT journal_entries + journal_entry_lines (debit = credit = order total)
  UPDATE order SET status = COMPLETED
COMMIT
```

If **any** step throws - a missing product, insufficient stock, or the accounting invariant check
in `accounting.service.js` - Sequelize rolls back everything created above, including the order row
itself. This directly satisfies the spec's requirement:

> If accounting creation fails: Order -> Rollback, Inventory -> Rollback

A single ACID transaction was chosen over an event-driven/saga approach because this is a single
monolith with one database - a saga's compensating actions would just be re-implementing what MySQL
already gives for free with `ROLLBACK`, at the cost of eventual (not immediate) consistency. An
event-driven/outbox approach is called out in §12 as the right answer once this needs to span
multiple services or databases.

Cache invalidation and the `inventory_updated` WebSocket broadcast happen **after** the transaction
commits (outside the `sequelize.transaction` callback) - so a client is never told about a stock
change that later turns out to have been rolled back.

---

## 7. Accounting Entry

`services/accounting.service.js` creates one `JournalEntry` with exactly two `JournalEntryLine`
rows per completed order:

```
Accounts Receivable   Debit   <order total>
Sales Revenue         Credit  <order total>
```

Because both lines always use the same `amount`, `total debit === total credit` by construction; a
defensive sum-check throws (rolling back the whole order) if that invariant is ever violated.

---

## 8. Redis Caching

Implemented for **both** suggested endpoints:

| Data                | Key                                            | TTL | Invalidated on |
|---------------------|-------------------------------------------------|-----|----------------|
| `GET /inventory/:id`| `inventory:product:{productId}`                 | 30s | add-stock, adjust, and every order that touches that product |
| `GET /products`     | `products:list:page:{p}:limit:{l}:search:{s}`   | 60s | any product create/update/delete (pattern-deleted via Redis `SCAN`) |

- **Key strategy:** inventory is keyed per product (matches the assessment's exact example key), so
  invalidating one product never evicts others. The product list is keyed per page/limit/search
  combination, since each combination is a distinct cached response; all list-page keys are
  invalidated together on any write because a single create/update/delete can shift every page's
  contents (SKU uniqueness, sort order).
- **TTL:** short (30-60s) because inventory is the most volatile data in the system - correctness
  during the concurrency window (§5) never depends on the cache (the atomic UPDATE always hits the
  database), so the TTL only bounds how stale a *read* can be, not whether writes are safe.
- **Invalidation:** explicit delete-on-write (`cache.service.js`), not just TTL expiry - so a stock
  change is reflected on the next read immediately, not just eventually.
- **If Redis goes down:** `cache.service.js` wraps every Redis call in try/catch and treats an
  error as a cache miss (`safeGet` returns `null`, `safeSet`/`safeDel` just log a warning). The
  request falls through to MySQL every time - the API stays fully correct, just slower. The
  rate limiter (`middleware/rateLimiter.middleware.js`) fails **open** the same way, so a Redis
  outage never takes the whole API down. The ioredis client is also configured with
  `enableOfflineQueue: false` (`config/redis.js`) - without it, a command issued while disconnected
  sits in an offline queue and only fails after working through the reconnect backoff, which was
  observed live to add several *seconds* of latency per request with Redis down (§15). With it,
  a command fails immediately when the connection isn't ready, so "Redis is down" degrades
  correctness-preserving performance in milliseconds, not seconds.

---

## 9. Real-Time Notification & Failed-Operation Handling

`inventory_updated` is emitted (via `socket.service.js`) only *after* the owning transaction commits
- for order creation, stock add, and manual adjustment alike. This guarantees connected clients
never see a stock number that a moment later gets rolled back.

For the specific "Order Created -> Inventory Updated -> Accounting Entry Failed" scenario: because
all three happen inside one MySQL transaction (§6), "Accounting Entry Failed" simply means the
transaction callback threw before `COMMIT` - MySQL rolls back the order insert and the inventory
UPDATE together, atomically. There is no window where the order or the inventory decrement exists
without its accounting entry; the database transaction is the compensation mechanism, so no
separate retry/saga logic is needed for this single-database use case.

---

## 10. Bulk Import (`POST /products/import`)

Accepts a multipart CSV or Excel file with columns `Product Name, SKU, Price, Opening Stock`.

- Parsing, per-row validation, duplicate-SKU detection (both within the file and against the
  database), and the batched DB writes all run inside a **`worker_threads` Worker**
  (`backend/src/workers/importWorker.js`) with its own `mysql2` connection - not on the main thread,
  and not through the shared Sequelize pool. This is what lets a 100,000+ row file be processed
  without blocking the Express event loop: HTTP requests, the rate limiter, and Socket.IO keep
  running normally on the main thread the entire time the worker is parsing and writing.
- Rows are validated in a single pass; invalid rows are collected with their **1-based spreadsheet
  row number** (header = row 1) and a list of reasons (missing field, non-numeric price, negative/
  non-integer stock, duplicate SKU in-file, or SKU already in the database).
- Valid rows are inserted in batches of 1,000 using multi-row `INSERT ... VALUES ?` (products,
  inventories, and an `IN` inventory_transaction per row), each batch wrapped in its own small
  transaction rather than one transaction for the whole file - this bounds memory/lock time
  per batch instead of holding a single multi-hundred-thousand-row transaction open. A crash
  mid-import keeps already-committed batches; re-running the import will simply report the
  already-imported SKUs as duplicates. This tradeoff (batch-level atomicity vs. one all-or-nothing
  transaction) is a deliberate choice for throughput on very large files.
- Response: `{ totalRows, importedCount, failedCount, invalidRows: [{ row, sku, reasons[] }] }`.

---

## 11. Database Optimization (`GET /orders`)

Supports `page`, `limit`, `status`, `customerId`, `startDate`/`endDate`, e.g.:

```
GET /orders?page=1&limit=20&status=COMPLETED
```

**Indexing decisions** (see `backend/src/migrations/20260101000006-create-orders.js`):
- `idx_orders_status` and `idx_orders_customer_id` - support filtering by either alone.
- `idx_orders_created_at` - supports the date-range filter and the default recency sort.
- `idx_orders_status_created_at` (composite) - the important one: the common case is "filter by
  status, show newest first, paginated" (`WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET
  ?`). A composite index with `status` first lets MySQL seek directly to the matching rows already
  in `created_at` order, avoiding a filesort.
- The query uses `findAndCountAll` with `distinct: true` (required because it also `include`s
  `order_items`, which would otherwise inflate the row/count via the join) and explicit
  `limit`/`offset` rather than loading all rows and slicing in application code.
- Only the columns actually needed are selected on the `order_items` include
  (`id, productId, quantity, unitPrice, subtotal`) instead of `SELECT *`.

**Real `EXPLAIN`**, captured live against this schema (migrated + seeded locally on MariaDB
10.4.32, MySQL-wire-compatible, via `mysql -u root mini_erp`):

```
mysql> EXPLAIN SELECT * FROM orders WHERE status='COMPLETED' ORDER BY created_at DESC LIMIT 20;
+----+-------------+--------+------+------------------------------------------------+-------------------------------+---------+-------+------+-------------+
| id | select_type | table  | type | possible_keys                                   | key                           | key_len | ref   | rows | Extra       |
+----+-------------+--------+------+------------------------------------------------+-------------------------------+---------+-------+------+-------------+
|  1 | SIMPLE      | orders | ref  | idx_orders_status,idx_orders_status_created_at  | idx_orders_status_created_at | 1       | const |    1 | Using where |
+----+-------------+--------+------+------------------------------------------------+-------------------------------+---------+-------+------+-------------+
```

Reasoning: `type: ref` (an equality lookup on the `status` prefix of the composite index, not a
table scan), `key: idx_orders_status_created_at` (the optimizer picked the composite index over the
single-column `idx_orders_status` because it also satisfies `ORDER BY created_at DESC` for free by
walking the index in reverse - notably **no `Using filesort`** in `Extra`). `rows: 1` here simply
reflects the small seeded dataset in this environment (one `COMPLETED` order at capture time); the
index-selection reasoning holds regardless of table size - it's what keeps this query from becoming
a full table scan + sort as `orders` grows.

---

## 12. API Rate Limiting

Fixed-window counter in Redis, 100 requests/minute/user (`middleware/rateLimiter.middleware.js`):

- Key: `ratelimit:{user:<id> or ip:<ip>}:{windowStart}`, where `windowStart = floor(now / 60s)`.
- `INCR` is atomic, so concurrent requests in the same window can't under-count each other; the key
  gets a 60s TTL only on its first increment (`count === 1`), so it self-expires with no cleanup job.
- Applied globally, after a best-effort JWT decode (`optionalAuth.middleware.js`) so limits key on
  the authenticated user when a token is present, falling back to IP for anonymous requests like
  `/auth/login`.
- `X-RateLimit-Limit` / `X-RateLimit-Remaining` response headers; `429` once exceeded.
- Fails open on Redis errors (§8) rather than blocking all traffic if Redis is unavailable.

---

## 13. Assumptions & Design Decisions

- **Plain JavaScript, Express, MySQL + Sequelize (model-based ORM)** per explicit instruction,
  instead of the PDF's suggested TypeScript/NestJS/Prisma combination.
- **Warehouse** is a minimal model (id, name, location) with no dedicated CRUD API, since the PDF
  doesn't request one - it exists only because Inventory's spec explicitly has a `warehouseId`
  field and the scenario mentions "multiple warehouses". Endpoints that don't specify a warehouse
  (add-stock, orders) resolve to the earliest-created warehouse; a seeded "Main Warehouse" covers
  the single-warehouse case out of the box.
- **`POST /auth/register` accepts a `role` field directly** for demo/grading convenience (so you can
  create ADMIN/MANAGER/SALES_USER accounts without a bootstrapping step). In a real product this
  would be admin-only or handled by a separate invite/role-assignment flow.
- **Products are soft-deleted** (Sequelize `paranoid: true`, adds `deleted_at`) rather than hard
  DELETE, since order_items/inventory reference `product_id` and historical orders should still be
  able to display which product they referred to.
- **Duplicate `productId` entries within a single order's `items` array are merged** (quantities
  summed) before stock is deducted, rather than treated as two independent line items competing
  for the same lock inside the same transaction.
- **`GET /orders/:id`** was added beyond the spec's `POST /orders`/`GET /orders` pair, purely so the
  frontend can show an order confirmation/detail view.
- Per the PDF's own RBAC table (Sales User: "create orders; view products" - no mention of viewing
  orders), `GET /orders` is restricted to ADMIN/MANAGER only; Sales Users only get the order
  confirmation returned directly from their own `POST /orders` call.

---

## 14. Scaling Notes (100 companies / 50,000 users)

- **Stateless API**: the Express process holds no in-memory session state (JWT is self-contained),
  so `backend` can be horizontally scaled behind a load balancer; Socket.IO would move to a Redis
  adapter (`socket.io-redis`) so broadcasts reach clients connected to any instance.
- **Database**: read replicas for `GET` traffic (products/orders listing), connection pooling
  (already configured, `config/database.js`), and revisiting the per-row lock contention on very
  hot single products (e.g. a flash-sale SKU) with sharding by warehouse/tenant if needed.
- **Multi-tenancy**: a `companyId`/`tenantId` column added to the core tables (or fully separate
  schemas per large tenant) with every query scoped by it; indexes above would gain `tenant_id` as
  a leading column.
- **Caching**: the existing Redis layer scales horizontally (Redis Cluster) and already isolates
  cache failures from correctness (§8).
- **Async work**: bulk import already runs off-thread (§10); at this scale it would move to a real
  job queue (BullMQ/Redis) so imports survive a backend restart and can be distributed across
  workers instead of one worker thread per API instance.
- **Rate limiting** already keys per-user in Redis (§12), which continues to work correctly across
  multiple backend instances since the counter lives in shared Redis, not process memory.

---

## 15. Testing This Yourself

1. `docker-compose up --build`, wait for `mysql`/`redis` health checks to pass.
2. Log in as `sales@erp.test` (frontend, or `POST /auth/login`).
3. Open two terminals/tabs and fire two `POST /orders` requests for Product A (`quantity: 5` each)
   at the same time - only one should return `201`, the other `409 Insufficient stock`. Product A's
   available quantity should read `0`, never negative.
4. Watch the frontend's Inventory page (or a raw Socket.IO client on `inventory_updated`) update
   live the moment the winning order commits.

### What was actually run and verified during development

Docker wasn't available in the development sandbox, so the backend was instead migrated/seeded
against a real local MySQL-wire-compatible server (MariaDB 10.4 via XAMPP) with Redis intentionally
absent, and driven end-to-end with `curl`. This caught three real bugs, since fixed (see the
"three bugs found by running the app" commit):

- Joi's default email check rejected the seeded `@erp.test` demo addresses (reserved TLD) -
  login/register always failed validation until `tlds: { allow: false }` was added.
- `config.js` used `||` for `DB_PASSWORD`, which silently discarded an intentionally empty password
  (a local root/no-password MySQL setup) - switched to `??`.
- With Redis down, `ioredis`'s offline command queue made **every** request wait through the full
  reconnect backoff (up to ~12s observed on `GET /products`) before falling back to the database -
  technically graceful, but not usably fast. `enableOfflineQueue: false` fixed it; the same request
  now returns in ~80ms with Redis still down.

After those fixes, this was confirmed live: the exact "5 units, two orders of 5" race (one `201`,
one clean `409`, final stock `0`, and the losing request left zero rows anywhere - no `orders`,
`order_items`, or `journal_entries` row at all, not even a `FAILED`-status one); RBAC on every
route (403s for Sales User on product mutation and `GET /orders`); add-stock and adjust (including
the negative-stock guard rejecting an over-large adjustment with `409`); bulk CSV import against a
file with valid, missing-field, invalid-price, invalid-stock, and duplicate-SKU rows (4 imported,
4 rejected, matching exactly); and `GET /orders` filtering by status/customer. Redis itself
(cache hits and the rate-limit counter actually incrementing) was **not** live-tested - no Redis
instance was available in the sandbox - so that path is verified by code review only; the fallback
path (Redis absent) was verified live as described above.
