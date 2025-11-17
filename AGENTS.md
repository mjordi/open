# AGENTS Instructions

This repository contains Solidity smart contracts (version 0.4.x) for blockchain-based access management and a web frontend for interaction. These instructions provide guidance for AI agents working on this codebase.

## Table of Contents

- [Project Overview](#project-overview)
- [Technology Stack](#technology-stack)
- [Development Guidelines](#development-guidelines)
- [Smart Contract Guidelines](#smart-contract-guidelines)
- [Frontend Guidelines](#frontend-guidelines)
- [Testing Approach](#testing-approach)
- [Deployment Guidelines](#deployment-guidelines)
- [Common Tasks](#common-tasks)
- [Security Considerations](#security-considerations)

## Project Overview

This is a blockchain access management system featuring:

- **AssetTracker**: Basic asset creation and ownership transfer (Solidity ^0.4.10)
- **RoleBasedAcl**: Simple role-based access control (Solidity ^0.4.10)
- **AccessManagement (aaas.sol)**: Comprehensive authorization management (Solidity ^0.4.24)
- **Web Frontend**: jQuery/Bootstrap interface with Web3 integration

## Technology Stack

### Smart Contracts
- **Solidity**: `^0.4.10` and `^0.4.24`
- **Compiler**: solc 0.4.x
- **Development**: Remix IDE, Truffle (optional)

### Frontend
- **HTML5**: Semantic markup
- **JavaScript**: ES5 compatible
- **jQuery**: v3.2.1
- **Bootstrap**: v4.x
- **Web3.js**: Ethereum JavaScript API
- **MetaMask**: Browser wallet integration

### No Build Tools
- No npm/yarn configuration
- No bundler (Webpack, Rollup)
- No transpilation (Babel)
- Static file serving only

## Development Guidelines

### Environment Setup

1. **Solidity Compiler:**
   ```bash
   npm install -g solc@0.4.24
   ```

2. **Local Web Server:**
   ```bash
   # Python 3
   python3 -m http.server 8000

   # Node.js
   npx http-server -p 8000
   ```

3. **MetaMask:**
   - Install browser extension
   - Connect to appropriate network (testnet/local)

### File Organization

Keep the flat file structure:
```
/
├── *.sol          # Smart contracts in root
├── *.js           # JavaScript files in root
├── *.css          # Stylesheets in root
├── *.html         # HTML files in root
└── assets/        # Images, icons, etc.
```

## Smart Contract Guidelines

### Solidity 0.4.x Specifics

#### Function Visibility
Always declare function visibility explicitly:
```solidity
// Good
function myFunction() public returns (bool) { }
function _internal() internal returns (bool) { }

// Bad (implicit public)
function myFunction() returns (bool) { }
```

#### Constructor Syntax
Use contract name as constructor (pre-0.5.0 syntax):
```solidity
contract MyContract {
    function MyContract() public {
        // Constructor code
    }
}
```

#### Error Handling
Use `throw`, `require`, or `assert`:
```solidity
// Legacy (0.4.10)
if (condition) {
    throw;
}

// Preferred (0.4.24+)
require(condition, "Error message");
```

#### Storage vs Memory
Be explicit about data location for complex types:
```solidity
function processData(string memory data) public {
    string storage storedData = myMapping[key];
}
```

### Coding Standards

#### Naming Conventions
- **Contracts**: PascalCase (`AssetTracker`)
- **Functions**: camelCase (`createAsset`)
- **Variables**: camelCase (`assetStore`)
- **Constants**: UPPER_SNAKE_CASE (`MAX_SUPPLY`)
- **Events**: PascalCase (`AssetCreate`)
- **Modifiers**: camelCase (`hasRole`)

#### Code Structure
```solidity
pragma solidity ^0.4.24;

contract ContractName {
    // State variables
    address public owner;
    mapping(address => bool) private authorized;
    
    // Events
    event Action(address indexed user, string data);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
    
    // Constructor
    function ContractName() public {
        owner = msg.sender;
    }
    
    // Public functions
    function publicFunction() public { }
    
    // Internal functions
    function _internalFunction() internal { }
}
```

### Security Best Practices

1. **Integer Overflow/Underflow:**
   - Solidity 0.4.x has NO automatic checks
   - Use SafeMath library for arithmetic
   - Manually check bounds

2. **Reentrancy:**
   - Update state before external calls
   - Use checks-effects-interactions pattern

3. **Access Control:**
   - Always use modifiers for permissions
   - Verify msg.sender appropriately

4. **Gas Optimization:**
   - Minimize storage writes
   - Use `memory` for temporary data
   - Batch operations when possible

5. **Event Emission:**
   - Emit events for all state changes
   - Include indexed parameters for filtering

### Common Patterns

#### Access Control Pattern
```solidity
address public owner;

modifier onlyOwner() {
    require(msg.sender == owner);
    _;
}

function restrictedFunction() public onlyOwner {
    // Only owner can call
}
```

#### Initialization Check Pattern
```solidity
struct Data {
    bool initialized;
    // other fields
}

mapping(string => Data) private store;

function create(string key) public {
    require(!store[key].initialized, "Already exists");
    store[key].initialized = true;
}
```

## Frontend Guidelines

### JavaScript Style

- **ES5 Compatibility**: No ES6+ features (arrow functions, const/let, etc.)
- **jQuery**: Use for DOM manipulation
- **Web3.js**: For blockchain interaction
- **Global Scope**: Manage carefully, avoid pollution

#### Code Style
```javascript
// Variable declarations
var contractAddress = '0x...';
var contractABI = [...];

// Function declarations
function initializeContract() {
    var contract = new web3.eth.Contract(contractABI, contractAddress);
    return contract;
}

// Event handlers
$('#createButton').on('click', function(event) {
    event.preventDefault();
    createAsset();
});
```

### Web3 Integration

#### Checking for Web3 Provider
```javascript
if (typeof web3 !== 'undefined') {
    web3 = new Web3(web3.currentProvider);
} else {
    console.log('No web3 provider detected');
    // Show message to user
}
```

#### Contract Interaction
```javascript
// Read-only call (doesn't cost gas)
contract.methods.getAsset(assetKey).call(function(error, result) {
    if (!error) {
        console.log('Asset:', result);
    }
});

// Transaction (costs gas)
contract.methods.createAsset(name, desc, uuid, mfg)
    .send({ from: userAddress }, function(error, txHash) {
        if (!error) {
            console.log('Transaction:', txHash);
        }
    });
```

#### Event Listening
```javascript
contract.events.AssetCreate({
    fromBlock: 'latest'
}, function(error, event) {
    if (!error) {
        console.log('Asset created:', event.returnValues);
    }
});
```

### HTML/CSS Guidelines

- Use semantic HTML5 elements
- Bootstrap 4 classes for styling
- Responsive design principles
- Accessible forms and buttons

## Testing Approach

### Manual Testing

Since there's no automated test framework:

1. **Deploy to Testnet:**
   - Use Remix IDE or Truffle
   - Deploy to Ropsten, Rinkeby, or local network

2. **Test Each Function:**
   - Create test accounts with MetaMask
   - Execute all contract functions
   - Verify events are emitted
   - Check state changes

3. **Test Frontend:**
   - Connect MetaMask to testnet
   - Test all UI interactions
   - Verify error messages display
   - Test on different browsers

### Testing Checklist

- [ ] AssetTracker: Create asset with unique UUID
- [ ] AssetTracker: Reject duplicate UUID
- [ ] AssetTracker: Transfer asset to another address
- [ ] AssetTracker: Reject transfer from non-owner
- [ ] RoleBasedAcl: Assign role as superadmin
- [ ] RoleBasedAcl: Unassign role as superadmin
- [ ] RoleBasedAcl: Reject role operations from non-superadmin
- [ ] AccessManagement: Create new asset
- [ ] AccessManagement: Add authorization to asset
- [ ] AccessManagement: Remove authorization from asset
- [ ] AccessManagement: Check access for authorized user
- [ ] AccessManagement: Reject access for unauthorized user
- [ ] Frontend: Connect MetaMask
- [ ] Frontend: Display contract data
- [ ] Frontend: Submit transactions
- [ ] Frontend: Show transaction confirmations

## Deployment Guidelines

### Pre-Deployment Checklist

1. **Code Review:**
   - Check all require statements
   - Verify access control modifiers
   - Review event emissions
   - Check for integer overflow risks

2. **Compilation:**
   ```bash
   solc --optimize --abi --bin ContractName.sol
   ```

3. **Test Network Deployment:**
   - Deploy to Ropsten or Rinkeby first
   - Test all functions thoroughly
   - Monitor gas costs

4. **Frontend Configuration:**
   - Update contract addresses in JS files
   - Update ABI if contracts changed
   - Test web interface with deployed contracts

### Deployment Steps

1. **Compile Contracts:**
   ```bash
   solc --abi --bin AssetTracker.sol -o build/
   solc --abi --bin RoleBasedAcl.sol -o build/
   solc --abi --bin aaas.sol -o build/
   ```

2. **Deploy via Remix:**
   - Open Remix IDE
   - Load contract source
   - Select Injected Web3 provider
   - Deploy with MetaMask

3. **Update Frontend:**
   ```javascript
   // In user2.js
   var contractAddress = '0xDeployedContractAddress';
   var contractABI = [ /* paste ABI here */ ];
   ```

4. **Verify Contracts:**
   - Verify on Etherscan (testnet/mainnet)
   - Check contract code is correct
   - Test interactions

## Common Tasks

### Adding a New Contract

1. Create `.sol` file in root directory
2. Use appropriate Solidity version pragma
3. Follow existing contract patterns
4. Test thoroughly on testnet
5. Update frontend if needed
6. Update README.md documentation

### Modifying Existing Contract

1. **IMPORTANT**: Contracts are immutable once deployed
2. Test changes extensively on local network
3. Deploy new version to testnet
4. Update frontend to use new address
5. Migration strategy for existing data

### Adding Frontend Features

1. Add HTML elements to `index.html`
2. Style with Bootstrap classes or custom CSS
3. Add JavaScript functions to `user2.js`
4. Use Web3.js for contract interaction
5. Handle errors gracefully
6. Update user feedback messages

### Updating Contract ABI

After redeploying contracts:
```bash
# Extract ABI
solc --abi aaas.sol

# Update abi_aaas.js
# Paste new ABI into JavaScript file
```

## Security Considerations

### Critical Vulnerabilities to Avoid

1. **Integer Overflow/Underflow:**
   ```solidity
   // Vulnerable
   uint256 balance = balances[user];
   balance += amount; // Can overflow!
   
   // Safe (use SafeMath)
   balance = balance.add(amount);
   ```

2. **Reentrancy:**
   ```solidity
   // Vulnerable
   function withdraw() public {
       uint amount = balances[msg.sender];
       msg.sender.call.value(amount)(); // External call first!
       balances[msg.sender] = 0;        // State change after
   }
   
   // Safe
   function withdraw() public {
       uint amount = balances[msg.sender];
       balances[msg.sender] = 0;        // State change first
       msg.sender.transfer(amount);     // External call after
   }
   ```

3. **Access Control:**
   ```solidity
   // Always check permissions
   function sensitiveOperation() public {
       require(msg.sender == owner, "Not authorized");
       // Operation logic
   }
   ```

4. **Unchecked External Calls:**
   ```solidity
   // Check return values
   bool success = address.call();
   require(success, "Call failed");
   ```

### Auditing Guidelines

Before deployment:
- Review all state-changing functions
- Check all access control modifiers
- Verify event emissions
- Test edge cases (zero values, max values)
- Check for unused variables or functions
- Verify gas optimization doesn't compromise security

## Limitations of Solidity 0.4.x

Be aware of these limitations:

1. **No SafeMath Built-in**: Must use library or manual checks
2. **Older Constructor Syntax**: Contract name, not `constructor` keyword
3. **Less Strict Compiler**: Missing some safety checks of 0.8.x
4. **`throw` Deprecated**: Use `require`/`revert`/`assert`
5. **No `immutable` Keyword**: Available from 0.6.5+
6. **Limited Error Messages**: String-based only

## Recommendations for AI Agents

1. **Maintain Simplicity**: No build tools, keep it simple
2. **Test on Testnet**: Always test before mainnet
3. **Document Changes**: Update README for any changes
4. **Security First**: Double-check access control
5. **Gas Awareness**: Monitor gas costs in testing
6. **Event-Driven**: Emit events for all important actions
7. **Error Handling**: Provide clear error messages
8. **Frontend UX**: Handle loading states and errors gracefully

## Getting Help

- [Solidity 0.4.x Documentation](https://docs.soliditylang.org/en/v0.4.24/)
- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [OpenZeppelin Contracts (0.4.x compatible)](https://github.com/OpenZeppelin/openzeppelin-contracts/tree/release-v1.12.0)
- [MetaMask Documentation](https://docs.metamask.io/)

## Upgrade Path

For future improvements, consider:
- Migrating to Solidity 0.8.x
- Adding Hardhat or Truffle for testing
- Implementing automated test suite
- Adding linters (Solhint, ESLint)
- Using modern JavaScript (ES6+)
- Implementing upgradeable contracts
- Adding CI/CD pipeline

Follow these instructions when modifying or extending the codebase.
