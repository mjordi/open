# OPEN

This repository demonstrates a simple asset management system built with Solidity smart contracts and a small web interface. The contracts implement role-based access control for assets, allowing users to assign permissions and verify access on the blockchain.

## Required Tools

- **Solidity compiler** (version 0.4.x) to compile the contracts
- **Web3 provider** such as MetaMask to interact with the Ethereum network
- Optional tools like **Truffle**, **Hardhat** or **Remix** can be used for deployment
- A simple HTTP server to host the `index.html` file

## Deploying and Interacting

1. Compile `aaas.sol` (or other contracts) using your Solidity compiler. Example:
   ```
   solcjs --bin --abi aaas.sol -o build/
   ```
2. Deploy the compiled contract to a network (Ganache, testnet, etc.) via Remix or your favorite tool.
3. Update `user2.js` with the deployed contract address if different from the default.
4. Serve the project files via a local web server, e.g.:
   ```
   python3 -m http.server 8080
   ```
5. Open `index.html` in a browser with MetaMask enabled and connect to the same network.
6. Use the on-page forms to add assets, assign or revoke permissions, check roles and request access.
