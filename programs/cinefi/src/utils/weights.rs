use anchor_lang::prelude::*;
use crate::states::*;
use crate::errors::ErrorCode;

pub fn get_day_index(bet_timestamp:i64,betting_starts_at:i64)->usize{
  let seconds_elapsed=bet_timestamp.saturating_sub(betting_starts_at);
  let day= (seconds_elapsed/SECONDS_PER_DAY) as usize;
  day.min((BETTING_DURATION_DAYS as usize)-1)
}
pub fn get_time_multiplier(day_index: usize) -> u64 {
    TIME_MULTIPLIERS[day_index.min((BETTING_DURATION_DAYS as usize) - 1)]
}
pub fn calc_weigthed_amount(amount: u64, day_index: usize)->Result<u64>{
  let multiplier=get_time_multiplier(day_index);
  amount
  .checked_mul(multiplier)
  .ok_or(ErrorCode::MathOverflow.into())
  .map(|v| v/MULTIPLIER_SCALE)
}

pub fn closeness_weight(bucket: u8, final_outcome:u8)->u128{
  let distance=(bucket as i16 - final_outcome as i16).unsigned_abs() as u128;
  (CLOSENESS_SCALE as u128 )/ (distance+1)
}

pub fn compute_bucket_prizes(
  weighted_pool:&[u64; 101],
  final_outcome:u8, 
  radius: u8, 
  total_prize_pool: u64
)->([u64; 101],bool){
  let mut bucket_prizes=[0u64; 101];
  let f=final_outcome as i16;

  let has_radius_winners=(1..MAX_BUCKETS).any(|i| {
    let distance= (i as i16-f).unsigned_abs() as u8;
    distance <= radius && weighted_pool[i]>0
  });

  let fallback_used=!has_radius_winners;

  let fallback_min_distance= if fallback_used {
    (1..MAX_BUCKETS)
    .filter(|&i| weighted_pool[i]>0)
    .map(|i| (i as i16 - f).unsigned_abs() as u8)
    .min()
    .unwrap_or(u8::MAX)
  }else {
    0
  };

  let is_winnig_bucket=|i:usize| ->bool{
    if weighted_pool[i]==0 {
      return false;
    }

    let distance= (i as i16 - f) as u8;
    if fallback_used{
      distance == fallback_min_distance
    }
    else{
      distance<=radius
    }
  };

  //compute TBW: total bucket weight across all winners.
  let tbw:u128=(1..MAX_BUCKETS)
  .filter(|&i| is_winnig_bucket(i))
  .map(|i| {
    let cw=closeness_weight(i as u8, final_outcome);
    cw.saturating_mul(weighted_pool[i] as u128)
  })
  .sum();

  if tbw==0 {
    return (bucket_prizes,fallback_used);
  }

  for i in 1..MAX_BUCKETS{
    if is_winnig_bucket(i) {
      let cw=closeness_weight(i as u8, final_outcome);
      let bw=cw.saturating_mul(weighted_pool[i] as u128);

      let prize=bw.saturating_mul(total_prize_pool as u128)/tbw;
      bucket_prizes[i]=prize as u64;
    }
  }

  (bucket_prizes,fallback_used)
}

pub fn calc_user_payout(
  user_weighted_amount: u64,
  bucket: u8,
  bucket_prize: &[u64; 101],
  weighted_pool:&[u64; 101]
) -> Result<u64>{
  let idx=bucket as usize;
  let prize=bucket_prize[idx];
  let pool=weighted_pool[idx];

  require!(pool>0, ErrorCode::InsufficientClaimAmount);
  require!(prize>0, ErrorCode::NotAWinner);

  let payout=(user_weighted_amount as u128)
  .checked_mul(prize as u128)
  .ok_or(ErrorCode::MathOverflow)?
  .checked_div(pool as u128)
  .ok_or(ErrorCode::MathOverflow)?;

  Ok(payout as u64)
}
