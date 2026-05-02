import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

describe("Kastj Escrow", function () {
    async function deployFixture() {
        const [owner, creator, recipient, supporter, treasury] = await ethers.getSigners();

        const Treasury = await ethers.getContractFactory("KastjTreasury");
        const treasuryContract = await Treasury.deploy(treasury.address);

        const Vault = await ethers.getContractFactory("EscrowVault");
        const vault = await Vault.deploy();

        const Manager = await ethers.getContractFactory("ProposalManager");
        const manager = await Manager.deploy(
            await vault.getAddress(),
            await treasuryContract.getAddress(),
        );

        await vault.setManager(await manager.getAddress());

        return {
            owner,
            creator,
            recipient,
            supporter,
            treasury,
            treasuryContract,
            manager,
            vault,
        };
    }

    it("releases funds with 5% creator reward and 2% platform fee", async () => {
        const { creator, recipient, supporter, treasuryContract, manager } = await deployFixture();

        const goal = ethers.parseEther("100");
        const amount = ethers.parseEther("100");

        await manager
            .connect(creator)
            .createProposal(
                recipient.address,
                ethers.ZeroAddress,
                goal,
                goal,
                3600,
                "ipfs://proposal-1",
            );

        await manager.connect(supporter).fundNative(1, {
            value: amount,
        });

        const recipientBefore = await ethers.provider.getBalance(recipient.address);
        const creatorBefore = await ethers.provider.getBalance(creator.address);

        await manager.finalizeProposal(1);

        const recipientAfter = await ethers.provider.getBalance(recipient.address);
        const creatorAfter = await ethers.provider.getBalance(creator.address);

        expect(recipientAfter - recipientBefore).to.equal(ethers.parseEther("93"));
        expect(creatorAfter - creatorBefore).to.equal(ethers.parseEther("5"));

        expect(await ethers.provider.getBalance(await treasuryContract.getAddress())).to.equal(
            ethers.parseEther("2"),
        );
    });

    it("allows refund when proposal fails", async () => {
        const { creator, recipient, supporter, manager, vault } = await deployFixture();

        const goal = ethers.parseEther("100");
        const threshold = ethers.parseEther("100");
        const contribution = ethers.parseEther("10");

        await manager
            .connect(creator)
            .createProposal(
                recipient.address,
                ethers.ZeroAddress,
                goal,
                threshold,
                3600,
                "ipfs://proposal-2",
            );

        await manager.connect(supporter).fundNative(1, {
            value: contribution,
        });

        await ethers.provider.send("evm_increaseTime", [3601]);
        await ethers.provider.send("evm_mine", []);

        await manager.finalizeProposal(1);

        const before = await ethers.provider.getBalance(supporter.address);

        const refundTx = await vault.connect(supporter).withdraw(1);
        const receipt = await refundTx.wait();

        const gas = receipt!.gasUsed * receipt!.gasPrice!;
        const after = await ethers.provider.getBalance(supporter.address);

        expect(after + gas - before).to.equal(contribution);
    });

    it("prevents double withdraw", async () => {
        const { creator, recipient, supporter, manager, vault } = await deployFixture();

        const goal = ethers.parseEther("100");
        const threshold = ethers.parseEther("100");
        const contribution = ethers.parseEther("10");

        await manager
            .connect(creator)
            .createProposal(
                recipient.address,
                ethers.ZeroAddress,
                goal,
                threshold,
                3600,
                "ipfs://proposal-3",
            );

        await manager.connect(supporter).fundNative(1, {
            value: contribution,
        });

        await ethers.provider.send("evm_increaseTime", [3601]);
        await ethers.provider.send("evm_mine", []);

        await manager.finalizeProposal(1);

        await vault.connect(supporter).withdraw(1);

        await expect(vault.connect(supporter).withdraw(1)).to.be.revertedWith("Already withdrawn");
    });
});
