import { network } from "hardhat";

const { ethers } = await network.connect();

const [deployer] = await ethers.getSigners();

console.log("Deploying with:", deployer.address);

const Treasury = await ethers.getContractFactory("KastjTreasury");
const treasury = await Treasury.deploy();
await treasury.waitForDeployment();

const Vault = await ethers.getContractFactory("EscrowVault");
const vault = await Vault.deploy();
await vault.waitForDeployment();

const Manager = await ethers.getContractFactory("ProposalManager");
const manager = await Manager.deploy(
  await vault.getAddress(),
  await treasury.getAddress()
);
await manager.waitForDeployment();

console.log("Treasury:", await treasury.getAddress());
console.log("Vault:", await vault.getAddress());
console.log("Manager:", await manager.getAddress());