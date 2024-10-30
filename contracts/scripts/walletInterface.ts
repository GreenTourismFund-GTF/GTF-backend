mport { ethers } from "hardhat";
import { WalletConnector } from "../typechain-types";

export class WalletInterface {
    private contract: WalletConnector;
    
    constructor(contractAddress: string) {
        this.contract = ethers.getContractAt("WalletConnector", contractAddress) as unknown as WalletConnector;
    }
    
    async connectWallet(walletType: string, address: string) {
        const tx = await this.contract.connectWallet(walletType);
        await tx.wait();
        console.log(`Connected ${walletType} wallet at address ${address}`);
    }
    
    async executeTransaction(to: string, token: string, amount: string) {
        const tx = await this.contract.executeTransaction(to, token, amount);
        await tx.wait();
        console.log(`Transaction executed: ${amount} tokens sent to ${to}`);
    }
    
    async getTransactionHistory(address: string) {
        const history = await this.contract.getUserTransactions(address);
        return history;
    }
}

// Example usage
async function main() {
    const [deployer] = await ethers.getSigners();
    
    // Deploy WalletConnector
    const WalletConnector = await ethers.getContractFactory("WalletConnector");
    const connector = await WalletConnector.deploy();
    await connector.deployed();
    
    console.log("WalletConnector deployed to:", connector.address);
    
    // Initialize interface
    const walletInterface = new WalletInterface(connector.address);
    
    // Connect wallet
    await walletInterface.connectWallet("MetaMask", deployer.address);
}