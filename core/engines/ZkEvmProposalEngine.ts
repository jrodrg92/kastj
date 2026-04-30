import { Contract, parseEther } from "ethers";
import { CONTRACTS } from "../../lib/contracts";
import ProposalManagerAbi from "../../abis/ProposalManager.json";
import EscrowVaultAbi from "../../abis/EscrowVault.json";

export class ZkEvmProposalEngine {
  private getManager(signerOrProvider: any) {
    return new Contract(
      CONTRACTS.manager,
      ProposalManagerAbi,
      signerOrProvider
    );
  }

  async createProposal(
    signer: any,
    recipient: string,
    goalEth: string,
    durationSeconds: number,
    metadataURI: string
  ) {
    const manager = this.getManager(signer);

    const tx = await manager.createProposal(
      recipient,
      parseEther(goalEth),
      durationSeconds,
      metadataURI
    );

    return tx.wait();
  }

  private getVault(signerOrProvider: any) {
    return new Contract(CONTRACTS.vault, EscrowVaultAbi, signerOrProvider);
  }

  async withdraw(signer: any, proposalId: number) {
    const vault = this.getVault(signer);
    const tx = await vault.withdraw(proposalId);
    return tx.wait();
  }
  
  async fundProposal(signer: any, proposalId: number, amountEth: string) {
    const manager = this.getManager(signer);

    const tx = await manager.fund(proposalId, {
      value: parseEther(amountEth),
    });

    return tx.wait();
  }

  async finalizeProposal(signer: any, proposalId: number) {
    const manager = this.getManager(signer);

    const tx = await manager.finalize(proposalId);

    return tx.wait();
  }

  async getProposal(providerOrSigner: any, proposalId: number) {
    const manager = this.getManager(providerOrSigner);
    return manager.proposals(proposalId);
  }

  async getProposalCount(providerOrSigner: any) {
    const manager = this.getManager(providerOrSigner);
    return manager.proposalCount();
  }
}