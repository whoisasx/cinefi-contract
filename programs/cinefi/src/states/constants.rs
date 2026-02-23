
/*
  mux(day)= e^(1-(1+decay_rate));
  decay_rate:(day-1)*0.15, 0.1 is too small and 0.2 quite larger.
  max(2)= e^(1-(1+(2-1)*0.15)) = e^(1-1.30)= e^(-.30) = 0.741 ~ 741
*/
pub const TIME_MULTIPLIERS: [u64; 14]=[1000, 861, 741, 638, 549, 472, 407, 350, 301, 259, 223, 192, 165, 142,];
pub const MULTIPLIER_SCALE: u64=1000;
pub const CLOSENESS_SCALE: u64=1_000_000;

pub const SECONDS_PER_DAY: i64=86_400;
pub const BETTING_DURATION_DAYS: i64=14;
pub const SETTLEMENT_DAY: i64=21;
pub const CLAIM_WINDOW_DAYS: i64=14;

pub const DEFAULT_RADIUS: u8=5;
pub const DEFAULT_PROTOCOL_FEE_BPS: u16=300;
pub const DEFAULT_CREATOR_FEE_BPS: u16=0;
pub const MAX_ORACLE_SIGNER: usize=3;
pub const MAX_BUCKETS: usize=100;

pub const ORACLE_WINDOWS_START_SECONDS: i64=72_000;
pub const ORACLE_WINDOWS_CLOSE_SECONDS: i64=82_800;

pub const MARKET_SEED: &[u8]=b"market_seed";
pub const VAULT_SEED: &[u8]=b"vault_seed";
pub const TREASURY_SEED: &[u8]=b"treasury_seed";
pub const ORACLE_REPORT_SEED: &[u8]=b"oracle_report_seed";
pub const POSITION_SEED: &[u8]=b"position_seed";
