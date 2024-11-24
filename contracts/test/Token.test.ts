import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Token, Token__factory } from "../typechain-types";

describe("Token", function () {
  let token: Token;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  
  const name = "MyToken";
  const symbol = "MTK";
  const initialSupply = ethers.utils.parseEther("1000000");
  const maxSupply = ethers.utils.parseEther("10000000");

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const TokenFactory = (await ethers.getContractFactory("Token")) as Token__factory;
    token = await TokenFactory.deploy(name, symbol, initialSupply, maxSupply);
    await token.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await token.name()).to.equal(name);
      expect(await token.symbol()).to.equal(symbol);
    });

    it("Should mint initial supply to owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(ownerBalance).to.equal(initialSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const amount = ethers.utils.parseEther("100");
      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });
  });
});