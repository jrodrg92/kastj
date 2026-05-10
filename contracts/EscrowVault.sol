// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IKRC20.sol";

contract EscrowVault {
    struct Deposit {
        uint256 amount;
        bool withdrawn;
    }

    uint16 public constant BPS_DENOMINATOR = 10_000;

    address public owner;
    address public pendingOwner;
    address public manager;
    bool public paused;

    bool private locked;

    mapping(uint256 => address) public proposalToken; // address(0) = native KAS
    mapping(uint256 => bool) public proposalRegistered;

    mapping(uint256 => mapping(address => Deposit)) public deposits;
    mapping(uint256 => uint256) public proposalBalances;
    mapping(uint256 => bool) public withdrawalsEnabled;
    mapping(uint256 => bool) public released;

    event OwnershipTransferStarted(address indexed previousOwner, address indexed newOwner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event Paused(address account);
    event Unpaused(address account);
    event ManagerSet(address indexed manager);
    event ProposalRegistered(uint256 indexed proposalId, address indexed token);
    event Deposited(
        uint256 indexed proposalId,
        address indexed supporter,
        address indexed token,
        uint256 amount
    );
    event WithdrawalsEnabled(uint256 indexed proposalId);
    event Withdrawn(
        uint256 indexed proposalId,
        address indexed supporter,
        address indexed token,
        uint256 amount
    );
    event Released(
        uint256 indexed proposalId,
        address indexed token,
        address indexed recipient,
        address creator,
        address treasury,
        uint256 recipientPayout,
        uint256 creatorReward,
        uint256 platformFee
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier onlyManager() {
        require(msg.sender == manager, "Only manager");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "Pausable: paused");
        _;
    }

    modifier nonReentrant() {
        require(!locked, "Reentrancy");
        locked = true;
        _;
        locked = false;
    }

    constructor() {
        owner = msg.sender;
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

    function setManager(address _manager) external onlyOwner {
        require(manager == address(0), "Manager already set");
        require(_manager != address(0), "Invalid manager");

        manager = _manager;

        emit ManagerSet(_manager);
    }

    function registerProposal(uint256 proposalId, address token) external onlyManager whenNotPaused {
        require(proposalId != 0, "Invalid proposal");
        require(!proposalRegistered[proposalId], "Already registered");

        proposalRegistered[proposalId] = true;
        proposalToken[proposalId] = token;

        emit ProposalRegistered(proposalId, token);
    }

    function depositNative(uint256 proposalId, address supporter) external payable onlyManager whenNotPaused nonReentrant {
        require(proposalRegistered[proposalId], "Proposal not registered");
        require(proposalToken[proposalId] == address(0), "Not native proposal");
        require(supporter != address(0), "Invalid supporter");
        require(msg.value > 0, "Invalid amount");
        require(!withdrawalsEnabled[proposalId], "Withdrawals enabled");
        require(!released[proposalId], "Already released");

        deposits[proposalId][supporter].amount += msg.value;
        proposalBalances[proposalId] += msg.value;

        emit Deposited(proposalId, supporter, address(0), msg.value);
    }

    function depositKrc20(
        uint256 proposalId,
        address supporter,
        uint256 amount
    ) external onlyManager whenNotPaused nonReentrant {
        require(proposalRegistered[proposalId], "Proposal not registered");

        address token = proposalToken[proposalId];

        require(token != address(0), "Not KRC20 proposal");
        require(supporter != address(0), "Invalid supporter");
        require(amount > 0, "Invalid amount");
        require(!withdrawalsEnabled[proposalId], "Withdrawals enabled");
        require(!released[proposalId], "Already released");

        uint256 balanceBefore = IKRC20(token).balanceOf(address(this));
        _safeTransferFrom(token, supporter, address(this), amount);
        uint256 balanceAfter = IKRC20(token).balanceOf(address(this));
        uint256 actualAmount = balanceAfter - balanceBefore;
        
        require(actualAmount > 0, "Zero received amount");

        deposits[proposalId][supporter].amount += actualAmount;
        proposalBalances[proposalId] += actualAmount;

        emit Deposited(proposalId, supporter, token, actualAmount);
    }

    function enableWithdrawals(uint256 proposalId) external onlyManager {
        require(!released[proposalId], "Already released");

        withdrawalsEnabled[proposalId] = true;

        emit WithdrawalsEnabled(proposalId);
    }

    function withdraw(uint256 proposalId) public nonReentrant {
        require(withdrawalsEnabled[proposalId], "Not allowed");
        require(!released[proposalId], "Already released");

        Deposit storage d = deposits[proposalId][msg.sender];

        require(!d.withdrawn, "Already withdrawn");
        require(d.amount > 0, "Nothing to withdraw");

        uint256 amount = d.amount;
        address token = proposalToken[proposalId];

        d.amount = 0;
        d.withdrawn = true;
        proposalBalances[proposalId] -= amount;

        _payout(token, msg.sender, amount);

        emit Withdrawn(proposalId, msg.sender, token, amount);
    }

    function withdrawMany(uint256[] calldata proposalIds) external {
        uint256 len = proposalIds.length;
        require(len <= 50, "Too many proposals");
        for (uint256 i = 0; i < len; i++) {
            withdraw(proposalIds[i]);
        }
    }

    function releaseSuccess(
        uint256 proposalId,
        address recipient,
        address creator,
        address treasury,
        uint16 creatorRewardBps,
        uint16 platformFeeBps
    ) external onlyManager nonReentrant {
        require(!released[proposalId], "Already released");
        require(!withdrawalsEnabled[proposalId], "Withdrawals enabled");
        require(recipient != address(0), "Invalid recipient");
        require(creator != address(0), "Invalid creator");
        require(treasury != address(0), "Invalid treasury");

        uint256 totalAmount = proposalBalances[proposalId];
        require(totalAmount > 0, "No funds");

        address token = proposalToken[proposalId];

        released[proposalId] = true;
        proposalBalances[proposalId] = 0;

        uint256 creatorReward = 0;

        if (creator != recipient) {
            creatorReward = (totalAmount * uint256(creatorRewardBps)) / BPS_DENOMINATOR;
        }

        uint256 platformFee = (totalAmount * uint256(platformFeeBps)) / BPS_DENOMINATOR;
        uint256 recipientPayout = totalAmount - creatorReward - platformFee;

        _payout(token, recipient, recipientPayout);

        if (creatorReward > 0) {
            _payout(token, creator, creatorReward);
        }

        _payout(token, treasury, platformFee);

        emit Released(
            proposalId,
            token,
            recipient,
            creator,
            treasury,
            recipientPayout,
            creatorReward,
            platformFee
        );
    }

    function _payout(address token, address to, uint256 amount) private {
        if (token == address(0)) {
            _safeNativeTransfer(to, amount);
        } else {
            _safeTokenTransfer(token, to, amount);
        }
    }

    function _safeNativeTransfer(address to, uint256 amount) private {
        (bool ok, ) = payable(to).call{value: amount}("");
        require(ok, "Native transfer failed");
    }

    function _safeTokenTransfer(address token, address to, uint256 amount) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IKRC20.transfer.selector, to, amount)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "SafeTransfer: failed"
        );
    }

    function _safeTransferFrom(address token, address from, address to, uint256 amount) private {
        (bool success, bytes memory data) = token.call(
            abi.encodeWithSelector(IKRC20.transferFrom.selector, from, to, amount)
        );
        require(
            success && (data.length == 0 || abi.decode(data, (bool))),
            "SafeTransferFrom: failed"
        );
    }
}
