import { ethers } from "ethers";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: "indexer/.env" });

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const ABI = ["function proposalCount() view returns (uint256)"];
const contract = new ethers.Contract(process.env.MANAGER_ADDRESS, ABI, provider);

async function checkOnChain() {
  try {
    const count = await contract.proposalCount();
    console.log("On-chain proposal count:", count.toString());
  } catch (e) {
    console.error("Error fetching count:", e.message);
  }
}

checkOnChain();
