const {ethers} = require("hardhat");
require("dotenv").config( {path: ".env"} );
const {WHITELIST_CONTRACT_ADDRESS, METADATA_URL} = require("../constants");

async function main() {
    //contract address of whitelist
    const whitelistContract = WHITELIST_CONTRACT_ADDRESS;
    
    //URL to extract metadata for Crypto Dev NFT
    const metadataURL = METADATA_URL;

    //ContractFactory in ethers.js is an abstraction used to deploy new contracts
    const cryptoDevsContract = await ethers.getContractFactory("CryptoDevs");

    //deploy the contract
    const deployedCryptoDevsContract = await cryptoDevsContract.deploy(
        metadataURL,
        whitelistContract
    );

    //print address of the deployed contract
    console.log("Crypto Devs Contract Address: ", deployedCryptoDevsContract.address);
}

//call main, if there is an error catch it
main()
.then( () => process.exit(0))
.catch( (error) => {
    console.error(error);
    process.exit(1);
});