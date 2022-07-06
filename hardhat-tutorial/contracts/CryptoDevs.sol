//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721IEnumerable, Ownable{
    /**_baseTokenURI for computing {tokenURI}, if set, each of the resulting URI will be a concatenation of the baseURI and tokenId*/
    string _baseTokenURI;

    //The price of one Crypto Dev NFT
    uint256 public _price = 0.01 ether;

    //Pause the contract in case of emergency
    bool public _paused;

    //Max number of Crypto Devs allowed
    uint256 public maxTokenIds = 20;

    //Total number of minted tokenIds
    uint256 public tokenIds;

    //Instance of Whitelist contract
    IWhitelist whitelist;

    //Keep tract of presale started or not
    bool public presaleStarted;

    //Timestamp for when presale would end
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused{
        require(!_paused, "Contract is currently paused");
    }

    /**Takes in a name = CryptoDevs and a symbol = CD
    *Takes in baseURI to set _baseTokenURI for the collection and initializes an instance of whitelist interface*/
    constructor(string memory baseURI, address whitelistContract) ERC721("CryptoDevs", "CD"){
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    //Start presale for whitelisted addresses
    function startPresale() public onlyOwner{
        presaleStarted = true;

        //Set presaleEnded time as current time + 5 minutes
        presaleEnded = block.timestamp  + 5 minutes;
    }

    //Allows user to mint one NFT per transaction during presale
    function presaleMint() public payable onlyWhenNotPaused{
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require(tokenIds < maxTokenIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether sent is not correct");

        tokenIds += 1;

        /**Safer version of _mint function, ensures if address being minted is a contract
        *then it will know how to deal with ERC721 tokens. If address is not a contract, it works the same as _mint*/
        _safeMint(msg.sender, tokenIds);
    }

    //Alolows the user to mint 1 NFT per transaction after presale has ended
    function mint() public payable onlyWhenNotPaused{
        require(presaleSatrted && block.timestamp >= presaleEnded, "Presale has not ended yet");
        require(tokenIds < maxTokenIds, "Exceed maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether is not correct");

        tokenId += 1;
        _safeMint(msg.sender, tokenIds);
    }

    //Overrides Openzeppelin ERC721 implementation, which by default returns an empty string for baseURI
    function _baseURI() internal view virtual override returns (string memory){
        return _baseTokenURI;
    }

    //Pauses the contract or unpauses the contract
    function setPaused(bool val) public onlyOwner{
        _paused = val;
    }

    //Sends all the ether in the contract to the contract owner
    function withdraw() public onlyOwner{
        address _owner = owner();
        uint256 amount = address(thi).balance;
        (bool sent, ) = _owner.call{value: amount}("");
        require(sent, "Failed to send ether");
    }

    //Function to receive ether.msg.data must be empty
    receive() external payable{}

    //Called when msg.data is not empty
    fallBack() external payable{}
}
