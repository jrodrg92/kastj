// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./EscrowVault.sol";
import "./KastjTreasury.sol";

contract ProposalManager {
    enum Status {
        Active,
        Succeeded,
        Failed
    }

    struct Proposal {
        uint256 id;
        address creator;
        address recipient;
        uint256 goal;
        uint256 deadline;
        uint256 totalRaised;
        Status status;
        bool executed;
        string metadataURI;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;

    EscrowVault public vault;
    KastjTreasury public treasury;

    event ProposalCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed recipient,
        uint256 goal,
        uint256 deadline,
        string metadataURI
    );

    event ProposalFunded(
        uint256 indexed id,
        address indexed supporter,
        uint256 amount,
        uint256 totalRaised
    );

    event ProposalFinalized(
        uint256 indexed id,
        bool success,
        uint256 totalRaised
    );

    constructor(address _vault, address payable _treasury) {
        vault = EscrowVault(_vault);
        treasury = KastjTreasury(_treasury);
    }

    function createProposal(
        address recipient,
        uint256 goal,
        uint256 duration,
        string calldata metadataURI
    ) external {
        require(recipient != address(0), "Invalid recipient");
        require(goal > 0, "Invalid goal");
        require(duration > 0, "Invalid duration");

        proposalCount++;

        uint256 deadline = block.timestamp + duration;

        proposals[proposalCount] = Proposal({
            id: proposalCount,
            creator: msg.sender,
            recipient: recipient,
            goal: goal,
            deadline: deadline,
            totalRaised: 0,
            status: Status.Active,
            executed: false,
            metadataURI: metadataURI
        });

        emit ProposalCreated(
            proposalCount,
            msg.sender,
            recipient,
            goal,
            deadline,
            metadataURI
        );
    }

    function fund(uint256 id) external payable {
        Proposal storage p = proposals[id];

        require(p.id != 0, "Proposal not found");
        require(block.timestamp < p.deadline, "Expired");
        require(p.status == Status.Active, "Not active");
        require(msg.value > 0, "Invalid amount");

        p.totalRaised += msg.value;

        vault.deposit{value: msg.value}(id, msg.sender);

        emit ProposalFunded(id, msg.sender, msg.value, p.totalRaised);
    }

    function finalize(uint256 id) external {
        Proposal storage p = proposals[id];

        require(p.id != 0, "Proposal not found");
        require(block.timestamp >= p.deadline, "Too early");
        require(!p.executed, "Already");

        p.executed = true;

        if (p.totalRaised >= p.goal) {
            p.status = Status.Succeeded;

            vault.releaseSuccess(
                id,
                p.recipient,
                p.creator,
                address(treasury),
                p.totalRaised
            );
        } else {
            p.status = Status.Failed;
            vault.enableWithdrawals(id);
        }

        emit ProposalFinalized(
            id,
            p.status == Status.Succeeded,
            p.totalRaised
        );
    }
}