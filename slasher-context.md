# Slash — Main Context Prompt
## Use this at the start of every Claude Code session on this project.

---

## What This Project Is

**Slash** is a multi-chain validator penalty tracker built for NullRabbit. It monitors validator delinquency and slashing events across Solana, Sui, Ethereum, and Cosmos-ecosystem chains, stores them in Postgres, and exposes them via a JSON REST API.

It is a backend-only project. There is no frontend work in this repo.

**Why this exists:** No unified, public, cross-chain view of validator penalty events exists. Chain-specific tools exist (beaconscan for Ethereum slashings, kjnodes Slashboard for Cosmos, operator-facing Prometheus exporters), but nothing normalises penalty data across chains into a single queryable feed. Slash fills that gap.

---

## Repo Structure

```
slash/                          ← Cargo workspace root
├── Cargo.toml
├── crates/
│   ├── slash-core/             ← shared types, DB pool, NetworkCollector trait
│   ├── slash-worker/           ← scheduler + collector dispatch
│   ├── slash-api/              ← axum HTTP service
│   └── networks/
│       ├── solana/
│       ├── sui/
│       ├── ethereum/
│       └── cosmos/
├── migrations/                 ← sqlx migrations, numbered sequentially
├── docker-compose.yml          ← local dev: Postgres + PgBouncer + both binaries
└── docker-compose.prod.yml     ← production: same shape, different env
```

---

## Language & Crates

- **Rust** throughout. No Python, no scripting glue unless explicitly instructed.
- `tokio` — async runtime
- `axum` — HTTP API
- `sqlx` — async Postgres, compile-time query checking (`query!` macros where possible)
- `reqwest` — HTTP client for chain RPCs
- `tower` + `tower-http` — middleware (CORS, tracing)
- `governor` — per-IP rate limiting (keyed rate limiter)
- `serde` / `serde_json` — serialisation
- `thiserror` — error types
- `tracing` + `tracing-subscriber` — structured logging
- `tokio-util` — `CancellationToken` for graceful shutdown

---

## Absolute Rules

**These apply in every session. Do not deviate.**

### 1. TDD is non-negotiable
- Write the test first. Confirm it fails. Then write the implementation. Confirm it passes.
- No implementation code is written before a failing test exists for it.
- If a task cannot be tested (genuinely), explain why before proceeding — do not silently skip.

### 2. One task per prompt
- Each Claude Code session works on one crate or one clearly scoped unit.
- Do not bleed work into adjacent crates unless it is a type definition in `slash-core` that is required to make the current task compile.

### 3. sqlx compile-time checking
- Use `query!` / `query_as!` macros. Do not use string-based queries unless there is a documented reason.
- Migrations must exist before queries that depend on them are written.

### 4. No fabrication
- Do not invent API response shapes, RPC method names, or field names. If unsure, add a `// TODO: verify against mainnet` comment and note it explicitly.

### 5. Error handling
- No `.unwrap()` in production code paths. Use `?` and `thiserror`-derived types.
- `.unwrap()` is acceptable in tests only, where a panic is the right failure mode.

### 6. No silent assumptions
- If a requirement is ambiguous, state the assumption explicitly in a comment and flag it in the response before proceeding.

---

## Cross-Chain Penalty Model

"Penalty" means different things on different chains. Slash normalises these into a common schema, but collectors and consumers must understand the differences:

| Chain | Penalty Types | Severity | Notes |
|---|---|---|---|
| **Ethereum** | `slashed` (double-sign, surround vote) | `critical` | Permanent exit, 1+ ETH lost, correlation penalty |
| **Ethereum** | `inactivity_leak` | `warning` | Gradual balance drain during non-finality |
| **Solana** | `delinquent` | `warning` | Missed votes / skip rate; no stake loss (yet) |
| **Solana** | `duplicate_block` | `critical` | SIMD-0204 records proof on-chain; no auto-slash yet |
| **Cosmos** | `slashed_double_sign` | `critical` | 5% stake slash, tombstoned |
| **Cosmos** | `slashed_downtime` | `warning` | 0.01% stake slash, jailed |
| **Sui** | `tallying_penalty` | `warning` | Peer-assessed, reduced stake rewards |

This table is the canonical reference. Collectors must use these `event_type` and `severity` values exactly.

---

## Canonical Enums (defined in `slash-core`)

### `EventType`

```rust
pub enum EventType {
    // Ethereum
    Slashed,
    InactivityLeak,
    // Solana
    Delinquent,
    DuplicateBlock,
    // Cosmos
    SlashedDoubleSign,
    SlashedDowntime,
    // Sui
    TallyingPenalty,
}
```

Serialises to the `snake_case` string representation (e.g. `"slashed_double_sign"`). Stored as `TEXT` in Postgres for flexibility, but validated at the application layer. New event types are added here when a new chain or penalty class is implemented — not invented per-collector.

### `Severity`

```rust
pub enum Severity {
    Info,      // informational, no stake impact
    Warning,   // operational issue, minor or no stake loss
    Critical,  // significant stake loss or permanent exit
}
```

Serialises to lowercase (`"info"`, `"warning"`, `"critical"`).

---

## Database Schema

All tables are defined in `migrations/`. The canonical schema is:

```sql
-- 001_create_networks.sql
CREATE TABLE networks (
    id                  SERIAL PRIMARY KEY,
    slug                TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL,
    enabled             BOOLEAN NOT NULL DEFAULT false,
    rpc_url             TEXT NOT NULL,
    poll_interval_secs  INT NOT NULL DEFAULT 60,
    config              JSONB NOT NULL DEFAULT '{}',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 002_create_validators.sql
CREATE TABLE validators (
    id          SERIAL PRIMARY KEY,
    network_id  INT NOT NULL REFERENCES networks(id),
    address     TEXT NOT NULL,
    moniker     TEXT,
    metadata    JSONB NOT NULL DEFAULT '{}',
    first_seen  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(network_id, address)
);

CREATE INDEX idx_validators_network_address ON validators(network_id, address);

-- 003_create_penalty_events.sql
CREATE TABLE penalty_events (
    id              SERIAL PRIMARY KEY,
    network_id      INT NOT NULL REFERENCES networks(id),
    validator_id    INT NOT NULL REFERENCES validators(id),
    event_type      TEXT NOT NULL,
    severity        TEXT NOT NULL,
    started_at      TIMESTAMPTZ NOT NULL,
    resolved_at     TIMESTAMPTZ,
    penalty_amount  NUMERIC,
    penalty_token   TEXT,
    raw             JSONB NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(network_id, validator_id, event_type, started_at)
);

-- Indexes for API query patterns
CREATE INDEX idx_penalty_events_network ON penalty_events(network_id);
CREATE INDEX idx_penalty_events_type ON penalty_events(event_type);
CREATE INDEX idx_penalty_events_started ON penalty_events(started_at DESC);
CREATE INDEX idx_penalty_events_cursor ON penalty_events(started_at DESC, id DESC);
CREATE INDEX idx_penalty_events_validator ON penalty_events(validator_id);

-- 004_create_collector_runs.sql
CREATE TABLE collector_runs (
    id              SERIAL PRIMARY KEY,
    network_id      INT NOT NULL REFERENCES networks(id),
    started_at      TIMESTAMPTZ NOT NULL,
    completed_at    TIMESTAMPTZ,
    events_found    INT,
    status          TEXT NOT NULL,
    error_message   TEXT
);

CREATE INDEX idx_collector_runs_network ON collector_runs(network_id, started_at DESC);
```

---

## The NetworkCollector Trait (defined in slash-core)

```rust
#[async_trait]
pub trait NetworkCollector: Send + Sync {
    fn network_slug(&self) -> &str;
    async fn collect(&self, config: &NetworkConfig) -> Result<Vec<PenaltyEvent>, CollectorError>;
}
```

- `NetworkConfig` is hydrated from the `networks` DB row.
- `PenaltyEvent` is the normalised output struct. It contains the validator address (not the DB id — the dispatcher resolves that). Chain-specific fields go in `PenaltyEvent.raw` as `serde_json::Value`.
- Every network crate implements this trait and nothing else. No network crate knows about the scheduler, the DB write path, or the API.

### PenaltyEvent (collector output)

```rust
pub struct PenaltyEvent {
    pub validator_address: String,
    pub validator_moniker: Option<String>,
    pub event_type: EventType,
    pub severity: Severity,
    pub started_at: DateTime<Utc>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub penalty_amount: Option<Decimal>,
    pub penalty_token: Option<String>,
    pub raw: serde_json::Value,
}
```

Note: `PenaltyEvent` does not contain `network_id` or `validator_id` (DB foreign keys). The dispatcher resolves these during persistence. The collector only knows the validator's on-chain address.

---

## Validator Upsert Logic

The **dispatcher** (in `slash-worker`) is responsible for validator row management, not the collectors.

When persisting events returned by a collector:

1. For each unique `validator_address` in the batch, upsert into `validators`:
   ```sql
   INSERT INTO validators (network_id, address, moniker, last_seen)
   VALUES ($1, $2, $3, NOW())
   ON CONFLICT (network_id, address)
   DO UPDATE SET
       moniker = COALESCE(EXCLUDED.moniker, validators.moniker),
       last_seen = NOW()
   RETURNING id
   ```
2. Use the returned `id` as `validator_id` when inserting into `penalty_events`.

This ensures validators are created on first encounter and their `last_seen` is updated on every run that references them.

---

## Network Modularity Rules

- A new network is: implement `NetworkCollector`, add a DB row, set `enabled = true`.
- The worker discovers enabled networks from the DB at startup. It matches `slug` values to registered collectors.
- An unknown slug (DB row with no registered collector) is logged as a warning and skipped. It does not crash the worker.
- Network-specific configuration (e.g. which Cosmos chains to poll, Solana commitment level) lives in the `config` JSONB column, not in code.

---

## Testing Conventions

```
tests/
  integration/
    api/        ← axum TestClient, one file per endpoint group
    collectors/ ← mocked HTTP (wiremock or httpmock), one file per network
    db/         ← sqlx against real test DB (DATABASE_TEST_URL env var)
  unit/         ← pure logic only (parsing, state machines, dedup)
```

- Integration tests against the DB use a real Postgres instance (local via docker-compose).
- HTTP calls to chain RPCs are always mocked in tests. No test should make a live network call.
- Test DB is migrated fresh at the start of each test run using sqlx's `migrate!` macro.
- Each test that writes to the DB should clean up after itself or use a transaction that is rolled back.

### Shared Test Harness

Define in `slash-core/src/test_helpers.rs` (behind `#[cfg(test)]` or a `test-support` feature flag):

```rust
pub async fn setup_test_db() -> PgPool {
    let url = std::env::var("DATABASE_TEST_URL")
        .expect("DATABASE_TEST_URL must be set for integration tests");
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&url)
        .await
        .expect("Failed to connect to test DB");
    sqlx::migrate!("../../migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");
    pool
}

/// Seed a network row and return its id.
pub async fn seed_network(pool: &PgPool, slug: &str, enabled: bool) -> i32 { ... }

/// Seed a validator row and return its id.
pub async fn seed_validator(pool: &PgPool, network_id: i32, address: &str) -> i32 { ... }

/// Seed a penalty_event row and return its id.
pub async fn seed_event(pool: &PgPool, network_id: i32, validator_id: i32, event_type: &str) -> i32 { ... }
```

All integration tests import from this module rather than reimplementing setup.

---

## Docker Compose (Local Dev)

```yaml
version: "3.8"

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: slash
      POSTGRES_PASSWORD: slash
      POSTGRES_DB: slash
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U slash"]
      interval: 5s
      timeout: 3s
      retries: 5

  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgres://slash:slash@postgres:5432/slash
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 200
      DEFAULT_POOL_SIZE: 20
    ports:
      - "6432:6432"
    depends_on:
      postgres:
        condition: service_healthy

  worker:
    build:
      context: .
      dockerfile: Dockerfile
      target: worker
    environment:
      DATABASE_URL: postgres://slash:slash@pgbouncer:6432/slash
      RUST_LOG: slash_worker=info
    depends_on:
      - pgbouncer

  api:
    build:
      context: .
      dockerfile: Dockerfile
      target: api
    environment:
      DATABASE_URL: postgres://slash:slash@pgbouncer:6432/slash
      BIND_ADDR: "0.0.0.0:3000"
      RUST_LOG: slash_api=info
    ports:
      - "3000:3000"
    depends_on:
      - pgbouncer

volumes:
  pgdata:
```

**Notes:**
- Both binaries connect to Postgres via PgBouncer in transaction pooling mode.
- In production, PgBouncer runs on the same Droplet, connecting to DigitalOcean managed Postgres.
- `BIND_ADDR` defaults to `127.0.0.1:3000` in the binary; overridden to `0.0.0.0:3000` in Docker.
- The API in production binds to `127.0.0.1` and is exposed via Cloudflare Tunnel only.

### Connection Pooling

Both binaries should configure `sqlx::PgPool` via environment:

```
DATABASE_URL             ← connection string (points at PgBouncer in prod)
DATABASE_MAX_CONNECTIONS ← default 10 (PgBouncer handles the real pool)
```

Since PgBouncer handles connection pooling to Postgres, the application-level pool should be kept small. `max_connections = 10` is sufficient; PgBouncer's `DEFAULT_POOL_SIZE` is the real knob.

---

## Deployment Context

- **Worker and API** run on a DigitalOcean Droplet via docker-compose.
- **Postgres** is a DigitalOcean managed database instance, accessed via PgBouncer.
- **Frontend** (not in this repo) runs on Cloudflare Pages.
- The API is exposed to the internet exclusively via a **Cloudflare Tunnel** (`cloudflared`). The API binary binds to `127.0.0.1` only. Nothing is publicly exposed on the droplet.
- Environment variables are the sole configuration mechanism. No config files in production.

---

## What Is Not In Scope

- Frontend code
- Authentication implementation (auth middleware is provisioned as a passthrough only)
- USD/fiat valuation of penalties (raw token amounts only for now)
- Alerting / webhook delivery (Slack bot is a separate service)
- SIMD-0204 programmatic slashing for Solana (tracked as a future extension — once activated on mainnet, a new event type and collector logic will be added)
