import useSWR from "swr";
import { useEffect, useContext } from "react";
import { Web3Context } from "../index";

const NETWORKS = {
  1: "Ethereum Main Network",
  3: "Ropsten Test Network",
  4: "Rinkeby Test Network",
  5: "Goerli Test Network",
  42: "Kovan Test Network",
  56: "Binance Smart Chain",
  1337: "Ganache",
  11155111: "Sepolia Test Network",
};

export const useNetwork = () => {
  const { web3 } = useContext(Web3Context);

  const { data, error, mutate, ...rest } = useSWR(
    () => (web3 ? "web3/network" : null),
    async () => {
      if (!web3) {
        throw new Error("Web3 not initialized yet.");
      }
      const chainId = await web3.eth.getChainId();

      if (!chainId) {
        throw new Error("Cannot retrieve network. Please reload your browser.");
      }
      return NETWORKS[chainId];
    },
    {
      revalidateOnFocus: false,
    }
  );

  const targetNetwork = NETWORKS[11155111]; // Sepolia

  return {
    network: data,
    mutate,
    target: targetNetwork,
    isSupported: data === targetNetwork,
    isLoading: !error && !data,
    isError: error,
    ...rest,
  };
};


/**

web3.eth.net.getId() will return the network id on ganache itself
web3.eth.getChainId() will return the chainId of ganache in metamask.

chainChanged event listens with web3.eth.getChainId()


 */
