import { useState, useEffect } from "react";
import useSWR from "swr";
import Web3 from "web3";
import LendingAndBorrowing from "../../abis/LendingAndBorrowing.json";
import { todp } from "../../utils/todp";
import ERC20 from "../../abis/ADE.json";
import { handler as useSupplyAssets } from "/var/www/html/Defi-Lending-Borrowing/components/providers/web3/hooks/useYourSupplies.js";
import Skeleton from '@mui/material/Skeleton'; // Import Skeleton from Material-UI

// Initialize web3 and contract
const web3 = new Web3(Web3.givenProvider || "http://localhost:8545");
const contractAddress = "0x18A723BD11A8FB6b960F93a6009C7E915F518AC6";
const contract = new web3.eth.Contract(LendingAndBorrowing.abi, contractAddress);

export default function YourSupplies({ account }) {
  const { data: tokens = [], error, isValidating } = useSupplyAssets(web3, contract)();

  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    const fetchBalances = async () => {
      let total = 0;
      for (const token of tokens) {
        try {
          const tokenContract = new web3.eth.Contract(ERC20.abi, token.tokenAddress);
          const balanceWei = await tokenContract.methods.balanceOf(account).call();
          const balanceEth = web3.utils.fromWei(balanceWei, "ether");
          token.balance = balanceEth;
          total += parseFloat(balanceEth);
        } catch (error) {
          console.error(`Error fetching balance for token ${token.tokenAddress}:`, error);
        }
      }
      setTotalBalance(total);
    };

    if (web3 && account && tokens.length > 0) {
      fetchBalances();
    }
  }, [web3, account, tokens]);

  if (isValidating) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error loading tokens: {error.message}</div>;
  }

  return (
    <div>
      <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
        <div className="rounded-t mb-0 px-4 py-3 border-0">
          <div className="flex flex-wrap items-center">
            <div className="relative w-full px-4 max-w-full">
              <h3 className="font-bold text-lg">Your Supplies</h3>
              <div className="mt-4 flex">
                <div className="border rounded-md p-1 px-2">
                  <span className="text-gray-800 font-medium">Balance: $</span>
                  <span className="font-medium">
                    {todp(totalBalance, 2)}
                  </span>
                </div>
              </div>
            </div>
            <div className="relative w-full px-4 max-w-full flex-grow flex-1 text-right"></div>
          </div>
        </div>
        <div className="block w-full overflow-x-auto">
          <table className="items-center w-full bg-transparent border-collapse">
            <thead>
              <tr>
                <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Assets
                </th>
                <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Balance
                </th>
                <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  APY
                </th>
                <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                  Collateral
                </th>
                <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left"></th>
              </tr>
            </thead>
            <tbody>
              {!Array.isArray(tokens) || tokens.length === 0 ? (
                <Skeleton variant="rectangular" width="100%" height={118} />
              ) : (
                tokens.map((token) => (
                  <SupplyRow
                    key={token.tokenAddress}
                    token={token}
                    balance={token.balance}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
