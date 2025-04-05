# Vanilla Protocol Deployment Scripts

This directory contains scripts for deploying the Vanilla Protocol contracts.

## Deployment Script

The `deploy.ts` script handles the deployment of the following contracts:

- `VanillaMarketMakerVault`: The vault for market makers to stake funds
- `VanillaMoneyVault`: The vault that manages user deposits and settlements

## Prerequisites

Before running the deployment script, make sure you have:

1. Set up your environment variables in a `.env` file:
   ```
   ASSET_ID=0x123...abc  # ERC20 token address used by the protocol
   OWNER_ADDRESS=0x456...def  # Optional: Address that will have admin privileges (defaults to deployer)
   PLATFORM_FEE_ACCOUNT=0x789...ghi  # Optional: Address that will receive platform fees (defaults to deployer)
   PROFIT_SHARING_ACCOUNT=0xabc...123  # Optional: Address that will receive profit sharing fees (defaults to deployer)
   BOT_ADDRESSES=0x111...aaa,0x222...bbb  # Optional: Comma-separated list of bot addresses
   ```

2. Configure your network settings in `hardhat.config.ts`

## Running the Deployment

To deploy the contracts to your chosen network:

```bash
# Deploy to local development network
npx hardhat run scripts/deploy.ts

# Deploy to a specific network
npx hardhat run scripts/deploy.ts --network mumbai
npx hardhat run scripts/deploy.ts --network mainnet
```

## Deployment Process

The script performs the following steps:

1. Deploys the `VanillaMarketMakerVault` contract
2. Initializes the `VanillaMarketMakerVault` with the asset ID and owner
3. Deploys the `VanillaMoneyVault` contract
4. Initializes the `VanillaMoneyVault` with all required parameters
5. Grants the `MONEY_VAULT_ROLE` to the `VanillaMoneyVault` in the `VanillaMarketMakerVault`
6. Saves the deployment information to a JSON file in the `deployments` directory

## After Deployment

After a successful deployment, you should:

1. Verify the contracts on the blockchain explorer
2. Set up any additional role grants required
3. Check the deployment JSON file for contract addresses and configuration details

## Troubleshooting

If you encounter issues during deployment:

- Ensure you have set the correct network in your command
- Verify that your environment variables are correctly set
- Check that you have sufficient funds in your deployer account
- For network-specific issues, refer to the Hardhat documentation 