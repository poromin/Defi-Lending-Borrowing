// setupHooks.js (Modified)

import { useAccount } from "./useAccount";
import { useNetwork } from "./useNetwork";
import { useSupplyAssets } from "./useSupplyAssets";
import { useBorrowAssets } from "./useBorrowAssets";
import { useYourSupplies } from "./useYourSupplies";
import { useYourBorrows } from "./useYourBorrows";

export const setupHooks = ({ web3, provider, contract }) => {
  // Call useAccount directly to get the account data
  const { account } = useAccount();

  return {
    useAccount: () => account, // Return a function that provides the account data
    useNetwork: createNetworkHook(web3),
    useSupplyAssets: createSupplyAssetsHook(web3, contract),
    useBorrowAssets: createBorrowAssetsHook(web3, contract),
    useYourSupplies: createYourSuppliesHook(web3, contract),
    useYourBorrows: createYourBorrowsHook(web3, contract),
  };
};