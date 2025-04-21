import hre from "hardhat";
import { ethers } from "hardhat";

async function addToWhiteList(address: string, addressToAdd: string) {
    // Connect to the contract using ethers since we're interacting with a proxy
    const marketMakerVault = await ethers.getContractAt("VanillaMarketMakerVault", address);

    // Call the whitelistStake function
    const tx = await marketMakerVault.whitelistStake(addressToAdd);
    await tx.wait();

    //log tx hash
    console.log(`Tx hash: ${tx.hash}`);

    console.log(`Address ${addressToAdd} added to whitelist in contract ${address}`);
}

addToWhiteList("0xaAd5005D2EF036d0a8b0Ab5322c852e55d9236cF", "0x64b50ee3cb2fa844c3a9d0a6c24f0bcdd29484fb");


