import { BorshInstructionCoder } from "@coral-xyz/anchor";
import IDL from "../../contract/cinefi.json";
import type { Cinefi } from "../../contract/cinefi";

const coder = new BorshInstructionCoder(IDL as Cinefi);

export interface DecodedInstruction {
	name: string;
	data: Record<string, any>;
}

export function decodeInstruction(
	base58Data: string,
): DecodedInstruction | null {
	try {
		const decoded = coder.decode(base58Data, "base58");
		if (!decoded) return null;
		return {
			name: decoded.name,
			data: decoded.data as Record<string, unknown>,
		};
	} catch {
		return null;
	}
}
