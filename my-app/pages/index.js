import { Contract, providers, utils } from "ethers";
import Head from 'next/head';
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
 //track of connected wallet
 const [walletConnected, setWalletConnected] = useState(false);

 //track of presale started or not
 const [presaleStarted, setPresaleStarted] = useState(false);

 //keep track of presale ended
 const [presaleEnded, setPresaleEnded] = useState(false);

 //when waiting for transaction to be minted set to true
 const [loading, setLoading] = useState(false);

 //check current connected MetaMask wallet belong to contract owner
 const [isOwner, setIsOwner] = useState(false);

 //track number of tokenIds mined
 const [tokenIdsMinted, setTokenIdsMinted] = useState("0");

 //create reference to web3modal
 const web3ModalRef = useRef();

 //Presale mint of NFT
 const presaleMint = async () => {
  try{
    //to write the transaction
    const signer = await getProviderOrSigner(true);

    //new instance of contract with signer which allows update of methods
    const whitelistContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      signer
    );

    //whitelisted addresses will mint
    const tx= await whitelistContract.presaleMint({
      value: utils.parseEther("0.01"),
    });
    setLoading(true);

    //for transaction to be mined
    await tx.wait();
    setLoading(false);
    window.alert("You successfully minted a Crypto Dev!");
  }
  catch(err){
    console.error(err);
  }
 };

 //mint NFT after presale
 const publicMint = async () => {
  try{
    const signer = await getProviderOrSigner(true);
    const whitelistContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      signer
    );

    //to mint Crypto Dev
    const tx = await whitelistContract.mint({
      value: utils.parseEther("0.01"),
    });
    setLoading(true);

    await tx.wait();
    setLoading(false);
    window.alert("You successfully minted a Crypto Dev!");
  }
  catch(err){
    console.error(err);
  }
 };

 //connect to MetaMask wallet
 const connectWallet = async () => {
  try{
    //get provider from web3modal, if first time use it prompts to connect to wallet
    await getProviderOrSigner();
    setWalletConnected(true);
  }
  catch(err){
    console.error(err);
  }
 };

 //start presale of NFT Collection
 const startPresale = async () => {
  try{
    const signer = await getProviderOrSigner(true);
    const whitelistContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      signer
    );

    //call presale from contract
    const tx = await whitelistContract.startPresale();
    setLoading(true);

    await tx.wait();
    setLoading(false);

    //set presale started to true
    await checkIfPresaleStarted();
  }
  catch(err){
    console.error(err);
  }
 };

 //check if presale started quering presaleStarted in contract
 const checkIfPresaleStarted = async () => {
  try{
    //get provider
    const provider = await getProviderOrSigner();

    //connect contract using provider
    const nftcontract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      provider
    );

    const _presaleStarted =  await nftContract.presaleStarted();
    if(!_presaleStarted){
      await getOwner();
    }
    setPresaleStarted(_presaleStarted);
    return _presaleStarted;
  }
  catch(err){
    console.error(err);
    return false;
  }
 };

 //check presaleEnded quering presaleEnded in contract
 const checkIfPresaleEnded = async () => {
  try{
    const provider = await getProviderOrSigner();
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      provider
    );
    const _presaleEnded = await nftContract.presaleEnded();

    //_presaleEnded is a big number so we use ls method instead of <
    //compare _presaleEnded timestamp is less than current time
    const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
    if(hasEnded){
      setPresaleEnded(true);
    }
    else{
      setPresaleEnded(false);
    }

    return hasEnded;
  }
  catch(err){
    console.error(err);
    return false;
  }
 };

 //to retrieve the owner
 const getOwner = async () => {
  try{
    const provider = await getProviderOrSigner();
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      provider
    );
    const _owner = await nftContract.owner();

    //extract address of currently connected MetaMask account
    const signer = await getProviderOrSigner(true);

    //get address of associated signer connected to MetaMask
    const address = await signer.getAddress();
    if(address.toLowerCase() === _owner.toLowerCase()){
      setIsOwner(true);
    }
  }
  catch (err) {
    console.error(err.message);
  }
 };

 //get number of minted tokenIds
 const getTokenIdsMinted = async () => {
  try{
    const provider = await getProviderOrSigner();
    const nftContract = new Contract(
      NFT_CONTRACT_ADDRESS,
      abi,
      provider
    );
    const _tokenIds = await nftContract.tokenIds();

    //convert to string because its a big number
    setTokenIdsMinted(_tokenIds.toString());
  }
  catch (err) {
    console.error(err);
  }
 };

 /**Return a Provider or Signer representing the Ethereum RPC
  * with or without signing capabilities of MetaMask
  * Provider needed to interact with blockchain
  */

 const getProviderOrSigner = async (needSigner = false) => {
  const provider = await web3ModalRef.current.connect();
  const web3Provider = new providers.Web3Provider(provider);

  //if not connected to Rinkeby network throw an error
  const {chainId} = await web3Provider.getNetwork();
  if(chainId !== 4){
    window.alert("Change the network to Rinkeby");
    throw new Error("Change the network to Rinkeby");
  }

  if(needSigner){
    const signer = web3Provider.getSigner();
    return signer;
  }

  return web3Provider;
 };

 //Used to react to changes in state of website
 //array at end of function represents what will trigget state change

 useEffect( () => {
  //If wallet not connected, create instance of Web3Modal to connect
  if(!walletConnected){
    web3ModalRef.current = new Web3Modal({
      network: "rinkeby",
      providerOptions: {},
      disableInjectedProvider: false,
    });
    connectWallet();

    //check if presale has started or ended
    const _presaleStarted = checkIfPresaleStarted();
    if(_presaleStarted){
      checkIfPresaleEnded();
    }

    getTokenIdsMinted();

    //set interval called every 5 seconds to check presale ended
    const presaleEndedInterval = setInterval(async function () {
      const _presaleStarted = await checkIfPresaleStarted();
      if(_presaleStarted){
        const _presaleEnded = await checkIfPresaleEnded();
        if(_presaleEnded){
          clearInterval(presaleEndedInterval);
        }
      }
    }, 5 * 1000);

    //get number of tokenIds minted every 5 seconds
    setInterval(async function (){
      await getTokenIdsMinted();
    }, 5 * 1000);
  }
 }, [walletConnected]);

 //return button based on the state of dApp
 const renderButton = () => {
  //if wallet not connected, render button to allow to connect to wallet
  if(!walletConnected){
    return(
      <button onClick={connectWallet} className={styles.button}>Connect your wallet</button> 
    );
  }

  //if waiting retuen a loading button
  if(loading){
    return <button className={styles.button}>Loading....</button>;
  }

  //if connected user is owner and presale has not started yet, allow owner to start presale
  if(isOwner && !presaleStarted){
    return(
      <button className={styles.button} onClick={startPresale}>Start Presale!</button>
    );
  }

  //notify connected user if owner and presale has not started
  if(!presaleStarted){
    return(
      <div>
        <div className={styles.description}>Presale has not started!</div>
      </div>
    );
  }

  //presaleStarted and not ended, allow minting during presale period
  if(presaleStarted && !presaleEnded){
    return(
      <div>
        <div className={styles.description}>Presale has started!!! If your address is whitelisted, Mint a Crypto Dev</div>
        <button className={styles.button} onClick={presaleMint}>Presale Mint</button>
      </div>
    );
  }

  //presale started and ended, time for public minting
  if(presaleStarted && presaleEnded){
    return(
      <button className={styles.button} onClick={publicMint}>Public Mint</button>
    );
  }
 };

 return(
  <div>
    <Head>
      <title>Crypto Devs</title>
      <meta name="description" content="Whitelist-dApp" />
      <link rel="icon" href="/favicon.ico" />
    </Head>

    <div className={styles.main}>
      <div>
        <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
        <div className={styles.description}>Its an NFT Collection for developers in Crypto</div>
        <div className={styles.description}>{tokenIdsMinted} / 20 have been minted</div>
        {renderButton()}
      </div>

      <div>
        <img className={styles.image} src="./cryptodevs/0.svg" />
      </div>
    </div>

    <footer className={styles.footer}>Made with &#10084; by Crypto Devs</footer>
  </div>
 );
}
