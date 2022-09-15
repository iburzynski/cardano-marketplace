import { blockfrost, market } from "@/config";
import type { AssetDetail, Datum } from "@/types";

export async function listMarketUtxos() {
  return await getBlockfrost(
    "/addresses/" + market.address + "/utxos?order=desc"
  );
}

export async function getAssetDetail(asset: string): Promise<AssetDetail> {
  const result = await getBlockfrost("/assets/" + asset);
  // const props = ["onchain_metadata"]
  // return props.reduce((res, p) => {
  //   return {...res, p: result[p]}
  // }, {})
  return result
}

export async function getDatum(hash: string): Promise<Datum> {
  const response = await getBlockfrost("/scripts/datum/" + hash)
  return response.json_value;
}

async function getBlockfrost(path: string): Promise<any> {
  const url = blockfrost.apiUrl + path;
  const res = await fetch(url, {
    headers: { project_id: blockfrost.apiKey },
  });
  if (res.status === 200) {
    return await res.json();
  } else {
    const txt = await res.text();
    let err;
    try {
      const json = JSON.parse(txt);
      err = Error(
        `BlockfrostAPI [Status ${res.status}]: ${
          json.message ? json.message : txt
        }`
      );
      err.json = json;
    } catch (e) {
      err = Error(`BlockfrostApi [Status ${res.status}]: ${txt}`);
      err.text = txt;
    }
    err.response = res;
    err.url = url;
    err.status_code = res.status;
    throw err;
  }
}
    // return res.text().then((txt) => {
    //   let err;
    //   let json: any;
    //   try {
    //     json = JSON.parse(txt);
    //     if (json) {
    //       err = Error(
    //         `BlockfrostApi [Status ${res.status}]: ${
    //           json.message ? json.message : txt
    //         }`
    //       );
    //       err.json = json;
    //     } else {
    //       err = Error(`BlockfrostApi [Status ${res.status}]: ${txt}`);
    //       err.text = txt;
    //     }
    //   } catch (e) {
    //     err = Error(`BlockfrostApi [Status ${res.status}]: ${txt}`);
    //     err.text = txt;
    //   }
    //   err.response = res;
    //   err.url = url;
    //   err.status_code = res.status;
    //   throw err;
    // });
    // }

