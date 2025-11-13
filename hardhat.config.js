import 'dotenv/config';
import { defineConfig } from 'hardhat/config';
import hardhatEthers from '@nomicfoundation/hardhat-ethers';
import hardhatMocha from '@nomicfoundation/hardhat-mocha';
import hardhatVerify from '@nomicfoundation/hardhat-verify';
import hardhatIgnitionEthers from '@nomicfoundation/hardhat-ignition-ethers';

// TODO: Re-enable these plugins when they add Hardhat 3.x support:
// - @nomicfoundation/hardhat-chai-matchers (requires hardhat/common/bigInt export)
// - @nomicfoundation/hardhat-network-helpers (requires hardhat/common export)
// - @typechain/hardhat (requires hardhat/common/bigInt export)
// - hardhat-gas-reporter (requires hardhat/common/bigInt export)
// - solidity-coverage (requires hardhat/common export)
// - hardhat-contract-sizer (compatibility unknown)

export default defineConfig({
  plugins: [hardhatEthers, hardhatMocha, hardhatVerify, hardhatIgnitionEthers],
  solidity: {
    compilers: [
      {
        version: '0.4.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.20',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: '0.8.24',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  paths: {
    sources: './contracts',
    tests: {
      mocha: './test',
    },
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    hardhat: {
      type: 'edr-simulated',
      accounts: {
        count: 20,
        accountsBalance: '10000000000000000000000', // 10,000 ETH
      },
      allowUnlimitedContractSize: false,
      blockGasLimit: 30000000,
      gas: 'auto',
      gasPrice: 'auto',
    },
    localhost: {
      type: 'http',
      url: 'http://127.0.0.1:8545',
      chainId: 31337,
    },
    sepolia: {
      type: 'http',
      url: process.env.SEPOLIA_URL || 'https://ethereum-sepolia.publicnode.com',
      accounts:
        process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66
          ? [process.env.PRIVATE_KEY]
          : [],
      chainId: 11155111,
    },
    mainnet: {
      type: 'http',
      url: process.env.MAINNET_URL || 'https://ethereum.publicnode.com',
      accounts:
        process.env.PRIVATE_KEY && process.env.PRIVATE_KEY.length === 66
          ? [process.env.PRIVATE_KEY]
          : [],
      chainId: 1,
      gasPrice: 'auto',
    },
  },
  test: {
    mocha: {
      timeout: 60000,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || '',
  },
});
