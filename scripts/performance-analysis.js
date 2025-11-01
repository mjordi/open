import { ethers } from 'hardhat';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Performance Analysis Script
 * Compares gas usage between original and optimized contracts
 */
async function main() {
  console.log('🔍 Starting Performance Analysis...\n');

  const [, /* deployer */ user1 /* user2 */] = await ethers.getSigners();

  // Deploy original contracts
  console.log('📦 Deploying Original Contracts...');
  const AssetTracker = await ethers.getContractFactory('AssetTracker');
  const RoleBasedAcl = await ethers.getContractFactory('RoleBasedAcl');
  const AccessManagement = await ethers.getContractFactory('AccessManagement');

  const assetTracker = await AssetTracker.deploy();
  const roleBasedAcl = await RoleBasedAcl.deploy();
  const accessManagement = await AccessManagement.deploy();

  await assetTracker.waitForDeployment();
  await roleBasedAcl.waitForDeployment();
  await accessManagement.waitForDeployment();

  // Deploy optimized contracts
  console.log('📦 Deploying Optimized Contracts...');
  const AssetTrackerOptimized = await ethers.getContractFactory('AssetTrackerOptimized');
  const assetTrackerOpt = await AssetTrackerOptimized.deploy();
  await assetTrackerOpt.waitForDeployment();

  console.log('✅ All contracts deployed\n');

  // Performance comparison object
  const performance = {
    deployment: {},
    operations: {},
    storage: {},
  };

  // 1. Deployment Gas Comparison
  console.log('📊 Deployment Gas Analysis:');

  const originalDeployTx = assetTracker.deploymentTransaction();
  const optimizedDeployTx = assetTrackerOpt.deploymentTransaction();

  if (originalDeployTx && optimizedDeployTx) {
    const originalReceipt = await ethers.provider.getTransactionReceipt(originalDeployTx.hash);
    const optimizedReceipt = await ethers.provider.getTransactionReceipt(optimizedDeployTx.hash);

    performance.deployment.original = originalReceipt.gasUsed;
    performance.deployment.optimized = optimizedReceipt.gasUsed;
    performance.deployment.savings = originalReceipt.gasUsed - optimizedReceipt.gasUsed;
    performance.deployment.percentSavings = (
      (Number(performance.deployment.savings) / Number(performance.deployment.original)) *
      100
    ).toFixed(2);

    console.log(`Original AssetTracker: ${performance.deployment.original.toString()} gas`);
    console.log(`Optimized AssetTracker: ${performance.deployment.optimized.toString()} gas`);
    console.log(
      `Deployment Savings: ${performance.deployment.savings.toString()} gas (${
        performance.deployment.percentSavings
      }%)\n`
    );
  }

  // 2. Operation Gas Comparison
  console.log('⚡ Operation Gas Analysis:');

  // Asset creation comparison
  console.log('Testing asset creation...');
  const assetData = {
    name: 'Performance Test Asset',
    description: 'Asset for performance testing',
    uuid: 'perf-test-001',
    manufacturer: 'Test Manufacturer',
  };

  try {
    // Original contract
    const originalCreateTx = await assetTracker.createAsset(
      assetData.name,
      assetData.description,
      assetData.uuid,
      assetData.manufacturer
    );
    const originalCreateReceipt = await originalCreateTx.wait();

    // Optimized contract
    const optimizedCreateTx = await assetTrackerOpt.createAsset(
      assetData.name,
      assetData.description,
      assetData.uuid + '-opt',
      assetData.manufacturer
    );
    const optimizedCreateReceipt = await optimizedCreateTx.wait();

    performance.operations.createAsset = {
      original: originalCreateReceipt.gasUsed,
      optimized: optimizedCreateReceipt.gasUsed,
      savings: originalCreateReceipt.gasUsed - optimizedCreateReceipt.gasUsed,
    };
    performance.operations.createAsset.percentSavings = (
      (Number(performance.operations.createAsset.savings) /
        Number(performance.operations.createAsset.original)) *
      100
    ).toFixed(2);

    console.log(
      `Create Asset - Original: ${performance.operations.createAsset.original.toString()} gas`
    );
    console.log(
      `Create Asset - Optimized: ${performance.operations.createAsset.optimized.toString()} gas`
    );
    console.log(
      `Create Asset Savings: ${performance.operations.createAsset.savings.toString()} gas (${
        performance.operations.createAsset.percentSavings
      }%)`
    );
  } catch (error) {
    console.log('⚠️  Asset creation test failed:', error.message);
  }

  // Asset transfer comparison
  console.log('\nTesting asset transfer...');
  try {
    // Original contract transfer
    const originalTransferTx = await assetTracker.transferAsset(user1.address, assetData.uuid);
    const originalTransferReceipt = await originalTransferTx.wait();

    // Optimized contract transfer
    const optimizedTransferTx = await assetTrackerOpt.transferAsset(
      user1.address,
      assetData.uuid + '-opt'
    );
    const optimizedTransferReceipt = await optimizedTransferTx.wait();

    performance.operations.transferAsset = {
      original: originalTransferReceipt.gasUsed,
      optimized: optimizedTransferReceipt.gasUsed,
      savings: originalTransferReceipt.gasUsed - optimizedTransferReceipt.gasUsed,
    };
    performance.operations.transferAsset.percentSavings = (
      (Number(performance.operations.transferAsset.savings) /
        Number(performance.operations.transferAsset.original)) *
      100
    ).toFixed(2);

    console.log(
      `Transfer Asset - Original: ${performance.operations.transferAsset.original.toString()} gas`
    );
    console.log(
      `Transfer Asset - Optimized: ${performance.operations.transferAsset.optimized.toString()} gas`
    );
    console.log(
      `Transfer Asset Savings: ${performance.operations.transferAsset.savings.toString()} gas (${
        performance.operations.transferAsset.percentSavings
      }%)`
    );
  } catch (error) {
    console.log('⚠️  Asset transfer test failed:', error.message);
  }

  // 3. Bulk Operations Test
  console.log('\n🔄 Bulk Operations Test:');
  const bulkTestSize = 5;
  let originalBulkGas = 0n;
  let optimizedBulkGas = 0n;

  try {
    // Bulk operations on original contract
    for (let i = 0; i < bulkTestSize; i++) {
      const tx = await assetTracker.createAsset(
        `Bulk Asset ${i}`,
        `Description ${i}`,
        `bulk-${i}`,
        `Manufacturer ${i}`
      );
      const receipt = await tx.wait();
      originalBulkGas += receipt.gasUsed;
    }

    // Bulk operations on optimized contract
    for (let i = 0; i < bulkTestSize; i++) {
      const tx = await assetTrackerOpt.createAsset(
        `Bulk Asset ${i}`,
        `Description ${i}`,
        `bulk-opt-${i}`,
        `Manufacturer ${i}`
      );
      const receipt = await tx.wait();
      optimizedBulkGas += receipt.gasUsed;
    }

    const bulkSavings = originalBulkGas - optimizedBulkGas;
    const bulkPercentSavings = ((Number(bulkSavings) / Number(originalBulkGas)) * 100).toFixed(2);

    console.log(`Bulk ${bulkTestSize} assets - Original: ${originalBulkGas.toString()} gas`);
    console.log(`Bulk ${bulkTestSize} assets - Optimized: ${optimizedBulkGas.toString()} gas`);
    console.log(`Bulk Savings: ${bulkSavings.toString()} gas (${bulkPercentSavings}%)`);

    performance.operations.bulk = {
      original: originalBulkGas,
      optimized: optimizedBulkGas,
      savings: bulkSavings,
      percentSavings: bulkPercentSavings,
    };
  } catch (error) {
    console.log('⚠️  Bulk operations test failed:', error.message);
  }

  // 4. Storage Efficiency Analysis
  console.log('\n💾 Storage Efficiency Analysis:');

  // Get contract sizes
  const originalSize = await ethers.provider.getCode(await assetTracker.getAddress());
  const optimizedSize = await ethers.provider.getCode(await assetTrackerOpt.getAddress());

  performance.storage.originalSize = originalSize.length;
  performance.storage.optimizedSize = optimizedSize.length;
  performance.storage.sizeDifference = originalSize.length - optimizedSize.length;
  performance.storage.percentSavings = (
    (performance.storage.sizeDifference / performance.storage.originalSize) *
    100
  ).toFixed(2);

  console.log(`Original contract size: ${performance.storage.originalSize} bytes`);
  console.log(`Optimized contract size: ${performance.storage.optimizedSize} bytes`);
  console.log(
    `Size difference: ${performance.storage.sizeDifference} bytes (${performance.storage.percentSavings}%)`
  );

  // 5. Summary Report
  console.log('\n📋 Performance Summary Report:');
  console.log('='.repeat(50));

  if (performance.deployment.savings) {
    console.log(`💰 Deployment gas savings: ${performance.deployment.percentSavings}%`);
  }

  if (performance.operations.createAsset) {
    console.log(
      `🏗️  Asset creation savings: ${performance.operations.createAsset.percentSavings}%`
    );
  }

  if (performance.operations.transferAsset) {
    console.log(
      `🔄 Asset transfer savings: ${performance.operations.transferAsset.percentSavings}%`
    );
  }

  if (performance.operations.bulk) {
    console.log(`📦 Bulk operations savings: ${performance.operations.bulk.percentSavings}%`);
  }

  console.log(`💾 Contract size savings: ${performance.storage.percentSavings}%`);

  // 6. Recommendations
  console.log('\n💡 Optimization Recommendations:');
  console.log('='.repeat(50));
  console.log('✅ Use custom errors instead of require statements');
  console.log('✅ Pack struct variables to optimize storage');
  console.log('✅ Use calldata instead of memory for external function parameters');
  console.log('✅ Implement proper access modifiers');
  console.log('✅ Add comprehensive event logging');
  console.log('✅ Use immutable variables where possible');
  console.log('✅ Optimize mapping structures for gas efficiency');

  // Save performance data
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const reportFile = path.join(reportsDir, `performance-analysis-${Date.now()}.json`);

  // Custom replacer function to handle BigInt serialization
  const jsonReplacer = (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    return value;
  };

  fs.writeFileSync(reportFile, JSON.stringify(performance, jsonReplacer, 2));
  console.log(`\n📄 Performance report saved to: ${reportFile}`);

  console.log('\n🎉 Performance analysis completed!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Performance analysis failed:', error);
      process.exit(1);
    });
}

export { main };
