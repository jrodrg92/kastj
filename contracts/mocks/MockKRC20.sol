// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract MockKRC20 {
    string public name = "Mock KRC20";
    string public symbol = "MKRC";
    uint8 public decimals = 18;

    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 amount);
    event Approval(address indexed owner, address indexed spender, uint256 amount);

    function mint(address to, uint256 amount) external {
        require(to != address(0), "Invalid recipient");

        balanceOf[to] += amount;
        totalSupply += amount;

        emit Transfer(address(0), to, amount);
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Invalid spender");

        allowance[msg.sender][spender] = amount;

        emit Approval(msg.sender, spender, amount);

        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);

        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        require(currentAllowance >= amount, "Insufficient allowance");

        allowance[from][msg.sender] = currentAllowance - amount;

        _transfer(from, to, amount);

        return true;
    }

    function _transfer(address from, address to, uint256 amount) private {
        require(to != address(0), "Invalid recipient");
        require(balanceOf[from] >= amount, "Insufficient balance");

        balanceOf[from] -= amount;
        balanceOf[to] += amount;

        emit Transfer(from, to, amount);
    }
}
