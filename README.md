# Cinefi

A decentralized prediction market protocol on Solana where users bet on media ratings — movies, shows, or any scored content. Built with the [Anchor](https://www.anchor-lang.com/) framework.

**Program ID:** `GomtSs5546sx4NQFsGaJtwFrDytfqRQPBADkiUr7PcyW`

---

## 🚀 Quick Navigation

Choose based on what you're building:

| Goal                             | Resource                                                      |
| -------------------------------- | ------------------------------------------------------------- |
| **Building a frontend/app**      | → See [TypeScript SDK](#typescript-sdk) section               |
| **Understanding the protocol**   | → See [How It Works](#how-it-works) section                   |
| **Running Rust program locally** | → See [Getting Started](#getting-started-development) section |
| **Deploying to Solana**          | → See [Deploy (Localnet)](#deploy-localnet) section           |
| **Full SDK API Reference**       | → See [app/contract/README.md](./app/contract/README.md)      |

---

## TypeScript SDK

The **easiest way** to interact with Cinefi is through the TypeScript SDK. It provides type-safe wrappers for all 8 program instructions, account fetching, validation, and utility functions.

### 📍 SDK Location

```
cinefi/
└── app/
    └── contract/          ← TypeScript SDK is here
        ├── README.md      ← Full SDK documentation (1600+ lines)
        ├── index.ts       ← Main entry point
        ├── pdas/
        ├── constants/
        ├── errors/
        ├── types/
        ├── utils/
        ├── accounts/
        └── instructions/
```

### ⚡ Quick Start (SDK)

```typescript
import CinefiSDK, {
	createMarketAndSend,
	placeBetAndSend,
} from "./app/contract";
import { Connection, Keypair } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";

// 1. Initialize connection & SDK
const connection = new Connection("https://api.devnet.solana.com");
const wallet = new Wallet(Keypair.generate());
const sdk = new CinefiSDK({ connection, wallet });

// 2. Create a market
const txId = await createMarketAndSend(sdk.program, creator, {
	mediaId: 12345n,
	radius: 5,
	oracleSet: [oracle1, oracle2, oracle3],
	oracleThreshold: 2,
});

// 3. Place a bet
const betTxId = await placeBetAndSend(sdk.program, bettor, {
	mediaId: 12345n,
	bucket: 75,
	amount: 1_000_000_000n, // 1 SOL
});
```

### 📖 Full SDK Documentation

For **complete API reference**, environment setup, oracle management, constraint documentation, error handling, and advanced workflows, see:

👉 **[app/contract/README.md](./app/contract/README.md)** (1600+ lines, covers everything)

**SDK Features:**

-   ✅ Type-safe instruction builders (8 instructions)
-   ✅ PDA derivation for all account types (5 PDAs)
-   ✅ Account fetching & parsing (6 methods)
-   ✅ 27 custom error codes with parsing
-   ✅ Validation helpers (bucket, amount, threshold)
-   ✅ State checking (betting open? can claim? etc)
-   ✅ Conversion utilities (SOL ↔ lamports, time multipliers)
-   ✅ Time management (decay multipliers, deadline checks)
-   ✅ Complete constraint documentation

### 🔧 SDK Usage in Your Project

```typescript
// ESM import
import CinefiSDK from "./app/contract";

// or CommonJS
const CinefiSDK = require("./app/contract");

// Environment setup required
import dotenv from "dotenv";
dotenv.config();

// Load keys from .env
const walletSecret = process.env.WALLET_SECRET_KEY;
const oracle1Secret = process.env.ORACLE_1_SECRET_KEY;
const oracle2Secret = process.env.ORACLE_2_SECRET_KEY;
const oracle3Secret = process.env.ORACLE_3_SECRET_KEY;
```

See [app/contract/README.md - Environment Configuration](./app/contract/README.md#environment-configuration) for complete setup.

---

## Table of Contents

- [Cinefi](#cinefi)
  - [🚀 Quick Navigation](#-quick-navigation)
  - [TypeScript SDK](#typescript-sdk)
    - [📍 SDK Location](#-sdk-location)
    - [⚡ Quick Start (SDK)](#-quick-start-sdk)
    - [📖 Full SDK Documentation](#-full-sdk-documentation)
    - [🔧 SDK Usage in Your Project](#-sdk-usage-in-your-project)
  - [Table of Contents](#table-of-contents)
  - [Program Overview](#program-overview)
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
  - [Getting Started (Development)](#getting-started-development)
    - [Prerequisites](#prerequisites)
    - [Install Dependencies](#install-dependencies)
    - [Build the Program](#build-the-program)
    - [Run Tests](#run-tests)
    - [Deploy (Localnet)](#deploy-localnet)
  - [Development: Program vs SDK](#development-program-vs-sdk)
    - [Building a Frontend/App](#building-a-frontendapp)
    - [Modifying the Program (Advanced)](#modifying-the-program-advanced)
  - [Common Tasks](#common-tasks)
    - [Task: Create a Web3 Frontend for Cinefi](#task-create-a-web3-frontend-for-cinefi)
    - [Task: Run Cinefi Locally for Testing](#task-run-cinefi-locally-for-testing)
    - [Task: Understand the Protocol Better](#task-understand-the-protocol-better)
  - [📚 Comprehensive Resource Guide](#-comprehensive-resource-guide)
    - [For SDK Users (Frontend Developers)](#for-sdk-users-frontend-developers)
    - [For Program Developers](#for-program-developers)
    - [Key Files](#key-files)
  - [🚀 Getting Started Paths](#-getting-started-paths)
    - [Path 1: Build a Frontend App (Recommended for most)](#path-1-build-a-frontend-app-recommended-for-most)
    - [Path 2: Understand the Protocol](#path-2-understand-the-protocol)
    - [Path 3: Modify the Program](#path-3-modify-the-program)
    - [Path 4: Integrate with Existing App](#path-4-integrate-with-existing-app)
  - [💡 Architecture Summary](#-architecture-summary)
    - [Three Layers](#three-layers)
    - [Data Flow](#data-flow)
  - [📞 Support \& References](#-support--references)
    - [Documentation Files](#documentation-files)
    - [External Resources](#external-resources)
    - [Files to Study](#files-to-study)
  - [📋 Checklist for Building an App](#-checklist-for-building-an-app)
  - [🎯 Next Steps](#-next-steps)
    - [Immediate (Next 30 minutes)](#immediate-next-30-minutes)
    - [Short Term (Next 2 hours)](#short-term-next-2-hours)
    - [Medium Term (This week)](#medium-term-this-week)
    - [Long Term (Production)](#long-term-production)
  - [📄 License](#-license)

---

## Program Overview

Cinefi lets anyone create a prediction market tied to a media item (identified by `media_id`). Participants bet SOL on a score bucket between 1 and 100 — representing their prediction of the media's final score. A set of trusted **oracles** submits the real-world score after the betting window closes. Winners — those who bet within a configurable **radius** of the final score — share the prize pool, weighted by how close their bucket is to the outcome and how early they placed their bet.

**Key Features:**

-   **Decentralized Oracle System** - 3 oracles provide consensus on outcomes
-   **Time-Weighted Betting** - Early bettors earn higher multipliers (1.0x → 0.272x over 14 days)
-   **Proximity-Based Rewards** - Winners closer to the actual outcome earn more
-   **Automatic Fee Distribution** - 3% protocol fee, customizable creator fees
-   **Fallback Mechanism** - If no one is in the winning radius, the closest bucket wins
-   **Permissionless** - Anyone can create markets, place bets, or claim rewards

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
├── package.json                   # Node.js dependencies (tests + SDK)
├── tsconfig.json                  # TypeScript config
├── README.md                       # This file
│
├── app/
│   └── contract/                  # 🚀 TypeScript SDK (use this for frontend!)
│       ├── README.md              # Complete SDK documentation (1600+ lines)
│       ├── index.ts               # SDK entry point
│       ├── pdas/index.ts          # 5 PDA derivation functions
│       ├── constants/index.ts     # Protocol constants
│       ├── errors/index.ts        # 27 error codes + parsing
│       ├── types/index.ts         # TypeScript type definitions
│       ├── utils/index.ts         # Validation, conversion, state functions
│       ├── accounts/index.ts      # Account fetching methods
│       └── instructions/          # 8 instruction modules
│           ├── initialize-treasury.ts
│           ├── create-market.ts
│           ├── place-bet.ts
│           ├── close-market.ts
│           ├── submit-score.ts
│           ├── resolve-market.ts
│           ├── claim-reward.ts
│           └── reclaim-pool.ts
│
├── programs/
│   └── cinefi/                    # Rust Anchor program
│       ├── Cargo.toml
│       └── src/
│           ├── lib.rs             # Program entrypoint & instruction dispatch
│           ├── errors/
│           │   └── mod.rs         # All custom error codes (27 total)
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
│               └── weights.rs     # Time multipliers, weights, prize computation
│
├── tests/
│   └── cinefi.ts                  # Integration tests
│
├── migrations/
│   └── deploy.ts
│
└── target/
    ├── idl/
    │   └── cinefi.json            # Generated IDL
    └── types/
        └── cinefi.ts              # Generated TypeScript types
```

## Getting Started (Development)

**If you want to use Cinefi in your app**, use the [TypeScript SDK](#typescript-sdk) instead (much easier!).

**If you want to develop or test the Solana program itself**, follow these steps:

### Prerequisites

-   [Rust](https://rustup.rs/) with the `solana` toolchain (see `rust-toolchain.toml`)
-   [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)
-   [Anchor CLI](https://www.anchor-lang.com/docs/installation)
-   [Node.js](https://nodejs.org/) v18+ & [Yarn](https://yarnpkg.com/) or npm

**Verify versions:**

```bash
rustc --version
solana --version
anchor --version
node --version
```

**Note:** For SDK usage only (no program development), you only need Node.js.

### Install Dependencies

```bash
# Install Rust/Solana dependencies
rustup update solana
cargo build -p cinefi

# Install Node dependencies
yarn install
# or
npm install
```

### Build the Program

```bash
# Build all programs
anchor build

# Build specific program
cargo build -p cinefi --release
```

**Output:**

-   Binaries: `target/release/cinefi.so`
-   IDL: `target/idl/cinefi.json`
-   TypeScript types: `target/types/cinefi.ts`

### Run Tests

Start a local validator and run the test suite:

```bash
# Start Solana localnet (in one terminal)
solana-test-validator

# In another terminal, run tests
anchor test

# Or run specific test file
anchor test --skip-local-validator
```

**What tests cover:**

-   ✅ All 8 program instructions
-   ✅ Market lifecycle (create → bet → resolve → claim)
-   ✅ Oracle consensus logic
-   ✅ Prize distribution calculations
-   ✅ Error cases and validation
-   ✅ Edge cases (fallback, overflow, etc)

### Deploy (Localnet)

```bash
# Start local validator
solana-test-validator

# Deploy program (in another terminal)
anchor deploy

# Program deployed to:
# GomtSs5546sx4NQFsGaJtwFrDytfqRQPBADkiUr7PcyW
```

**Before creating markets, initialize treasury:**

```typescript
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";

const connection = new Connection("http://localhost:8899");
const wallet = new Wallet(Keypair.generate());
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program(IDL, PROGRAM_ID, provider);

await program.methods
	.initializeTreasury()
	.accounts({ authority: wallet.publicKey })
	.rpc();
```

---

## Development: Program vs SDK

### Building a Frontend/App

**Use the TypeScript SDK** (in `/app/contract/`):

```typescript
// Simple!
import CinefiSDK, { placeBetAndSend } from "./app/contract";

const sdk = new CinefiSDK({ connection, wallet });
await placeBetAndSend(sdk.program, user, {
	mediaId: 123n,
	bucket: 75,
	amount: 1_000_000_000n,
});
```

**Why SDK?**

-   Type-safe (full TypeScript support)
-   Handles serialization & deserialization
-   Built-in validation & error parsing
-   Utility functions (time multipliers, state checks, etc)
-   Complete documentation in [app/contract/README.md](./app/contract/README.md)
-   No need to understand Anchor internals

### Modifying the Program (Advanced)

**Edit Rust code** (in `/programs/cinefi/src/`):

```rust
// Example: Add new instruction or modify existing
pub fn place_bet(ctx: Context<PlaceBet>, bucket: u8, amount: u64) -> Result<()> {
    // Your logic here
}
```

**Then:**

1. Build: `anchor build`
2. Tests: `anchor test`
3. Deploy: `anchor deploy`
4. SDK automatically regenerates from IDL

**Why modify?**

-   Changing protocol logic
-   Adding new features
-   Optimizing on-chain calculations
-   Fixing bugs in Rust code

---

## Common Tasks

### Task: Create a Web3 Frontend for Cinefi

**Solution:** Use the SDK

1. Create Next.js/React app
2. Import CinefiSDK from `./app/contract`
3. Follow examples in [app/contract/README.md](./app/contract/README.md)
4. Done!

**Example:**

```typescript
import CinefiSDK, { fetchMarket, getMarketState } from "./app/contract";

export default function MarketView({ mediaId }: { mediaId: bigint }) {
	const [market, setMarket] = useState(null);
	const [state, setState] = useState(null);

	useEffect(async () => {
		const m = await fetchMarket(sdk.program, mediaId);
		setMarket(m);
		setState(getMarketState(m!));
	}, []);

	return (
		<div>
			<h2>Market {mediaId}</h2>
			<p>Betting Open: {state?.canBet ? "Yes" : "No"}</p>
			<p>Can Claim: {state?.canClaim ? "Yes" : "No"}</p>
		</div>
	);
}
```

### Task: Run Cinefi Locally for Testing

**Solution:** Use localnet

```bash
# Terminal 1: Start local validator
solana-test-validator

# Terminal 2: Deploy program
anchor deploy

# Terminal 3: Run your tests
anchor test
```

See [Run Tests](#run-tests) and [Deploy (Localnet)](#deploy-localnet) sections.

### Task: Understand the Protocol Better

**Solution:** Read the docs

1. **Quick overview:** This file (README.md)
2. **How markets work:** [Market Lifecycle](#market-lifecycle)
3. **Complete details:** [How It Works](#how-it-works)
4. **Using in code:** [app/contract/README.md](./app/contract/README.md)
5. **Program internals:** [Program Instructions](#program-instructions) and [Account Architecture](#account-architecture)

---

## 📚 Comprehensive Resource Guide

### For SDK Users (Frontend Developers)

| Resource           | Purpose                                             | Link                                                                                 |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------ |
| SDK Setup          | Environment config, oracle keys, cluster connection | [app/contract/README.md - Setup](./app/contract/README.md#installation--setup)       |
| API Reference      | All 8 instructions, 5 PDAs, validation functions    | [app/contract/README.md - API Reference](./app/contract/README.md#api-reference)     |
| Complete Workflows | Real market lifecycle examples                      | [app/contract/README.md - Workflows](./app/contract/README.md#complete-workflows)    |
| Error Handling     | All 27 error codes, recovery patterns               | [app/contract/README.md - Error Handling](./app/contract/README.md#error-handling)   |
| Constraint Docs    | Time windows, amount limits, bucket rules           | [app/contract/README.md - Constraints](./app/contract/README.md#program-constraints) |
| Troubleshooting    | Connection issues, wallet errors, debugging         | [app/contract/README.md - Troubleshooting](./app/contract/README.md#troubleshooting) |

### For Program Developers

| Resource         | Purpose                                    | Link                                                              |
| ---------------- | ------------------------------------------ | ----------------------------------------------------------------- |
| Program Overview | Instructions, accounts, logic              | [Program Overview](#program-overview) section (this file)         |
| Market Lifecycle | State transitions, timing                  | [Market Lifecycle](#market-lifecycle) section (this file)         |
| Instructions     | Detailed specification of each instruction | [Program Instructions](#program-instructions) section (this file) |
| Accounts         | Data structures and field descriptions     | [Account Architecture](#account-architecture) section (this file) |
| Constants        | Time values, fees, limits                  | [Protocol Constants](#protocol-constants) section (this file)     |
| Error Codes      | All 27 error codes with descriptions       | [Error Codes](#error-codes) section (this file)                   |
| Rust Code        | Implementation details                     | `/programs/cinefi/src/` directory                                 |

### Key Files

| File/Folder                         | Purpose                                         |
| ----------------------------------- | ----------------------------------------------- |
| `app/contract/`                     | 🔥 **Start here for frontend** - TypeScript SDK |
| `app/contract/README.md`            | 📖 **Complete SDK documentation (1600+ lines)** |
| `programs/cinefi/src/lib.rs`        | Entry point for Rust program                    |
| `programs/cinefi/src/instructions/` | All 8 instruction implementations               |
| `programs/cinefi/src/states/`       | Account definitions                             |
| `tests/cinefi.ts`                   | Integration tests (shows SDK usage)             |
| `target/idl/cinefi.json`            | Generated IDL (shared between Rust & TS)        |

---

## 🚀 Getting Started Paths

### Path 1: Build a Frontend App (Recommended for most)

```
1. Read: Quick Navigation → TypeScript SDK section above
2. Setup: app/contract/README.md - Environment Configuration
3. Code: Import CinefiSDK and follow examples
4. Reference: app/contract/README.md - API Reference
5. Deploy: Use TestNet or MainNet
```

**Time: 1-2 hours to basic working app**

### Path 2: Understand the Protocol

```
1. Read: Program Overview (this file)
2. Understand: Market Lifecycle & How It Works (this file)
3. Reference: Program Instructions & Account Architecture (this file)
4. Deep dive: Scroll to Error Codes & Constants (this file)
5. Code: Look at tests/cinefi.ts for real examples
```

**Time: 2-3 hours of reading**

### Path 3: Modify the Program

```
1. Setup: Run Prerequisites through Deploy sections above
2. Understand: Program Instructions & Account Architecture (this file)
3. Modify: Edit code in programs/cinefi/src/
4. Build: cargo build -p cinefi
5. Test: anchor test (tests/ folder)
6. Deploy: anchor deploy
7. Regenerate: SDK regenerates from new IDL automatically
```

**Time: Varies by change complexity**

### Path 4: Integrate with Existing App

```
1. Copy: app/contract/ folder to your project
2. Install: npm install @coral-xyz/anchor @solana/web3.js bn.js
3. Setup: Create .env with WALLET_SECRET_KEY and ORACLE_*_SECRET_KEY
4. Use: import CinefiSDK from "./app/contract"
5. Reference: app/contract/README.md for all possible operations
```

**Time: 30 minutes**

---

## 💡 Architecture Summary

### Three Layers

```
┌─────────────────────────────────────────┐
│  Your Frontend App (React, Next.js, etc)│
├─────────────────────────────────────────┤  ← Use TypeScript SDK here
│  TypeScript SDK (app/contract/)         │     Type-safe, easy to use
│  - Instructions (8)                     │     All examples provided
│  - Account Fetching (6 methods)         │
│  - Validation (15+ helpers)             │
│  - Error Parsing (27 codes)             │
├─────────────────────────────────────────┤
│  Solana Blockchain                      │  ← Program runs here
│  Cinefi Program (programs/cinefi/)      │     You don't interact directly
│  - 8 Instructions                       │
│  - 5 Account Types                      │
│  - Oracle Consensus Logic               │
│  - Prize Distribution Math              │
├─────────────────────────────────────────┤
│  Solana Network (Devnet/Testnet/Mainnet)│
└─────────────────────────────────────────┘
```

### Data Flow

```
User Input
    ↓
TypeScript SDK validates
    ↓
SDK calls program instruction
    ↓
Program executes on blockchain
    ↓
Program updates accounts
    ↓
SDK fetches updated accounts
    ↓
Frontend displays results
```

**You only write:**

-   Frontend code
-   SDK usage in frontend

**You don't write:**

-   Blockchain code (already built)
-   Transaction serialization (SDK handles)
-   Account struct definitions (SDK handles)

---

## 📞 Support & References

### Documentation Files

-   **Main Docs:** `/README.md` (this file) - Protocol overview
-   **SDK Docs:** `/app/contract/README.md` - Complete API reference & setup
-   **IDL Docs:** `/target/idl/cinefi.json` - Generated from Rust code

### External Resources

-   [Anchor Documentation](https://www.anchor-lang.com/docs/intro)
-   [Solana Documentation](https://docs.solana.com/)
-   [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
-   [BN.js Documentation](https://github.com/indutny/bn.js)

### Files to Study

**To learn protocol:**

-   `programs/cinefi/src/lib.rs` - Main logic
-   `programs/cinefi/src/states/` - Data structures
-   `tests/cinefi.ts` - Real usage examples

**To build frontend:**

-   `app/contract/README.md` - Complete guide
-   `app/contract/instructions/` - How each instruction works
-   `app/contract/utils/index.ts` - Utility functions

---

## 📋 Checklist for Building an App

-   [ ] Read [Quick Navigation](#-quick-navigation) section
-   [ ] Read [TypeScript SDK](#typescript-sdk) section
-   [ ] Clone/import `/app/contract/` to your project
-   [ ] Create `.env` file with wallet and oracle keys (from [SDK docs](./app/contract/README.md#environment-configuration))
-   [ ] Test connection to cluster (from [SDK docs](./app/contract/README.md#cluster-connection))
-   [ ] Run quick start example (from [SDK quick start](#-quick-start-sdk))
-   [ ] Study full examples in [app/contract/README.md](./app/contract/README.md#complete-workflows)
-   [ ] Implement your frontend features
-   [ ] Test on Devnet
-   [ ] Deploy to Testnet or Mainnet

---

## 🎯 Next Steps

### Immediate (Next 30 minutes)

1. Read the [Quick Navigation](#-quick-navigation) section above
2. Check [TypeScript SDK](#typescript-sdk) section for your use case
3. Open [app/contract/README.md](./app/contract/README.md) in your editor

### Short Term (Next 2 hours)

1. Set up environment variables (`.env` file)
2. Create a basic script that connects to SDK
3. Run the [Quick Start example](#-quick-start-sdk)
4. Fetch a market and display its state

### Medium Term (This week)

1. Build core frontend features
2. Study [complete workflows](./app/contract/README.md#complete-workflows)
3. Test on Devnet with real transactions
4. Implement error handling

### Long Term (Production)

1. Comprehensive testing
2. Security audit of your app
3. Deploy to Testnet
4. Deploy to Mainnet

---

## 📄 License

MIT

---

**Questions?** Check the comprehensive SDK docs: [app/contract/README.md](./app/contract/README.md) (1600+ lines covering everything)
