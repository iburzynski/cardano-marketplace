import type { BigNum } from "@emurgo/cardano-serialization-lib-asmjs";

export type HexString = string;

export interface CIP30Provider {
  apiVersion: String;
  enable: () => Promise<CIP30Instance>;
  icon: string;
  isEnabled: () => Promise<Boolean>;
  name: string;
}

export interface CIP30Instance {
  submitTx: (tx: string) => Promise<any>;
  signTx: (tx: string, partial?: Boolean) => Promise<HexString>;
  getChangeAddress: () => Promise<HexString>;
  getNetworkId: () => Promise<number>;
  getRewardAddresses: () => Promise<HexString>;
  getUnusedAddresses: () => Promise<Array<HexString>>;
  getUsedAddresses: () => Promise<Array<HexString>>;
  getUtxos: () => Promise<Array<HexString>>;
  getCollateral: () => Promise<Array<HexString>>;
}

export interface WalletValue {
  lovelace: bigint;
  multiassets: object;
}

export interface Script {
  type: string;
  keyHash: string;
}

export type UTXO = BlockfrostUTXO | DatabaseUTXO;

export interface BlockfrostUTXO {
  amount: { quantity: string; unit: string }[];
  assetName: string;
  policy: string;
  data_hash: string;
  nft: string;
  id: string;
  tx_hash: string;
  tx_index: string;
}

export interface DatabaseUTXO {
  // utxo: string;
  datum: any;
  data_hash: string;
  metadata: {
    artist: string;
    copyright: string;
    description: string;
    image: string;
    name: string;
  };
  nft: string;
  tx_hash: string;
  tx_index: string;
}

export interface AssetDetail {
  asset: string;
  asset_name: string;
  onchain_metadata: {
    artist: string;
    copyright: string;
    description: any;
    image: string;
    name: string;
  };
}

export type Datum = string;
