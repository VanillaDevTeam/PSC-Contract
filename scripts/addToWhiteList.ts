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

addToWhiteList("0xf5079707731cb55BdE02dce8AF07a5f1FE2405b0", "0x89eB8D017454055649963c514bD4673AB4A74F66");


