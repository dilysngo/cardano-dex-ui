import { RawAddLiquidityItem } from './AddLiquidityOperation';
import { RawLmDepositItem } from './LmDepositOperation';
import { RawLmRedeemItem } from './LmRedeemOperation';
import { RawLockItem } from './LockOperation';
import { RawRemoveLiquidityItem } from './RemoveLiquidityOperation';
import { RawSwapItem } from './SwapOperation';

export type RawOperationItem =
  | RawSwapItem
  | RawAddLiquidityItem
  | RawRemoveLiquidityItem
  | RawLmDepositItem
  | RawLmRedeemItem
  | RawLockItem;
