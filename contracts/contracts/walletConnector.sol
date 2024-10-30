pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title WalletConnector
 * @dev Contract for handling multi-wallet interactions and transactions
 */
contract WalletConnector is Ownable, ReentrancyGuard {
    // Wallet connection status
    mapping(address => bool) public connectedWallets;
    mapping(address => string) public walletTypes;
    mapping(address => uint256) public lastActivity;
    
    // Supported wallet types
    string[] public supportedWallets;
    
    // Transaction records
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        string walletType;
        bool success;
    }
    
    mapping(address => Transaction[]) public userTransactions;
    
    // Events
    event WalletConnected(address indexed wallet, string walletType);
    event WalletDisconnected(address indexed wallet);
    event TransactionExecuted(
        address indexed from,
        address indexed to,
        uint256 amount,
        string walletType,
        bool success
    );
    
    constructor() {
        // Initialize supported wallet types
        supportedWallets = ["MetaMask", "XVerse", "NEAR"];
    }
    
    /**
     * @dev Connect a wallet to the system
     * @param walletType Type of wallet being connected
     */
    function connectWallet(string memory walletType) external {
        require(!connectedWallets[msg.sender], "Wallet already connected");
        require(_isWalletTypeSupported(walletType), "Unsupported wallet type");
        
        connectedWallets[msg.sender] = true;
        walletTypes[msg.sender] = walletType;
        lastActivity[msg.sender] = block.timestamp;
        
        emit WalletConnected(msg.sender, walletType);
    }
    
    /**
     * @dev Disconnect a wallet from the system
     */
    function disconnectWallet() external {
        require(connectedWallets[msg.sender], "Wallet not connected");
        
        delete connectedWallets[msg.sender];
        delete walletTypes[msg.sender];
        delete lastActivity[msg.sender];
        
        emit WalletDisconnected(msg.sender);
    }
    
    /**
     * @dev Execute a transaction between wallets
     * @param to Recipient address
     * @param token Token address (use address(0) for native currency)
     * @param amount Amount to transfer
     */
    function executeTransaction(
        address to,
        address token,
        uint256 amount
    ) external payable nonReentrant {
        require(connectedWallets[msg.sender], "Wallet not connected");
        require(to != address(0), "Invalid recipient");
        
        bool success;
        if (token == address(0)) {
            // Native currency transfer
            require(msg.value == amount, "Incorrect amount sent");
            (success, ) = to.call{value: amount}("");
        } else {
            // ERC20 token transfer
            require(msg.value == 0, "ETH not needed for token transfer");
            success = IERC20(token).transferFrom(msg.sender, to, amount);
        }
        
        // Record transaction
        Transaction memory newTx = Transaction({
            from: msg.sender,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            walletType: walletTypes[msg.sender],
            success: success
        });
        
        userTransactions[msg.sender].push(newTx);
        lastActivity[msg.sender] = block.timestamp;
        
        emit TransactionExecuted(
            msg.sender,
            to,
            amount,
            walletTypes[msg.sender],
            success
        );
    }
    
    /**
     * @dev Get user's transaction history
     * @param user Address of the user
     * @return Transaction[] Array of user transactions
     */
    function getUserTransactions(address user) 
        external 
        view 
        returns (Transaction[] memory) 
    {
        return userTransactions[user];
    }
    
    /**
     * @dev Add support for a new wallet type
     * @param walletType New wallet type to support
     */
    function addSupportedWallet(string memory walletType) external onlyOwner {
        require(!_isWalletTypeSupported(walletType), "Wallet type already supported");
        supportedWallets.push(walletType);
    }
    
    /**
     * @dev Check if wallet type is supported
     * @param walletType Wallet type to check
     * @return bool Whether the wallet type is supported
     */
    function _isWalletTypeSupported(string memory walletType) 
        internal 
        view 
        returns (bool) 
    {
        for (uint i = 0; i < supportedWallets.length; i++) {
            if (keccak256(bytes(supportedWallets[i])) == keccak256(bytes(walletType))) {
                return true;
            }
        }
        return false;
    }
    
    // Receive function to accept native currency
    receive() external payable {}
}