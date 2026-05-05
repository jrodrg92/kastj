import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Kastj Quality & Security QA", function () {
    async function deployFixture() {
        const [deployer, creator, recipient, supporter, attacker, treasuryOwner, newTreasury] =
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

        // Mocks
        const Token = await ethers.getContractFactory("MockKRC20");
        const token = await Token.deploy();
        await token.waitForDeployment();
        await (await manager.setTokenDecimals(await token.getAddress(), 18)).wait();

        const FeeToken = await ethers.getContractFactory("MockFeeOnTransferToken");
        const feeToken = await FeeToken.deploy();
        await feeToken.waitForDeployment();
        await (await manager.setTokenDecimals(await feeToken.getAddress(), 18)).wait();

        await token.mint(supporter.address, ethers.parseEther("1000"));
        // FeeToken minting is handled in its specific test due to accounting checks

        return {
            deployer,
            creator,
            recipient,
            supporter,
            attacker,
            treasuryOwner,
            newTreasury,
            vault,
            treasury,
            manager,
            token,
            feeToken
        };
    }

    async function moveAfterDeadline(manager: any, proposalId: bigint) {
        const proposal = await manager.getProposal(proposalId);
        const block = await ethers.provider.getBlock("latest");
        const secondsToMove = Number(proposal.deadline - BigInt(block!.timestamp) + 1n);
        await ethers.provider.send("evm_increaseTime", [secondsToMove]);
        await ethers.provider.send("evm_mine", []);
    }

    async function moveAfterGracePeriod(manager: any, proposalId: bigint) {
        const proposal = await manager.getProposal(proposalId);
        const grace = await manager.FINALIZATION_GRACE_PERIOD();
        const block = await ethers.provider.getBlock("latest");
        const secondsToMove = Number(proposal.deadline + grace - BigInt(block!.timestamp) + 1n);
        await ethers.provider.send("evm_increaseTime", [secondsToMove]);
        await ethers.provider.send("evm_mine", []);
    }

    describe("Stability & Immutability", function () {
        it("Fee policy, treasury and decimals are frozen per proposal", async function () {
            const { manager, creator, recipient, supporter, treasuryOwner, newTreasury, deployer, token, vault } = await deployFixture();

            // Create proposal 1 with default fees (2% platform, 5% creator) and 18 decimals
            const tx1 = await manager.connect(creator).createProposal(
                recipient.address,
                await token.getAddress(),
                ethers.parseUnits("10", 18),
                ethers.parseUnits("10", 18),
                86400,
                0, // DeadlineOnly
                false,
                "ipfs://1"
            );
            const proposalId = await manager.proposalCount();

            // Change global defaults
            await manager.setFees(300, 600); // 3% platform, 6% creator
            await manager.setTreasury(newTreasury.address);
            await manager.setTokenDecimals(await token.getAddress(), 8); // Change to 8

            // Proposal 1 should still have old values
            const p = await manager.getProposal(proposalId);
            expect(p.platformFeeBps).to.equal(200);
            expect(p.creatorRewardBps).to.equal(500);
            expect(p.treasury).to.not.equal(newTreasury.address);
            expect(p.assetDecimals).to.equal(18);

            // Finalize should use frozen values
            await token.connect(supporter).approve(await vault.getAddress(), ethers.parseUnits("10", 18));
            await manager.connect(supporter).fundKrc20(proposalId, ethers.parseUnits("10", 18));
            await moveAfterDeadline(manager, proposalId);
            
            const treasuryBefore = await token.balanceOf(p.treasury);
            await manager.finalizeProposal(proposalId);
            const treasuryAfter = await token.balanceOf(p.treasury);
            
            // Should be 2% of 10 = 0.2
            expect(treasuryAfter - treasuryBefore).to.equal(ethers.parseUnits("0.2", 18));
        });
    });

    describe("Pause Behavior", function () {
        it("Pause blocks new deposits but NOT refunds", async function () {
            const { manager, vault, creator, recipient, supporter } = await deployFixture();

            const tx = await manager.connect(creator).createProposal(
                recipient.address,
                ethers.ZeroAddress,
                ethers.parseEther("10"),
                ethers.parseEther("10"),
                86400,
                0,
                false,
                "ipfs://1"
            );
            const proposalId = await manager.proposalCount();

            await manager.connect(supporter).fundNative(proposalId, { value: ethers.parseEther("5") });

            // Pause
            await manager.setPaused(true);

            // Block new deposits
            await expect(
                manager.connect(supporter).fundNative(proposalId, { value: ethers.parseEther("1") })
            ).to.be.revertedWith("Pausable: paused");

            // Move to failure
            await moveAfterDeadline(manager, proposalId);
            await manager.finalizeProposal(proposalId);

            // Refund should still work (trust-minimized)
            const before = await ethers.provider.getBalance(supporter.address);
            const withdrawTx = await vault.connect(supporter).withdraw(proposalId);
            const receipt = await withdrawTx.wait();
            const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
            
            const after = await ethers.provider.getBalance(supporter.address);
            expect(after).to.equal(before + ethers.parseEther("5") - gasUsed);
        });
    });

    describe("Permissionless Finalization", function () {
        it("Anyone can finalize a successful proposal", async function () {
            const { manager, creator, recipient, supporter, attacker } = await deployFixture();

            const tx = await manager.connect(creator).createProposal(
                recipient.address,
                ethers.ZeroAddress,
                ethers.parseEther("10"),
                ethers.parseEther("10"),
                86400,
                0,
                false,
                "ipfs://1"
            );
            const proposalId = await manager.proposalCount();

            await manager.connect(supporter).fundNative(proposalId, { value: ethers.parseEther("10") });
            await moveAfterDeadline(manager, proposalId);

            // Attacker (external user) finalizes
            await manager.connect(attacker).finalizeProposal(proposalId);
            
            const p = await manager.getProposal(proposalId);
            expect(p.finalized).to.be.true;
            expect(p.status).to.equal(1); // Succeeded
        });

        it("Finalize cannot run twice", async function () {
            const { manager, creator, recipient, supporter } = await deployFixture();
            const tx = await manager.connect(creator).createProposal(
                recipient.address,
                ethers.ZeroAddress,
                ethers.parseEther("10"),
                ethers.parseEther("10"),
                86400,
                0,
                false,
                "ipfs://1"
            );
            const proposalId = await manager.proposalCount();
            await manager.connect(supporter).fundNative(proposalId, { value: ethers.parseEther("10") });
            await moveAfterDeadline(manager, proposalId);

            await manager.finalizeProposal(proposalId);
            await expect(manager.finalizeProposal(proposalId)).to.be.revertedWith("Not active");
        });
    });

    describe("Advanced Accounting", function () {
        it("Correctly handles Fee-on-Transfer tokens", async function () {
            const { manager, vault, creator, recipient, supporter, feeToken } = await deployFixture();

            const tx = await manager.connect(creator).createProposal(
                recipient.address,
                await feeToken.getAddress(),
                ethers.parseEther("100"),
                ethers.parseEther("50"),
                86400,
                0,
                false,
                "ipfs://1"
            );
            const proposalId = await manager.proposalCount();

            await feeToken.mint(supporter.address, ethers.parseEther("100"));
            await feeToken.connect(supporter).approve(await vault.getAddress(), ethers.parseEther("100"));

            // Supporter sends 100, but vault receives 95 (5% fee)
            await manager.connect(supporter).fundKrc20(proposalId, ethers.parseEther("100"));

            const p = await manager.getProposal(proposalId);
            expect(p.totalRaised).to.equal(ethers.parseEther("100")); // Manager tracks gross
            
            const vaultBalance = await vault.proposalBalances(proposalId);
            expect(vaultBalance).to.equal(ethers.parseEther("95")); // Vault tracks net

            // Finalize success (threshold was 50, we have 95 net)
            await moveAfterDeadline(manager, proposalId);
            await manager.finalizeProposal(proposalId);

            // Recipient should get (95 - splits) * 0.95 = 83.9325
            expect(await feeToken.balanceOf(recipient.address)).to.equal(ethers.parseEther("83.9325"));
        });
    });

    describe("Emergency Resilience", function () {
        it("Emergency refund works after grace period if manager is idle", async function () {
            const { manager, vault, creator, recipient, supporter, attacker } = await deployFixture();

            const tx = await manager.connect(creator).createProposal(
                recipient.address,
                ethers.ZeroAddress,
                ethers.parseEther("10"),
                ethers.parseEther("10"),
                86400,
                0,
                false,
                "ipfs://1"
            );
            const proposalId = await manager.proposalCount();

            await manager.connect(supporter).fundNative(proposalId, { value: ethers.parseEther("5") });

            // Move past deadline BUT DON'T FINALIZE
            await moveAfterDeadline(manager, proposalId);
            
            // Try emergency refund early -> fail
            await expect(manager.triggerEmergencyRefund(proposalId)).to.be.revertedWith("Grace period not elapsed");

            // Move past grace period
            await moveAfterGracePeriod(manager, proposalId);

            // Anyone can trigger emergency refund
            await manager.connect(attacker).triggerEmergencyRefund(proposalId);

            expect(await vault.withdrawalsEnabled(proposalId)).to.be.true;
            
            const before = await ethers.provider.getBalance(supporter.address);
            await vault.connect(supporter).withdraw(proposalId);
            const after = await ethers.provider.getBalance(supporter.address);
            expect(after).to.be.gt(before);
        });
    });
});
