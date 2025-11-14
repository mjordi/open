import { expect } from 'chai';
import hre from 'hardhat';

describe('Test Network Connect', function () {
  it('Try connecting to network', async function () {
    console.log('hre.network:', hre.network);
    console.log('hre.network.connect:', typeof hre.network.connect);

    if (hre.network && hre.network.connect) {
      const connection = await hre.network.connect();
      console.log('connection:', connection);
      console.log('connection.ethers:', connection.ethers);

      if (connection.ethers) {
        const signers = await connection.ethers.getSigners();
        console.log('Got signers:', signers.length);
        expect(signers.length).to.be.greaterThan(0);
      }
    }
  });
});
