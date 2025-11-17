window.addEventListener('load', async () => {

    //Detecting MetaMask
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
            // Request account access if needed
            await ethereum.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            // User denied account access...
            var errorMsg = 'User denied account access!';
            $('#log').text(errorMsg);
            console.error(errorMsg, error);
            return;
        }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
    }
    // Non-dapp browsers...
    else {
        var errorMsg = 'Non-Ethereum browser detected. You should consider trying MetaMask!';
        $('#log').text(errorMsg);
        console.log(errorMsg);
        return;
    }

    // Network Detection
    try {
        const networkId = await web3.eth.net.getId();
        const networkName = {
            1: 'Mainnet',
            3: 'Ropsten',
            4: 'Rinkeby',
            5: 'Goerli',
            11155111: 'Sepolia',
            1337: 'Local',
            31337: 'Hardhat'
        }[networkId] || 'Unknown';

        console.log("Connected to network:", networkName, "(ID:", networkId + ")");

        if (networkId === 1) {
            const proceed = confirm("⚠️ WARNING: You are on Ethereum Mainnet!\n\nTransactions will cost real ETH. Are you sure you want to continue?");
            if (!proceed) {
                $('#log').text('Application stopped - Connected to Mainnet');
                return;
            }
        }
    } catch (err) {
        console.error("Error detecting network:", err);
    }

    //Set User from Metamask
    const accounts = await web3.eth.getAccounts();
    var user1Address = accounts[0];
    console.log("Metamask Account: " + user1Address);
    try {
        const balance = await web3.eth.getBalance(user1Address);
        console.log("Balance: " + web3.utils.fromWei(balance, "ether") + " ETH");
    } catch (err) {
        console.error("Error getting balance:", err);
    }

    // Contract bytecode is loaded from contractBytecode.js

    //Initiate Standard Smart Contract
    var smartContract = web3.eth.contract(smartContractAbi);
    var smartContractAddress = "0x1614c607e0e36d210196941b954f9e5128f3e0f5";
    var smartContractInstance = smartContract.at(smartContractAddress);
    console.log("Default Smart Contract Address: " + smartContractInstance.address);

    //Deploy Smart Contract
    $('#form_deploy').on('submit', async function (e) {
        e.preventDefault();
        try {
            // Estimate gas for contract deployment
            const gasEstimate = await web3.eth.estimateGas({
                from: accounts[0],
                data: contractBytecode
            });
            const gasWithBuffer = Math.floor(gasEstimate * 1.2); // Add 20% buffer
            console.log(`Estimated gas: ${gasEstimate}, using: ${gasWithBuffer}`);

            smartContractInstance = smartContract.new({
                from: accounts[0],
                data: contractBytecode,
                gas: gasWithBuffer
            }, function (error, contract) {
                if (error) {
                    console.error("Contract deployment failed:", error);
                    alert("Failed to deploy contract: " + error.message);
                    return;
                }
                console.log("Contract deployment transaction:", contract);
                if (typeof contract.address !== 'undefined') {
                    console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);
                    alert('Contract deployed at: ' + contract.address);
                }
            });
        } catch (error) {
            console.error("Error estimating gas:", error);
            alert("Failed to estimate gas: " + error.message);
        }
    });

    // Set up event watchers once at initialization (prevents memory leaks)
    const assetCreateEvent = smartContractInstance.AssetCreate();
    assetCreateEvent.watch(function (error, result) {
        if (error) {
            console.error("AssetCreate event error:", error);
            return;
        }
        console.log("The asset '" + result.args.assetKey + " / " + result.args.assetDescription + "' was created by " + result.args.account);
    });

    const rejectCreateEvent = smartContractInstance.RejectCreate();
    rejectCreateEvent.watch(function (error, result) {
        if (error) {
            console.error("RejectCreate event error:", error);
            return;
        }
        console.log(result.args.message + "Serial: " + result.args.assetKey + " / Owner: " + result.args.account);
    });

    const authorizationCreateEvent = smartContractInstance.AuthorizationCreate();
    authorizationCreateEvent.watch(function (error, result) {
        if (error) {
            console.error("AuthorizationCreate event error:", error);
            return;
        }
        console.log("The role '" + result.args.authorizationRole + "' was added to the asset '" + result.args.assetKey + "' for " + result.args.account);
    });

    const authorizationRemoveEvent = smartContractInstance.AuthorizationRemove();
    authorizationRemoveEvent.watch(function (error, result) {
        if (error) {
            console.error("AuthorizationRemove event error:", error);
            return;
        }
        console.log("The role was removed from the asset '" + result.args.assetKey + "' for " + result.args.account);
    });

    const accessLogEvent = smartContractInstance.AccessLog();
    accessLogEvent.watch(function (error, result) {
        if (error) {
            console.error("AccessLog event error:", error);
            return;
        }
        if (result.args.accessGranted) {
            console.log("Access was granted to " + result.args.account + " for the Asset '" + result.args.assetKey + "'");
        } else {
            console.log("Access was NOT granted to " + result.args.account + " for the Asset '" + result.args.assetKey + "'");
        }
    });

    //Add Asset
    $('#form_asset').on('submit', async function (e) {
        e.preventDefault();
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.text();

        try {
            // Set loading state
            submitButton.prop('disabled', true).text('Processing...');

            console.log("Adding Asset to Smart Contract '" + smartContractInstance.address + "'... \n");

            const txHash = await new Promise((resolve, reject) => {
                smartContractInstance.newAsset($('#assetKey').val(), $('#assetDescription').val(), function (error, result) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

            console.log("Asset creation transaction sent:", txHash);
            submitButton.text('Waiting for confirmation...');

            // Wait for transaction confirmation
            const receipt = await waitForTransactionReceipt(txHash);

            if (receipt && receipt.status) {
                console.log("✓ Transaction confirmed in block:", receipt.blockNumber);
                alert("✓ Asset created successfully!");
            } else {
                console.error("✗ Transaction failed");
                alert("✗ Transaction failed. Please check the console for details.");
            }
        } catch (error) {
            console.error("Failed to create asset:", error);
            alert("Failed to create asset: " + error.message);
        } finally {
            // Reset button state
            submitButton.prop('disabled', false).text(originalText);
        }
    });

    //Add Authorization
    $('#form_assign').on('submit', async function (e) {
        e.preventDefault();
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.text();

        try {
            submitButton.prop('disabled', true).text('Processing...');

            console.log("Assigning Role in Smart Contract '" + smartContractInstance.address + "'... \n");

            const txHash = await new Promise((resolve, reject) => {
                smartContractInstance.addAuthorization($('#assetKey_assign').val(), $('#address_assign').val(), $('#role_assign').val(), function (error, result) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

            console.log("Authorization transaction sent:", txHash);
            submitButton.text('Waiting for confirmation...');

            const receipt = await waitForTransactionReceipt(txHash);

            if (receipt && receipt.status) {
                console.log("✓ Transaction confirmed in block:", receipt.blockNumber);
                alert("✓ Authorization added successfully!");
            } else {
                console.error("✗ Transaction failed");
                alert("✗ Transaction failed. Please check the console for details.");
            }
        } catch (error) {
            console.error("Failed to add authorization:", error);
            alert("Failed to add authorization: " + error.message);
        } finally {
            submitButton.prop('disabled', false).text(originalText);
        }
    });

    //Check Role
    $('#form_isAssigned').on('submit', function (e) {
        e.preventDefault();
        console.log("Checking Role in Smart Contract '" + smartContractInstance.address + "'... \n");
        smartContractInstance.getAssetAuthorization($('#assetKey_isAssigned').val(), $('#address_isAssigned').val(), function (error, res) {
            if (error) {
                console.error("Failed to check authorization:", error);
                alert("Failed to check authorization: " + error.message);
                return;
            }
            console.log("Authorization role:", res);
        });
    });

    //Access the Asset
    $('#form_access').on('submit', function (e) {
        e.preventDefault();
        console.log("Try to access in Smart Contract '" + smartContractInstance.address + "'... \n");
        smartContractInstance.getAccess($('#assetKey_access').val(), function (error, result) {
            if (error) {
                console.error("Failed to check access:", error);
                alert("Failed to check access: " + error.message);
                return;
            }
            console.log("Access check transaction sent:", result);
        });
    });

    //Remove Authorization
    $('#form_unassign').on('submit', async function (e) {
        e.preventDefault();
        const submitButton = $(this).find('button[type="submit"]');
        const originalText = submitButton.text();

        try {
            submitButton.prop('disabled', true).text('Processing...');

            console.log("Unassigning Role in Smart Contract '" + smartContractInstance.address + "'... \n");

            const txHash = await new Promise((resolve, reject) => {
                smartContractInstance.removeAuthorization($('#assetKey_unassign').val(), $('#address_unassign').val(), function (error, result) {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });

            console.log("Remove authorization transaction sent:", txHash);
            submitButton.text('Waiting for confirmation...');

            const receipt = await waitForTransactionReceipt(txHash);

            if (receipt && receipt.status) {
                console.log("✓ Transaction confirmed in block:", receipt.blockNumber);
                alert("✓ Authorization removed successfully!");
            } else {
                console.error("✗ Transaction failed");
                alert("✗ Transaction failed. Please check the console for details.");
            }
        } catch (error) {
            console.error("Failed to remove authorization:", error);
            alert("Failed to remove authorization: " + error.message);
        } finally {
            submitButton.prop('disabled', false).text(originalText);
        }
    });

    // Helper function to wait for transaction receipt
    async function waitForTransactionReceipt(txHash, maxAttempts = 60) {
        for (let i = 0; i < maxAttempts; i++) {
            try {
                const receipt = await web3.eth.getTransactionReceipt(txHash);
                if (receipt) {
                    return receipt;
                }
                // Wait 1 second before trying again
                await new Promise(resolve => setTimeout(resolve, 1000));
            } catch (error) {
                console.error("Error getting transaction receipt:", error);
            }
        }
        console.warn("Transaction receipt not found after", maxAttempts, "attempts");
        return null;
    }

    // List all assets function
    window.listAllAssets = async function() {
        try {
            console.log("Fetching all assets...");
            const assetCount = await new Promise((resolve, reject) => {
                smartContractInstance.getAssetCount(function (error, result) {
                    if (error) reject(error);
                    else resolve(result);
                });
            });

            console.log(`Found ${assetCount} asset(s)`);
            const assets = [];

            for (let i = 0; i < assetCount; i++) {
                const assetKey = await new Promise((resolve, reject) => {
                    smartContractInstance.getAssetAtIndex(i, function (error, result) {
                        if (error) reject(error);
                        else resolve(result);
                    });
                });

                const asset = await new Promise((resolve, reject) => {
                    smartContractInstance.getAsset(assetKey, function (error, result) {
                        if (error) reject(error);
                        else resolve(result);
                    });
                });

                assets.push({
                    key: assetKey,
                    owner: asset[0],
                    description: asset[1],
                    initialized: asset[2],
                    authorizationCount: asset[3].toString()
                });
            }

            console.table(assets);
            return assets;
        } catch (error) {
            console.error("Error listing assets:", error);
            return [];
        }
    };

    // List authorizations for an asset
    window.listAssetAuthorizations = async function(assetKey) {
        try {
            console.log(`Fetching authorizations for asset: ${assetKey}`);
            const authCount = await new Promise((resolve, reject) => {
                smartContractInstance.getAssetAuthorizationCount(assetKey, function (error, result) {
                    if (error) reject(error);
                    else resolve(result);
                });
            });

            console.log(`Found ${authCount} authorization(s)`);
            const authorizations = [];

            for (let i = 0; i < authCount; i++) {
                const address = await new Promise((resolve, reject) => {
                    smartContractInstance.getAssetAuthorizationAtIndex(assetKey, i, function (error, result) {
                        if (error) reject(error);
                        else resolve(result);
                    });
                });

                const role = await new Promise((resolve, reject) => {
                    smartContractInstance.getAssetAuthorization(assetKey, address, function (error, result) {
                        if (error) reject(error);
                        else resolve(result);
                    });
                });

                authorizations.push({
                    address: address,
                    role: role
                });
            }

            console.table(authorizations);
            return authorizations;
        } catch (error) {
            console.error("Error listing authorizations:", error);
            return [];
        }
    };

    // Get event history for an asset
    window.getAssetHistory = async function(assetKey) {
        try {
            console.log(`Fetching event history for asset: ${assetKey || 'all assets'}`);

            const filter = assetKey ? { assetKey: assetKey } : {};

            const events = await smartContractInstance.getPastEvents('allEvents', {
                filter: filter,
                fromBlock: 0,
                toBlock: 'latest'
            });

            const history = events.map(event => ({
                event: event.event,
                block: event.blockNumber,
                txHash: event.transactionHash,
                args: event.returnValues
            }));

            console.log(`Found ${history.length} event(s)`);
            console.table(history);
            return history;
        } catch (error) {
            console.error("Error fetching event history:", error);
            return [];
        }
    };

    // Make functions available in console
    console.log("\n=== Available Functions ===");
    console.log("listAllAssets() - List all assets in the system");
    console.log("listAssetAuthorizations(assetKey) - List all authorizations for an asset");
    console.log("getAssetHistory(assetKey) - Get event history for an asset (or all if no key provided)");
    console.log("===========================\n");
});
