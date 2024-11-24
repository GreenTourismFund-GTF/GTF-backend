// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  // Deploy Token
  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy(
    "GTF Token",    // name
    "GTF",         // symbol
    ethers.utils.parseEther("1000000"),  // initialSupply: 1 million tokens
    ethers.utils.parseEther("10000000")  // maxSupply: 10 million tokens
  );
  await token.deployed();
  console.log("Token deployed to:", token.address);

  // Deploy WalletConnector
  const WalletConnector = await ethers.getContractFactory("WalletConnector");
  const walletConnector = await WalletConnector.deploy();
  await walletConnector.deployed();
  console.log("WalletConnector deployed to:", walletConnector.address);

  // Approve WalletConnector to handle tokens
  await token.approveWalletConnector(
    walletConnector.address,
    ethers.constants.MaxUint256
  );
  console.log("WalletConnector approved for token transfers");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});