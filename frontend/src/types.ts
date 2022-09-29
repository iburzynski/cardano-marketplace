export type HexString = string;
export type PolicyId = string;
export type TokenName = string;

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
  multiassets: {
    [key: PolicyId]: {
      [key: TokenName]: bigint;
    };
  };
}

export interface Script {
  cborHex?: string;
  description?: string;
  keyHash?: string;
  type: string;
}

export interface BfUTXO {
  amount: { quantity: string; unit: string }[];
  assetName: string;
  data_hash: string;
  nft: string;
  id: string;
  tx_hash: string;
  tx_index: string;
}

export type Datum =
  | {
      constructor: number;
      fields: Datum[];
    }
  | { bytes: string }
  | { int: number };

export interface NftMetadata {
  artist: string;
  copyright: string;
  description: string;
  image: string;
  name: string;
}

export interface DbUTXO {
  datum: Datum;
  metadata: NftMetadata;
  nft: string;
  tx_hash: string;
  tx_index: string;
}

export type SettledDbUTXO = PromiseSettledResult<DbUTXO>;

export interface MultiAssetObj {
  tokenName: string;
  policy: string;
  asset: string;
  metadata: NftMetadata;
}

export interface ListingState {
  message: string;
  hasIndexDb: boolean;
  utxos: DbUTXO[];
  providers: CIP30Provider[];
  addSelections: boolean;
  interval: number;
  timeout: number;
}

// export interface WalletState {
  // prompt: string;
  // providers: null | CIP30Provider[];
  // curProvider: null | CIP30Provider;
  // walletPkh: null | string;
  // curInstance: null | CIP30Instance;
  // sellAmount: string;
  // showToast: boolean;
  // lastSalePrompt: number;
  // balance: {
    // lovelace: bigint;
    // multiAssets: MultiAssetObj[];
  // };
// }

// export interface WalletBalance {
//   lovelace: bigint;
//   multiAssets: MultiAssetObj[];
// }

export interface MintFormData {
  tokenName: string;
  artist: string;
  imageUrl: string;
}

// Kuber Requests
export type KuberRequest = KuberBuyRequest | KuberMintRequest | KuberSellRequest

export interface KuberBuyRequest {
  inputs: {
    address: string;
    datum: Datum;
    redeemer: {
      constructor: number;
      fields: [];
    };
    script: Script;
    utxo: {
      hash: string;
      index: string;
    };
  }[];
  outputs: {
    address: string;
    value: string;
  }[];
  selections: string[];
}

export interface KuberMintRequest {
  metadata: {
    721: {
      [key: PolicyId]: {
        [key: TokenName]: NftMetadata;
      };
    };
  };
  mint: {
    script: Script;
    amount: { [key: string]: number };
  }[];
  selections: string[];
}

export interface KuberSellRequest {
  outputs: {
    address: string;
    value: string;
    datum: Datum;
  }[];
  selections: string[];
}

export interface UserKeyhashes {
  pubKeyhash: string;
  stakeKeyhash: string;
}