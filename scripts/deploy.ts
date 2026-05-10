import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const connection = await (hre.network as any).getOrCreate();
  const { ethers } = connection;
  const [deployer] = await ethers.getSigners();

  console.log("\n🚀 Starting deployment...");
  console.log("-----------------------------------------");
  console.log(`Network:  ${hre.network.name || "localhost"}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log("-----------------------------------------\n");

  // 1. Deploy Vault
  const Vault = await ethers.getContractFactory("EscrowVault");
  const vault = await Vault.deploy();
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log(`[1/3] Vault deployed at:    ${vaultAddress}`);

  // 2. Deploy Treasury
  const Treasury = await ethers.getContractFactory("KastjTreasury");
  const treasury = await Treasury.deploy(deployer.address);
  await treasury.waitForDeployment();
  const treasuryAddress = await treasury.getAddress();
  console.log(`[2/3] Treasury deployed at: ${treasuryAddress}`);

  // 3. Deploy Manager
  const Manager = await ethers.getContractFactory("ProposalManager");
  const manager = await Manager.deploy(vaultAddress, treasuryAddress);
  await manager.waitForDeployment();
  const managerAddress = await manager.getAddress();
  console.log(`[3/3] Manager deployed at:  ${managerAddress}`);

  // 4. Critical Link: Set Manager in Vault
  console.log("\n🔗 Linking Vault to Manager...");
  const tx = await vault.setManager(managerAddress);
  await tx.wait();

  // Verification
  const currentManager = await vault.manager();
  if (currentManager.toLowerCase() === managerAddress.toLowerCase()) {
    console.log("✔️  Vault successfully linked to Manager.");
  } else {
    console.error("❌ LINKING FAILED: Manager mismatch in Vault.");
    process.exit(1);
  }

  console.log("\n✅ Deployment complete!");
  console.log("=========================================");
  console.log(`Manager:  ${managerAddress}`);
  console.log(`Vault:    ${vaultAddress}`);
  console.log(`Treasury: ${treasuryAddress}`);
  console.log("=========================================\n");

  // --- AUTO-SYNC .ENV FILES ---
  console.log("🔄 Syncing .env files...");
  
  const rootDir = path.join(__dirname, "..");
  const envLocalPath = path.join(rootDir, ".env.local");
  const indexerEnvPath = path.join(rootDir, "indexer", ".env");

  const updateEnv = (filePath: string, updates: Record<string, string>) => {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, "utf8");
    for (const [key, value] of Object.entries(updates)) {
      const regex = new RegExp(`^${key}=.*`, "m");
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${value}`);
      } else {
        content += `\n${key}=${value}`;
      }
    }
    fs.writeFileSync(filePath, content);
  };

  updateEnv(envLocalPath, {
    NEXT_PUBLIC_KASTJ_MANAGER: managerAddress,
    NEXT_PUBLIC_KASTJ_VAULT: vaultAddress,
    NEXT_PUBLIC_KASTJ_TREASURY: treasuryAddress
  });

  updateEnv(indexerEnvPath, {
    MANAGER_ADDRESS: managerAddress,
    VAULT_ADDRESS: vaultAddress
  });

  console.log("✨ .env files synchronized successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});