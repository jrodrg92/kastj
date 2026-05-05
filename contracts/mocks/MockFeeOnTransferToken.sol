// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IKRC20.sol";

contract MockFeeOnTransferToken is IKRC20 {
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    string public name = "Fee Token";
    string public symbol = "FEE";
    uint8 public decimals = 18;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    uint256 public constant FEE_BPS = 500; // 5% fee
    uint256 public constant BPS_DENOMINATOR = 10000;

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
        emit Transfer(address(0), to, amount);
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        return _transfer(msg.sender, to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "ERC20: insufficient allowance");
        allowance[from][msg.sender] = currentAllowance - amount;
        return _transfer(from, to, amount);
    }

    function _transfer(address from, address to, uint256 amount) internal returns (bool) {
        require(balanceOf[from] >= amount, "ERC20: transfer amount exceeds balance");
        
        uint256 fee = (amount * FEE_BPS) / BPS_DENOMINATOR;
        uint256 finalAmount = amount - fee;

        balanceOf[from] -= amount;
        balanceOf[to] += finalAmount;
        balanceOf[address(0xdead)] += fee; // fee destination

        emit Transfer(from, to, finalAmount);
        emit Transfer(from, address(0xdead), fee);
        
        return true;
    }
}
