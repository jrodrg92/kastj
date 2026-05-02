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

    enum AssetType {
        Native,
        KRC20
    }

    struct Asset {
        AssetType assetType;
        address token;
    }

    struct Proposal {
        uint256 id;
        address creator;
        address recipient;
        Asset asset;
        uint256 goal;
        uint256 minThreshold;
        uint256 deadline;
        uint256 totalRaised;
        Status status;
        bool executed;
        string metadataURI;
    }

    uint256 public proposalCount;

    mapping(uint256 => Proposal) public proposals;

    EscrowVault public immutable vault;
    KastjTreasury public immutable treasury;

    event ProposalCreated(
        uint256 indexed id,
        address indexed creator,
        address indexed recipient,
        AssetType assetType,
        address token,
        uint256 goal,
        uint256 minThreshold,
        uint256 deadline,
        string metadataURI
    );

    event ProposalFunded(
        uint256 indexed id,
        address indexed supporter,
        address indexed token,
        uint256 amount,
        uint256 totalRaised
    );

    event ProposalFinalized(
        uint256 indexed id,
        bool success,
        uint256 totalRaised
    );

    constructor(address _vault, address payable _treasury) {
        require(_vault != address(0), "Invalid vault");
        require(_treasury != address(0), "Invalid treasury");

        vault = EscrowVault(_vault);
        treasury = KastjTreasury(_treasury);
    }

    function createProposal(
        address recipient,
        Asset calldata asset,
        uint256 goal,
        uint256 minThreshold,
        uint256 duration,
        string calldata metadataURI
    ) external returns (uint256 proposalId) {
        require(recipient != address(0), "Invalid recipient");
        require(goal > 0, "Invalid goal");
        require(minThreshold > 0, "Invalid threshold");
        require(minThreshold <= goal, "Threshold exceeds goal");
        require(duration > 0, "Invalid duration");
        require(bytes(metadataURI).length > 0, "Invalid metadata");

        if (asset.assetType == AssetType.Native) {
            require(asset.token == address(0), "Native token must be zero");
        } else {
            require(asset.token != address(0), "Invalid token");
        }

        proposalCount++;

        proposalId = proposalCount;
        uint256 deadline = block.timestamp + duration;

        proposals[proposalId] = Proposal({
            id: proposalId,
            creator: msg.sender,
            recipient: recipient,
            asset: asset,
            goal: goal,
            minThreshold: minThreshold,
            deadline: deadline,
            totalRaised: 0,
            status: Status.Active,
            executed: false,
            metadataURI: metadataURI
        });

        vault.registerProposal(proposalId, asset.token);

        emit ProposalCreated(
            proposalId,
            msg.sender,
            recipient,
            asset.assetType,
            asset.token,
            goal,
            minThreshold,
            deadline,
            metadataURI
        );
    }

    function fundNative(uint256 id) external payable {
        Proposal storage p = proposals[id];

        require(p.id != 0, "Proposal not found");
        require(p.asset.assetType == AssetType.Native, "Not native proposal");
        require(block.timestamp < p.deadline, "Expired");
        require(p.status == Status.Active, "Not active");
        require(msg.value > 0, "Invalid amount");

        p.totalRaised += msg.value;

        vault.depositNative{value: msg.value}(id, msg.sender);

        emit ProposalFunded(id, msg.sender, address(0), msg.value, p.totalRaised);
    }

    function fundKrc20(uint256 id, uint256 amount) external {
        Proposal storage p = proposals[id];

        require(p.id != 0, "Proposal not found");
        require(p.asset.assetType == AssetType.KRC20, "Not KRC20 proposal");
        require(block.timestamp < p.deadline, "Expired");
        require(p.status == Status.Active, "Not active");
        require(amount > 0, "Invalid amount");

        p.totalRaised += amount;

        vault.depositKrc20(id, msg.sender, amount);

        emit ProposalFunded(id, msg.sender, p.asset.token, amount, p.totalRaised);
    }

    function finalize(uint256 id) external {
        Proposal storage p = proposals[id];

        require(p.id != 0, "Proposal not found");
        require(block.timestamp >= p.deadline, "Too early");
        require(!p.executed, "Already executed");
        require(p.status == Status.Active, "Not active");

        p.executed = true;

        bool success = p.totalRaised >= p.minThreshold;

        if (success) {
            p.status = Status.Succeeded;

            vault.releaseSuccess(
                id,
                p.recipient,
                p.creator,
                address(treasury)
            );
        } else {
            p.status = Status.Failed;

            vault.enableWithdrawals(id);
        }

        emit ProposalFinalized(id, success, p.totalRaised);
    }

    function getProposal(uint256 id) external view returns (Proposal memory) {
        require(proposals[id].id != 0, "Proposal not found");
        return proposals[id];
    }
}