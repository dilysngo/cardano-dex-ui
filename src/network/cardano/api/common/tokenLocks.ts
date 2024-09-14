import { extractPaymentCred } from '@spectrumlabs/cardano-dex-sdk';
import { RustModule } from '@spectrumlabs/cardano-dex-sdk/build/main/utils/rustLoader';
import axios from 'axios';
import groupBy from 'lodash/groupBy';
import last from 'lodash/last';
import uniq from 'lodash/uniq';
import uniqBy from 'lodash/uniqBy';
import { catchError, combineLatest, map, of, switchMap } from 'rxjs';

import { appTick$ } from '../../../../common/streams/appTick.ts';
import { PoolId } from '../../../../common/types.ts';
import { cardanoNetworkData } from '../../utils/cardanoNetworkData.ts';
import { getAddresses } from '../addresses/addresses.ts';

export interface CardanoTokenLock {
  readonly entityId: string;
  readonly poolId: PoolId;
  readonly deadline: number;
  readonly amount: string;
  readonly redeemer: string;
}

const getLocksByPaymentCreds = (creds: string[]): Promise<CardanoTokenLock[]> =>
  axios
    .post(`${cardanoNetworkData.analyticUrl}history/locks`, creds)
    .then((res) => res.data)
    .catch(() => [] as CardanoTokenLock[]);

export const locks$ = appTick$.pipe(
  switchMap(() => getAddresses()),
  switchMap((addresses) => {
    if (addresses.length > 0) {
      const creds = uniq(
        addresses.map((addr) =>
          extractPaymentCred(addr, RustModule.CardanoWasm),
        ),
      );

      const credsBatches: string[][] = [[]];
      //
      for (const cred of creds) {
        const lastItem = last(credsBatches);
        if (!lastItem) {
          break;
        }
        if (lastItem.length >= 400) {
          credsBatches.push([cred]);
        } else {
          lastItem.push(cred);
        }
      }
      return combineLatest(
        credsBatches.map((batch) => getLocksByPaymentCreds(batch)),
      ).pipe(
        map((locksBatches) => {
          return groupBy(
            uniqBy(
              locksBatches.flatMap((lb) => lb),
              (item) => item.entityId,
            ),
            (item) => item.poolId,
          );
        }),
        catchError(() => of({})),
      );
    }

    return of({});
  }),
);
