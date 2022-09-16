import { blockfrost, market } from "@/config";
import type { Datum, NftMetadata } from "@/types";
import { transformNftImageUrl } from "./wallet";

export async function listMarketUtxos() {
  return await getBlockfrost(
    "/addresses/" + market.address + "/utxos?order=desc"
  );
}

function renderDescription(desc: Array<string> | string) {
  return Array.isArray(desc) ? desc.join('') : desc
}

export async function getNftMetadata(nft: string): Promise<NftMetadata> {
  const res = await getBlockfrost("/assets/" + nft);
  const md = res.onchain_metadata || {}
  // const props = ["onchain_metadata"]
  // return props.reduce((res, p) => {
  //   return {...res, p: result[p]}
  // }, {})
  return {
    artist: "artist" in md ? md.artist : "",
    copyright: "copyright" in md ? md.copyright : "",
    description: "description" in md ? renderDescription(md.description) : "",
    image: "image" in md ? transformNftImageUrl(md.image) : "",
    name: "name" in md ? md.name : "",
  };
}

export async function getDatum(hash: string): Promise<Datum> {
  const response = await getBlockfrost("/scripts/datum/" + hash);
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
