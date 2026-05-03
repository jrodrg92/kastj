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

    enum SettlementMode { 
        DeadlineOnly, 
        EarlyIfGoalReached 
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
        SettlementMode settlementMode;
        bool finalized;
        bool allowOverfunding; // New: explicit decision on overfunding
        string metadataURI;
    }

    uint256 public proposalCount;

    address public owner;
    address public pendingOwner;
    address public treasury;
    EscrowVault public vault;
    bool public paused;

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint8) public tokenDecimals;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed creator,
        address indexed recipient,
        address token,
        uint256 goalAmount,
        uint256 minThreshold,
        uint256 deadline,
        SettlementMode settlementMode,
        bool allowOverfunding,
        string metadataURI
    );

    event ProposalFunded(
        uint256 indexed proposalId,
        address indexed supporter,
        address token,
        uint256 amount,
        uint256 totalRaised
    );

    event ProposalFinalized(uint256 indexed proposalId, ProposalStatus status, uint256 totalRaised);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        pendingOwner = newOwner;
        emit OwnershipTransferStarted(owner, newOwner);
    }

    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Not pending owner");
        emit OwnershipTransferred(owner, pendingOwner);
        owner = pendingOwner;
        pendingOwner = address(0);
    }

    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        if (_paused) emit Paused(msg.sender);
        else emit Unpaused(msg.sender);
    }

    function setTokenDecimals(address token, uint8 decimals) external onlyOwner {
        require(token != address(0), "Native KAS is fixed");
        require(decimals > 0, "Invalid decimals");
        tokenDecimals[token] = decimals;
    }

    function _calculateMinThreshold(
        uint256 goalAmount,
        uint256 durationSeconds,
        uint8 decimals
    ) internal pure returns (uint256) {
        uint256 oneUnit = 10 ** uint256(decimals);
        
        uint256 basePercentage;
        if (goalAmount < 1000 * oneUnit) {
            basePercentage = 30;
        } else if (goalAmount < 10000 * oneUnit) {
            basePercentage = 40;
        } else if (goalAmount < 50000 * oneUnit) {
            basePercentage = 50;
        } else {
            basePercentage = 60;
        }

        uint256 daysCount = durationSeconds / 1 days;
        int256 durationModifier;
        
        if (daysCount <= 3) {
            durationModifier = -5;
        } else if (daysCount <= 14) {
            durationModifier = 0;
        } else if (daysCount <= 30) {
            durationModifier = 5;
        } else {
            durationModifier = 10;
        }

        int256 finalPercentage = int256(basePercentage) + durationModifier;
        
        if (finalPercentage < 25) {
            finalPercentage = 25;
        } else if (finalPercentage > 80) {
            finalPercentage = 80;
        }

        return (goalAmount * uint256(finalPercentage)) / 100;
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
        SettlementMode settlementMode,
        bool allowOverfunding,
        string calldata metadataURI
    ) external whenNotPaused returns (uint256) {
        require(recipient != address(0), "Invalid recipient");
        require(goalAmount > 0, "Invalid goal");
        require(minThreshold > 0, "Invalid threshold");
        require(minThreshold <= goalAmount, "Threshold above goal");
        require(durationSeconds > 0, "Invalid duration");
        require(bytes(metadataURI).length > 0, "Invalid metadata");

        uint8 decimals = 18; // Default ZK-EVM
        if (token != address(0)) {
            decimals = tokenDecimals[token];
            require(decimals > 0, "Token not supported");
        }

        uint256 autoThreshold = _calculateMinThreshold(goalAmount, durationSeconds, decimals);
        require(minThreshold >= autoThreshold, "Threshold below auto-min");

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
            settlementMode: settlementMode,
            finalized: false,
            allowOverfunding: allowOverfunding,
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
            settlementMode,
            allowOverfunding,
            metadataURI
        );

        return proposalId;
    }

    function fundNative(uint256 proposalId) external payable proposalExists(proposalId) whenNotPaused {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Active, "Not active");
        require(!p.finalized, "Finalized");
        require(block.timestamp < p.deadline, "Expired");
        require(p.token == address(0), "Not native proposal");
        require(msg.value > 0, "Invalid amount");

        if (!p.allowOverfunding) {
            require(p.totalRaised + msg.value <= p.goalAmount, "Overfunding not allowed");
        }

        p.totalRaised += msg.value;

        vault.depositNative{value: msg.value}(proposalId, msg.sender);

        emit ProposalFunded(proposalId, msg.sender, address(0), msg.value, p.totalRaised);
    }

    function fundKrc20(uint256 proposalId, uint256 amount) external proposalExists(proposalId) whenNotPaused {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Active, "Not active");
        require(!p.finalized, "Finalized");
        require(block.timestamp < p.deadline, "Expired");
        require(p.token != address(0), "Not KRC20 proposal");
        require(amount > 0, "Invalid amount");

        if (!p.allowOverfunding) {
            require(p.totalRaised + amount <= p.goalAmount, "Overfunding not allowed");
        }

        p.totalRaised += amount;

        vault.depositKrc20(proposalId, msg.sender, amount);

        emit ProposalFunded(proposalId, msg.sender, p.token, amount, p.totalRaised);
    }

    function finalizeProposal(uint256 proposalId) external proposalExists(proposalId) whenNotPaused {
        Proposal storage p = proposals[proposalId];

        require(p.status == ProposalStatus.Active, "Not active");
        require(!p.finalized, "Already finalized");

        bool reachedGoal = p.totalRaised >= p.goalAmount;
        bool expired = block.timestamp >= p.deadline;

        if (p.settlementMode == SettlementMode.DeadlineOnly) {
            require(expired, "Must wait for deadline");
        } else {
            require(reachedGoal || expired, "Cannot finalize yet");
        }

        p.finalized = true;

        if (p.totalRaised >= p.minThreshold) {
            p.status = ProposalStatus.Succeeded;

            vault.releaseSuccess(proposalId, p.recipient, p.creator, treasury);
        } else {
            p.status = ProposalStatus.Failed;

            vault.enableWithdrawals(proposalId);
        }

        emit ProposalFinalized(proposalId, p.status, p.totalRaised);
    }

    function getProposal(
        uint256 proposalId
    ) external view proposalExists(proposalId) returns (Proposal memory) {
        return proposals[proposalId];
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        emit TreasuryUpdated(treasury, _treasury);
        treasury = _treasury;
    }
}
