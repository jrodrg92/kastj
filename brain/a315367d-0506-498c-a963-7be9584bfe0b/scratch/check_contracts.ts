import hre from "hardhat";

async function main() {
  const connection = await hre.network.getOrCreate();
  const { ethers } = connection;

  const vaultAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Standard Hardhat address for first contract
  const managerAddress = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // From logs

  const Vault = await ethers.getContractAt("EscrowVault", vaultAddress);
  const currentManager = await Vault.manager();
  const vaultOwner = await Vault.owner();

  console.log("Vault Address:", vaultAddress);
  console.log("Current Manager in Vault:", currentManager);
  console.log("Expected Manager:", managerAddress);
  console.log("Vault Owner:", vaultOwner);

  if (currentManager.toLowerCase() !== managerAddress.toLowerCase()) {
    console.log("❌ Manager mismatch! The ProposalManager is not linked to the Vault.");
  } else {
    console.log("✅ Manager correctly linked.");
  }
}

main().catch(console.error);
