import useSWR from "swr";
import { normalizeToken } from "../../../../utils/normalize";
import { useContext } from "react";
import { Web3Context } from "../index"; // Assuming web3Context is in the parent directory

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

export const useBorrowAssets = () => {
  const { web3, contract } = useContext(Web3Context);

  const { data, error, mutate, ...rest } = useSWR(
    () => (web3 ? "web3/borrow_assets" : null),
    async () => {
      if (!contract) {
        throw new Error("Contract not initialized yet.");
      }

      const borrowAssets = [];
      const tokens = await contract.methods.getTokensForBorrowingArray().call();
      for (let i = 0; i < tokens.length; i++) {
        const currentToken = tokens[i];
        const newToken = await normalizeToken(web3, contract, currentToken);
        borrowAssets.push(newToken);
      }

      return borrowAssets;
    },
    {
      revalidateOnFocus: false,
    }
  );
  if (error) {
    return {
      tokensForBorrow: undefined,
      isLoading: false,
      isError: true,
      error,
    };
  }
  return {
    tokensForBorrow: data,
    isLoading: !error && !data,
    isError: error,
    mutate,
    ...rest,
  };
};

/**

web3.eth.net.getId() will return the network id on ganache itself
web3.eth.getChainId() will return the chainId of ganache in metamask.

chainChanged event listens with web3.eth.getChainId()


 */
