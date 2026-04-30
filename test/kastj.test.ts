import { expect } from "chai";
import { network } from "hardhat";

describe("Kastj Flow", function () {
  let ethers: any;
  let networkHelpers: any;

  let manager: any;
  let vault: any;
  let treasury: any;

  let owner: any;
  let user1: any;
  let user2: any;

  beforeEach(async function () {
    const conn = await network.connect();
    ethers = conn.ethers;
    networkHelpers = conn.networkHelpers;

    [owner, user1, user2] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory("KastjTreasury");
    treasury = await Treasury.deploy();
    await treasury.waitForDeployment();

    const Vault = await ethers.getContractFactory("EscrowVault");
    vault = await Vault.deploy();
    await vault.waitForDeployment();

    const Manager = await ethers.getContractFactory("ProposalManager");
    manager = await Manager.deploy(
      await vault.getAddress(),
      await treasury.getAddress()
    );
    await manager.waitForDeployment();
  });

  it("Should create proposal", async function () {
    await manager.connect(user1).createProposal(
      user2.address,
      ethers.parseEther("10"),
      3600
    );

    const p = await manager.proposals(1);

    expect(p.creator).to.equal(user1.address);
    expect(p.recipient).to.equal(user2.address);
  });

  it("Should fund proposal", async function () {
    await manager.connect(user1).createProposal(
      user2.address,
      ethers.parseEther("10"),
      3600
    );

    await manager.connect(user2).fund(1, {
      value: ethers.parseEther("5"),
    });

    const p = await manager.proposals(1);

    expect(p.totalRaised).to.equal(ethers.parseEther("5"));
  });

  it("Should fail and allow withdraw", async function () {
    await manager.connect(user1).createProposal(
      user2.address,
      ethers.parseEther("10"),
      3600
    );

    await manager.connect(user2).fund(1, {
      value: ethers.parseEther("5"),
    });

    await networkHelpers.time.increase(4000);
    await networkHelpers.mine();

    await manager.finalize(1);

    const p = await manager.proposals(1);
    expect(p.status).to.equal(2); // Failed

    await vault.connect(user2).withdraw(1);

    await expect(vault.connect(user2).withdraw(1)).to.be.revertedWith("Already withdrawn");

  });

  it("Should succeed and distribute funds", async function () {
    await manager.connect(user1).createProposal(
      user2.address,
      ethers.parseEther("10"),
      3600
    );

    await manager.connect(owner).fund(1, {
      value: ethers.parseEther("10"),
    });

    const balanceBeforeRecipient = await ethers.provider.getBalance(user2.address);
    const balanceBeforeCreator = await ethers.provider.getBalance(user1.address);

    await networkHelpers.time.increase(4000);
    await networkHelpers.mine();

    await manager.finalize(1);

    const p = await manager.proposals(1);
    expect(p.status).to.equal(1); // Success

    const balanceAfterRecipient = await ethers.provider.getBalance(user2.address);
    const balanceAfterCreator = await ethers.provider.getBalance(user1.address);
    const treasuryBalance = await ethers.provider.getBalance(await treasury.getAddress());

    expect(balanceAfterRecipient > balanceBeforeRecipient).to.be.true;
    expect(balanceAfterCreator > balanceBeforeCreator).to.be.true;
    expect(treasuryBalance).to.equal(ethers.parseEther("0.2"));
  });
});