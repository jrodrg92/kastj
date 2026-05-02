import { Contract, parseEther, ZeroAddress } from "ethers";
import { CONTRACTS } from "../../lib/contracts";
import ProposalManagerAbi from "../../abis/ProposalManager.json";
import EscrowVaultAbi from "../../abis/EscrowVault.json";
import {
  CreateProposalInput,
  FundProposalInput,
  ProposalEngine,
  ProposalView,
} from "./ProposalEngine";

const KRC20_APPROVE_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
];

export class ZkEvmProposalEngine implements ProposalEngine {
  private getManager(signerOrProvider: any) {
    return new Contract(CONTRACTS.manager, ProposalManagerAbi, signerOrProvider);
  }

  private getVault(signerOrProvider: any) {
    return new Contract(CONTRACTS.vault, EscrowVaultAbi, signerOrProvider);
  }

  async createProposal(signer: any, input: CreateProposalInput) {
    const manager = this.getManager(signer);

    const token =
      input.asset.type === "native" ? ZeroAddress : input.asset.tokenAddress;

    const tx = await manager.createProposal(
      input.recipient,
      token,
      parseEther(input.goal),
      parseEther(input.minThreshold),
      input.durationSeconds,
      input.metadataURI
    );

    return tx.wait();
  }

  async fundProposal(signer: any, input: FundProposalInput) {
    const manager = this.getManager(signer);
    const amount = parseEther(input.amount);

    if (input.asset.type === "native") {
      const tx = await manager.fundNative(input.proposalId, {
        value: amount,
      });

      return tx.wait();
    }

    const token = new Contract(
      input.asset.tokenAddress,
      KRC20_APPROVE_ABI,
      signer
    );

    const approveTx = await token.approve(CONTRACTS.vault, amount);
    await approveTx.wait();

    const fundTx = await manager.fundKrc20(input.proposalId, amount);

    return fundTx.wait();
  }

  async finalizeProposal(signer: any, proposalId: number) {
    const manager = this.getManager(signer);
    const tx = await manager.finalizeProposal(proposalId);

    return tx.wait();
  }

  async withdraw(signer: any, proposalId: number) {
    const vault = this.getVault(signer);
    const tx = await vault.withdraw(proposalId);

    return tx.wait();
  }

  async withdrawMany(signer: any, proposalIds: number[]) {
    const vault = this.getVault(signer);
    const tx = await vault.withdrawMany(proposalIds);

    return tx.wait();
  }

  async getProposal(
    providerOrSigner: any,
    proposalId: number
  ): Promise<ProposalView> {
    const manager = this.getManager(providerOrSigner);
    const p = await manager.getProposal(proposalId);

    return {
      id: p.id,
      creator: p.creator,
      recipient: p.recipient,
      asset:
        p.token === ZeroAddress
          ? { type: "native" }
          : { type: "krc20", tokenAddress: p.token },
      goal: p.goalAmount,
      minThreshold: p.minThreshold,
      deadline: p.deadline,
      totalRaised: p.totalRaised,
      status: Number(p.status),
      executed: p.finalized,
      metadataURI: p.metadataURI,
    };
  }

  async getProposalCount(providerOrSigner: any): Promise<bigint> {
    const manager = this.getManager(providerOrSigner);
    return manager.proposalCount();
  }
}