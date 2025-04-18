## v2.1
*   VanillaMarketMakerVault
    *   add whiteListManagement related function  
        ```solidity
        function isWhitelisted(address account) external view returns (bool);
        function removeWhitelistStake(address account) external onlyRole(ADMIN_ROLE);
        function whitelistStake(address account) external onlyRole(ADMIN_ROLE);
        ```
        and events
        ```solidity
        event WhitelistStake(address indexed account);
        event RemoveWhitelistStake(address indexed account);
        ```
    * add paticial unstake support
        ```solidity
        function partialUnstake(uint256 amount) external nonReentrant whenNotPaused;

        ```
*   VanillaMoneyVault
    *   add daily signIn function
        ```solidity
        event DailySignIn(address indexed user, uint256 timestamp);

        ```
## v2.0
*   add function 
*   ```solidity 
    function addDefaultAdmin(address owner) external onlyRole(ADMIN_ROLE)
    ``` 
    to both VanillaMoneyVault and VanillaMarketMakerVault