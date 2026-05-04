import { ethers } from "ethers";

async function main() {
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
  const txHash = "0x4efb2a0e25aefee353373d0a58cd74c18f20add779e2d649ad193fd22dd82fba";
  
  try {
    const tx = await provider.getTransaction(txHash);
    console.log("Transaction:", tx ? "Found" : "Not Found");
    if (tx) {
      const receipt = await provider.getTransactionReceipt(txHash);
      console.log("Status:", receipt?.status === 1 ? "Success" : "Failed");
      console.log("To:", tx.to);
    }
  } catch (e) {
    console.error(e);
  }
}

main();
