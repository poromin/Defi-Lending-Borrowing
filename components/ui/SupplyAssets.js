import RowSupplyAsset from "./RowSupplyAsset";
import Skeleton from "./Skeleton";
import SupplyRow from "./SupplyRow";
import React from "react";

export default function SupplyAsset({ tokens, children }) {
  return (
    <div className="relative flex flex-col min-w-0 break-words bg-white w-full mb-6 shadow-lg rounded">
      <div className="rounded-t mb-0 px-4 py-3 border-0">
        <div className="flex flex-wrap items-center">
          <div className="relative w-full max-w-full">
            <h3 className="font-bold text-lg px-0 ">Assets to Supply</h3>
          </div>
          <div className="relative w-full px-4 max-w-full flex-grow flex-1 text-right"></div>
        </div>
      </div>
      <div className="block w-full overflow-auto">
        {/* Projects table */}
        <table className="items-center w-full bg-transparent border-collapse">
          <thead>
            <tr>
              <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800  border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Assets
              </th>
              <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Wallet Balance
              </th>
              <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                APY
              </th>
              <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left">
                Can be collateral
              </th>
              <th className="px-4 bg-blueGray-50 text-blueGray-500 align-middle border border-solid border-blueGray-100 py-3 text-xs text-gray-800 border-t-0 border-l-0 border-r-0 whitespace-nowrap font-semibold text-left"></th>
            </tr>
          </thead>
          <tbody>
            {!tokens && (
              <Skeleton />
            )}
            {tokens?.map((token) => children(token))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
