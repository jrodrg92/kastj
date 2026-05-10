import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Kastj KRC20 flow", function () {
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
        const manager = await Manager.deploy(await vault.getAddress(), await treasury.getAddress());
        await manager.waitForDeployment();

        await (await vault.setManager(await manager.getAddress())).wait();

        const Token = await ethers.getContractFactory("MockKRC20");
        const token = await Token.deploy();
        await token.waitForDeployment();

        await (await manager.setTokenDecimals(await token.getAddress(), 18)).wait();

        await token.mint(supporter.address, ethers.parseEther("1000"));

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
            token,
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

    async function createKrc20Proposal({
        manager,
        creator,
        recipient,
        token,
        goal = "100",
        threshold = "50",
        duration = 365 * 24 * 60 * 60,
    }: any) {
        const tx = await manager
            .connect(creator)
            .createProposal(
                recipient.address,
                await token.getAddress(),
                ethers.parseUnits(goal, 18),
                ethers.parseUnits(threshold, 18),
                duration,
                0, // DeadlineOnly
                "ipfs://krc20-proposal",
            );

        await tx.wait();

        return await manager.proposalCount();
    }

    it("permite financiar una propuesta KRC20 con approve + fundKrc20", async function () {
        const { manager, vault, creator, recipient, supporter, token } = await deployFixture();

        const proposalId = await createKrc20Proposal({
            manager,
            creator,
            recipient,
            token,
        });

        await token.connect(supporter).approve(await vault.getAddress(), ethers.parseEther("100"));

        await manager.connect(supporter).fundKrc20(proposalId, ethers.parseEther("100"));

        expect(await token.balanceOf(await vault.getAddress())).to.equal(ethers.parseEther("100"));

        expect(await vault.proposalBalances(proposalId)).to.equal(ethers.parseEther("100"));
    });

    it("una propuesta KRC20 exitosa libera 93/5/2", async function () {
        const { manager, vault, treasury, creator, recipient, supporter, token, attacker } =
            await deployFixture();

        const proposalId = await createKrc20Proposal({
            manager,
            creator,
            recipient,
            token,
        });

        await token.connect(supporter).approve(await vault.getAddress(), ethers.parseUnits("100", 18));

        await manager.connect(supporter).fundKrc20(proposalId, ethers.parseUnits("100", 18));

        await moveAfterDeadline(manager, proposalId);

        await manager.connect(attacker).finalizeProposal(proposalId);

        expect(await token.balanceOf(recipient.address)).to.equal(ethers.parseUnits("93", 18));

        expect(await token.balanceOf(creator.address)).to.equal(ethers.parseUnits("5", 18));

        expect(await token.balanceOf(await treasury.getAddress())).to.equal(ethers.parseUnits("2", 18));

        expect(await token.balanceOf(await vault.getAddress())).to.equal(0n);
    });

    it("una propuesta KRC20 fallida permite refund", async function () {
        const { manager, vault, creator, recipient, supporter, token, attacker } =
            await deployFixture();

        const proposalId = await createKrc20Proposal({
            manager,
            creator,
            recipient,
            token,
            goal: "100",
            threshold: "50",
        });

        await token.connect(supporter).approve(await vault.getAddress(), ethers.parseUnits("20", 18));

        await manager.connect(supporter).fundKrc20(proposalId, ethers.parseUnits("20", 18));

        await moveAfterDeadline(manager, proposalId);

        await manager.connect(attacker).finalizeProposal(proposalId);

        const before = await token.balanceOf(supporter.address);

        await vault.connect(supporter).withdraw(proposalId);

        const after = await token.balanceOf(supporter.address);

        expect(after - before).to.equal(ethers.parseUnits("20", 18));
        expect(await token.balanceOf(await vault.getAddress())).to.equal(0n);
    });

    it("no permite fundKrc20 sin allowance", async function () {
        const { manager, creator, recipient, supporter, token } = await deployFixture();

        const proposalId = await createKrc20Proposal({
            manager,
            creator,
            recipient,
            token,
        });

        await expect(
            manager.connect(supporter).fundKrc20(proposalId, ethers.parseUnits("10", 18)),
        ).to.be.revert(ethers);
    });

    it("no permite fundNative en propuesta KRC20", async function () {
        const { manager, creator, recipient, supporter, token } = await deployFixture();

        const proposalId = await createKrc20Proposal({
            manager,
            creator,
            recipient,
            token,
        });

        await expect(
            manager.connect(supporter).fundNative(proposalId, {
                value: ethers.parseUnits("1", 18),
            }),
        ).to.be.revertedWith("Not native proposal");
    });
});
