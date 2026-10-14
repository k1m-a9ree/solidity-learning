import hre from "hardhat";
import { expect } from "chai";
import { MyToken, MyToken__factory } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const mintingAmount = 100n;
const decimals = 10n;

describe("My Token", () => {
    let myTokenC: MyToken;
    let signers: HardhatEthersSigner[];

    beforeEach("should deploy", async () => {
        signers = await hre.ethers.getSigners();
        myTokenC = await hre.ethers.deployContract("MyToken", [
            "MyToken",
            "MT",
            decimals,
            mintingAmount
        ]);
    });

    describe("Basic state value check", () => {
        it("should return name", async () => {
            expect(await myTokenC.name()).to.equal("MyToken");
        });
        it("should return symbol", async () => {
            expect(await myTokenC.symbol()).to.equal("MT");
        });
        it("should return decimals", async () => {
            expect(await myTokenC.decimals()).to.equal(decimals);
        });
        it("should return 100 totalSupply", async () => {
            expect(await myTokenC.totalSupply()).to.equal(mintingAmount * 10n ** decimals);
        });
    });

    describe("Mint", () => {
        it("should return 1MT balance for signer 0", async () => {
            const signer0 = signers[0];
            expect(await myTokenC.balanceOf(signer0)).equal(mintingAmount * 10n ** decimals);
        });
    });

    describe("Transfer", () => {
        it("should have 0.5MT", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];

            await expect(
                myTokenC.transfer(
                    hre.ethers.parseUnits("0.5", decimals), 
                    signer1.address
                )
            ).to.emit(
                myTokenC, "Transfer"
            ).withArgs(
                signer0.address, 
                signer1.address, 
                hre.ethers.parseUnits("0.5", decimals)
            );
            
            expect(await myTokenC.balanceOf(signer1.address)).equal(
                hre.ethers.parseUnits("0.5", decimals)
            );
        });

        it("should be reverted with insufficient balance error", async () => {
            const signer1 = signers[1];
            await expect(
                myTokenC.transfer(
                    hre.ethers.parseUnits((mintingAmount + 1n).toString(), decimals), 
                    signer1.address
                )
            ).to.be.revertedWith("insufficient balance");
        });
    })

    describe("TransferFrom", () => {
        it("should emit Approval event", async () => {
            const signer1 = signers[1];
            await expect(myTokenC.approve(signer1.address, hre.ethers.parseUnits("10", decimals))).to.emit(myTokenC, "Approval").withArgs(signer1.address, hre.ethers.parseUnits("10", decimals));
        });
        it("should be reverted with insufficient allowance error", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];
            await expect(myTokenC.connect(signer1).transferFrom(
                signer0.address, 
                signer1.address, 
                hre.ethers.parseUnits("1", decimals))
            ).to.be.revertedWith("insufficient allowance");
        });

        // 과제
        it("should emit Approval and transfer 2MT", async () => {
            const signer0 = signers[0];
            const signer1 = signers[1];

            // signer1이 signer0 계좌에서 3MT만큼 가져갈 수 있게 함
            await expect(
                myTokenC.connect(signer0).approve( // connect를 안써도 signer0인건 알지만, 걍 명시하기 위해 사용했음. 성능 차이가 있으려나?
                    signer1.address, 
                    hre.ethers.parseUnits("3", decimals)
                )
            ).to.emit(
                myTokenC, "Approval"
            ).withArgs(
                signer1.address, 
                hre.ethers.parseUnits("3", decimals)
            );

            // signer1이 signer0 계좌에서 2MT만큼 가져감
            await expect(
                myTokenC.connect(signer1).transferFrom(
                    signer0.address, 
                    signer1.address,
                    hre.ethers.parseUnits("2", decimals)
                )
            ).to.emit(
                myTokenC, "Transfer"
            ).withArgs(
                signer0.address, 
                signer1.address,
                hre.ethers.parseUnits("2", decimals)
            );

            // 그럼 한 번 더 2MT 가져갈려고 하면 이제 1MT만 허용되므로 거절되겠네
            await expect(
                myTokenC.connect(signer1).transferFrom(
                    signer0.address, 
                    signer1.address,
                    hre.ethers.parseUnits("2", decimals)
                )
            ).to.be.revertedWith("insufficient allowance");
        });
    });

});