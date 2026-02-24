
/*
  mux(day)= e^(1-(1+decay_rate));
  decay_rate:(day-1)*0.10,keeping it more user friendly and lineint.(more aggressive would be 0.15)
  max(2)= e^(1-(1+(2-1)*0.10)) = e^(1-1.10)= e^(-.10) = 0.818 ~ 818
*/
// 0.8: [1000, 923, 852, 786, 726, 670, 618, 571, 527, 486, 449, 414, 382, 353]
// 0.10: [1000, 904, 818, 740, 670, 606, 548, 496, 449, 406, 367, 332, 301, 272]
// 0.12: [1000, 886, 786, 697, 618, 548, 486, 431, 382, 339, 301, 267, 236, 210]
// 0.15: [1000, 860, 740, 637, 548, 472, 406, 349, 301, 259, 223, 192, 165, 142]

pub const TIME_MULTIPLIERS: [u64; 14]=[1000, 904, 818, 740, 670, 606, 548, 496, 449, 406, 367, 332, 301, 272];
pub const MULTIPLIER_SCALE: u64=1000;
pub const CLOSENESS_SCALE: u64=1_000_000;
pub const MINIMUM_STAKE_AMOUNT: u64=0;

pub const SECONDS_PER_DAY: i64=86_400;
pub const SECONDS_PER_HOUT: i64=3_600;
pub const BETTING_DURATION_DAYS: i64=14;
pub const SETTLEMENT_DAY: i64=21;
pub const CLAIM_WINDOW_DAYS: i64=14;

pub const DEFAULT_RADIUS: u8=5;
pub const DEFAULT_PROTOCOL_FEE_BPS: u16=300;
pub const DEFAULT_CREATOR_FEE_BPS: u16=0;
pub const MAX_ORACLE_SIGNER: usize=3;
pub const MAX_BUCKETS: usize=100;

pub const ORACLE_WINDOWS_START_SECONDS: i64=0;
pub const ORACLE_WINDOWS_CLOSE_SECONDS: i64=3_600;

pub const MARKET_SEED: &[u8]=b"market_seed";
pub const VAULT_SEED: &[u8]=b"vault_seed";
pub const TREASURY_SEED: &[u8]=b"treasury_seed";
pub const ORACLE_REPORT_SEED: &[u8]=b"oracle_report_seed";
pub const POSITION_SEED: &[u8]=b"position_seed";
