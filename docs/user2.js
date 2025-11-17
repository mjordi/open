// Ensure the DOM is fully loaded before running the script
document.addEventListener('DOMContentLoaded', () => {
  let provider;
  let signer;
  let contract;
  const logDiv = document.getElementById('log');

  const log = (message, isError = false) => {
    // Always log to the browser console for debugging
    console[isError ? 'error' : 'log'](message);

    // Only show error messages on the web page
    if (isError) {
      const p = document.createElement('p');
      p.textContent = message;
      p.style.color = 'red';
      logDiv.appendChild(p);
      logDiv.scrollTop = logDiv.scrollHeight;
    }
  };

  const initialize = () => {
    const connectButton = document.getElementById('connect_wallet_btn');

    if (!connectButton) {
      log('FATAL: Could not find the "Connect Wallet" button.', true);
      return;
    }

    if (typeof window.ethereum !== 'undefined') {
      log('MetaMask is installed!');
      // Ethers v6: Use BrowserProvider
      provider = new ethers.BrowserProvider(window.ethereum);

      log('Attempting to enable the connect button and add listener...');
      connectButton.disabled = false;
      connectButton.addEventListener('click', connectWallet);
      log('Connect button is active.');

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        log(`Account changed to: ${accounts[0]}`);
        if (accounts.length > 0) {
          connectWallet(); // Re-connect with the new account
        } else {
          log('Wallet disconnected.', true);
          document.getElementById('contract_interaction').style.display = 'none';
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', (chainId) => {
        log(`Network changed to: ${chainId}. Please reload the page.`);
        window.location.reload();
      });
    } else {
      log('MetaMask is not installed. Please install it to use this app.', true);
      connectButton.disabled = true;
    }

    document.getElementById('connect_contract_btn').addEventListener('click', connectContract);
  };

  const connectWallet = async () => {
    log('"Connect Wallet" button clicked. Firing request...');
    try {
      log('Requesting account access...');
      // Ethers v6: No need to send 'eth_requestAccounts' manually, getSigner handles it.
      signer = await provider.getSigner();
      const address = await signer.getAddress();

      log(`Wallet connected: ${address}`);
      document.getElementById('connect_wallet_btn').disabled = true;
      document.getElementById('contract_interaction').style.display = 'block';
    } catch (error) {
      log(`Access denied: ${error.message}`, true);
      console.error(error);
    }
  };

  // 2. Connect to the Smart Contract
  const connectContract = () => {
    const contractAddress = document.getElementById('contract_address').value;
    if (!signer) {
      log('Please connect your wallet first.', true);
      return;
    }
    // Ethers v6: isAddress is now a top-level function
    if (!ethers.isAddress(contractAddress)) {
      log(`Invalid contract address: ${contractAddress}`, true);
      return;
    }

    try {
      // Create a contract instance
      contract = new ethers.Contract(contractAddress, smartContractAbi, signer);
      log(`Connected to contract at: ${contractAddress}`);
      listenToEvents();
    } catch (error) {
      log('Failed to connect to the contract.', true);
      console.error(error);
    }
  };

  // 3. Listen to all contract events
  const listenToEvents = () => {
    if (!contract) return;

    log('Listening for contract events...');

    // Clear previous listeners to avoid duplicates
    contract.removeAllListeners();

    contract.on('AssetCreated', (owner, assetKey, description, event) => {
      log(`EVENT: AssetCreated - Owner: ${owner}, Key: ${assetKey}, Desc: ${description}`);
    });

    contract.on('AuthorizationAdded', (authorizer, authorized, assetKey, role, event) => {
      log(
        `EVENT: AuthorizationAdded - By: ${authorizer}, For: ${authorized}, Key: ${assetKey}, Role: ${role}`
      );
    });

    contract.on('AuthorizationRemoved', (authorizer, authorized, assetKey, event) => {
      log(`EVENT: AuthorizationRemoved - By: ${authorizer}, From: ${authorized}, Key: ${assetKey}`);
    });

    contract.on('AccessAttempt', (account, assetKey, accessGranted, event) => {
      log(
        `EVENT: AccessAttempt - Account: ${account}, Key: ${assetKey}, Granted: ${accessGranted}`
      );
    });

    contract.on('AssetCreationRejected', (account, assetKey, message, event) => {
      log(
        `EVENT: AssetCreationRejected - Account: ${account}, Key: ${assetKey}, Message: ${message}`
      );
    });
  };

  // 4. Bind Functions to Forms

  // Add Asset
  document.getElementById('form_asset').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contract) return log('Contract not connected', true);

    const assetKey = document.getElementById('assetKey').value;
    const assetDescription = document.getElementById('assetDescription').value;
    log(`Adding asset: ${assetKey}...`);

    try {
      const tx = await contract.newAsset(assetKey, assetDescription);
      log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      log(`Transaction confirmed for asset: ${assetKey}`);
    } catch (error) {
      log(`Error creating asset: ${error.message}`, true);
      console.error(error);
    }
  });

  // Add Authorization
  document.getElementById('form_assign').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contract) return log('Contract not connected', true);

    const assetKey = document.getElementById('assetKey_assign').value;
    const address = document.getElementById('address_assign').value;
    const role = document.getElementById('role_assign').value;
    log(`Assigning role '${role}' for asset ${assetKey} to ${address}...`);

    try {
      const tx = await contract.addAuthorization(assetKey, address, role);
      log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      log('Authorization added successfully.');
    } catch (error) {
      log(`Error adding authorization: ${error.message}`, true);
      console.error(error);
    }
  });

  // Check Role
  document.getElementById('form_isAssigned').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contract) return log('Contract not connected', true);

    const assetKey = document.getElementById('assetKey_isAssigned').value;
    const address = document.getElementById('address_isAssigned').value;
    log(`Checking role for asset ${assetKey} and address ${address}...`);

    try {
      const role = await contract.getAssetAuthorization(assetKey, address);
      log(`Role found: ${role || 'No role assigned'}`);
    } catch (error) {
      log(`Error checking role: ${error.message}`, true);
      console.error(error);
    }
  });

  // Access Asset
  document.getElementById('form_access').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contract) return log('Contract not connected', true);

    const assetKey = document.getElementById('assetKey_access').value;
    log(`Requesting access for asset ${assetKey}...`);

    try {
      const tx = await contract.getAccess(assetKey);
      // The result is emitted as an event, which the listener will catch
      log(`Access request transaction sent. See events for result.`);
    } catch (error) {
      log(`Error requesting access: ${error.message}`, true);
      console.error(error);
    }
  });

  // Remove Authorization
  document.getElementById('form_unassign').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!contract) return log('Contract not connected', true);

    const assetKey = document.getElementById('assetKey_unassign').value;
    const address = document.getElementById('address_unassign').value;
    log(`Removing authorization for asset ${assetKey} from ${address}...`);

    try {
      const tx = await contract.removeAuthorization(assetKey, address);
      log(`Transaction sent: ${tx.hash}`);
      await tx.wait();
      log('Authorization removed successfully.');
    } catch (error) {
      log(`Error removing authorization: ${error.message}`, true);
      console.error(error);
    }
  });

  // Start the initialization process
  initialize();
});
