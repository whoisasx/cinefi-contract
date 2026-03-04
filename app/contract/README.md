# Cinefi SDK - Complete Reference Guide

Complete TypeScript SDK for the **Cinefi** Solana program - a decentralized prediction market protocol built with Anchor.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Installation & Setup](#installation--setup)
4. [Environment Configuration](#environment-configuration)
5. [Cluster Connection](#cluster-connection)
6. [Oracle Setup](#oracle-setup)
7. [Program Constraints](#program-constraints)
8. [Quick Start](#quick-start)
9. [API Reference](#api-reference)
10. [Complete Workflows](#complete-workflows)
11. [Error Handling](#error-handling)
12. [Troubleshooting](#troubleshooting)

## Overview

Cinefi is a peer-to-peer prediction market protocol where:
- **Users** place bets on outcomes by selecting buckets (0-100)
- **Markets** have 14-day betting windows, 21-day settlement, and 14-day claim windows
- **Oracles** (3 signers) submit consensus scores to resolve markets
- **Rewards** are distributed based on proximity to final outcome within a radius
- **Fees** include 3% protocol fee + creator fees, deducted before distribution

This SDK provides complete, type-safe access to all 8 program instructions, account types, and utility functions. **Everything you need is documented here - no need to read the source code.**

## Features

✨ **Type-Safe Wrappers** - All 8 program instructions with full TypeScript support  
📍 **PDA Derivation** - Automatic derivation of all program-derived accounts  
🔐 **Error Handling** - Custom error types and parsing for all 27 program error codes  
📊 **Account Fetching** - Methods to fetch and parse all account types  
🛠️ **Utility Helpers** - Validation, conversion, and state checking functions  
⏰ **Time Management** - Multiplier calculations and deadline checks  
🔢 **Constants** - All program constants exported for reference  
🔍 **Constraint Validation** - Built-in validation for all program constraints  

## Prerequisites

Before starting, ensure you have:

- **Node.js** v18+ installed
- **TypeScript** knowledge (or JavaScript)
- **Solana CLI** installed (`solana --version`)
- **Solana wallet** with SOL for transactions and rent exemption
- **3 Oracle keypairs** for market resolution (see [Oracle Setup](#oracle-setup))
- **Internet connection** to Solana cluster (Devnet, Testnet, or Mainnet)

### Check Solana Installation

```bash
solana --version
solana config get
```

## Installation & Setup

### 1. Install Dependencies

```bash
npm install @coral-xyz/anchor @solana/web3.js bn.js
npm install --save-dev typescript @types/node
```

### 2. Import SDK

```typescript
import CinefiSDK, {
	createMarketAndSend,
	placeBetAndSend,
	fetchMarket,
	getMarketState,
} from "./app/contract";

import {
	Connection,
	Keypair,
	PublicKey,
} from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
```

### 3. Set Up TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
	"compilerOptions": {
		"target": "ES2020",
		"module": "commonjs",
		"lib": ["ES2020"],
		"declaration": true,
		"strict": true,
		"esModuleInterop": true,
		"skipLibCheck": true,
		"forceConsistentCasingInFileNames": true
	}
}
```

## Environment Configuration

### Set Up Environment Variables

Create a `.env` file in your project root:

```bash
# Solana Cluster
SOLANA_CLUSTER=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com

# Wallet (base58 encoded secret key)
WALLET_SECRET_KEY=[YOUR_WALLET_SECRET_KEY_BASE58]

# Oracle Keypairs (3 required for market resolution)
ORACLE_1_SECRET_KEY=[ORACLE_1_SECRET_KEY_BASE58]
ORACLE_2_SECRET_KEY=[ORACLE_2_SECRET_KEY_BASE58]
ORACLE_3_SECRET_KEY=[ORACLE_3_SECRET_KEY_BASE58]

# Optional: Program ID (uses default if not set)
CINEFI_PROGRAM_ID=GomtSs5546sx4NQFsGaJtwFrDytfqRQPBADkiUr7PcyW
```

**IMPORTANT**: Add `.env` to `.gitignore` - never commit private keys!

```bash
echo ".env" >> .gitignore
```

### Install dotenv

```bash
npm install dotenv
```

### Load Environment Variables

```typescript
import dotenv from "dotenv";

dotenv.config();

const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const walletSecret = process.env.WALLET_SECRET_KEY;
const oracle1Secret = process.env.ORACLE_1_SECRET_KEY;
const oracle2Secret = process.env.ORACLE_2_SECRET_KEY;
const oracle3Secret = process.env.ORACLE_3_SECRET_KEY;

if (!walletSecret || !oracle1Secret || !oracle2Secret || !oracle3Secret) {
	throw new Error("Missing required environment variables");
}

const walletKeypair = Keypair.fromSecretKey(
	Buffer.from(walletSecret, "base64")
);
const oracle1 = Keypair.fromSecretKey(
	Buffer.from(oracle1Secret, "base64")
);
const oracle2 = Keypair.fromSecretKey(
	Buffer.from(oracle2Secret, "base64")
);
const oracle3 = Keypair.fromSecretKey(
	Buffer.from(oracle3Secret, "base64")
);
```

## Cluster Connection

### Initialize Connection (With Cluster Check)

```typescript
import { Connection, clusterApiUrl } from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

async function initializeConnection(): Promise<Connection> {
	const rpcUrl =
		process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");

	const connection = new Connection(rpcUrl, "confirmed");

	try {
		const version = await connection.getVersion();
		console.log(`✓ Connected to Solana cluster`);
		console.log(`  RPC: ${rpcUrl}`);
		console.log(`  Solana version: ${version["solana-core"]}`);
		return connection;
	} catch (error) {
		console.error(`✗ Failed to connect to cluster at ${rpcUrl}`);
		console.error(`  Error: ${(error as Error).message}`);
		throw error;
	}
}
```

### Check Wallet Balance

```typescript
async function checkWalletBalance(
	connection: Connection,
	publicKey: PublicKey
): Promise<number> {
	const balanceLamports = await connection.getBalance(publicKey);
	const balanceSol = balanceLamports / 1e9;

	console.log(`Wallet: ${publicKey.toBase58()}`);
	console.log(`Balance: ${balanceSol} SOL (${balanceLamports} lamports)`);

	if (balanceLamports < 5_000_000) {
		console.warn(
			"⚠️  Low balance! Consider airdropping more SOL"
		);
	}

	return balanceSol;
}
```

### Airdrop SOL (Devnet Only)

```typescript
async function requestAirdrop(
	connection: Connection,
	publicKey: PublicKey,
	lamports: number = 2_000_000_000
): Promise<void> {
	try {
		console.log(`Requesting ${lamports / 1e9} SOL airdrop...`);
		const signature = await connection.requestAirdrop(
			publicKey,
			lamports
		);
		await connection.confirmTransaction(signature);
		console.log(`✓ Airdrop successful`);
	} catch (error) {
		console.error(`✗ Airdrop failed: ${(error as Error).message}`);
		throw error;
	}
}
```

## Oracle Setup

### Why 3 Oracles?

The Cinefi protocol requires **exactly 3 oracle signers** for market resolution:
- Each oracle submits a score independently
- Consensus is reached when 2+ oracles agree (oracle_threshold = 2 by default)
- Prevents single-oracle manipulation
- Ensures decentralized outcome determination

### Generate Oracle Keypairs

```typescript
import { Keypair } from "@solana/web3.js";
import * as fs from "fs";

function generateOracleKeypairs(): void {
	const oracles = [
		{ name: "ORACLE_1", keypair: Keypair.generate() },
		{ name: "ORACLE_2", keypair: Keypair.generate() },
		{ name: "ORACLE_3", keypair: Keypair.generate() },
	];

	console.log("Generated Oracle Keypairs:\n");

	for (const oracle of oracles) {
		const secretKeyBase64 = Buffer.from(
			oracle.keypair.secretKey
		).toString("base64");
		const publicKey = oracle.keypair.publicKey.toBase58();

		console.log(`${oracle.name}:`);
		console.log(`  Public Key: ${publicKey}`);
		console.log(`  Secret Key (Base64): ${secretKeyBase64}`);
		console.log();
	}

	console.log("Add these to your .env file:");
	for (const oracle of oracles) {
		const secretKeyBase64 = Buffer.from(
			oracle.keypair.secretKey
		).toString("base64");
		console.log(
			`${oracle.name}_SECRET_KEY=${secretKeyBase64}`
		);
	}
}

generateOracleKeypairs();
```

### Store Oracle Keypairs in Environment

**CRITICAL Security Rules:**
1. **Never commit oracle keypairs to version control**
2. **Use .env file with .gitignore**
3. **Treat oracle keys like production credentials**
4. **Keep separate secure storage for mainnet**
5. **Rotate keys periodically**

**Steps:**
1. Generate keypairs using the function above
2. Add to `.env` file (verified in `.gitignore`)
3. Load at runtime (as shown in [Environment Configuration](#environment-configuration))
4. Use oracle keypairs only when submitting scores

### Using Oracle Keypairs

```typescript
const oracleSet: [PublicKey, PublicKey, PublicKey] = [
	oracle1.publicKey,
	oracle2.publicKey,
	oracle3.publicKey,
];

console.log("Oracle Set for Markets:");
console.log(` Oracle 1: ${oracle1.publicKey.toBase58()}`);
console.log(` Oracle 2: ${oracle2.publicKey.toBase58()}`);
console.log(` Oracle 3: ${oracle3.publicKey.toBase58()}`);

// Use this oracleSet when creating markets
const marketParams = {
	mediaId: 12345n,
	oracleSet,
	oracleThreshold: 2,
};
```

## Program Constraints

### CRITICAL: Understand All Constraints

**Violating any constraint will cause transaction failure.** All constraints are validated by the program and will return specific error codes.

### Time Constraints (Absolute Rules)

| Phase | Timeline | Window | Details |
|-------|----------|--------|---------|
| Betting | Day 1-14 | 14 days | Users place bets during this window only |
| Settlement Delay | Day 15-20 | 6 days | No oracle submissions allowed |
| Oracle Submission | Day 21-21:01 | 1 hour | Oracles submit scores in this window |
| Claim Period | Day 22-35 | 14 days | Winners can claim rewards |
| Reclaim Period | Day 36+ | Unlimited | Treasury can reclaim unclaimed funds |

**Key Constants:**
- `BETTING_DURATION_DAYS = 14`
- `SETTLEMENT_DAY = 21`
- `CLAIM_WINDOW_DAYS = 14`

### Amount Constraints (Lamports are the Unit)

| Constraint | Rule | Details | Error Code |
|-----------|------|---------|-----------|
| Minimum Bet | > 0 lamports | Bets must be positive | `InvalidAmount` (6020) |
| Maximum Bet | No hard limit | Limited by wallet + tx limits | - |
| Protocol Fee | 300 BPS (3%) | Deducted from pool | - |
| Creator Fee | 0 BPS (default) | Configurable per market | - |

**Example Amounts:**
```typescript
const oneSol = BigInt(1_000_000_000); // 1 SOL
const halfSol = BigInt(500_000_000);   // 0.5 SOL
const oneLamport = BigInt(1);          // Minimum valid
```

### Bucket Constraints (0-100 Scale)

| Constraint | Rule | Details | Error Code |
|-----------|------|---------|-----------|
| Valid Range | 0-100 inclusive | Integer values only | `InvalidBucket` (6019) |
| Bucket Type | u8 | Cannot exceed 255 | - |
| Total Buckets | 101 | Buckets 0 through 100 | - |
| Score Range | 0-100 | Oracle scores use same range | `InvalidBucket` (6019) |

**Winning Criteria:**
```
User is a winner if: |userBucket - finalScore| <= radius

Example with radius=5, outcome=75:
- Winning buckets: 70-80 (inclusive)
- Losing buckets: 0-69, 81-100
```

### Oracle Constraints (3 Signers Required)

| Constraint | Rule | Details | Error Code |
|-----------|------|---------|-----------|
| Oracle Count | Exactly 3 | No more, no less | - |
| Threshold | 1-3 | Min to reach consensus | `InvalidAmount` (6020) |
| Signers | Must be in oracle_set | Only designated oracles | `UnauthorizedOracle` (6012) |
| Submissions | Max 3 (1 per oracle) | Duplicates overwrite | `OracleAlreadySubmitted` (6015) |
| Consensus | 2+ must agree | Default threshold=2 | `OracleNotFinalized` (6014) |

**Consensus Logic:**
```typescript
// Market resolves with 2+ matching scores
Scores: [75, 75, 80]
Result: Consensus = 75 (2 agree)

Scores: [70, 75, 80]
Result: No consensus (all different)
```

### Market State Constraints (Phase Progression)

| State | Allowed Actions | Forbidden Actions | Conditions | Error Code |
|-------|-----------------|-------------------|-----------|-----------|
| Active | PlaceBet | Close, Submit, Resolve, Claim | time ∈ [start, start+14d] | - |
| Closed | Submit, Close (idempotent) | PlaceBet | time ≥ start+14d | `BettingClosed` (6005) |
| Settlement | Submit | PlaceBet, Resolve | time ∈ [start+21d, start+21d+1h] | `OracleWindowClosed` (6010) |
| Finalized | Resolve, Claim | PlaceBet, Submit | Oracle report finalized | `OracleNotFinalized` (6014) |
| Resolved | Claim, Reclaim | PlaceBet, Submit | Rewards calculated | - |
| Claimed | - | ClaimReward again | After deadline | `AlreadyClaimed` (6021) |

### Fee Distribution Constraints

```
Total Pool = Sum of all bets
Step 1: Deduct Protocol Fee
  Protocol Fee = (Total Pool * 300 / 10000) = 3%
  
Step 2: Deduct Creator Fee
  Creator Fee = (Total Pool * creatorFeeBps / 10000)
  
Step 3: Remaining Prize Pool
  Prize Pool = Total Pool - Protocol Fee - Creator Fee

Step 4: Distribute to Winners (within radius)
  Per Winner = (Prize Pool / Total Pool) 
            * userBetAmount 
            * (timeMultiplier / 1000)
            * (closenessBonus / 1_000_000)

Constraints:
- All calculations use checked arithmetic
- Overflow/underflow → MathOverflow/Underflow (6025/6026)
- Precision loss handled at 6 decimal places
```

### Early Betting Multiplier (Time Decay)

Rewards decay 10% per day, incentivizing early betting:

```
Day 1:  100.0% multiplier (1000)
Day 2:  90.4%  multiplier (904)
Day 3:  81.8%  multiplier (818)
Day 4:  73.6%  multiplier (736)
Day 5:  66.2%  multiplier (662)
Day 6:  59.6%  multiplier (596)
Day 7:  53.6%  multiplier (536)
Day 8:  48.2%  multiplier (482)
Day 9:  43.3%  multiplier (433)
Day 10: 38.9%  multiplier (389)
Day 11: 35.0%  multiplier (350)
Day 12: 31.5%  multiplier (315)
Day 13: 28.3%  multiplier (283)
Day 14: 27.2%  multiplier (272)
```

## Quick Start

### Initialize SDK (Complete Setup)

```typescript
import dotenv from "dotenv";
import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import CinefiSDK from "./app/contract";

dotenv.config();

async function initializeSdk() {
	// 1. Set up cluster connection with validation
	const rpcUrl =
		process.env.SOLANA_RPC_URL || clusterApiUrl("devnet");
	const connection = new Connection(rpcUrl, "confirmed");

	try {
		const version = await connection.getVersion();
		console.log(`✓ Connected to Solana`);
	} catch (error) {
		console.error(`✗ Failed to connect: ${error}`);
		process.exit(1);
	}

	// 2. Load wallet keypair
	const walletSecret = process.env.WALLET_SECRET_KEY;
	if (!walletSecret) {
		throw new Error(
			"WALLET_SECRET_KEY not found in environment"
		);
	}

	const walletKeypair = Keypair.fromSecretKey(
		Buffer.from(walletSecret, "base64")
	);
	const wallet = new Wallet(walletKeypair);

	// 3. Check wallet balance
	const balance = await connection.getBalance(wallet.publicKey);
	console.log(
		`Wallet balance: ${(balance / 1e9).toFixed(4)} SOL`
	);

	if (balance < 1_000_000) {
		throw new Error(
			"Insufficient balance. Need at least 0.001 SOL"
		);
	}

	// 4. Initialize SDK
	const sdk = new CinefiSDK({
		connection,
		wallet,
	});

	console.log(`Program ID: ${sdk.programId.toBase58()}`);
	return { sdk, connection, wallet };
}

// Usage
const { sdk, connection, wallet } = await initializeSdk();
```

### Create A Market (Complete Example)

```typescript
import {
	createMarketAndSend,
	CreateMarketParams,
	validateBucket,
} from "./app/contract";

async function createPredictionMarket(
	sdk: CinefiSDK,
	creator: PublicKey,
	oracleSet: [PublicKey, PublicKey, PublicKey]
) {
	const params: CreateMarketParams = {
		mediaId: BigInt(12345), // Unique identifier (never reused)
		bettingStartsAfter: null, // null = immediate, or seconds delay
		radius: 5, // Winning bucket range (±5 from outcome)
		oracleSet: oracleSet, // 3 oracle public keys (from .env)
		oracleThreshold: 2, // Min oracles that must agree (1-3)
	};

	try {
		console.log("Creating market...");
		const signature = await createMarketAndSend(
			sdk.program,
			creator,
			params
		);

		console.log(`✓ Market created: ${signature}`);
		console.log(`  Media ID: ${params.mediaId}`);
		console.log(`  Outcome radius: ±${params.radius}`);
		console.log(`  Oracle threshold: ${params.oracleThreshold}/3`);

		return signature;
	} catch (error) {
		console.error(
			`✗ Failed to create market: ${(error as Error).message}`
		);
		throw error;
	}
}
```

### Place a Bet (With Validation)

```typescript
import {
	placeBetAndSend,
	PlaceBetParams,
	validateBucket,
	validateAmount,
	solToLamports,
} from "./app/contract";

async function placePredictionBet(
	sdk: CinefiSDK,
	user: PublicKey,
	mediaId: bigint,
	bucket: number,
	solAmount: number
) {
	// Validate inputs before sending transaction
	try {
		validateBucket(bucket); // Must be 0-100
		const lamports = solToLamports(solAmount);
		validateAmount(lamports); // Must be > 0
	} catch (error) {
		console.error(`✗ Validation failed: ${(error as Error).message}`);
		throw error;
	}

	const params: PlaceBetParams = {
		mediaId,
		bucket, // 0-100 outcome prediction
		amount: solToLamports(solAmount),
	};

	try {
		console.log(`Placing bet...`);
		console.log(`  Bucket: ${bucket}`);
		console.log(`  Amount: ${solAmount} SOL`);

		const signature = await placeBetAndSend(
			sdk.program,
			user,
			params
		);

		console.log(`✓ Bet placed: ${signature}`);
		return signature;
	} catch (error) {
		console.error(
			`✗ Failed to place bet: ${(error as Error).message}`
		);
		throw error;
	}
}
```

### Fetch and Check Market State

```typescript
import {
	fetchMarket,
	getMarketState,
	getCurrentTimestamp,
} from "./app/contract";

async function checkMarketStatus(sdk: CinefiSDK, mediaId: bigint) {
	const market = await fetchMarket(sdk.program, mediaId);

	if (!market) {
		console.log(`✗ Market not found for media ID: ${mediaId}`);
		return;
	}

	const now = getCurrentTimestamp();
	const state = getMarketState(market, now);

	console.log(`Market Status for Media ID ${mediaId}:`);
	console.log(`  Address: ${market.publicKey.toBase58()}`);
	console.log(`\nAvailable Actions:`);
	console.log(`  Can bet: ${state.canBet}`);
	console.log(`  Can close: ${state.canClose}`);
	console.log(`  Can submit score: ${state.canSubmitScore}`);
	console.log(`  Can resolve: ${state.canResolve}`);
	console.log(`  Can claim: ${state.canClaim}`);
	console.log(`  Can reclaim: ${state.canReclaim}`);

	console.log(`\nMarket Data:`);
	console.log(
		`  Created: ${new Date(market.bettingStartsAt * 1000)}`
	);
	console.log(
		`  Betting closes: ${new Date(market.bettingClosesAt * 1000)}`
	);
	console.log(
		`  Settlement: ${new Date(market.settledAt * 1000)}`
	);
	console.log(
		`  Claim deadline: ${new Date(market.claimDeadline * 1000)}`
	);

	return state;
}
```

## API Reference

### Complete PDA Derivation Guide

All PDAs are deterministic - same inputs always produce same addresses.

```typescript
import {
	deriveMarketPDA,
	deriveVaultPDA,
	deriveTreasuryPDA,
	deriveOracleReportPDA,
	deriveUserPositionPDA,
} from "./app/contract";

// Market PDA (derived from mediaId)
const [marketPDA, marketBump] = deriveMarketPDA(programId, mediaId);
console.log(`Market: ${marketPDA.toBase58()}`);

// Vault PDA (derived from market)
const [vaultPDA, vaultBump] = deriveVaultPDA(programId, marketPDA);
console.log(`Vault: ${vaultPDA.toBase58()}`);

// Treasury PDA (singleton account)
const [treasuryPDA, treasuryBump] = deriveTreasuryPDA(programId);
console.log(`Treasury: ${treasuryPDA.toBase58()}`);

// Oracle Report PDA (derived from market)
const [oraclePDA, oracleBump] = deriveOracleReportPDA(
	programId,
	marketPDA
);
console.log(`Oracle Report: ${oraclePDA.toBase58()}`);

// User Position PDA (derived from user, market, bucket)
const [positionPDA, positionBump] = deriveUserPositionPDA(
	programId,
	userPublicKey,
	marketPDA,
	bucket
);
console.log(`Position: ${positionPDA.toBase58()}`);
```

### Instructions - Complete API

Every instruction has TWO variants for flexibility:

1. **instruction()** - Returns `TransactionInstruction` for custom transaction building
2. **instructionAndSend()** - Builds, signs, and sends transaction in one call

#### Initialize Treasury (Admin Only)

**Purpose:** Sets up the protocol treasury account. Called once at deployment.

```typescript
import {
	initializeTreasury,
	initializeTreasuryAndSend,
} from "./app/contract";

// Option 1: Get just the instruction
const ix = await initializeTreasury(sdk.program, adminPublicKey);

// Option 2: Send directly (simpler)
const txId = await initializeTreasuryAndSend(
	sdk.program,
	adminPublicKey
);

console.log(`Treasury initialized: ${txId}`);
```

**Parameters:** None additional (derives treasury automatically)

**Constraints:**
- ✓ Can only be called once
- ✓ Must be called before creating any markets
- ✓ Requires admin authority
- ✓ Creates singleton treasury account

#### Create Market

**Purpose:** Creates a new prediction market. Called by market creators.

```typescript
import {
	createMarket,
	createMarketAndSend,
	CreateMarketParams,
} from "./app/contract";

const params: CreateMarketParams = {
	mediaId: BigInt(998877), // Must be unique, never reused
	bettingStartsAfter: null, // null=now, or seconds from now
	radius: 5, // Winning bucket range ±5 from outcome
	oracleSet: [oracle1.publicKey, oracle2.publicKey, oracle3.publicKey],
	oracleThreshold: 2, // Min for consensus (1-3)
};

// Send with signature
const txId = await createMarketAndSend(sdk.program, creator, params);
```

**Parameters:**

| Param | Type | Constraints | Notes |
|-------|------|-------------|-------|
| mediaId | bigint | Must be unique | Never reuse for same content |
| bettingStartsAfter | null \| number | Seconds from now | null=immediate, 3600=1 hour delay |
| radius | number | 0-100 | Default 5, winnings within ±distance |
| oracleSet | [PublicKey; 3] | Exactly 3 distinct | From .env oracle keypairs |
| oracleThreshold | number | 1-3 | Default 2, min to reach consensus |

**What Gets Created Automatically:**
- Market account (stores parameters + state)
- Vault account (holds betting pool)
- Oracle Report account (tracks oracle submissions)

**Constraints:**
- ✓ mediaId must be unique (no duplicate markets)
- ✓ Exactly 3 oracle signers (not 2, not 4)
- ✓ radius must be 0-100
- ✓ oracleThreshold must be 1-3
- ✓ Creates Market, Vault, and OracleReport PDAs

#### Place Bet

**Purpose:** Users place bets on specific outcomes. During betting window only.

```typescript
import {
	placeBet,
	placeBetAndSend,
	PlaceBetParams,
	validateBucket,
	validateAmount,
	solToLamports,
} from "./app/contract";

// Validate locally first
validateBucket(75);
validateAmount(BigInt(1_000_000_000));

const params: PlaceBetParams = {
	mediaId: BigInt(998877),
	bucket: 75, // Prediction: outcome will be ~75
	amount: BigInt(2_000_000_000), // 2 SOL in lamports
};

const txId = await placeBetAndSend(sdk.program, bettor, params);
```

**Parameters:**

| Param | Type | Constraints | Notes |
|-------|------|-------------|-------|
| mediaId | bigint | Market must exist | Get from createMarket |
| bucket | number | 0-100 inclusive | Integer, 101 total buckets |
| amount | bigint | > 0 lamports | Use solToLamports() helper |

**Constraints:**
- ✓ Betting window must be open (day 1-14)
- ✓ bucket must be 0-100 (use validateBucket)
- ✓ amount must be > 0 (use validateAmount)
- ✓ User wallet must have sufficient balance
- ✓ Each bucket creates separate position account
- ✓ Can make multiple bets in same bucket (accumulates)

#### Close Market

**Purpose:** Closes the betting window. After 14 days, anyone can call.

```typescript
import {
	closeMarket,
	closeMarketAndSend,
} from "./app/contract";

const txId = await closeMarketAndSend(sdk.program, caller, mediaId);
console.log(`Market closed: ${txId}`);
```

**Parameters:**

| Param | Type | Constraints | Notes |
|-------|------|-------------|-------|
| mediaId | bigint | Market must exist | From createMarket |

**Constraints:**
- ✓ Current time ≥ bettingClosesAt (day 14+)
- ✓ Can be called by anyone (permissionless)
- ✓ Idempotent (safe to call multiple times)

#### Submit Score (Oracle Only)

**Purpose:** Oracles submit the outcome score. During 1-hour submission window.

```typescript
import {
	submitScore,
	submitScoreAndSend,
	SubmitScoreParams,
	validateBucket,
} from "./app/contract";

validateBucket(78);

const params: SubmitScoreParams = {
	mediaId: BigInt(998877),
	score: 78, // Final outcome: 78
};

// MUST sign with oracle keypair from oracle_set
const txId = await submitScoreAndSend(
	sdk.program,
	oracle1Keypair, // From .env ORACLE_1_SECRET_KEY
	params
);

console.log(`Score submitted: ${txId}`);
```

**Parameters:**

| Param | Type | Constraints | Notes |
|-------|------|-------------|-------|
| mediaId | bigint | Market must exist | From createMarket |
| score | number | 0-100 | Integer, same as bucket range |

**Important:**
- Must sign with oracle keypair from market's oracle_set
- Each oracle can submit once (duplicate overwrites)
- Window: day 21 to day 21 + 1 hour
- All 3 oracles can submit, but only 2+ needed for consensus

**Constraints:**
- ✓ Must be called by oracle in oracle_set
- ✓ Window: day 21 to day 21 + 1 hour only
- ✓ One submission per oracle (overwrites previous)
- ✓ score must be 0-100

#### Resolve Market

**Purpose:** Finalizes market with oracle consensus. After oracle window.

```typescript
import {
	resolveMarket,
	resolveMarketAndSend,
} from "./app/contract";

const txId = await resolveMarketAndSend(
	sdk.program,
	resolver, // Anyone can resolve
	mediaId
);

console.log(`Market resolved: ${txId}`);
```

**Parameters:**

| Param | Type | Constraints | Notes |
|-------|------|-------------|-------|
| mediaId | bigint | Market must exist | From createMarket |

**What Happens on Resolve:**
1. Checks oracle report is finalized (2+ submissions)
2. Determines final score (most common among submissions)
3. Calculates rewards for each winning bucket
4. Applies time multiplier (day-based decay)
5. Applies closeness bonus (proximity to outcome)
6. Deducts protocol fee (3%) and creator fee (if set)
7. Stores reward amounts in UserPosition accounts

**Constraints:**
- ✓ Oracle report must be finalized (2+ oracle submissions)
- ✓ Must be after oracle submission window
- ✓ Calculates rewards considering:
  - Bucket proximity (within radius)
  - Time multiplier (early betting bonus)
  - Bet amount proportion
  - Fee deductions

#### Claim Reward

**Purpose:** Winners claim their prize. Within 14-day claim window.

```typescript
import {
	claimReward,
	claimRewardAndSend,
} from "./app/contract";

const txId = await claimRewardAndSend(
	sdk.program,
	winner, // User claiming
	mediaId,
	winningBucket // Bucket they bet on
);

console.log(`Reward claimed: ${txId}`);
```

**Parameters:**

| Param | Type | Constraints | Notes |
|-------|------|-------------|-------|
| mediaId | bigint | Market must exist | From createMarket |
| bucket | number | 0-100, user must have bet | Bucket user predicted |

**Constraints:**
- ✓ Market must be resolved
- ✓ User must have position in bucket
- ✓ Outcome ∈ [bucket - radius, bucket + radius]
- ✓ Only before claim deadline (day 35)
- ✓ Can only claim each position once

#### Reclaim Pool

**Purpose:** Treasury reclaims unclaimed funds. After 14-day claim deadline.

```typescript
import {
	reclaimPool,
	reclaimPoolAndSend,
} from "./app/contract";

const txId = await reclaimPoolAndSend(
	sdk.program,
	reclaimer, // Anyone can trigger
	mediaId
);

console.log(`Unclaimed funds reclaimed to treasury: ${txId}`);
```

**Parameters:**

| Param | Type | Constraints | Notes |
|-------|------|-------------|-------|
| mediaId | bigint | Market must exist | From createMarket |

**Constraints:**
- ✓ Current time > claimDeadline (day 35+)
- ✓ Only unclaimed funds transferred
- ✓ Already claimed funds unaffected
- ✓ Protocol and creator fees already deducted

### Account Fetching (Complete Guide)

```typescript
import {
	fetchMarket,
	fetchMarkets,
	fetchOracleReport,
	fetchUserPosition,
	fetchUserPositionsForMarket,
	accountExists,
} from "./app/contract";

// Single market fetch
const market = await fetchMarket(sdk.program, mediaId);
if (market) {
	console.log(`Market: ${market.publicKey.toBase58()}`);
	console.log(`Betting closes: ${market.bettingClosesAt}`);
}

// Batch market fetch (efficient for multiple markets)
const markets = await fetchMarkets(sdk.program, [id1, id2, id3]);
const activeMarkets = markets.filter((m) => m !== null);

// Oracle report for a market
const report = await fetchOracleReport(sdk.program, marketKey);
if (report) {
	console.log(`Oracle submissions: ${report.submissions.length}`);
}

// Single user position
const position = await fetchUserPosition(
	sdk.program,
	user,
	marketKey,
	bucket
);
if (position) {
	console.log(`Bet amount: ${position.amount}`);
}

// All user positions in a market (iterates buckets 0-100)
const allPositions = await fetchUserPositionsForMarket(
	sdk.program,
	user,
	marketKey
);
console.log(`Total positions: ${allPositions.length}`);

// Check if account exists
const exists = await accountExists(connection, publicKey);
console.log(`Account exists: ${exists}`);
```

### Utilities (Comprehensive Reference)

#### Validation Functions

```typescript
import {
	validateBucket,
	validateAmount,
	validateOracleThreshold,
} from "./app/contract";

// Bucket must be 0-100
try {
	validateBucket(75); // ✓ OK
	validateBucket(101); // ✗ Throws error
} catch (error) {
	console.error(error.message);
}

// Amount must be > 0
try {
	validateAmount(1_000_000n); // ✓ OK
	validateAmount(0n); // ✗ Throws error
} catch (error) {
	console.error(error.message);
}

// Oracle threshold must be 1-3
try {
	validateOracleThreshold(2); // ✓ OK
	validateOracleThreshold(4); // ✗ Throws error
} catch (error) {
	console.error(error.message);
}
```

#### State Checking Functions

```typescript
import {
	isBettingOpen,
	canCloseMarket,
	canSubmitScore,
	canResolveMarket,
	canClaimReward,
	canReclaimPool,
	getMarketState,
} from "./app/contract";

const market = await fetchMarket(sdk.program, mediaId);
const now = Math.floor(Date.now() / 1000);

// Check individual states
console.log(`Betting open: ${isBettingOpen(market, now)}`);
console.log(`Can close: ${canCloseMarket(market, now)}`);
console.log(`Can submit: ${canSubmitScore(market, now)}`);
console.log(`Can resolve: ${canResolveMarket(market)}`);
console.log(`Can claim: ${canClaimReward(market, now)}`);
console.log(`Can reclaim: ${canReclaimPool(market, now)}`);

// Or get all states at once
const state = getMarketState(market, now);
console.log(state);
// Output: {
//   canBet: true,
//   canClose: false,
//   canSubmitScore: false,
//   canResolve: false,
//   canClaim: false,
//   canReclaim: false
// }
```

#### Conversion Functions

```typescript
import {
	lamportsToSol,
	solToLamports,
	mediaIdToBytes,
	bucketToBytes,
	isWinningBucket,
	getCurrentTimestamp,
} from "./app/contract";

// SOL ↔ Lamports conversion
const sol = lamportsToSol(1_000_000_000n); // 1.0
const lamports = solToLamports(1.5); // 1,500,000,000

// ID conversions for on-chain storage
const mediaBytes = mediaIdToBytes(12345n); // Buffer(8)
const bucketBytes = bucketToBytes(75); // Buffer(1)

// Check if bucket wins (with radius)
const isWinner = isWinningBucket(75, 80, 5); // true (within ±5)
const isLoser = isWinningBucket(75, 100, 5); // false (too far)

// Current time
const timestamp = getCurrentTimestamp(); // seconds since epoch
```

#### Time Management

```typescript
import {
	TIME_MULTIPLIERS,
	getTimeMultiplier,
	calculateDaysRemaining,
} from "./app/contract";

// View all multipliers (14 days)
console.log(TIME_MULTIPLIERS); // [1000, 904, 818, ..., 272]

// Get multiplier for specific day
console.log(`Day 1 multiplier: ${getTimeMultiplier(1) / 1000}`); // 1.0
console.log(`Day 7 multiplier: ${getTimeMultiplier(7) / 1000}`); // 0.536
console.log(`Day 14 multiplier: ${getTimeMultiplier(14) / 1000}`); // 0.272

// Calculate remaining days in betting window
const daysLeft = calculateDaysRemaining(
	market.bettingStartsAt,
	market.bettingClosesAt,
	now
);
console.log(`Days left to bet: ${daysLeft}`);
```

### Constants Reference

```typescript
import {
	TIME_MULTIPLIERS,
	MULTIPLIER_SCALE,
	BETTING_DURATION_DAYS,
	SETTLEMENT_DAY,
	CLAIM_WINDOW_DAYS,
	DEFAULT_RADIUS,
	DEFAULT_PROTOCOL_FEE_BPS,
	MAX_BUCKET,
	MIN_BUCKET,
	MARKET_SEED,
	VAULT_SEED,
	TREASURY_SEED,
	ORACLE_REPORT_SEED,
	POSITION_SEED,
} from "./app/contract";

// Time-related (in days)
console.log(`Betting window: ${BETTING_DURATION_DAYS} days`); // 14
console.log(`Settlement delay: ${SETTLEMENT_DAY} days`); // 21
console.log(`Claim window: ${CLAIM_WINDOW_DAYS} days`); // 14

// Fee and market parameters
console.log(`Default radius: ±${DEFAULT_RADIUS}`); // 5
console.log(`Protocol fee: ${DEFAULT_PROTOCOL_FEE_BPS / 100}%`); // 3%

// Bucket range
console.log(`Buckets: ${MIN_BUCKET}-${MAX_BUCKET}`); // 0-100

// PDA seeds (for advanced usage)
console.log(`Market seed: ${Buffer.from(MARKET_SEED).toString()}`);
```

### Error Handling (Complete Guide)

```typescript
import {
	parseCinefiError,
	CinefiErrorCode,
	CinefiError,
	ERROR_MESSAGES,
} from "./app/contract";

try {
	await placeBetAndSend(sdk.program, user, {
		mediaId: 123n,
		bucket: 75,
		amount: 1_000_000_000n,
	});
} catch (error) {
	// Parse to CinefiError
	const cinefiError = parseCinefiError(error);

	if (!cinefiError) {
		// Unknown error (not from program)
		console.error("Unknown error:", error);
		return;
	}

	// Access error details
	console.error(`Error code: ${cinefiError.code}`);
	console.error(`Error message: ${cinefiError.message}`);

	// Handle specific errors
	switch (cinefiError.code) {
		case CinefiErrorCode.BettingClosed:
			console.error("Betting window has closed");
			break;

		case CinefiErrorCode.InvalidBucket:
			console.error("Bucket must be 0-100");
			break;

		case CinefiErrorCode.InvalidAmount:
			console.error("Amount must be > 0");
			break;

		case CinefiErrorCode.UnauthorizedOracle:
			console.error("Only designated oracles can submit");
			break;

		case CinefiErrorCode.ClaimDeadlinePassed:
			console.error("Claim window has closed");
			break;

		default:
			console.error(`Error: ${ERROR_MESSAGES[cinefiError.code]}`);
	}
}
```

#### All 27 Error Codes with Meanings

```typescript
enum CinefiErrorCode {
	// Market State Errors (6000-6004)
	MarketAlreadyClosed = 6000,      // Market is already closed
	MarketNotClosed = 6001,          // Market is not yet closed
	MarketNotResolved = 6002,        // Market is not yet resolved
	MarketAlreadyResolved = 6003,    // Market is already resolved
	BettingNotStarted = 6004,        // Betting window not started

	// Betting Phase Errors (6005-6007)
	BettingClosed = 6005,            // Betting window is closed
	BettingStillOpen = 6006,         // Betting is still open
	SettlementNotReady = 6007,       // Settlement period not reached

	// Settlement Timing Errors (6008-6009)
	SettlementTimeInvalid = 6008,    // Invalid settlement time
	ClaimDeadlinePassed = 6009,      // Claim period has ended

	// Oracle Window Errors (6010-6018)
	OracleWindowClosed = 6010,       // Oracle submission window closed
	ClaimDeadlineNotPassed = 6011,   // Claim deadline not yet passed
	UnauthorizedOracle = 6012,       // Not a designated oracle
	OracleAlreadyFinalized = 6013,   // Oracle report finalized
	OracleNotFinalized = 6014,       // Oracle report not finalized
	OracleAlreadySubmitted = 6015,   // Oracle already submitted score
	OracleDisputed = 6016,           // Oracle submission disputed

	// Input Validation Errors (6019-6024)
	InvalidBucket = 6019,            // Bucket not in range 0-100
	InvalidAmount = 6020,            // Amount must be > 0
	AlreadyClaimed = 6021,           // Reward already claimed
	NotAWinner = 6022,               // User is not within winning range
	InsufficientClaimAmount = 6023,  // Insufficient claimable amount
	Unauthorized = 6024,             // Unauthorized action

	// Math Errors (6025-6026)
	MathOverflow = 6025,             // Math overflow occurred
	MathUnderflow = 6026,            // Math underflow occurred
}

// Lookup error messages
import { ERROR_MESSAGES } from "./app/contract";
const message = ERROR_MESSAGES[CinefiErrorCode.BettingClosed];
// "Betting window is closed"
```

## Complete Workflows

### Full Market Lifecycle (Real Example)

```typescript
import dotenv from "dotenv";
import {
	Connection,
	Keypair,
	PublicKey,
	clusterApiUrl,
} from "@solana/web3.js";
import { Wallet } from "@coral-xyz/anchor";
import CinefiSDK, {
	createMarketAndSend,
	placeBetAndSend,
	closeMarketAndSend,
	submitScoreAndSend,
	resolveMarketAndSend,
	claimRewardAndSend,
	fetchMarket,
	getMarketState,
	getCurrentTimestamp,
} from "./app/contract";

dotenv.config();

async function completeMarketLifecycle() {
	// 1. SETUP
	console.log("=== SETUP ===");
	const connection = new Connection(clusterApiUrl("devnet"));
	const creatorKp = Keypair.fromSecretKey(
		Buffer.from(process.env.WALLET_SECRET_KEY!, "base64")
	);
	const bettor1Kp = Keypair.fromSecretKey(
		Buffer.from(process.env.BETTOR1_SECRET_KEY!, "base64")
	);
	const oracle1Kp = Keypair.fromSecretKey(
		Buffer.from(process.env.ORACLE_1_SECRET_KEY!, "base64")
	);
	const oracle2Kp = Keypair.fromSecretKey(
		Buffer.from(process.env.ORACLE_2_SECRET_KEY!, "base64")
	);
	const oracle3Kp = Keypair.fromSecretKey(
		Buffer.from(process.env.ORACLE_3_SECRET_KEY!, "base64")
	);

	const wallet = new Wallet(creatorKp);
	const sdk = new CinefiSDK({ connection, wallet });

	console.log(`✓ Connected to Solana (Devnet)`);
	console.log(`✓ Creator: ${creatorKp.publicKey.toBase58()}`);

	// 2. CREATE MARKET
	console.log("\n=== CREATE MARKET ===");
	const mediaId = BigInt(Math.floor(Math.random() * 1_000_000));

	const createTx = await createMarketAndSend(sdk.program, creatorKp.publicKey, {
		mediaId,
		bettingStartsAfter: null,
		radius: 5,
		oracleSet: [
			oracle1Kp.publicKey,
			oracle2Kp.publicKey,
			oracle3Kp.publicKey,
		],
		oracleThreshold: 2,
	});

	console.log(`✓ Market created: ${createTx}`);
	console.log(`  Media ID: ${mediaId}`);
	await connection.confirmTransaction(createTx);

	// 3. PLACE BETS
	console.log("\n=== BETTING PHASE ===");

	const bet1Tx = await placeBetAndSend(sdk.program, bettor1Kp.publicKey, {
		mediaId,
		bucket: 70,
		amount: BigInt(1_000_000_000), // 1 SOL
	});
	console.log(`✓ User bet on bucket 70: ${bet1Tx}`);
	await connection.confirmTransaction(bet1Tx);

	// 4. CLOSE MARKET
	console.log("\n=== CLOSE MARKET ===");
	const closeTx = await closeMarketAndSend(
		sdk.program,
		creatorKp.publicKey,
		mediaId
	);
	console.log(`✓ Market closed: ${closeTx}`);
	await connection.confirmTransaction(closeTx);

	// 5. SUBMIT SCORES
	console.log("\n=== ORACLE SUBMISSION ===");

	const score1Tx = await submitScoreAndSend(sdk.program, oracle1Kp, {
		mediaId,
		score: 75,
	});
	console.log(`✓ Oracle 1 submitted: ${score1Tx}`);
	await connection.confirmTransaction(score1Tx);

	const score2Tx = await submitScoreAndSend(sdk.program, oracle2Kp, {
		mediaId,
		score: 75,
	});
	console.log(`✓ Oracle 2 submitted: ${score2Tx}`);
	await connection.confirmTransaction(score2Tx);

	// 6. RESOLVE MARKET
	console.log("\n=== RESOLVE MARKET ===");
	const resolveTx = await resolveMarketAndSend(
		sdk.program,
		creatorKp.publicKey,
		mediaId
	);
	console.log(`✓ Market resolved: ${resolveTx}`);
	await connection.confirmTransaction(resolveTx);

	// 7. CLAIM REWARDS
	console.log("\n=== CLAIM REWARDS ===");
	const claimTx = await claimRewardAndSend(
		sdk.program,
		bettor1Kp.publicKey,
		mediaId,
		70 // User bet on bucket 70
	);
	console.log(`✓ Reward claimed: ${claimTx}`);
	await connection.confirmTransaction(claimTx);

	console.log(`\n✓✓✓ COMPLETE LIFECYCLE FINISHED ✓✓✓`);
}

completeMarketLifecycle().catch(console.error);
```

## Error Handling

### Common Errors and Solutions

| Error Code | Error | Cause | Solution |
|-----------|-------|-------|----------|
| 6005 | BettingClosed | Betting window passed | Check with `isBettingOpen()` before betting |
| 6019 | InvalidBucket | Bucket not 0-100 | Use `validateBucket(bucket)` before submitting |
| 6020 | InvalidAmount | Amount ≤ 0 | Ensure amount > 0, use `validateAmount()` |
| 6012 | UnauthorizedOracle | Non-oracle submitting | Use oracle keypair from oracle_set |
| 6009 | ClaimDeadlinePassed | Past day 35 | Check `state.canClaim` before claiming |
| 6022 | NotAWinner | Outside winning range | Check `isWinningBucket()` before claiming |
| 6001 | MarketNotClosed | Trying to submit before close | Call closeMarket first |
| 6014 | OracleNotFinalized | Insufficient submissions | Wait for 2 oracles to submit |

### Error Recovery Pattern

```typescript
async function safePlaceBet(
	sdk: CinefiSDK,
	user: PublicKey,
	mediaId: bigint,
	bucket: number,
	amount: bigint
): Promise<string | null> {
	// 1. Validate inputs locally
	try {
		validateBucket(bucket);
		validateAmount(amount);
	} catch (error) {
		console.error(`Validation failed: ${(error as Error).message}`);
		return null;
	}

	// 2. Check market state
	const market = await fetchMarket(sdk.program, mediaId);
	if (!market) {
		console.error("Market not found");
		return null;
	}

	const now = getCurrentTimestamp();
	if (!isBettingOpen(market, now)) {
		console.error("Betting window closed");
		return null;
	}

	// 3. Attempt transaction with error handling
	try {
		const tx = await placeBetAndSend(sdk.program, user, {
			mediaId,
			bucket,
			amount,
		});
		console.log(`✓ Bet placed: ${tx}`);
		return tx;
	} catch (error) {
		const cinefiError = parseCinefiError(error);
		if (cinefiError) {
			console.error(
				`Program error (${cinefiError.code}): ${cinefiError.message}`
			);
		} else {
			console.error(`Transaction failed: ${(error as Error).message}`);
		}
		return null;
	}
}
```

## Troubleshooting

### Connection Issues

```typescript
async function diagnoseConnection(rpcUrl: string) {
	try {
		const connection = new Connection(rpcUrl);
		const version = await connection.getVersion();
		console.log(`✓ RPC is reachable`);
		console.log(`  Solana version: ${version["solana-core"]}`);
		return true;
	} catch (error) {
		console.error(`✗ Cannot reach RPC: ${(error as Error).message}`);
		console.log(`  Tried: ${rpcUrl}`);
		console.log(`\n  Alternative RPCs:`);
		console.log(`    Devnet: https://api.devnet.solana.com`);
		console.log(`    Testnet: https://api.testnet.solana.com`);
		return false;
	}
}
```

### Wallet Issues

```typescript
async function validateWallet(connection: Connection, keypair: Keypair) {
	console.log(`Wallet: ${keypair.publicKey.toBase58()}`);

	const balance = await connection.getBalance(keypair.publicKey);
	console.log(`Balance: ${(balance / 1e9).toFixed(4)} SOL`);

	if (balance < 100_000) {
		console.warn("⚠️  Very low balance`);
		console.log(`  Airdrop on devnet: solana airdrop 10`);
		return false;
	}

	return true;
}
```

### Transaction Failures

```typescript
async function debugTransaction(error: unknown) {
	const cinefiError = parseCinefiError(error);

	if (cinefiError) {
		console.error(`Cinefi Error: ${cinefiError.message}`);
		console.log(`Error Code: ${cinefiError.code}`);

		// Suggest fixes
		if (cinefiError.code === CinefiErrorCode.BettingClosed) {
			console.log(`Solution: Betting window has closed`);
		} else if (cinefiError.code === CinefiErrorCode.InvalidBucket) {
			console.log(`Solution: Bucket must be 0-100`);
		}
	} else if (error instanceof Error) {
		console.error(`Transaction Error: ${error.message}`);

		if (error.message.includes("insufficient funds")) {
			console.log(`Solution: Top up wallet balance`);
		}
	}
}
```

## Structure

```
app/contract/
├── index.ts                    # Main SDK class & re-exports
├── pdas/index.ts              # 5 PDA derivation functions
├── constants/index.ts         # 14 exported constants
├── errors/index.ts            # 27 error codes + parsing
├── types/index.ts             # 8 TypeScript interfaces
├── utils/index.ts             # 20+ utility functions
├── accounts/index.ts          # 6 account fetching methods
└── instructions/               # 8 instruction modules
    ├── initialize-treasury.ts
    ├── create-market.ts
    ├── place-bet.ts
    ├── close-market.ts
    ├── submit-score.ts
    ├── resolve-market.ts
    ├── claim-reward.ts
    └── reclaim-pool.ts
```

## License

MIT
