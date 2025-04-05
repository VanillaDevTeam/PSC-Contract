import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import "@nomicfoundation/hardhat-ethers";
import dotenv from "dotenv";

dotenv.config();

// Load environment variables
let PRIVATE_KEY = process.env.PRIVATE_KEY || ""; // Default local dev key
PRIVATE_KEY = PRIVATE_KEY.replace(/^0x/, "");

const ETHEREUM_RPC_URL = process.env.ETHEREUM_RPC_URL || "";
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "";
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const OPBNB_RPC_URL = process.env.OPBNB_RPC_URL || "";
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || "";
const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Mainnet configurations
    ethereum: {
      url: ETHEREUM_RPC_URL,
      accounts: [PRIVATE_KEY || ""],
    },
    polygon: {
      url: POLYGON_RPC_URL,
      accounts: [PRIVATE_KEY || ""],
    },
    opBnb: {
      url: OPBNB_RPC_URL,
      accounts: [PRIVATE_KEY || ""],
    },
    // Testnet configurations
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
      accounts: [PRIVATE_KEY || ""],
    },
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
      accounts: [PRIVATE_KEY || ""],
    },
    opBnbTestnet: {
      url: OPBNB_RPC_URL,
      accounts: [PRIVATE_KEY || ""],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      opBnb: process.env.BSCSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "opBnb",
        chainId: 204,
        urls: {
          apiURL: "https://api-opbnb.bscscan.com/api",
          browserURL: "https://opbnb.bscscan.com/"
        }
      }
    ]
  },
};

export default config;
