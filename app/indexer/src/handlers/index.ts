import { Network } from "../config";
import { HeliusEnhancedTransaction } from "../types/helius";
import { EventPayload } from "../types/events";
import { handleCreateMarket } from "./create-market";
import { handlePlaceBet } from "./place-bet";
import { handleCloseMarket } from "./close-market";
import { handleSubmitScore } from "./submit-score";
import { handleResolveMarket } from "./resolve-market";
import { handleClaimReward } from "./claim-reward";
import { handleReclaimPool } from "./reclaim-pool";
import { handleInitializeTreasury } from "./initialize-treasury";

type HandlerFn = (
	tx: HeliusEnhancedTransaction,
	ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
) => Promise<EventPayload>;

const HANDLERS: Record<string, HandlerFn> = {
	create_market: handleCreateMarket,
	place_bet: handlePlaceBet,
	close_market: handleCloseMarket,
	submit_score: handleSubmitScore,
	resolve_market: handleResolveMarket,
	claim_reward: handleClaimReward,
	reclaim_pool: handleReclaimPool,
	initialize_treasury: handleInitializeTreasury,
};

export async function dispatch(
	instructionName: string,
	tx: HeliusEnhancedTransaction,
	ix: HeliusEnhancedTransaction["instructions"][number],
	network: Network,
): Promise<EventPayload | null> {
	const handler = HANDLERS[instructionName];
	if (!handler) return null;
	return handler(tx, ix, network);
}
