import { expect } from 'chai';

describe('Test Global Ethers', function() {
  it('Check if ethers is global', async function() {
    console.log('typeof ethers:', typeof ethers);
    console.log('typeof global.ethers:', typeof global.ethers);
    console.log('typeof globalThis.ethers:', typeof globalThis.ethers);
    
    // Try to see what IS available
    console.log('Available globals:', Object.keys(global).filter(k => k.includes('eth') || k.includes('hard')));
  });
});
