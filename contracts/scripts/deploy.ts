// scripts/deploy.ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  const Token = await ethers.getContractFactory("Token");
  const token = await Token.deploy(
    "MyToken",
    "MTK",
    ethers.utils.parseEther("1000000"), // initial supply
    ethers.utils.parseEther("10000000")  // max supply
  );

  await token.deployed();
  console.log("Token deployed to:", token.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });