// index.js
import { useHooks, useWeb3 } from "../../providers/web3";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const { setWeb3Provider, getWeb3 } = require('/var/www/html/Defi-Lending-Borrowing/node_modules/@openzeppelin/test-helpers/src/config/web3.js');

// Initialize the Web3 provider
setWeb3Provider.default();

// Get the Web3 instance
const web3 = getWeb3();

// Now you can use `web3` to interact with the Sepolia network

const _isEmpty = (data) => { 
  return (
    data == null ||
    data === "" ||
    (Array.isArray(data) && data.length === 0) ||
    (data.constructor === Object && Object.keys(data).length === 0)
  );
};

const enhanceHook = (swrRes) => {
  const { data, error } = swrRes;
  const hasInitialResponse = data || error;
  return {
    ...swrRes,
    hasInitialResponse,
    isEmpty: hasInitialResponse && _isEmpty(data),
  };
};

export const useAccount = () => {
  const swrRes = enhanceHook(useHooks((hooks) => hooks.useAccount)());
  console.log("Data /web3/index.js:", swrRes.data);
  return {
    account: swrRes,
  };
};

export const useSupplyAssets = () => {
  const swrRes = enhanceHook(useHooks((hooks) => hooks.useSupplyAssets)());
  console.log("Data /web3/index.js:", swrRes.data);
  return {
    tokens: swrRes,
  };
};

export const useBorrowAssets = () => {
  const swrRes = enhanceHook(useHooks((hooks) => hooks.useBorrowAssets)());
  return {
    tokensForBorrow: swrRes,
  };
};

export const useYourSupplies = () => {
  const swrRes = enhanceHook(useHooks((hooks) => hooks.useYourSupplies)());
  return {
    yourSupplies: swrRes,
  };
};

export const useYourBorrows = () => {
  const swrRes = enhanceHook(useHooks((hooks) => hooks.useYourBorrows)());
  return {
    yourBorrows: swrRes,
  };
};

export const useAdmin = ({ redirectTo }) => {
  const { account } = useAccount();
  const { requireInstall } = useWeb3();
  const router = useRouter();

  useEffect(() => {
    if (
      requireInstall ||
      (account.hasInitialResponse && !account.isAdmin) ||
      account.isEmpty
    ) {
      router.push(redirectTo);
    }
  }, [account, redirectTo, requireInstall, router]); // Đã thêm các dependencies còn thiếu

  return { account };
};

export const useNetwork = () => {
  const swrRes = enhanceHook(useHooks((hooks) => hooks.useNetwork)());
  return {
    network: swrRes,
  };
};

export const useWalletInfo = () => {
  const { network } = useNetwork();
  const { account } = useAccount();
  const hasConnectedWallet = !!(account.data && network.isSupported);
  const isConnecting =
    !account.hasInitialResponse && !network.hasInitialResponse;

  return {
    network,
    account,
    hasConnectedWallet,
    isConnecting,
  };
};
