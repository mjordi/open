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
    var user1Adress = "0x46e2aB674C9a1F5A7846b22AcdBE268B85ce793f";
	var userAbi = [
        {
            "constant": true,
            "inputs": [],
            "name": "wallet",
            "outputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "price",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "operatorBackend",
            "outputs": [
                {
                    "name": "",
                    "type": "address"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": true,
            "inputs": [],
            "name": "myBalance",
            "outputs": [
                {
                    "name": "",
                    "type": "uint256"
                }
            ],
            "payable": false,
            "stateMutability": "view",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_kWh",
                    "type": "uint256"
                },
                {
                    "name": "_totalPrice",
                    "type": "uint256"
                }
            ],
            "name": "buyEnergy",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [],
            "name": "payForEnergy",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_operatorBackend",
                    "type": "address"
                },
                {
                    "name": "_wallet",
                    "type": "address"
                }
            ],
            "name": "setUp",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "constant": false,
            "inputs": [
                {
                    "name": "_dest",
                    "type": "address"
                },
                {
                    "name": "_amount",
                    "type": "uint256"
                }
            ],
            "name": "transferTokens",
            "outputs": [],
            "payable": false,
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    var user = web3.eth.contract(userAbi).at(user1Adress);
    
    // Define Smart Contract
    var smartContractAdress ="0x478458ac84bd55221a20466457094e6db7567682";
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
    var smartContract = web3.eth.contract(smartContractAbi).at(smartContractAdress);
    
    //List User1 Adress, Balance, Smart Contract Adress 
    var log = "Account of Smart Contract Owner: " + user1Adress + "\n";
    web3.eth.getBalance(user1Adress, function(err, balance) {
      if (err === null) {
        log = log + "Balance: " + web3.fromWei(balance, "ether") + " ETH \n";
      }
    });
    log = log + "Smart Contract: \n" + smartContractAdress;

    // Assign Role
    $('#form_assign').on('submit', function(e) {
		e.preventDefault();
        log = log + "Assigning Role... \n";
        smartContract.assignRole($('#address_assign').val(), $('#role_assign').val(), function(error) {});
        $('#log').text(log);
	});

    // Check Assign Role
    $('#form_isAssigned').on('submit', function(e) {
		e.preventDefault();
        log = log + "Checking Role... \n";
        var variable= smartContract.isAssignedRole($('#address_isAssigned').val(), $('#role_isAssigned').val(), function(error, res) {
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
        smartContract.unassignRole($('#address_unassign').val(), $('#role_unassign').val(), function(error) {});
        $('#log').text(log);
    });
    
    //Watch for role changes
    var RoleChange = smartContract.RoleChange();
    RoleChange.watch(function(error, result){
        if (!error) {
            log += "The role '" + result.args._role + "' was changed for " + result.args._client  + "\n";
            $('#log').text(log);
        }
    });

});