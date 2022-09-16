// import type { UTXO } from "@/types";

import type { BfUTXO, DbUTXO } from "@/types";
import { getDatum, getNftMetadata } from "./blockfrost";
import { decodeAssetName } from "./wallet";

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      let request: IDBOpenDBRequest = window.indexedDB.open("marketDB", 2);

      request.onerror = (e) => {
        console.log("Error opening db", e);
        reject("Error");
      };

      request.onsuccess = (e: any) => {
        console.log("Success opening db", e);
        resolve(e.target.result);
      };

      request.onupgradeneeded = (event: any) => {
        console.log("Upgrading db", event);
        var db: IDBDatabase = event.target.result;

        // Create an objectStore to hold information about our customers. We're
        // going to use "ssn" as our key path because it's guaranteed to be
        // unique - or at least that's what I was told during the kickoff meeting.
        var objectStore = db.createObjectStore("utxoContent", {
          keyPath: "tx_hash",
        });

        // Create an index to search customers by name. We may have duplicates
        // so we can't use a unique index.
        objectStore.createIndex("tx_hash", "tx_hash", { unique: true });

        // Use transaction oncomplete to make sure the objectStore creation is
        // finished before adding data into it.
        objectStore.transaction.oncomplete = () => {
          Promise.resolve(db);
        };
      };
    } catch (e) {
      reject(e.message);
    }
  });
}

export async function convertUtxos(utxos: BfUTXO[]) {
  const db: IDBDatabase = await openDB();
  const dbUs = await Promise.allSettled(
    utxos.reduce((us: Promise<DbUTXO>[], u: BfUTXO): Promise<DbUTXO>[] => {
      const amount_ = u.amount.filter((x) => x.unit != "lovelace");
      if (amount_.length == 1 && Number(amount_[0].quantity) == 1) {
        const nft: string = amount_[0].unit;
        // const policy = nft.substring(0, 56)
        const asset = nft.substring(56);
        const assetUtf8 = decodeAssetName(asset);
        // utxo.policy = policy
        u.assetName = assetUtf8;
        u.nft = nft;
        u.id = u.tx_hash + "#" + u.tx_index;
        return [...us, convertUTXO(db)(u)];
      }
      return us;
    }, [])
  );
  // https://stackoverflow.com/questions/64928212/how-to-use-promise-allsettled-with-typescript
  // const dbUtxos: PromiseSettledResult<DatabaseUTXO>[] = await Promise.allSettled(utxos)
  const isRejected = (
    input: PromiseSettledResult<unknown>
  ): input is PromiseRejectedResult => input.status === "rejected";
  const isFulfilled = (
    input: PromiseSettledResult<any>
  ): input is PromiseFulfilledResult<any> => input.status === "fulfilled";
  const dbUsResponse: DbUTXO[] = dbUs.filter(isFulfilled).map((p) => p.value);
  dbUs.forEach((res) => {
    if (isRejected(res)) console.log("rejected", res.reason);
  });
  return dbUsResponse
}

function convertUTXO(db: IDBDatabase): (utxo: BfUTXO) => Promise<DbUTXO> {
  const readHandle: IDBObjectStore = db && getReadHandle(db);
  return async (utxo: BfUTXO) => {
    try {
      return await getUtxo(readHandle, utxo.tx_hash);
    } catch (e) {
      console.log("Error returned from db", e);
      try {
        const dbUtxo: DbUTXO = await makeDatabaseUtxo(utxo);
        setTimeout(() => {
          saveUtxo(db, dbUtxo);
        });
        return dbUtxo;
      } catch (e_1) {
        if (e_1.status_code && e_1.status_code == 404) {
          // const data_1 = {
          //   utxo: utxo.id,
          //   status_code: e_1.status_code
          // };
          // database.saveUtxos(db, [data_1]);
          // return data_1;
        } else {
          console.error(e_1);
          throw e_1;
        }
      }
    }
  };
}

export async function makeDatabaseUtxo(u: BfUTXO): Promise<DbUTXO> {
  const datum = await getDatum(u.data_hash);
  const metadata = await getNftMetadata(u.nft);
  return {
    datum,
    metadata,
    nft: u.nft,
    tx_hash: u.tx_hash,
    tx_index: u.tx_index,
  };
}

export function saveUtxo(
  db: IDBDatabase | undefined | null,
  utxo: DbUTXO
): Promise<any> {
  if (!db) {
    return Promise.reject("Null db instance");
  }
  return new Promise((resolve, reject): void => {
    console.log("Starting to save");
    const trans: IDBTransaction = db.transaction("utxoContent", "readwrite");
    trans.oncomplete = () => {
      resolve(utxo);
    };
    trans.onerror = (e) => {
      console.log("Saving error", e);
      reject("Error");
    };

    const store = trans.objectStore("utxoContent");
    console.log("putting", utxo);
    store.put(utxo);
    trans.commit();
  });
}
export function getReadHandle(db: IDBDatabase): IDBObjectStore {
  const trans = db.transaction("utxoContent");
  return trans.objectStore("utxoContent");
}
export function getUtxo(handle: IDBObjectStore, id: string): Promise<DbUTXO> {
  if (!handle) {
    return Promise.reject("Null Object store handle");
  }
  return new Promise((resolve, reject) => {
    const request = handle.get(id);
    request.onerror = (event) => {
      reject(event);
    };
    request.onsuccess = () => {
      // Do something with the request.result!
      console.log("returning from db", request.result);
      if (request.result) resolve(request.result);
      else reject("Not found");
    };
  });
}
