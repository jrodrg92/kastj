// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract KastjTreasury {
    address public owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event TreasuryWithdrawal(address indexed to, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    constructor(address _owner) {
        require(_owner != address(0), "Invalid owner");
        owner = _owner;
    }

    receive() external payable {}

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid owner");

        emit OwnershipTransferred(owner, newOwner);

        owner = newOwner;
    }

    function withdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(amount <= address(this).balance, "Insufficient balance");

        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "Transfer failed");

        emit TreasuryWithdrawal(to, amount);
    }
}