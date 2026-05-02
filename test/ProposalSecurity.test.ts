import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Kastj escrow security", function () {
  async function deployFixture() {
    const [deployer, creator, recipient, supporter, attacker, treasuryOwner] =
      await ethers.getSigners();

    const Vault = await ethers.getContractFactory("EscrowVault");
    const vault = await Vault.deploy();
    await vault.waitForDeployment();

    const Treasury = await ethers.getContractFactory("KastjTreasury");
    const treasury = await Treasury.deploy(treasuryOwner.address);
    await treasury.waitForDeployment();

    const Manager = await ethers.getContractFactory("ProposalManager");
    const manager = await Manager.deploy(
      await vault.getAddress(),
      await treasury.getAddress()
    );
    await manager.waitForDeployment();

    await (await vault.setManager(await manager.getAddress())).wait();

    return {
      deployer,
      creator,
      recipient,
      supporter,
      attacker,
      treasuryOwner,
      vault,
      treasury,
      manager,
    };
  }

  async function moveAfterDeadline(manager: any, proposalId: bigint) {
    const proposal = await manager.getProposal(proposalId);
    const block = await ethers.provider.getBlock("latest");

    const now = BigInt(block!.timestamp);
    const deadline = proposal.deadline;

    const secondsToMove = Number(deadline - now + 1n);

    await ethers.provider.send("evm_increaseTime", [secondsToMove]);
    await ethers.provider.send("evm_mine", []);
  }

  async function createProposal({
    manager,
    creator,
    recipient,
    goal = "10",
    threshold = "5",
    duration = 30 * 24 * 60 * 60,
  }: any) {
    const tx = await manager.connect(creator).createProposal(
      recipient.address,
      ethers.ZeroAddress,
      ethers.parseEther(goal),
      ethers.parseEther(threshold),
      duration,
      "ipfs://proposal"
    );

    await tx.wait();

    return await manager.proposalCount();
  }

  it("un usuario externo NO puede llamar enableWithdrawals", async function () {
    const { vault, attacker } = await deployFixture();

    await expect(
      vault.connect(attacker).enableWithdrawals(1)
    ).to.be.revertedWith("Only manager");
  });

  it("un usuario externo NO puede llamar releaseSuccess", async function () {
    const { vault, attacker, recipient, creator, treasury } =
      await deployFixture();

    await expect(
      vault.connect(attacker).releaseSuccess(
        1,
        recipient.address,
        creator.address,
        await treasury.getAddress()
      )
    ).to.be.revertedWith("Only manager");
  });

  it("una propuesta fallida permite refunds", async function () {
    const { manager, vault, creator, recipient, supporter } =
      await deployFixture();

    const proposalId = await createProposal({
      manager,
      creator,
      recipient,
      goal: "10",
      threshold: "5",
    });

    await manager.connect(supporter).fundNative(proposalId, {
      value: ethers.parseEther("2"),
    });

    await moveAfterDeadline(manager, proposalId);

    await manager.finalizeProposal(proposalId);

    expect(await vault.withdrawalsEnabled(proposalId)).to.equal(true);

    await vault.connect(supporter).withdraw(proposalId);

    expect(await vault.proposalBalances(proposalId)).to.equal(0n);
  });

  it("una propuesta exitosa libera 93/5/2", async function () {
    const { manager, vault, treasury, creator, recipient, supporter } =
      await deployFixture();

    const proposalId = await createProposal({
      manager,
      creator,
      recipient,
      goal: "10",
      threshold: "5",
    });

    await manager.connect(supporter).fundNative(proposalId, {
      value: ethers.parseEther("10"),
    });

    await moveAfterDeadline(manager, proposalId);

    const recipientBefore = await ethers.provider.getBalance(recipient.address);
    const creatorBefore = await ethers.provider.getBalance(creator.address);
    const treasuryBefore = await ethers.provider.getBalance(
      await treasury.getAddress()
    );

    await manager.finalizeProposal(proposalId);

    const recipientAfter = await ethers.provider.getBalance(recipient.address);
    const creatorAfter = await ethers.provider.getBalance(creator.address);
    const treasuryAfter = await ethers.provider.getBalance(
      await treasury.getAddress()
    );

    expect(recipientAfter - recipientBefore).to.equal(ethers.parseEther("9.3"));
    expect(creatorAfter - creatorBefore).to.equal(ethers.parseEther("0.5"));
    expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseEther("0.2"));

    expect(await vault.released(proposalId)).to.equal(true);
  });

  it("si creator == recipient, libera 98/0/2", async function () {
    const { manager, treasury, creator, supporter, attacker } =
      await deployFixture();

    const proposalId = await createProposal({
      manager,
      creator,
      recipient: creator,
      goal: "10",
      threshold: "5",
    });

    await manager.connect(supporter).fundNative(proposalId, {
      value: ethers.parseEther("10"),
    });

    await moveAfterDeadline(manager, proposalId);

    const creatorBefore = await ethers.provider.getBalance(creator.address);
    const treasuryBefore = await ethers.provider.getBalance(
      await treasury.getAddress()
    );

    await manager.connect(attacker).finalizeProposal(proposalId);

    const creatorAfter = await ethers.provider.getBalance(creator.address);
    const treasuryAfter = await ethers.provider.getBalance(
      await treasury.getAddress()
    );

    expect(creatorAfter - creatorBefore).to.equal(ethers.parseEther("9.8"));
    expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseEther("0.2"));
  });

  it("no permite doble finalize", async function () {
    const { manager, creator, recipient, supporter } = await deployFixture();

    const proposalId = await createProposal({
      manager,
      creator,
      recipient,
      goal: "10",
      threshold: "5",
    });

    await manager.connect(supporter).fundNative(proposalId, {
      value: ethers.parseEther("10"),
    });

    await moveAfterDeadline(manager, proposalId);

    await manager.finalizeProposal(proposalId);

    await expect(
      manager.finalizeProposal(proposalId)
    ).to.be.revertedWith("Not active");
  });

  it("no permite doble withdraw", async function () {
    const { manager, vault, creator, recipient, supporter } =
      await deployFixture();

    const proposalId = await createProposal({
      manager,
      creator,
      recipient,
      goal: "10",
      threshold: "5",
    });

    await manager.connect(supporter).fundNative(proposalId, {
      value: ethers.parseEther("2"),
    });

    await moveAfterDeadline(manager, proposalId);

    await manager.finalizeProposal(proposalId);

    await vault.connect(supporter).withdraw(proposalId);

    await expect(
      vault.connect(supporter).withdraw(proposalId)
    ).to.be.revertedWith("Already withdrawn");
  });

  it("no permite withdraw si propuesta fue exitosa", async function () {
    const { manager, vault, creator, recipient, supporter } =
      await deployFixture();

    const proposalId = await createProposal({
      manager,
      creator,
      recipient,
      goal: "10",
      threshold: "5",
    });

    await manager.connect(supporter).fundNative(proposalId, {
      value: ethers.parseEther("10"),
    });

    await moveAfterDeadline(manager, proposalId);

    await manager.finalizeProposal(proposalId);

    await expect(
      vault.connect(supporter).withdraw(proposalId)
    ).to.be.revertedWith("Not allowed");
  });
});