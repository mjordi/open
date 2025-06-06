const { ethers, run, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment process...");
  console.log(`📡 Network: ${network.name}`);
  console.log(`🕒 Timestamp: ${new Date().toISOString()}`);

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`👤 Deploying with account: ${deployer.address}`);

  // Check deployer balance
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log(`💰 Account balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    throw new Error("❌ Deployer account has no funds");
  }

  const deploymentInfo = {
    network: network.name,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {},
  };

  console.log("\n📦 Deploying contracts...");

  try {
    // Deploy AssetTracker
    console.log("\n🔧 Deploying AssetTracker...");
    const AssetTracker = await ethers.getContractFactory("AssetTracker");
    const assetTracker = await AssetTracker.deploy();
    await assetTracker.waitForDeployment();
    
    const assetTrackerAddress = await assetTracker.getAddress();
    console.log(`✅ AssetTracker deployed to: ${assetTrackerAddress}`);
    
    deploymentInfo.contracts.AssetTracker = {
      address: assetTrackerAddress,
      txHash: assetTracker.deploymentTransaction()?.hash,
    };

    // Deploy RoleBasedAcl
    console.log("\n🔧 Deploying RoleBasedAcl...");
    const RoleBasedAcl = await ethers.getContractFactory("RoleBasedAcl");
    const roleBasedAcl = await RoleBasedAcl.deploy();
    await roleBasedAcl.waitForDeployment();
    
    const roleBasedAclAddress = await roleBasedAcl.getAddress();
    console.log(`✅ RoleBasedAcl deployed to: ${roleBasedAclAddress}`);
    
    deploymentInfo.contracts.RoleBasedAcl = {
      address: roleBasedAclAddress,
      txHash: roleBasedAcl.deploymentTransaction()?.hash,
    };

    // Deploy AccessManagement
    console.log("\n🔧 Deploying AccessManagement...");
    const AccessManagement = await ethers.getContractFactory("AccessManagement");
    const accessManagement = await AccessManagement.deploy();
    await accessManagement.waitForDeployment();
    
    const accessManagementAddress = await accessManagement.getAddress();
    console.log(`✅ AccessManagement deployed to: ${accessManagementAddress}`);
    
    deploymentInfo.contracts.AccessManagement = {
      address: accessManagementAddress,
      txHash: accessManagement.deploymentTransaction()?.hash,
    };

    // Calculate total gas used
    let totalGasUsed = 0n;
    for (const contract of Object.values(deploymentInfo.contracts)) {
      if (contract.txHash) {
        const receipt = await ethers.provider.getTransactionReceipt(contract.txHash);
        if (receipt) {
          totalGasUsed += receipt.gasUsed;
        }
      }
    }

    console.log(`\n⛽ Total gas used: ${totalGasUsed.toString()}`);
    const gasPrice = await ethers.provider.getGasPrice();
    const totalCost = totalGasUsed * gasPrice;
    console.log(`💸 Total deployment cost: ${ethers.formatEther(totalCost)} ETH`);

    deploymentInfo.gasUsed = totalGasUsed.toString();
    deploymentInfo.deploymentCost = ethers.formatEther(totalCost);

    // Save deployment info
    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    const deploymentFile = path.join(deploymentsDir, `${network.name}.json`);
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`📄 Deployment info saved to: ${deploymentFile}`);

    // Verify contracts on public networks
    if (network.name !== "hardhat" && network.name !== "localhost") {
      console.log("\n🔍 Verifying contracts...");
      
      await new Promise(resolve => setTimeout(resolve, 30000)); // Wait 30 seconds
      
      try {
        await run("verify:verify", {
          address: assetTrackerAddress,
          constructorArguments: [],
        });
        console.log("✅ AssetTracker verified");
      } catch (error) {
        console.log("❌ AssetTracker verification failed:", error.message);
      }

      try {
        await run("verify:verify", {
          address: roleBasedAclAddress,
          constructorArguments: [],
        });
        console.log("✅ RoleBasedAcl verified");
      } catch (error) {
        console.log("❌ RoleBasedAcl verification failed:", error.message);
      }

      try {
        await run("verify:verify", {
          address: accessManagementAddress,
          constructorArguments: [],
        });
        console.log("✅ AccessManagement verified");
      } catch (error) {
        console.log("❌ AccessManagement verification failed:", error.message);
      }
    }

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Summary:");
    console.log(`AssetTracker: ${assetTrackerAddress}`);
    console.log(`RoleBasedAcl: ${roleBasedAclAddress}`);
    console.log(`AccessManagement: ${accessManagementAddress}`);

    return deploymentInfo;

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    throw error;
  }
}

// Handle script execution
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main }; 