use std::u8;
use anchor_lang::prelude::Pubkey;

use crate::states::*;

pub fn is_winner(
  bucket: u8, 
  final_outcome: u8,
  radius: u8,
  fallback_used: bool,
  pool: &[u64; 101]
)->bool{
  let distance=(bucket as i16 - final_outcome as i16).unsigned_abs() as u8;

  if !fallback_used{
    return radius <= distance;
  }

  //now the fallback is used;

  let mut min_distance=u8::MAX;
  for i in 1..MAX_BUCKETS{
    if pool[i]>0 {
      let d=(i as i16 - final_outcome as i16).unsigned_abs() as u8;
      if d<min_distance {
        min_distance=d;
      }
    }
  }

  distance==min_distance && pool[bucket as usize]>0
}


pub fn is_valid_oracle(market: &Market, orcale_signer: &Pubkey) -> bool{
  market.oracle_set.iter().any(|pk| pk==orcale_signer)
}
pub fn has_already_submitted(oracle_report: &OracleReport, orcale_signer: &Pubkey) -> bool{
  oracle_report.submissions
  .iter()
  .take(oracle_report.submission_count as usize)
  .any(|(pk,_)| pk==orcale_signer)
}
pub fn evaluate_report(oracle_report: &OracleReport, oracle_threshold: u8)->(bool,bool,u8){
  let count=oracle_report.submission_count as usize;

  if count<oracle_threshold as usize {
    return (false,false,0)
  }

  let first_score= oracle_report.submissions[0].1;
  let all_agree=oracle_report
  .submissions
  .iter()
  .take(count)
  .all(|(_, score)| *score==first_score);

  if all_agree {
    (true, false, first_score)
  }
  else {
    (false,true,0)
  }

}