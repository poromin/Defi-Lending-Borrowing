// web3Context.js
import React, { createContext, useContext, useEffect, useState } from "react";
import Web3 from "web3";
import { Web3Provider } from "@ethersproject/providers";

const Web3Context = createContext(null);

export const Web3ProviderComponent = ({ children }) => {
  const [web3, setWeb3] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      const provider = new Web3Provider(window.ethereum);
      const web3Instance = new Web3(provider);
      setWeb3(web3Instance);
    };
    initWeb3();
  }, []);

  return (
    <Web3Context.Provider value={web3}>{children}</Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  return useContext(Web3Context);
};