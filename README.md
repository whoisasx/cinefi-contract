# Cinefi

A decentralized prediction market protocol on Solana where users bet on media ratings — movies, shows, or any scored content. Built with the [Anchor](https://www.anchor-lang.com/) framework.

---

## Table of Contents

- [Cinefi](#cinefi)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [How It Works](#how-it-works)
    - [Market Lifecycle](#market-lifecycle)
    - [Scoring \& Buckets](#scoring--buckets)
    - [Time-Weighted Betting](#time-weighted-betting)
    - [Oracle System](#oracle-system)
    - [Prize Distribution](#prize-distribution)
    - [Fallback Mechanism](#fallback-mechanism)
  - [Program Instructions](#program-instructions)
    - [`initialize_treasury`](#initialize_treasury)
    - [`create_market`](#create_market)
    - [`place_bet`](#place_bet)
    - [`close_market`](#close_market)
    - [`submit_score`](#submit_score)
    - [`resolve_market`](#resolve_market)
    - [`claim_reward`](#claim_reward)
    - [`reclaim_pool`](#reclaim_pool)
  - [Account Architecture](#account-architecture)
    - [Market Account](#market-account)
    - [OracleReport Account](#oraclereport-account)
    - [UserPosition Account](#userposition-account)
    - [Vault (PDA)](#vault-pda)
    - [Treasury (PDA)](#treasury-pda)
  - [PDA Seeds](#pda-seeds)
  - [Protocol Constants](#protocol-constants)
  - [Error Codes](#error-codes)
  - [Project Structure](#project-structure)
  - [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Install Dependencies](#install-dependencies)
    - [Build the Program](#build-the-program)
    - [Run Tests](#run-tests)
    - [Deploy (Localnet)](#deploy-localnet)

---

## Overview

Cinefi lets anyone create a prediction market tied to a media item (identified by `media_id`). Participants bet SOL on a score bucket between 1 and 100 — representing their prediction of the media's final score. A set of trusted **oracles** submits the real-world score after the betting window closes. Winners — those who bet within a configurable **radius** of the final score — share the prize pool, weighted by how close their bucket is to the outcome and how early they placed their bet.

**Program ID:** `GomtSs5546sx4NQFsGaJtwFrDytfqRQPBADkiUr7PcyW`

---

## How It Works

### Market Lifecycle

Each market moves through a strict sequential set of phases enforced on-chain:

```
[Create] → [Betting Open] → [Betting Closed] → [Oracle Window] → [Resolved] → [Claims] → [Reclaimed]
```

| Phase              | Duration                 | Description                                               |
| ------------------ | ------------------------ | --------------------------------------------------------- |
| **Betting Open**   | 14 days                  | Users place SOL bets on any bucket 1–100                  |
| **Betting Closed** | Day 15–21                | No new bets; oracle window approaches                     |
| **Oracle Window**  | 1 hour (at Day 21)       | Oracles submit their score observations                   |
| **Resolution**     | After Day 21             | Anyone can trigger `resolve_market` once oracles finalize |
| **Claim Window**   | 14 days after resolution | Winners claim their SOL payout                            |
| **Reclaim**        | After claim deadline     | Unclaimed SOL is swept to the treasury                    |

A market is created with an optional `betting_starts_after` delay, allowing the creator to schedule when betting opens.

---

### Scoring & Buckets

The score space is divided into **100 buckets** (1–100). Each bucket represents a predicted score. For example:

-   Bucket `74` = predicting a score of 74/100
-   Bucket `50` = predicting a score of 50/100

The **radius** parameter (set at market creation) defines the winning range. If `radius = 5` and the final score is `72`, then any bettor in buckets `67–77` is a winner.

---

### Time-Weighted Betting

To incentivize early participation, bets are multiplied by a **time-decay multiplier** based on when the bet is placed relative to the betting start date.

| Day | Multiplier (×1000 scale) | Effective Weight |
| --- | ------------------------ | ---------------- |
| 1   | 1000                     | 1.000×           |
| 2   | 904                      | 0.904×           |
| 3   | 818                      | 0.818×           |
| 4   | 740                      | 0.740×           |
| 5   | 670                      | 0.670×           |
| 6   | 606                      | 0.606×           |
| 7   | 548                      | 0.548×           |
| 8   | 496                      | 0.496×           |
| 9   | 449                      | 0.449×           |
| 10  | 406                      | 0.406×           |
| 11  | 367                      | 0.367×           |
| 12  | 332                      | 0.332×           |
| 13  | 301                      | 0.301×           |
| 14  | 272                      | 0.272×           |

The weighted amount is stored alongside the raw amount in both the `Market` pool arrays and the user's `UserPosition`. Prize payouts are computed using weighted amounts, so early bettors earn a proportionally larger share.

**Formula:**

```
weighted_amount = (amount × TIME_MULTIPLIERS[day_index]) / 1000
```

---

### Oracle System

Each market is created with an `oracle_set` of exactly **3 oracle public keys** and an `oracle_threshold` (must be 2 or 3).

During the oracle window (starting at the settlement timestamp, open for 1 hour):

1. Each oracle in the set calls `submit_score` with their observed score (1–100).
2. After `oracle_threshold` submissions agree on a score, the report is marked **finalized**.
3. If oracles disagree and cannot reach consensus, the report is marked **disputed** — blocking resolution.

The `OracleReport` PDA tracks all submissions and their agreement state.

---

### Prize Distribution

When `resolve_market` is called:

1. A **protocol fee** of 3% (300 bps) is transferred from the vault to the treasury.
2. The remaining `total_prize_pool` is distributed across winning buckets using a **two-factor weighting**:

**Factor 1 — Time Weight:** Each individual bettor's share within their bucket is proportional to their `weighted_amount` (early bettors get more).

**Factor 2 — Closeness Weight:** Each winning bucket's share of the total prize pool is proportional to a closeness function:

```
closeness_weight(bucket) = 1_000_000 / (|bucket - final_outcome| + 1)
```

This means a bucket exactly at the final score gets the maximum share, buckets one step away get half, and so on.

**Total Bucket Weight (TBW):**

```
TBW = Σ (closeness_weight(bucket_i) × weighted_pool[bucket_i])   for all winning buckets i
```

**Bucket Prize:**

```
bucket_prize[i] = (closeness_weight(bucket_i) × weighted_pool[i] × total_prize_pool) / TBW
```

**Individual Payout:**

```
user_payout = (user.weighted_amount / weighted_pool[user.bucket]) × bucket_prize[user.bucket]
```

---

### Fallback Mechanism

If **no bets exist within the radius** of the final score, the protocol falls back gracefully:

-   The winner(s) are determined by finding the **minimum distance** from the final score across all filled buckets.
-   All bettors at that minimum distance are treated as winners.
-   The normal closeness-weighted distribution then applies among those fallback buckets.

This guarantees the prize pool is always distributed rather than locked.

---

## Program Instructions

### `initialize_treasury`

Creates the global treasury PDA. This must be called once before any markets can be resolved.

**Accounts:**
| Account | Type | Description |
|---|---|---|
| `authority` | Signer (mut) | Pays for account initialization |
| `treasury` | UncheckedAccount (init) | Global treasury PDA |
| `system_program` | Program | Solana System Program |

---

### `create_market`

Creates a new prediction market for a media item.

**Parameters:**

| Parameter              | Type          | Description                                                    |
| ---------------------- | ------------- | -------------------------------------------------------------- |
| `betting_starts_after` | `Option<i64>` | Seconds delay before betting opens (default: 0)                |
| `media_id`             | `u64`         | Unique identifier for the media title                          |
| `radius`               | `u8`          | Number of buckets on each side of the outcome considered a win |
| `oracle_set`           | `[Pubkey; 3]` | Exactly 3 oracle public keys                                   |
| `oracle_threshold`     | `u8`          | Minimum agreeing oracles to finalize (must be 2 or 3)          |

**Accounts:**

| Account          | Type                    | Description                       |
| ---------------- | ----------------------- | --------------------------------- |
| `creator`        | Signer (mut)            | Market creator; pays for all PDAs |
| `market`         | Account (init)          | Market state PDA                  |
| `vault`          | UncheckedAccount (init) | Lamport vault for this market     |
| `oracle_report`  | Account (init)          | Oracle submission tracking PDA    |
| `system_program` | Program                 | Solana System Program             |

**Timeline set at creation:**

```
betting_starts_at  = now + betting_starts_after
betting_closes_at  = betting_starts_at + 14 days
settle_at          = betting_closes_at + 7 days  (day 21 total)
claim_deadline     = settle_at + 14 days
```

---

### `place_bet`

Places a SOL bet on a score bucket for a given market.

**Parameters:**

| Parameter | Type  | Description                     |
| --------- | ----- | ------------------------------- |
| `bucket`  | `u8`  | Score prediction (1–100)        |
| `amount`  | `u64` | Lamports to stake (must be > 0) |

**Accounts:**

| Account          | Type                     | Description                       |
| ---------------- | ------------------------ | --------------------------------- |
| `user`           | Signer (mut)             | Bettor; lamports source           |
| `market`         | Account (mut)            | Target market                     |
| `user_position`  | Account (init_if_needed) | Tracks user's bet for this bucket |
| `vault`          | UncheckedAccount (mut)   | Receives the lamports             |
| `system_program` | Program                  | Solana System Program             |

**Behavior:**

-   Transfers `amount` lamports from user to the market vault.
-   Calculates `weighted_amount` using the time-decay multiplier for the current day.
-   Updates `market.pool[bucket]`, `market.weighted_pool[bucket]`, and `market.total_pool`.
-   Initializes or updates the user's `UserPosition` for this market+bucket combination.
-   A user can add to an existing position in the same bucket by calling `place_bet` again; their `amount` and `weighted_amount` accumulate.

---

### `close_market`

Closes the betting window. Can be called by anyone once `betting_closes_at` has passed.

**Accounts:**

| Account  | Type          | Description                 |
| -------- | ------------- | --------------------------- |
| `caller` | Signer (mut)  | Any signer (permissionless) |
| `market` | Account (mut) | Target market               |

---

### `submit_score`

Called by each oracle to submit their observed score. Only executable during the 1-hour oracle window starting at `settle_at`.

**Parameters:**

| Parameter | Type | Description                     |
| --------- | ---- | ------------------------------- |
| `score`   | `u8` | Oracle's observed score (1–100) |

**Accounts:**

| Account          | Type          | Description                          |
| ---------------- | ------------- | ------------------------------------ |
| `oracle_signer`  | Signer (mut)  | Must be in the market's `oracle_set` |
| `market`         | Account       | Target market                        |
| `oracle_report`  | Account (mut) | Oracle submission state              |
| `system_program` | Program       | Solana System Program                |

**Finalization logic:**

-   If `oracle_threshold` oracles agree on the same score → `finalized = true`, `agreed_score` is set.
-   If all 3 oracles submit but no threshold of agreement is reached → `disputed = true`.
-   A disputed report blocks market resolution.

---

### `resolve_market`

Resolves the market using the finalized oracle score, distributes the protocol fee, and computes per-bucket prize amounts. Can be called by anyone once `settle_at` has passed and the oracle report is finalized.

**Accounts:**

| Account          | Type                   | Description                         |
| ---------------- | ---------------------- | ----------------------------------- |
| `caller`         | Signer (mut)           | Any signer (permissionless)         |
| `market`         | Account (mut)          | Target market                       |
| `oracle_report`  | Account                | Must be finalized and not disputed  |
| `vault`          | UncheckedAccount (mut) | Market lamport vault                |
| `treasury`       | UncheckedAccount (mut) | Protocol treasury (receives 3% fee) |
| `system_program` | Program                | Solana System Program               |

---

### `claim_reward`

Allows a winning user to claim their SOL payout. Must be called before `claim_deadline`. The `UserPosition` account is **closed** and rent is returned to the user on claim.

**Accounts:**

| Account          | Type                      | Description                           |
| ---------------- | ------------------------- | ------------------------------------- |
| `user`           | Signer (mut)              | Winner claiming their reward          |
| `market`         | Account                   | Resolved market                       |
| `user_position`  | Account (mut, close=user) | User's bet record (closed on success) |
| `vault`          | UncheckedAccount (mut)    | Source of payout lamports             |
| `system_program` | Program                   | Solana System Program                 |

**Validation:**

-   Market must be resolved.
-   Claim deadline must not have passed.
-   User's bucket must be within the winning radius (or fallback set).
-   Position must not have been previously claimed.

---

### `reclaim_pool`

After the `claim_deadline` has passed, sweeps all remaining lamports in the vault to the treasury. This handles unclaimed winnings and any dust. Can be called by anyone.

**Accounts:**

| Account          | Type                   | Description                             |
| ---------------- | ---------------------- | --------------------------------------- |
| `caller`         | Signer (mut)           | Any signer (permissionless)             |
| `market`         | Account (mut)          | Must be resolved; claim deadline passed |
| `vault`          | UncheckedAccount (mut) | Remaining market lamports               |
| `treasury`       | UncheckedAccount (mut) | Protocol treasury (receives everything) |
| `system_program` | Program                | Solana System Program                   |

---

## Account Architecture

### Market Account

The core on-chain state for a prediction market. Derived from `["market_seed", media_id_le_bytes]`.

| Field               | Type          | Description                                    |
| ------------------- | ------------- | ---------------------------------------------- |
| `media_id`          | `u64`         | Unique ID of the media item                    |
| `creator`           | `Pubkey`      | Market creator's public key                    |
| `created_at`        | `i64`         | Unix timestamp of creation                     |
| `betting_starts_at` | `i64`         | When betting opens                             |
| `betting_closes_at` | `i64`         | When betting closes (14 days after open)       |
| `settle_at`         | `i64`         | Oracle settlement time (day 21)                |
| `claim_deadline`    | `i64`         | Last date to claim rewards                     |
| `radius`            | `u8`          | Winning bucket radius around final score       |
| `protocol_fee_bps`  | `u16`         | Protocol fee in basis points (300 = 3%)        |
| `creator_fee_bps`   | `u16`         | Creator fee in basis points (currently 0)      |
| `oracle_set`        | `[Pubkey; 3]` | Authorized oracle public keys                  |
| `oracle_threshold`  | `u8`          | Minimum agreeing oracles for finalization      |
| `pool`              | `[u64; 101]`  | Raw lamport totals per bucket (index 1–100)    |
| `weighted_pool`     | `[u64; 101]`  | Time-weighted totals per bucket                |
| `total_pool`        | `u64`         | Total raw lamports staked                      |
| `total_prize_pool`  | `u64`         | Total after protocol fee deduction             |
| `final_outcome`     | `u8`          | Resolved score (set after resolution)          |
| `bucket_prize`      | `[u64; 101]`  | Lamport prize allocated to each winning bucket |
| `fallback_used`     | `bool`        | Whether fallback distribution was applied      |
| `resolved`          | `bool`        | Has the market been resolved                   |
| `closed`            | `bool`        | Has the betting window been closed             |
| `reclaimed`         | `bool`        | Has unclaimed pool been swept to treasury      |
| `bump`              | `u8`          | PDA bump seed                                  |

---

### OracleReport Account

Tracks oracle submissions for a market. Derived from `["oracle_report_seed", market_pubkey]`.

| Field              | Type                | Description                             |
| ------------------ | ------------------- | --------------------------------------- |
| `market`           | `Pubkey`            | Parent market public key                |
| `submissions`      | `[(Pubkey, u8); 3]` | Each oracle's (pubkey, submitted_score) |
| `submission_count` | `u8`                | Number of submissions so far            |
| `agreed_score`     | `u8`                | Consensus score (set when finalized)    |
| `finalized`        | `bool`              | Threshold consensus reached             |
| `disputed`         | `bool`              | Oracles disagree; cannot resolve        |
| `bump`             | `u8`                | PDA bump seed                           |

---

### UserPosition Account

Records a single user's bet in a specific bucket for a market. Derived from `["position_seed", user_pubkey, market_pubkey, bucket_byte]`.

| Field             | Type     | Description                              |
| ----------------- | -------- | ---------------------------------------- |
| `user`            | `Pubkey` | Bettor's public key                      |
| `market`          | `Pubkey` | Market public key                        |
| `bucket`          | `u8`     | The score bucket they bet on             |
| `amount`          | `u64`    | Total raw lamports staked in this bucket |
| `weighted_amount` | `u64`    | Total time-weighted lamports             |
| `claimed`         | `bool`   | Whether the reward has been claimed      |
| `bump`            | `u8`     | PDA bump seed                            |

> A user can hold at most one `UserPosition` per `(market, bucket)` pair but may have positions across different buckets or different markets simultaneously.

---

### Vault (PDA)

A lamport-only account that holds all SOL staked in a market. Derived from `["vault_seed", market_pubkey]`. The program uses PDA signer seeds to authorize transfers out of the vault.

---

### Treasury (PDA)

The global protocol treasury. Derived from `["treasury_seed"]`. Receives:

-   3% protocol fee on every market resolution.
-   All unclaimed funds after the claim deadline via `reclaim_pool`.

---

## PDA Seeds

| Account      | Seeds                                                              |
| ------------ | ------------------------------------------------------------------ |
| Market       | `b"market_seed" \|\| media_id.to_le_bytes()`                       |
| Vault        | `b"vault_seed" \|\| market.key()`                                  |
| OracleReport | `b"oracle_report_seed" \|\| market.key()`                          |
| UserPosition | `b"position_seed" \|\| user.key() \|\| market.key() \|\| [bucket]` |
| Treasury     | `b"treasury_seed"`                                                 |

---

## Protocol Constants

| Constant                       | Value         | Description                                      |
| ------------------------------ | ------------- | ------------------------------------------------ |
| `BETTING_DURATION_DAYS`        | 14 days       | Length of the betting window                     |
| `SETTLEMENT_DAY`               | Day 21        | Oracle settlement deadline                       |
| `CLAIM_WINDOW_DAYS`            | 14 days       | Time after resolution to claim                   |
| `ORACLE_WINDOWS_START_SECONDS` | 0 s           | Oracle window starts at `settle_at`              |
| `ORACLE_WINDOWS_CLOSE_SECONDS` | 3600 s (1 hr) | Oracle window closes 1 hour after `settle_at`    |
| `DEFAULT_PROTOCOL_FEE_BPS`     | 300 (3%)      | Protocol fee on total pool                       |
| `DEFAULT_RADIUS`               | 5             | Default winning radius                           |
| `MAX_ORACLE_SIGNER`            | 3             | Maximum oracles per market                       |
| `MAX_BUCKETS`                  | 101           | Total bucket slots (index 0 unused; 1–100 valid) |
| `MULTIPLIER_SCALE`             | 1000          | Denominator for time multiplier division         |
| `CLOSENESS_SCALE`              | 1,000,000     | Numerator for closeness weight computation       |

---

## Error Codes

| Error                     | Description                                     |
| ------------------------- | ----------------------------------------------- |
| `MarketAlreadyClosed`     | Market is already in closed state               |
| `MarketNotClosed`         | Market has not been closed yet                  |
| `MarketAlreadyResolved`   | Market resolution already happened              |
| `MarketNotResolved`       | Market has not been resolved yet                |
| `MarketAlreadyClaimed`    | Vault has already been reclaimed                |
| `BettingNotStarted`       | Betting window has not opened yet               |
| `BettingClosed`           | The betting window has ended                    |
| `BettingStillOpen`        | Betting window is still active                  |
| `SettlementNotReady`      | `settle_at` timestamp not yet reached           |
| `SettlementTimeInvalid`   | Invalid settlement time provided                |
| `ClaimDeadlinePassed`     | The claim deadline has passed                   |
| `ClaimDeadlineNotPassed`  | Claim deadline has not passed yet (for reclaim) |
| `OracleWindowClosed`      | Oracle submission window is not currently open  |
| `UnauthorizedOracle`      | Signer is not in the market's oracle set        |
| `InvalidOracleThreshold`  | Threshold must be 2 or 3                        |
| `OracleAlreadyFinalized`  | Oracle report is already finalized              |
| `OracleNotFinalized`      | Oracle report has not been finalized            |
| `OracleAlreadySubmitted`  | This oracle already submitted a score           |
| `OracleDisputed`          | Oracles could not reach consensus               |
| `InvalidBucket`           | Bucket must be between 1 and 100                |
| `InvalidAmount`           | Bet amount must be greater than zero            |
| `AlreadyClaimed`          | User has already claimed their reward           |
| `InsufficientClaimAmount` | Computed payout is zero                         |
| `NotAWinner`              | User's bucket is outside the winning range      |
| `Unauthorized`            | Signer does not own the position account        |
| `MathOverflow`            | Arithmetic overflow during calculation          |

---

## Project Structure

```
cinefi/
├── Anchor.toml                    # Anchor workspace config
├── Cargo.toml                     # Workspace Cargo manifest
├── package.json                   # Node.js dependencies (tests)
├── tsconfig.json                  # TypeScript config
├── programs/
│   └── cinefi/
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs             # Program entrypoint & instruction dispatch
│           ├── errors/
│           │   └── mod.rs         # All custom error codes
│           ├── instructions/
│           │   ├── mod.rs
│           │   ├── initialize_treasury.rs
│           │   ├── create_market.rs
│           │   ├── place_bet.rs
│           │   ├── close_market.rs
│           │   ├── submit_score.rs
│           │   ├── resolve_market.rs
│           │   ├── claim_reward.rs
│           │   └── reclaim_pool.rs
│           ├── states/
│           │   ├── mod.rs
│           │   ├── constants.rs   # Protocol-wide constants & seeds
│           │   ├── market.rs      # Market account definition
│           │   ├── oracle_report.rs
│           │   └── user_position.rs
│           └── utils/
│               ├── mod.rs
│               ├── validations.rs # is_winner, oracle checks
│               └── weights.rs     # Time multipliers, closeness weights, prize computation
├── tests/
│   └── cinefi.ts                  # Integration tests
├── migrations/
│   └── deploy.ts
└── target/
    ├── idl/
    │   └── cinefi.json            # Generated IDL
    └── types/
        └── cinefi.ts              # Generated TypeScript types
```

---

## Getting Started

### Prerequisites

-   [Rust](https://rustup.rs/) with the `solana` toolchain (see `rust-toolchain.toml`)
-   [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
-   [Anchor CLI](https://www.anchor-lang.com/docs/installation)
-   [Node.js](https://nodejs.org/) & [Yarn](https://yarnpkg.com/)

### Install Dependencies

```bash
yarn install
```

### Build the Program

```bash
anchor build
```

### Run Tests

Start a local validator and run the test suite:

```bash
anchor test
```

### Deploy (Localnet)

```bash
anchor deploy
```

The program will be deployed to the address configured in `Anchor.toml`:

```
GomtSs5546sx4NQFsGaJtwFrDytfqRQPBADkiUr7PcyW
```

After deployment, initialize the treasury before creating any markets:

```typescript
await program.methods
	.initializeTreasury()
	.accounts({ authority: wallet.publicKey })
	.rpc();
```
