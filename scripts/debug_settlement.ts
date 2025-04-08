import hre from "hardhat";
import { ethers } from "hardhat";

async function debugSettlement(address: string, account: string, amount: number) {
    // First make sure the signer has the MONEY_VAULT_ROLE
    const marketMakerVault = await ethers.getContractAt("VanillaMarketMakerVaultV2", address);
    const role = await marketMakerVault.MONEY_VAULT_ROLE();
    const signer = await ethers.provider.getSigner();
    const signerAddress = await signer.getAddress();

    console.log("Signer address:", signerAddress);

    const hasRole = await marketMakerVault.hasRole(role, signerAddress);
    console.log(`Signer has role ${role}: ${hasRole}`);

    if (!hasRole) {
        console.log(`Adding role ${role} to signer`);
        // Check if signer has ADMIN_ROLE to grant MONEY_VAULT_ROLE
        const adminRole = await marketMakerVault.ADMIN_ROLE();
        const hasAdminRole = await marketMakerVault.hasRole(adminRole, signerAddress);
        console.log(`Signer has admin role: ${hasAdminRole}`);

        if (hasAdminRole) {
            const tx = await marketMakerVault.grantRole(role, signerAddress);
            await tx.wait();
            console.log(`Granted MONEY_VAULT_ROLE to signer: ${tx.hash}`);
        } else {
            console.log("Signer doesn't have admin role to grant MONEY_VAULT_ROLE");
            return;
        }
    }

    // Now perform the settlement
    const tx = await marketMakerVault.settlement(account, ethers.parseUnits(amount.toString(), 18));
    await tx.wait();
    console.log(`Tx hash: ${tx.hash}`);
    console.log(`Settlement ${amount} to ${account} in contract ${address}`);
}

async function makesureRole(address: string, account: string) {
    const marketMakerVault = await ethers.getContractAt("VanillaMarketMakerVaultV2", address);
    console.log("marketMakerVault", await marketMakerVault.getRoleAdmin(await marketMakerVault.MONEY_VAULT_ROLE()));
    // const tx = await marketMakerVault.addDefaultAdmin(account);
    // await tx.wait();
    // console.log(`Tx hash: ${tx.hash}`);
    const role = await marketMakerVault.MONEY_VAULT_ROLE();
    console.log("role", role);
    const hasRole = await marketMakerVault.hasRole(role, account);
    console.log(`Has role ${role} ${hasRole}`);

    if (!hasRole) {
        console.log(`Adding role ${role} to ${account}`);
        const tx = await marketMakerVault.grantRole(role, account);
        await tx.wait();
        console.log(`Tx hash: ${tx.hash}`);
    }
}

// Only run one function to debug the issue
// Comment out makesureRole call to focus on settlement first
// makesureRole("0xaE5e8B8D1977360931fc8a76555d4A0835EAC449", "0x36cd0275746cdee559c73208c093fd32638e1640");
debugSettlement("0xaE5e8B8D1977360931fc8a76555d4A0835EAC449", "0x36cd0275746cdee559c73208c093fd32638e1640", 72.8699);

