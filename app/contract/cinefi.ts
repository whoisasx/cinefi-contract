/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/cinefi.json`.
 */
export type Cinefi = {
	address: "GomtSs5546sx4NQFsGaJtwFrDytfqRQPBADkiUr7PcyW";
	metadata: {
		name: "cinefi";
		version: "0.1.0";
		spec: "0.1.0";
		description: "Created with Anchor";
	};
	instructions: [
		{
			name: "claimReward";
			discriminator: [149, 95, 181, 242, 94, 90, 158, 162];
			accounts: [
				{
					name: "user";
					writable: true;
					signer: true;
				},
				{
					name: "market";
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									109,
									97,
									114,
									107,
									101,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market.media_id";
								account: "market";
							},
						];
					};
				},
				{
					name: "userPosition";
					writable: true;
				},
				{
					name: "vault";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									118,
									97,
									117,
									108,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market";
							},
						];
					};
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
			];
			args: [];
		},
		{
			name: "closeMarket";
			discriminator: [88, 154, 248, 186, 48, 14, 123, 244];
			accounts: [
				{
					name: "caller";
					writable: true;
					signer: true;
				},
				{
					name: "market";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									109,
									97,
									114,
									107,
									101,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market.media_id";
								account: "market";
							},
						];
					};
				},
			];
			args: [];
		},
		{
			name: "createMarket";
			discriminator: [103, 226, 97, 235, 200, 188, 251, 254];
			accounts: [
				{
					name: "creator";
					writable: true;
					signer: true;
				},
				{
					name: "market";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									109,
									97,
									114,
									107,
									101,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "arg";
								path: "mediaId";
							},
						];
					};
				},
				{
					name: "vault";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									118,
									97,
									117,
									108,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market";
							},
						];
					};
				},
				{
					name: "oracleReport";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									111,
									114,
									97,
									99,
									108,
									101,
									95,
									114,
									101,
									112,
									111,
									114,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market";
							},
						];
					};
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
			];
			args: [
				{
					name: "bettingStartsAfter";
					type: {
						option: "i64";
					};
				},
				{
					name: "mediaId";
					type: "u64";
				},
				{
					name: "radius";
					type: "u8";
				},
				{
					name: "oracleSet";
					type: {
						array: ["pubkey", 3];
					};
				},
				{
					name: "oracleThreshold";
					type: "u8";
				},
			];
		},
		{
			name: "initializeTreasury";
			discriminator: [124, 186, 211, 195, 85, 165, 129, 166];
			accounts: [
				{
					name: "authority";
					writable: true;
					signer: true;
				},
				{
					name: "treasury";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									116,
									114,
									101,
									97,
									115,
									117,
									114,
									121,
									95,
									115,
									101,
									101,
									100,
								];
							},
						];
					};
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
			];
			args: [];
		},
		{
			name: "placeBet";
			discriminator: [222, 62, 67, 220, 63, 166, 126, 33];
			accounts: [
				{
					name: "user";
					writable: true;
					signer: true;
				},
				{
					name: "market";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									109,
									97,
									114,
									107,
									101,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market.media_id";
								account: "market";
							},
						];
					};
				},
				{
					name: "userPosition";
					writable: true;
				},
				{
					name: "vault";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									118,
									97,
									117,
									108,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market";
							},
						];
					};
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
			];
			args: [
				{
					name: "bucket";
					type: "u8";
				},
				{
					name: "amount";
					type: "u64";
				},
			];
		},
		{
			name: "reclaimPool";
			discriminator: [245, 166, 14, 51, 160, 71, 224, 56];
			accounts: [
				{
					name: "caller";
					writable: true;
					signer: true;
				},
				{
					name: "market";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									109,
									97,
									114,
									107,
									101,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market.media_id";
								account: "market";
							},
						];
					};
				},
				{
					name: "vault";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									118,
									97,
									117,
									108,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market";
							},
						];
					};
				},
				{
					name: "treasury";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									116,
									114,
									101,
									97,
									115,
									117,
									114,
									121,
									95,
									115,
									101,
									101,
									100,
								];
							},
						];
					};
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
			];
			args: [];
		},
		{
			name: "resolveMarket";
			discriminator: [155, 23, 80, 173, 46, 74, 23, 239];
			accounts: [
				{
					name: "caller";
					writable: true;
					signer: true;
				},
				{
					name: "market";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									109,
									97,
									114,
									107,
									101,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market.media_id";
								account: "market";
							},
						];
					};
				},
				{
					name: "oracleReport";
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									111,
									114,
									97,
									99,
									108,
									101,
									95,
									114,
									101,
									112,
									111,
									114,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market";
							},
						];
					};
				},
				{
					name: "vault";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									118,
									97,
									117,
									108,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market";
							},
						];
					};
				},
				{
					name: "treasury";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									116,
									114,
									101,
									97,
									115,
									117,
									114,
									121,
									95,
									115,
									101,
									101,
									100,
								];
							},
						];
					};
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
			];
			args: [];
		},
		{
			name: "submitScore";
			discriminator: [212, 128, 45, 22, 112, 82, 85, 235];
			accounts: [
				{
					name: "oracleSigner";
					writable: true;
					signer: true;
				},
				{
					name: "market";
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									109,
									97,
									114,
									107,
									101,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market.media_id";
								account: "market";
							},
						];
					};
				},
				{
					name: "oracleReport";
					writable: true;
					pda: {
						seeds: [
							{
								kind: "const";
								value: [
									111,
									114,
									97,
									99,
									108,
									101,
									95,
									114,
									101,
									112,
									111,
									114,
									116,
									95,
									115,
									101,
									101,
									100,
								];
							},
							{
								kind: "account";
								path: "market";
							},
						];
					};
				},
				{
					name: "systemProgram";
					address: "11111111111111111111111111111111";
				},
			];
			args: [
				{
					name: "score";
					type: "u8";
				},
			];
		},
	];
	accounts: [
		{
			name: "market";
			discriminator: [219, 190, 213, 55, 0, 227, 198, 154];
		},
		{
			name: "oracleReport";
			discriminator: [72, 98, 174, 167, 90, 119, 146, 220];
		},
		{
			name: "userPosition";
			discriminator: [251, 248, 209, 245, 83, 234, 17, 27];
		},
	];
	errors: [
		{
			code: 6000;
			name: "marketAlreadyClosed";
			msg: "market is already closed";
		},
		{
			code: 6001;
			name: "marketNotClosed";
			msg: "market is not closed yet";
		},
		{
			code: 6002;
			name: "marketAlreadyResolved";
			msg: "market is already resolved";
		},
		{
			code: 6003;
			name: "marketNotResolved";
			msg: "market is not resolved yet";
		},
		{
			code: 6004;
			name: "marketAlreadyClaimed";
			msg: "market has been already reclaimed";
		},
		{
			code: 6005;
			name: "bettingNotStarted";
			msg: "betting is not started yet";
		},
		{
			code: 6006;
			name: "bettingClosed";
			msg: "betting window is closed";
		},
		{
			code: 6007;
			name: "bettingStillOpen";
			msg: "betting window is still open";
		},
		{
			code: 6008;
			name: "settlementNotReady";
			msg: "settlement time not reached yet";
		},
		{
			code: 6009;
			name: "settlementTimeInvalid";
			msg: "settlement time is not valid";
		},
		{
			code: 6010;
			name: "claimDeadlinePassed";
			msg: "claim deadline is passed";
		},
		{
			code: 6011;
			name: "claimDeadlineNotPassed";
			msg: "claim deadline has not passed yet";
		},
		{
			code: 6012;
			name: "oracleWindowClosed";
			msg: "oracle submission window is not open";
		},
		{
			code: 6013;
			name: "unauthorizedOracle";
			msg: "signer is not in the oracle set";
		},
		{
			code: 6014;
			name: "invalidOracleThreshold";
			msg: "invalid oracle threshold";
		},
		{
			code: 6015;
			name: "oracleAlreadyFinalized";
			msg: "oracle report is finalized already";
		},
		{
			code: 6016;
			name: "oracleNotFinalized";
			msg: "oracle report is not finalized yet";
		},
		{
			code: 6017;
			name: "oracleAlreadySubmitted";
			msg: "oracle signer has already submitted";
		},
		{
			code: 6018;
			name: "oracleDisputed";
			msg: "oracle report is disputed - signers disagree";
		},
		{
			code: 6019;
			name: "invalidBucket";
			msg: "invalid bucket: must be from 1 to 100";
		},
		{
			code: 6020;
			name: "invalidAmount";
			msg: "bet amount must be greater than zero dollar";
		},
		{
			code: 6021;
			name: "alreadyClaimed";
			msg: "reward already claimed";
		},
		{
			code: 6022;
			name: "insufficientClaimAmount";
			msg: "insufficient reward amount";
		},
		{
			code: 6023;
			name: "notAWinner";
			msg: "user is not a winner - bucket outside winning radius";
		},
		{
			code: 6024;
			name: "unauthorized";
			msg: "you did not place this position";
		},
		{
			code: 6025;
			name: "mathOverflow";
			msg: "math overflow";
		},
		{
			code: 6026;
			name: "mathUnderflow";
			msg: "math underflow";
		},
	];
	types: [
		{
			name: "market";
			type: {
				kind: "struct";
				fields: [
					{
						name: "mediaId";
						type: "u64";
					},
					{
						name: "creator";
						type: "pubkey";
					},
					{
						name: "createdAt";
						type: "i64";
					},
					{
						name: "bettingStartsAt";
						type: "i64";
					},
					{
						name: "bettingClosesAt";
						type: "i64";
					},
					{
						name: "settleAt";
						type: "i64";
					},
					{
						name: "claimDeadline";
						type: "i64";
					},
					{
						name: "radius";
						type: "u8";
					},
					{
						name: "protocolFeeBps";
						type: "u16";
					},
					{
						name: "creatorFeeBps";
						type: "u16";
					},
					{
						name: "oracleSet";
						type: {
							array: ["pubkey", 3];
						};
					},
					{
						name: "oracleThreshold";
						type: "u8";
					},
					{
						name: "pool";
						type: {
							array: ["u64", 101];
						};
					},
					{
						name: "weightedPool";
						type: {
							array: ["u64", 101];
						};
					},
					{
						name: "totalPool";
						type: "u64";
					},
					{
						name: "totalPrizePool";
						type: "u64";
					},
					{
						name: "finalOutcome";
						type: "u8";
					},
					{
						name: "bucketPrize";
						type: {
							array: ["u64", 101];
						};
					},
					{
						name: "fallbackUsed";
						type: "bool";
					},
					{
						name: "resolved";
						type: "bool";
					},
					{
						name: "closed";
						type: "bool";
					},
					{
						name: "reclaimed";
						type: "bool";
					},
					{
						name: "bump";
						type: "u8";
					},
				];
			};
		},
		{
			name: "oracleReport";
			type: {
				kind: "struct";
				fields: [
					{
						name: "market";
						type: "pubkey";
					},
					{
						name: "submissions";
						type: {
							array: [
								{
									defined: {
										name: "oracleSubmission";
									};
								},
								3,
							];
						};
					},
					{
						name: "submissionCount";
						type: "u8";
					},
					{
						name: "agreedScore";
						type: "u8";
					},
					{
						name: "finalized";
						type: "bool";
					},
					{
						name: "disputed";
						type: "bool";
					},
					{
						name: "bump";
						type: "u8";
					},
				];
			};
		},
		{
			name: "oracleSubmission";
			type: {
				kind: "struct";
				fields: [
					{
						name: "signer";
						type: "pubkey";
					},
					{
						name: "score";
						type: "u8";
					},
				];
			};
		},
		{
			name: "userPosition";
			type: {
				kind: "struct";
				fields: [
					{
						name: "user";
						type: "pubkey";
					},
					{
						name: "market";
						type: "pubkey";
					},
					{
						name: "bucket";
						type: "u8";
					},
					{
						name: "amount";
						type: "u64";
					},
					{
						name: "weightedAmount";
						type: "u64";
					},
					{
						name: "claimed";
						type: "bool";
					},
					{
						name: "bump";
						type: "u8";
					},
				];
			};
		},
	];
};
