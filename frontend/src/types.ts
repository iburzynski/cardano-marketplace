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

export interface WalletAction {
  enable: boolean;
  callback: (provider: CIP30Instance) => Promise<any>;
  message: string;
}

export interface Script {
  type: string;
  keyHash: string;
}

// export type UTXO = BfUTXO | DbUTXO;

export interface BfUTXO {
  amount: { quantity: string; unit: string }[];
  assetName: string;
  // policy: string;
  data_hash: string;
  nft: string;
  id: string;
  tx_hash: string;
  tx_index: string;
}

export type Datum =
  | { constructor: number; fields: Datum[] }
  | { constructor: number; fields: { int: number } }
  | { constructor: number; fields: { bytes: string } };

export interface DbUTXO {
  datum: Datum;
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

export type SettledDbUTXO = PromiseSettledResult<DbUTXO>;

export interface NftMetadata {
  artist: string;
  copyright: string;
  description: any;
  image: string;
  name: string;
}

export interface MultiAssetObj {
  tokenName: string;
  policy: string;
  asset: string;
  sellInput: boolean;
  name: string;
  image: string;
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

export interface WalletState {
  prompt: string;
  providers: CIP30Provider[];
  curProvider: CIP30Provider;
  walletPkh: string;
  // curInstance: CIP30Instance;
  sellAmount: string;
  showToast: boolean;
  lastSalePrompt: number;
  balance: {
    lovelace: bigint;
    multiAssets: MultiAssetObj[];
  };
}

export interface MintFormData {
  tokenName: string,
  artist: string,
  imageUrl: string
}