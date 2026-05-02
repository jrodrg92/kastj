import hre from "hardhat";

async function main() {
  const connection = await hre.network.getOrCreate();
  const { ethers } = connection;

  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  // Vault
  const Vault = await ethers.getContractFactory("EscrowVault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();

  const vaultAddress = await vault.getAddress();
  console.log("Vault:", vaultAddress);

  // Treasury
  const Treasury = await ethers.getContractFactory("KastjTreasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();

  const treasuryAddress = await treasury.getAddress();
  console.log("Treasury:", treasuryAddress);

  // Manager
  const Manager = await ethers.getContractFactory("ProposalManager");
  const manager = await Manager.deploy(vaultAddress, treasuryAddress);
  await manager.waitForDeployment();

  const managerAddress = await manager.getAddress();
  console.log("Manager:", managerAddress);

  // 🔥 link crítico
  const tx = await vault.setManager(managerAddress);
  await tx.wait();

  console.log("Vault linked to manager ✅");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});