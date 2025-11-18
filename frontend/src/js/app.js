/**
 * Access Management DApp - Modernized with ethers.js
 */

// Global state
const AppState = {
    provider: null,
    signer: null,
    contract: null,
    contractAddress: null,
    userAddress: null,
    network: null
};

// ==================== Utility Functions ====================

/**
 * Show toast notification
 */
function showNotification(message, type = 'info', duration = 5000) {
    const container = document.getElementById('notification-container');
    const toastId = `toast-${Date.now()}`;

    const iconMap = {
        success: 'check-circle-fill',
        error: 'exclamation-triangle-fill',
        warning: 'exclamation-circle-fill',
        info: 'info-circle-fill'
    };

    const toastHTML = `
        <div class="toast toast-${type} fade-in" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header toast-${type}">
                <i class="bi bi-${iconMap[type]} me-2"></i>
                <strong class="me-auto">${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        </div>
    `;

    container.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { autohide: true, delay: duration });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

/**
 * Add event to log
 */
function addEventToLog(eventName, message, type = 'info') {
    const eventLog = document.getElementById('event-log');

    // Remove empty state message
    const emptyState = eventLog.querySelector('.text-center');
    if (emptyState) {
        emptyState.remove();
    }

    const iconMap = {
        success: 'check-circle',
        error: 'x-circle',
        info: 'info-circle'
    };

    const timestamp = new Date().toLocaleTimeString();
    const eventHTML = `
        <div class="list-group-item event-item fade-in">
            <div class="d-flex align-items-start">
                <div class="event-icon ${type} me-3">
                    <i class="bi bi-${iconMap[type]}"></i>
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <strong>${eventName}</strong>
                        <span class="event-timestamp">${timestamp}</span>
                    </div>
                    <div class="text-muted small">${message}</div>
                </div>
            </div>
        </div>
    `;

    eventLog.insertAdjacentHTML('afterbegin', eventHTML);

    // Keep only last 50 events
    while (eventLog.children.length > 50) {
        eventLog.lastChild.remove();
    }
}

/**
 * Truncate address for display
 */
function truncateAddress(address) {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Set button loading state
 */
function setButtonLoading(button, loading) {
    const spinner = button.querySelector('.spinner-border');
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
        spinner.classList.remove('d-none');
    } else {
        button.classList.remove('loading');
        button.disabled = false;
        spinner.classList.add('d-none');
    }
}

/**
 * Validate Ethereum address
 */
function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Save contract address to localStorage
 */
function saveContractAddress(address) {
    try {
        localStorage.setItem('open_contract_address', address);
    } catch (error) {
        console.warn('Failed to save contract address to localStorage:', error);
    }
}

/**
 * Load contract address from localStorage
 */
function loadContractAddress() {
    try {
        return localStorage.getItem('open_contract_address');
    } catch (error) {
        console.warn('Failed to load contract address from localStorage:', error);
        return null;
    }
}

// ==================== Blockchain Functions ====================

/**
 * Initialize wallet connection
 */
async function initializeWallet() {
    try {
        // Check for MetaMask/wallet
        if (!window.ethereum) {
            showNotification(
                'MetaMask or another Web3 wallet is required. Please install one to continue.',
                'error',
                10000
            );
            return false;
        }

        // Request account access
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });

        if (!accounts || accounts.length === 0) {
            showNotification('No accounts found. Please connect your wallet.', 'error');
            return false;
        }

        // Create provider and signer
        AppState.provider = new ethers.BrowserProvider(window.ethereum);
        AppState.signer = await AppState.provider.getSigner();
        AppState.userAddress = accounts[0];

        // Get network info
        const network = await AppState.provider.getNetwork();
        AppState.network = {
            chainId: Number(network.chainId),
            name: getNetworkName(Number(network.chainId))
        };

        // Update UI
        updateConnectionUI();

        // Check for mainnet warning
        if (AppState.network.chainId === 1) {
            const proceed = confirm(
                "⚠️ WARNING: You are on Ethereum Mainnet!\n\nTransactions will cost real ETH. Are you sure you want to continue?"
            );
            if (!proceed) {
                showNotification('Application stopped - Connected to Mainnet', 'warning');
                return false;
            }
        }

        // Get and display balance
        const balance = await AppState.provider.getBalance(AppState.userAddress);
        const balanceInEth = ethers.formatEther(balance);
        console.log(`Balance: ${balanceInEth} ETH`);

        showNotification(
            `Connected to ${AppState.network.name} as ${truncateAddress(AppState.userAddress)}`,
            'success'
        );

        return true;
    } catch (error) {
        console.error('Failed to initialize wallet:', error);
        showNotification(`Failed to connect wallet: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Get network name from chain ID
 */
function getNetworkName(chainId) {
    const networks = {
        1: 'Mainnet',
        3: 'Ropsten',
        4: 'Rinkeby',
        5: 'Goerli',
        11155111: 'Sepolia',
        1337: 'Local',
        31337: 'Hardhat'
    };
    return networks[chainId] || `Unknown (${chainId})`;
}

/**
 * Update connection UI
 */
function updateConnectionUI() {
    const networkIndicator = document.getElementById('network-indicator');
    const networkName = document.getElementById('network-name');
    const accountAddress = document.getElementById('account-address');

    if (AppState.userAddress) {
        networkIndicator.classList.add('connected');
        networkName.textContent = AppState.network.name;
        accountAddress.textContent = truncateAddress(AppState.userAddress);
    } else {
        networkIndicator.classList.remove('connected');
        networkName.textContent = 'Disconnected';
        accountAddress.textContent = 'Not Connected';
    }
}

/**
 * Connect to contract
 */
async function connectToContract(address) {
    try {
        if (!AppState.signer) {
            showNotification('Please connect your wallet first', 'warning');
            return false;
        }

        if (!isValidAddress(address)) {
            showNotification('Invalid contract address', 'error');
            return false;
        }

        // Create contract instance
        AppState.contract = new ethers.Contract(
            address,
            contractABI, // From generated/abi.js
            AppState.signer
        );

        AppState.contractAddress = address;

        // Save to localStorage
        saveContractAddress(address);

        // Set up event listeners
        setupContractEvents();

        showNotification(`Connected to contract at ${truncateAddress(address)}`, 'success');
        console.log('Contract connected:', address);

        // Load assets
        await loadAssets();

        return true;
    } catch (error) {
        console.error('Failed to connect to contract:', error);
        showNotification(`Failed to connect to contract: ${error.message}`, 'error');
        return false;
    }
}

/**
 * Set up contract event listeners
 */
function setupContractEvents() {
    if (!AppState.contract) return;

    // AssetCreate event
    AppState.contract.on('AssetCreate', (assetKey, assetDescription, account, event) => {
        console.log('AssetCreate event:', { assetKey, assetDescription, account });
        addEventToLog(
            'Asset Created',
            `Asset "${assetKey}" (${assetDescription}) created by ${truncateAddress(account)}`,
            'success'
        );
        // Reload assets after a short delay
        setTimeout(() => loadAssets(), 2000);
    });

    // RejectCreate event
    AppState.contract.on('RejectCreate', (message, assetKey, account, event) => {
        console.log('RejectCreate event:', { message, assetKey, account });
        addEventToLog(
            'Asset Creation Rejected',
            `${message} - Serial: ${assetKey}, Owner: ${truncateAddress(account)}`,
            'error'
        );
    });

    // AuthorizationCreate event
    AppState.contract.on('AuthorizationCreate', (assetKey, account, authorizationRole, event) => {
        console.log('AuthorizationCreate event:', { assetKey, account, authorizationRole });
        addEventToLog(
            'Authorization Granted',
            `Role "${authorizationRole}" granted for asset "${assetKey}" to ${truncateAddress(account)}`,
            'success'
        );
        setTimeout(() => loadAssets(), 2000);
    });

    // AuthorizationRemove event
    AppState.contract.on('AuthorizationRemove', (assetKey, account, event) => {
        console.log('AuthorizationRemove event:', { assetKey, account });
        addEventToLog(
            'Authorization Revoked',
            `Authorization removed for asset "${assetKey}" from ${truncateAddress(account)}`,
            'info'
        );
        setTimeout(() => loadAssets(), 2000);
    });

    // AccessLog event
    AppState.contract.on('AccessLog', (assetKey, account, accessGranted, event) => {
        console.log('AccessLog event:', { assetKey, account, accessGranted });
        if (accessGranted) {
            addEventToLog(
                'Access Granted',
                `Access granted to ${truncateAddress(account)} for asset "${assetKey}"`,
                'success'
            );
        } else {
            addEventToLog(
                'Access Denied',
                `Access denied to ${truncateAddress(account)} for asset "${assetKey}"`,
                'error'
            );
        }
    });
}

/**
 * Load and display all assets
 */
async function loadAssets() {
    const container = document.getElementById('assets-container');

    if (!AppState.contract) {
        container.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                <p class="mt-2">Connect to a contract to view assets</p>
            </div>
        `;
        return;
    }

    try {
        // Show loading state
        container.innerHTML = `
            <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2 text-muted">Loading assets...</p>
            </div>
        `;

        const assetCount = await AppState.contract.getAssetCount();
        const count = Number(assetCount);

        if (count === 0) {
            container.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="bi bi-inbox" style="font-size: 2rem;"></i>
                    <p class="mt-2">No assets registered yet</p>
                </div>
            `;
            return;
        }

        const assets = [];
        for (let i = 0; i < count; i++) {
            const assetKey = await AppState.contract.getAssetAtIndex(i);
            const assetData = await AppState.contract.getAsset(assetKey);

            // Get authorization count
            const authCount = await AppState.contract.getAssetAuthorizationCount(assetKey);

            assets.push({
                key: assetKey,
                owner: assetData[0],
                description: assetData[1],
                initialized: assetData[2],
                authorizationCount: Number(authCount)
            });
        }

        // Render assets
        let assetsHTML = '<div class="row g-3">';

        for (const asset of assets) {
            assetsHTML += `
                <div class="col-12">
                    <div class="card asset-card">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h6 class="mb-1">
                                        <i class="bi bi-key"></i> ${escapeHtml(asset.key)}
                                    </h6>
                                    <p class="text-muted mb-2">${escapeHtml(asset.description)}</p>
                                    <div class="asset-owner">
                                        <i class="bi bi-person"></i> Owner: ${truncateAddress(asset.owner)}
                                    </div>
                                </div>
                                <div class="text-end">
                                    <span class="badge bg-primary authorization-badge">
                                        ${asset.authorizationCount} authorization${asset.authorizationCount !== 1 ? 's' : ''}
                                    </span>
                                    <button class="btn btn-sm btn-outline-secondary mt-2 view-auth-btn"
                                            data-asset-key="${escapeHtml(asset.key)}">
                                        <i class="bi bi-eye"></i> View
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        assetsHTML += '</div>';
        container.innerHTML = assetsHTML;

        // Add event listeners to view buttons
        container.querySelectorAll('.view-auth-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const assetKey = e.currentTarget.dataset.assetKey;
                await showAssetAuthorizations(assetKey);
            });
        });

    } catch (error) {
        console.error('Failed to load assets:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle"></i>
                Failed to load assets: ${escapeHtml(error.message)}
            </div>
        `;
    }
}

/**
 * Show authorizations for an asset
 */
async function showAssetAuthorizations(assetKey) {
    try {
        const authCount = await AppState.contract.getAssetAuthorizationCount(assetKey);
        const count = Number(authCount);

        if (count === 0) {
            showNotification(`No authorizations found for asset "${assetKey}"`, 'info');
            return;
        }

        const authorizations = [];
        for (let i = 0; i < count; i++) {
            const address = await AppState.contract.getAssetAuthorizationAtIndex(assetKey, i);
            const role = await AppState.contract.getAssetAuthorization(assetKey, address);
            authorizations.push({ address, role });
        }

        let authHTML = `<strong>Authorizations for "${assetKey}":</strong><br><br>`;
        authorizations.forEach(auth => {
            authHTML += `<div class="mb-2">
                <span class="badge bg-secondary">${auth.role}</span>
                <code class="ms-2">${truncateAddress(auth.address)}</code>
            </div>`;
        });

        // Show in notification
        showNotification(authHTML, 'info', 10000);

        // Also log to console with full details
        console.table(authorizations);
    } catch (error) {
        console.error('Failed to load authorizations:', error);
        showNotification(`Failed to load authorizations: ${error.message}`, 'error');
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Estimate and display gas cost
 * @param {Function} txFunction - Function that returns transaction promise
 * @param {string} actionName - Name of the action for display
 * @returns {Object|null} - Gas estimate details or null if estimation fails
 */
async function estimateGas(txFunction, actionName = 'transaction') {
    try {
        // Get gas estimate
        const gasEstimate = await txFunction();
        const gasLimit = gasEstimate;

        // Get current gas price
        const feeData = await AppState.provider.getFeeData();
        const gasPrice = feeData.gasPrice || feeData.maxFeePerGas;

        // Calculate total cost in ETH
        const totalCostWei = gasLimit * gasPrice;
        const totalCostEth = ethers.formatEther(totalCostWei);

        console.log(`⛽ Gas Estimate for ${actionName}:`);
        console.log(`  Gas Limit: ${gasLimit.toString()}`);
        console.log(`  Gas Price: ${ethers.formatUnits(gasPrice, 'gwei')} Gwei`);
        console.log(`  Estimated Cost: ${totalCostEth} ETH`);

        return {
            gasLimit,
            gasPrice,
            totalCostWei,
            totalCostEth
        };
    } catch (error) {
        console.warn(`Failed to estimate gas for ${actionName}:`, error);
        return null;
    }
}

// ==================== Form Handlers ====================

/**
 * Deploy contract
 */
async function deployContract(e) {
    e.preventDefault();
    const button = e.target.querySelector('button[type="submit"]');

    try {
        setButtonLoading(button, true);

        if (!AppState.signer) {
            showNotification('Please connect your wallet first', 'warning');
            return;
        }

        // Create contract factory
        const factory = new ethers.ContractFactory(
            contractABI,
            contractBytecode,
            AppState.signer
        );

        // Estimate gas
        showNotification('Estimating gas cost...', 'info', 3000);
        const gasEstimate = await estimateGas(
            async () => await factory.getDeployTransaction().then(tx =>
                AppState.provider.estimateGas({ ...tx, from: AppState.userAddress })
            ),
            'contract deployment'
        );

        if (gasEstimate) {
            showNotification(
                `Estimated cost: ${parseFloat(gasEstimate.totalCostEth).toFixed(6)} ETH. Deploying...`,
                'info',
                5000
            );
        } else {
            showNotification('Deploying contract... This may take a moment.', 'info');
        }

        // Deploy
        const contract = await factory.deploy();
        await contract.waitForDeployment();

        const address = await contract.getAddress();

        showNotification(`Contract deployed successfully at ${address}`, 'success');
        addEventToLog('Contract Deployed', `New contract deployed at ${address}`, 'success');

        // Update contract address input
        document.getElementById('contract-address').value = address;

        // Auto-connect to new contract
        await connectToContract(address);

    } catch (error) {
        console.error('Deployment failed:', error);
        showNotification(`Deployment failed: ${error.message}`, 'error');
        addEventToLog('Deployment Failed', error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Add asset
 */
async function addAsset(e) {
    e.preventDefault();

    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    const assetKey = document.getElementById('assetKey').value.trim();
    const assetDescription = document.getElementById('assetDescription').value.trim();

    try {
        setButtonLoading(button, true);

        if (!AppState.contract) {
            showNotification('Please connect to a contract first', 'warning');
            return;
        }

        // Estimate gas
        const gasEstimate = await estimateGas(
            async () => await AppState.contract.newAsset.estimateGas(assetKey, assetDescription),
            'add asset'
        );

        if (gasEstimate) {
            showNotification(
                `Estimated cost: ${parseFloat(gasEstimate.totalCostEth).toFixed(6)} ETH`,
                'info',
                3000
            );
        }

        const tx = await AppState.contract.newAsset(assetKey, assetDescription);

        showNotification('Transaction sent. Waiting for confirmation...', 'info');
        addEventToLog('Transaction Sent', `Creating asset "${assetKey}"`, 'info');

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            showNotification('Asset created successfully!', 'success');
            e.target.reset();
            e.target.classList.remove('was-validated');
        } else {
            throw new Error('Transaction failed');
        }

    } catch (error) {
        console.error('Failed to create asset:', error);
        const errorMsg = error.reason || error.message;
        showNotification(`Failed to create asset: ${errorMsg}`, 'error');
        addEventToLog('Asset Creation Failed', errorMsg, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Add authorization
 */
async function addAuthorization(e) {
    e.preventDefault();

    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    const assetKey = document.getElementById('assetKey_assign').value.trim();
    const address = document.getElementById('address_assign').value.trim();
    const role = document.getElementById('role_assign').value;

    try {
        setButtonLoading(button, true);

        if (!AppState.contract) {
            showNotification('Please connect to a contract first', 'warning');
            return;
        }

        if (!role || role === 'Choose...') {
            showNotification('Please select a role', 'warning');
            return;
        }

        // Estimate gas
        const gasEstimate = await estimateGas(
            async () => await AppState.contract.addAuthorization.estimateGas(assetKey, address, role),
            'add authorization'
        );

        if (gasEstimate) {
            showNotification(
                `Estimated cost: ${parseFloat(gasEstimate.totalCostEth).toFixed(6)} ETH`,
                'info',
                3000
            );
        }

        const tx = await AppState.contract.addAuthorization(assetKey, address, role);

        showNotification('Transaction sent. Waiting for confirmation...', 'info');
        addEventToLog('Transaction Sent', `Adding ${role} authorization for ${truncateAddress(address)}`, 'info');

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            showNotification('Authorization added successfully!', 'success');
            e.target.reset();
            e.target.classList.remove('was-validated');
        } else {
            throw new Error('Transaction failed');
        }

    } catch (error) {
        console.error('Failed to add authorization:', error);
        const errorMsg = error.reason || error.message;
        showNotification(`Failed to add authorization: ${errorMsg}`, 'error');
        addEventToLog('Authorization Failed', errorMsg, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Check role
 */
async function checkRole(e) {
    e.preventDefault();

    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    const assetKey = document.getElementById('assetKey_isAssigned').value.trim();
    const address = document.getElementById('address_isAssigned').value.trim();

    try {
        setButtonLoading(button, true);

        if (!AppState.contract) {
            showNotification('Please connect to a contract first', 'warning');
            return;
        }

        const role = await AppState.contract.getAssetAuthorization(assetKey, address);

        if (role && role !== '') {
            showNotification(
                `Role for ${truncateAddress(address)} on asset "${assetKey}": <strong>${role}</strong>`,
                'success',
                8000
            );
            addEventToLog('Role Check', `${truncateAddress(address)} has role "${role}" on asset "${assetKey}"`, 'info');
        } else {
            showNotification(
                `No authorization found for ${truncateAddress(address)} on asset "${assetKey}"`,
                'warning'
            );
            addEventToLog('Role Check', `No authorization found`, 'info');
        }

        console.log('Authorization role:', role);

    } catch (error) {
        console.error('Failed to check role:', error);
        const errorMsg = error.reason || error.message;
        showNotification(`Failed to check role: ${errorMsg}`, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Access asset
 */
async function accessAsset(e) {
    e.preventDefault();

    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    const assetKey = document.getElementById('assetKey_access').value.trim();

    try {
        setButtonLoading(button, true);

        if (!AppState.contract) {
            showNotification('Please connect to a contract first', 'warning');
            return;
        }

        const tx = await AppState.contract.getAccess(assetKey);

        showNotification('Access request sent. Waiting for confirmation...', 'info');

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            showNotification('Access request processed. Check event log for result.', 'success');
        } else {
            throw new Error('Transaction failed');
        }

    } catch (error) {
        console.error('Failed to request access:', error);
        const errorMsg = error.reason || error.message;
        showNotification(`Failed to request access: ${errorMsg}`, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Remove authorization
 */
async function removeAuthorization(e) {
    e.preventDefault();

    if (!e.target.checkValidity()) {
        e.target.classList.add('was-validated');
        return;
    }

    const button = e.target.querySelector('button[type="submit"]');
    const assetKey = document.getElementById('assetKey_unassign').value.trim();
    const address = document.getElementById('address_unassign').value.trim();

    try {
        setButtonLoading(button, true);

        if (!AppState.contract) {
            showNotification('Please connect to a contract first', 'warning');
            return;
        }

        // Estimate gas
        const gasEstimate = await estimateGas(
            async () => await AppState.contract.removeAuthorization.estimateGas(assetKey, address),
            'remove authorization'
        );

        if (gasEstimate) {
            showNotification(
                `Estimated cost: ${parseFloat(gasEstimate.totalCostEth).toFixed(6)} ETH`,
                'info',
                3000
            );
        }

        const tx = await AppState.contract.removeAuthorization(assetKey, address);

        showNotification('Transaction sent. Waiting for confirmation...', 'info');
        addEventToLog('Transaction Sent', `Removing authorization for ${truncateAddress(address)}`, 'info');

        const receipt = await tx.wait();

        if (receipt.status === 1) {
            showNotification('Authorization removed successfully!', 'success');
            e.target.reset();
            e.target.classList.remove('was-validated');
        } else {
            throw new Error('Transaction failed');
        }

    } catch (error) {
        console.error('Failed to remove authorization:', error);
        const errorMsg = error.reason || error.message;
        showNotification(`Failed to remove authorization: ${errorMsg}`, 'error');
        addEventToLog('Remove Authorization Failed', errorMsg, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

// ==================== Event Listeners ====================

window.addEventListener('load', async () => {
    console.log('🚀 Access Management DApp Loading...');

    // Initialize wallet connection
    const connected = await initializeWallet();

    if (connected) {
        // Load saved contract address from localStorage
        const savedAddress = loadContractAddress();
        const inputField = document.getElementById('contract-address');

        // If no default address in input, use saved address
        if ((!inputField.value || inputField.value.trim() === '') && savedAddress) {
            inputField.value = savedAddress;
        }

        // Try to connect to contract if address is present
        const addressToConnect = inputField.value.trim();
        if (addressToConnect && isValidAddress(addressToConnect)) {
            await connectToContract(addressToConnect);
        }
    }

    // Connect contract button
    document.getElementById('connect-contract').addEventListener('click', async () => {
        const address = document.getElementById('contract-address').value.trim();
        await connectToContract(address);
    });

    // Copy address button
    document.getElementById('copy-address').addEventListener('click', async () => {
        const addressInput = document.getElementById('contract-address');
        const address = addressInput.value.trim();

        if (!address) {
            showNotification('No address to copy', 'warning');
            return;
        }

        try {
            await navigator.clipboard.writeText(address);
            const button = document.getElementById('copy-address');
            const icon = button.querySelector('i');

            // Change icon to checkmark temporarily
            icon.classList.remove('bi-clipboard');
            icon.classList.add('bi-check2');
            button.classList.remove('btn-outline-secondary');
            button.classList.add('btn-success');

            showNotification('Address copied to clipboard!', 'success', 2000);

            // Reset icon after 2 seconds
            setTimeout(() => {
                icon.classList.remove('bi-check2');
                icon.classList.add('bi-clipboard');
                button.classList.remove('btn-success');
                button.classList.add('btn-outline-secondary');
            }, 2000);
        } catch (error) {
            console.error('Failed to copy address:', error);
            showNotification('Failed to copy address. Please copy manually.', 'error');
        }
    });

    // Form submissions
    document.getElementById('form_deploy').addEventListener('submit', deployContract);
    document.getElementById('form_asset').addEventListener('submit', addAsset);
    document.getElementById('form_assign').addEventListener('submit', addAuthorization);
    document.getElementById('form_isAssigned').addEventListener('submit', checkRole);
    document.getElementById('form_access').addEventListener('submit', accessAsset);
    document.getElementById('form_unassign').addEventListener('submit', removeAuthorization);

    // Refresh assets button
    document.getElementById('refresh-assets').addEventListener('click', loadAssets);

    // Clear events button
    document.getElementById('clear-events').addEventListener('click', () => {
        const eventLog = document.getElementById('event-log');
        eventLog.innerHTML = `
            <div class="list-group-item text-center text-muted">
                No events yet. Interact with the contract to see activity.
            </div>
        `;
    });

    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', async (accounts) => {
            console.log('Account changed:', accounts[0]);
            if (accounts.length === 0) {
                showNotification('Wallet disconnected', 'warning');
                AppState.userAddress = null;
                updateConnectionUI();
            } else {
                location.reload(); // Reload to reinitialize with new account
            }
        });

        window.ethereum.on('chainChanged', () => {
            console.log('Network changed, reloading...');
            location.reload(); // Reload on network change
        });
    }

    console.log('✅ DApp Ready');
    console.log('\n=== Available Console Functions ===');
    console.log('AppState - View current application state');
    console.log('loadAssets() - Reload asset list');
    console.log('====================================\n');
});

// Make functions available globally for debugging
window.AppState = AppState;
window.loadAssets = loadAssets;
window.showAssetAuthorizations = showAssetAuthorizations;
