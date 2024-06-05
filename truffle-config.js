const HDWalletProvider = require('@truffle/hdwallet-provider');
const mnemonic = 'ahead either antique panther aim dust keen lounge tuna panic method brass';
const infuraKey = '216587818aaf4c0fadcb50754bd65b74';
const alchemyApiKey = "eSbuEhNGkdBrxonWJ2lS2jJqYqAn-dDe"; 

module.exports = {
  networks: {
    sepolia2: {
      provider: () => new HDWalletProvider(mnemonic, `https://eth-sepolia.g.alchemy.com/v2/${alchemyApiKey}`),
      network_id: 11155111, // Sepolia's network id
      gas: 5500000, // Gas limit
      confirmations: 2, // Number of confirmations to wait between deployments. (default: 0)
      timeoutBlocks: 200000, // Number of blocks before a deployment times out (minimum/default: 50)
      skipDryRun: true,
      requestTimeout: 1000000, // Skip dry run before migrations? (default: false for public nets )
    },
    sepolia: {
      provider: () => new HDWalletProvider(mnemonic, `https://sepolia.infura.io/v3/${infuraKey}`),
      network_id: 11155111, // Sepolia's id
      gas: 5500000,    // Gas limit
      confirmations: 2,    // # of confirmations to wait between deployments. (default: 0)
      timeoutBlocks: 200000,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true,     // Skip dry run before migrations? (default: false for public nets)
      pollingInterval: 60000, // Set the polling interval to 60 seconds (1000 ms * 60 seconds)
      retryTimeout: 60000, // Set the retry timeout to 60 seconds (1000 ms * 60 seconds)
      networkCheckTimeout: 1000000, // Adjust the timeout value (in milliseconds)
      deploymentPollingInterval: 60000, // Set the deployment polling interval to 60 seconds
    }
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0",    // Fetch exact version from solc-bin (default: truffle's version)
    }
  }
};
