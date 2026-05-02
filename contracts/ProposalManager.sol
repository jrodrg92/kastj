// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./EscrowVault.sol";
import "./interfaces/IKRC20.sol";

contract ProposalManager {
    enum ProposalStatus {
        Active,
        Succeeded,
        Failed
    }

    struct Proposal {
        uint256 id;
        address creator;
        address recipient;
        address token; // address(0) = native KAS
        uint256 goalAmount;
        uint256 minThreshold;
        uint256 deadline;
        uint256 totalRaised;
        ProposalStatus status;
        bool finalized;
        string metadataURI;
    }

    uint256 public proposalCount;

    address public owner;
    address public treasury;
    EscrowVault public vault;

    mapping(uint256 => Proposal) public proposals;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        address indexed recipient,
        address token,
        uint256 goalAmount,
        uint256 minThreshold,
        uint256 deadline,
        string metadataURI
    );

    event ProposalFunded(
        uint256 indexed proposalId,
        address indexed supporter,
        address token,
        uint256 amount,
        uint256 totalRaised
    );

    event ProposalFinalized(
        uint256 indexed proposalId,
        ProposalStatus status,
        uint256 totalRaised
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier proposalExists(uint256 proposalId) {
        require(proposalId > 0 && proposalId <= proposalCount, "Proposal not found");
        _;
    }

    constructor(address _vault, address _treasury) {
        require(_vault != address(0), "Invalid vault");
        require(_treasury != address(0), "Invalid treasury");

        owner = msg.sender;
        vault = EscrowVault(_vault);
        treasury = _treasury;
    }

    function createProposal(
        address recipient,
        address token,
        uint256 goalAmount,
        uint256 minThreshold,
        uint256 durationSeconds,
        string calldata metadataURI
    ) external returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(goalAmount > 0, "Invalid goal");
        require(minThreshold > 0, "Invalid threshold");
        require(minThreshold <= goalAmount, "Threshold above goal");
        require(durationSeconds > 0, "Invalid duration");
        require(bytes(metadataURI).length > 0, "Invalid metadata");

        proposalCount++;

        uint256 proposalId = proposalCount;
        uint256 deadline = block.timestamp + durationSeconds;

        proposals[proposalId] = Proposal({
            id: proposalId,
            creator: msg.sender,
            recipient: recipient,
            token: token,
            goalAmount: goalAmount,
            minThreshold: minThreshold,
            deadline: deadline,
            totalRaised: 0,
            status: ProposalStatus.Active,
            finalized: false,
            metadataURI: metadataURI
        });

        vault.registerProposal(proposalId, token);

        emit ProposalCreated(
            proposalId,
            msg.sender,
            recipient,
            token,
            goalAmount,
            minThreshold,
            deadline,
            metadataURI
        );

        return proposalId;
    }

    function fundNative(uint256 proposalId)
        external
        payable
        proposalExists(proposalId)
    {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Active, "Not active");
        require(!p.finalized, "Finalized");
        require(block.timestamp < p.deadline, "Expired");
        require(p.token == address(0), "Not native proposal");
        require(msg.value > 0, "Invalid amount");

        p.totalRaised += msg.value;

        vault.depositNative{value: msg.value}(proposalId, msg.sender);

        emit ProposalFunded(
            proposalId,
            msg.sender,
            address(0),
            msg.value,
            p.totalRaised
        );
    }

    function fundKrc20(uint256 proposalId, uint256 amount)
        external
        proposalExists(proposalId)
    {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Active, "Not active");
        require(!p.finalized, "Finalized");
        require(block.timestamp < p.deadline, "Expired");
        require(p.token != address(0), "Not KRC20 proposal");
        require(amount > 0, "Invalid amount");

        p.totalRaised += amount;

        vault.depositKrc20(proposalId, msg.sender, amount);

        emit ProposalFunded(
            proposalId,
            msg.sender,
            p.token,
            amount,
            p.totalRaised
        );
    }

    function finalizeProposal(uint256 proposalId)
        external
        proposalExists(proposalId)
    {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Active, "Not active");
        require(!p.finalized, "Already finalized");

        bool reachedGoal = p.totalRaised >= p.goalAmount;
        bool expired = block.timestamp >= p.deadline;

        require(reachedGoal || expired, "Cannot finalize yet");

        p.finalized = true;

        if (p.totalRaised >= p.minThreshold) {
            p.status = ProposalStatus.Succeeded;

            vault.releaseSuccess(
                proposalId,
                p.recipient,
                p.creator,
                treasury
            );
        } else {
            p.status = ProposalStatus.Failed;

            vault.enableWithdrawals(proposalId);
        }

        emit ProposalFinalized(
            proposalId,
            p.status,
            p.totalRaised
        );
    }

    function getProposal(uint256 proposalId)
        external
        view
        proposalExists(proposalId)
        returns (Proposal memory)
    {
        return proposals[proposalId];
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
}