import hre from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🚀 Starting deployment process...');
  console.log(`📡 Network: ${hre.network.name}`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);

  // Connect to network and get ethers
  const { ethers } = await hre.network.connect();

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  if (!deployer) {
    throw new Error(
      '❌ No deployer account found. Please check your Hardhat configuration and ensure a private key is provided.'
    );
  }
  console.log(`👤 Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error('❌ Deployer account has no funds');
  }

  const deploymentInfo = {
    network: hre.network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  console.log('\n📦 Deploying contracts...');

  try {
    // Deploy AssetTracker
    console.log('\n🔧 Deploying AssetTracker...');
    const AssetTracker = await ethers.getContractFactory('AssetTracker');
    const assetTracker = await AssetTracker.deploy();
    await assetTracker.waitForDeployment();

    const assetTrackerAddress = await assetTracker.getAddress();
    console.log(`✅ AssetTracker deployed to: ${assetTrackerAddress}`);

    deploymentInfo.contracts.AssetTracker = {
      address: assetTrackerAddress,
      txHash: assetTracker.deploymentTransaction()?.hash,
    };

    // Deploy RoleBasedAcl
    console.log('\n🔧 Deploying RoleBasedAcl...');
    const RoleBasedAcl = await ethers.getContractFactory('RoleBasedAcl');
    const roleBasedAcl = await RoleBasedAcl.deploy();
    await roleBasedAcl.waitForDeployment();

    const roleBasedAclAddress = await roleBasedAcl.getAddress();
    console.log(`✅ RoleBasedAcl deployed to: ${roleBasedAclAddress}`);

    deploymentInfo.contracts.RoleBasedAcl = {
      address: roleBasedAclAddress,
      txHash: roleBasedAcl.deploymentTransaction()?.hash,
    };

    // Deploy AccessManagement
    console.log('\n🔧 Deploying AccessManagement...');
    const AccessManagement = await ethers.getContractFactory('AccessManagement');
    const accessManagement = await AccessManagement.deploy();
    await accessManagement.waitForDeployment();

    const accessManagementAddress = await accessManagement.getAddress();
    console.log(`✅ AccessManagement deployed to: ${accessManagementAddress}`);

    deploymentInfo.contracts.AccessManagement = {
      address: accessManagementAddress,
      txHash: accessManagement.deploymentTransaction()?.hash,
    };

    // Calculate total gas used and cost
    let totalGasUsed = 0n;
    let totalDeploymentCost = 0n;
    for (const contract of Object.values(deploymentInfo.contracts)) {
      if (contract.txHash) {
        const receipt = await ethers.provider.getTransactionReceipt(contract.txHash);
        if (receipt) {
          totalGasUsed += receipt.gasUsed;
          // In ethers v6, the receipt contains the effective gas price
          if (receipt.gasPrice) {
            totalDeploymentCost += receipt.gasUsed * receipt.gasPrice;
          }
        }
      }
    }

    console.log(`\n⛽ Total gas used: ${totalGasUsed.toString()}`);
    if (totalDeploymentCost > 0n) {
      console.log(`💸 Total deployment cost: ${ethers.formatEther(totalDeploymentCost)} ETH`);
    }

    deploymentInfo.gasUsed = totalGasUsed.toString();
    deploymentInfo.deploymentCost = ethers.formatEther(totalDeploymentCost);

    // Save deployment info
    const deploymentsDir = path.join(__dirname, '..', 'deployments');
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${hre.network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Deployment info saved to: ${deploymentFile}`);

    // Verify contracts on public networks
    if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
      console.log('\n🔍 Verifying contracts...');

      await new Promise((resolve) => setTimeout(resolve, 30000)); // Wait 30 seconds

      try {
        await run('verify:verify', {
          address: assetTrackerAddress,
          constructorArguments: [],
        });
        console.log('✅ AssetTracker verified');
      } catch (error) {
        console.log('❌ AssetTracker verification failed:', error.message);
      }

      try {
        await run('verify:verify', {
          address: roleBasedAclAddress,
          constructorArguments: [],
        });
        console.log('✅ RoleBasedAcl verified');
      } catch (error) {
        console.log('❌ RoleBasedAcl verification failed:', error.message);
      }

      try {
        await run('verify:verify', {
          address: accessManagementAddress,
          constructorArguments: [],
        });
        console.log('✅ AccessManagement verified');
      } catch (error) {
        console.log('❌ AccessManagement verification failed:', error.message);
      }
    }

    console.log('\n🎉 Deployment completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`AssetTracker: ${assetTrackerAddress}`);
    console.log(`RoleBasedAcl: ${roleBasedAclAddress}`);
    console.log(`AccessManagement: ${accessManagementAddress}`);

    return deploymentInfo;
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main };
