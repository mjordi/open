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
    $('#form_asset').on('submit', function (e) {
        e.preventDefault();
        console.log("Adding Asset to Smart Contract '" + smartContractInstance.address + "'... \n");
        smartContractInstance.newAsset($('#assetKey').val(), $('#assetDescription').val(), function (error, result) {
            if (error) {
                console.error("Failed to create asset:", error);
                alert("Failed to create asset: " + error.message);
                return;
            }
            console.log("Asset creation transaction sent:", result);
        });
    });

    //Add Authorization
    $('#form_assign').on('submit', function (e) {
        e.preventDefault();
        console.log("Assigning Role in Smart Contract '" + smartContractInstance.address + "'... \n");
        smartContractInstance.addAuthorization($('#assetKey_assign').val(), $('#address_assign').val(), $('#role_assign').val(), function (error, result) {
            if (error) {
                console.error("Failed to add authorization:", error);
                alert("Failed to add authorization: " + error.message);
                return;
            }
            console.log("Authorization transaction sent:", result);
        });
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
    $('#form_unassign').on('submit', function (e) {
        e.preventDefault();
        console.log("Unassigning Role in Smart Contract '" + smartContractInstance.address + "'... \n");
        smartContractInstance.removeAuthorization($('#assetKey_unassign').val(), $('#address_unassign').val(), function (error, result) {
            if (error) {
                console.error("Failed to remove authorization:", error);
                alert("Failed to remove authorization: " + error.message);
                return;
            }
            console.log("Remove authorization transaction sent:", result);
        });
    });
});
