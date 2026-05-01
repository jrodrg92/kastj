// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract EscrowVault {
    struct Deposit {
        uint256 amount;
        bool withdrawn;
    }

    mapping(uint256 => mapping(address => Deposit)) public deposits;
    mapping(uint256 => bool) public withdrawalsEnabled;

    function deposit(uint256 proposalId, address supporter) external payable {
        deposits[proposalId][supporter].amount += msg.value;
    }

    function enableWithdrawals(uint256 proposalId) external {
        withdrawalsEnabled[proposalId] = true;
    }

    function withdraw(uint256 proposalId) public {
        require(withdrawalsEnabled[proposalId], "Not allowed");

        Deposit storage d = deposits[proposalId][msg.sender];

        require(!d.withdrawn, "Already withdrawn");
        require(d.amount > 0, "Nothing");

        uint256 amount = d.amount;
        d.amount = 0;
        d.withdrawn = true;

        payable(msg.sender).transfer(amount);
    }

    function releaseSuccess(
        uint256 /* proposalId */,
        address recipient,
        address creator,
        address treasury,
        uint256 totalAmount
    ) external {
        uint256 creatorReward = (totalAmount * 5) / 100;
        uint256 platformFee = (totalAmount * 2) / 100;
        uint256 recipientPayout = totalAmount - creatorReward - platformFee;

        payable(recipient).transfer(recipientPayout);
        payable(creator).transfer(creatorReward);
        payable(treasury).transfer(platformFee);
    }

    function withdrawMany(uint256[] calldata proposalIds) external {
        for (uint256 i = 0; i < proposalIds.length; i++) {
            withdraw(proposalIds[i]);
        }
    }
}