export type HeliusTransactionType =
	| "UNKNOWN"
	| "NFT_SALE"
	| "NFT_LISTING"
	| "NFT_BID"
	| "TRANSFER"
	| "SWAP"
	| "ANY";

export interface HeliusTokenTransfer {
	fromUserAccount: string;
	toUserAccount: string;
	mint: string;
	tokenAmount: number;
}

export interface HeliusNativeTransfer {
	fromUserAccount: string;
	toUserAccount: string;
	amount: number;
}

export interface HeliusAccountData {
	account: string;
	nativeBalanceChange: number;
	tokenBalanceChanges: unknown[];
}

export interface HeliusInstruction {
	accounts: string[];
	data: string;
	programId: string;
	innerInstructions: HeliusInnerInstruction[];
}

export interface HeliusInnerInstruction {
	accounts: string[];
	data: string;
	programId: string;
}

export interface HeliusEnhancedTransaction {
	description: string;
	type: HeliusTransactionType;
	source: string;
	fee: number;
	feePayer: string;
	signature: string;
	slot: number;
	timestamp: number;
	nativeTransfers: HeliusNativeTransfer[];
	tokenTransfers: HeliusTokenTransfer[];
	accountData: HeliusAccountData[];
	transactionError: string | null;
	instructions: HeliusInstruction[];
	events: Record<string, unknown>;
}

export type HeliusWebhookPayload = HeliusEnhancedTransaction[];
