// index.js
import { useHooks } from "../../providers/web3";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Web3Provider, useWeb3 } from "../../providers/web3"; // Import useWeb3

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
  const { web3 } = useWeb3(); // Get web3 from the context
  const swrRes = enhanceHook(useHooks((hooks) => hooks.useAccount)(web3)); // Pass web3 to useHooks
  console.log("Data /web3/index.js:", swrRes.data);
  return {
    account: swrRes,
  };
};

// ... (other hooks remain the same)

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

// Wrap the exported components with the Web3Provider
export const App = ({ Component, pageProps }) => {
  return (
    <Web3Provider web3={web3}> {/* Pass web3 to Web3Provider */}
      <Component {...pageProps} />
    </Web3Provider>
  );
};

/*

getHooks() method returns a dictionary containing name of the hook (key) and the handler to the hook (value)
That dictionary will be accessible anywhere useHooks() method is called because the dictionary is passed as an argument to the callback.

*/
