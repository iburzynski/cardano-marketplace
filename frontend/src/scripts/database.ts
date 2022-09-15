// import type { UTXO } from "@/types";

import type { DatabaseUTXO } from "@/types";

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
          keyPath: "utxo",
        });

        // Create an index to search customers by name. We may have duplicates
        // so we can't use a unique index.
        objectStore.createIndex("utxo", "utxo", { unique: true });

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
export function saveUtxos(
  db: IDBDatabase | undefined | null,
  objects: DatabaseUTXO[]
): Promise<any> {
  if (!db) {
    return Promise.reject("Null db instance");
  }
  return new Promise((resolve, reject): void => {
    console.log("Starting to save");
    const trans: IDBTransaction = db.transaction("utxoContent", "readwrite");
    trans.oncomplete = () => {
      resolve(objects);
    };
    trans.onerror = (e) => {
      console.log("Saving error", e);
      reject("Error");
    };

    const store = trans.objectStore("utxoContent");
    objects.forEach((utxo) => {
      console.log("putting", utxo);
      store.put(utxo);
    });
    trans.commit();
  });
}
export function getReadHandle(db: IDBDatabase): IDBObjectStore {
  const trans = db.transaction("utxoContent");
  return trans.objectStore("utxoContent");
}
export function getUtxo(handle: IDBObjectStore, id: string): Promise<DatabaseUTXO> {
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
