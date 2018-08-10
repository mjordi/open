$(window).on('load', function() {

    //Detecting MetaMask 
    if (typeof web3 !== 'undefined') {
        window.web3 = new Web3(web3.currentProvider);
    } else {
        var errorMsg = 'No web3? You should consider trying MetaMask!';
        $('#log').text(errorMsg);
        console.log(errorMsg);
        return;
    }    

    // Define User
    var user1Adress = web3.eth.accounts[0];
    console.log("Metamask Account: " + user1Adress);
    
    // Define Smart Contract 
    var smartContractAbi = [
        {
            "constant": false,
            "inputs": [
                {
                    "name": "entity",
                    "type": "address"
                },
                {
                    "name": "role",
                    "type": "string"
                }
            ],
            "name": "assignRole",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "entity",
                    "type": "address"
                },
                {
                    "name": "role",
                    "type": "string"
                }
            ],
            "name": "isAssignedRole",
            "outputs": [
                {
                    "name": "",
                    "type": "bool"
                }
            ],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "name": "_client",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "name": "_role",
                    "type": "string"
                }
            ],
            "name": "RoleChange",
            "type": "event"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "entity",
                    "type": "address"
                },
                {
                    "name": "role",
                    "type": "string"
                }
            ],
            "name": "unassignRole",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "constructor"
        }
    ]
    
    //Initiate Standard Smart Contract
    var smartContract = web3.eth.contract(smartContractAbi);
    var smartContractAdress ="0x478458ac84bd55221a20466457094e6db7567682";
    var smartContractInstance = smartContract.at(smartContractAdress);
    console.log("Smart Contract Adress: " + smartContractInstance.address);

    //Deploy Smart Contract
    $('#form_deploy').on('submit', function(e) {
        e.preventDefault();
        smartContractInstance = smartContract.new(
        {
            from: web3.eth.accounts[0], 
            data: '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff160217905550610726806100606000396000f300608060405260043610610057576000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff16806337798e8e1461005c578063b7dfcbee146100fd578063c936919f14610186575b600080fd5b34801561006857600080fd5b506100e3600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001908201803590602001908080601f016020809104026020016040519081016040528093929190818152602001838380828437820191505050505050919291929050505061020f565b604051808215151515815260200191505060405180910390f35b34801561010957600080fd5b50610184600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091929192905050506102cf565b005b34801561019257600080fd5b5061020d600480360381019080803573ffffffffffffffffffffffffffffffffffffffff169060200190929190803590602001908201803590602001908080601f01602080910402602001604051908101604052809392919081815260200183838082843782019150505050505091929192905050506104e4565b005b6000600160008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020826040518082805190602001908083835b6020831015156102865780518252602082019150602081019050602083039250610261565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902060009054906101000a900460ff16905092915050565b6040805190810160405280600a81526020017f737570657261646d696e00000000000000000000000000000000000000000000815250600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020816040518082805190602001908083835b60208310151561037a5780518252602082019150602081019050602083039250610355565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902060009054906101000a900460ff1615801561041557506000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614155b1561041f57600080fd5b60018060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020836040518082805190602001908083835b6020831015156104955780518252602082019150602081019050602083039250610470565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902060006101000a81548160ff021916908315150217905550505050565b6040805190810160405280600a81526020017f737570657261646d696e00000000000000000000000000000000000000000000815250600160003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020816040518082805190602001908083835b60208310151561058f578051825260208201915060208101905060208303925061056a565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902060009054906101000a900460ff1615801561062a57506000809054906101000a900473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614155b1561063457600080fd5b6000600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020836040518082805190602001908083835b6020831015156106ab5780518252602082019150602081019050602083039250610686565b6001836020036101000a038019825116818451168082178552505050505050905001915050908152602001604051809103902060006101000a81548160ff0219169083151502179055505050505600a165627a7a72305820ab71b872e4564e56e3b8086d875970a51634b61c6d34958bc388e0ade9febd410029', 
            gas: '4700000' //add gasEstimate
        }, function (e, contract){
            console.log(e, contract);
            if (typeof contract.address !== 'undefined') {
                console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);
                //smartContractAdress = contract.address;
            }
        });
    });
        
    //List User1 Adress, Balance, Smart Contract Adress  
    web3.eth.getBalance(user1Adress, function(err, balance) {
      if (err === null) {
        log = log + "Balance: " + web3.fromWei(balance, "ether") + " ETH \n";
      }
    });

    // Assign Role
    $('#form_assign').on('submit', function(e) {
		e.preventDefault();
        console.log("Assigning Role... \n");
        console.log(smartContractInstance.addresss);
        smartContractInstance.assignRole($('#address_assign').val(), $('#role_assign').val(), function(error) {});
        $('#log').text(log);
	});

    // Check Assign Role
    $('#form_isAssigned').on('submit', function(e) {
		e.preventDefault();
        log = log + "Checking Role... \n";
        var variable= smartContractInstance.isAssignedRole($('#address_isAssigned').val(), $('#role_isAssigned').val(), function(error, res) {
                console.log(error); 
                console.log(res);
                //console.log(res.c[0]); // Your "customerName"
            });
        });
        $('#log').text(log);

    // Unassign Role
    $('#form_unassign').on('submit', function(e) {
		e.preventDefault();
        log = log + "Unassigning Role... \n";
        smartContractInstance.unassignRole($('#address_unassign').val(), $('#role_unassign').val(), function(error) {});
        $('#log').text(log);
    });
    
    //Watch for role changes
    var RoleChange = smartContractInstance.RoleChange();
    RoleChange.watch(function(error, result){
        if (!error) {
            log += "The role '" + result.args._role + "' was changed for " + result.args._client  + "\n";
            $('#log').text(log);
        }
    });

});