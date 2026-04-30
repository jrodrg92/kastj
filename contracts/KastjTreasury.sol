// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract KastjTreasury {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    receive() external payable {}
}