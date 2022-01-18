#! /usr/bin/env node
const Web3 = require("web3");
const farmLike = require("./farmLike.js");
const provider =
  "wss://eth-mainnet.ws.alchemyapi.io/v2/<your_key>";
const web3 = new Web3(provider);
const web3Https = new Web3(
  "https://eth-mainnet.alchemyapi.io/v2/<your_key>"
);
const delay = require("delay");

const getTime = () => {
  const currentdate = new Date();
  const datetime =
    currentdate.getDay() +
    "/" +
    currentdate.getMonth() +
    "/" +
    currentdate.getFullYear() +
    " " +
    currentdate.getHours() +
    ":" +
    currentdate.getMinutes() +
    ":" +
    currentdate.getSeconds();
  return datetime;
};

const getTransactionReceipt = async (transactionHash) => {
  let receipt = await web3Https.eth.getTransactionReceipt(transactionHash);
  if (!receipt) {
    receipt = await web3Https.eth.getTransactionReceipt(transactionHash);
    if (!receipt) {
      console.log("Error");
    }
  }
  // console.log(receipt.transactionHash);
  return receipt;
};

const findContractCreationReceipts = (transactionReceipt) => {
  if (!transactionReceipt || !("contractAddress" in transactionReceipt)) {
    console.log("No receipt", transactionReceipt);
    return false;
  }
  return transactionReceipt.contractAddress;
};

const testNewContract = (contractAddress) => {
  console.log(`Found new contract: ${contractAddress} (${getTime()})`);
  farmLike(contractAddress);
};

const processBlockHeader = async (_, blockHeader) => {
  const { number: blockNumber } = blockHeader;

  const block = await web3.eth.getBlock(blockNumber);
  console.log(block);
  console.log(JSON.stringify(block.transactions));

  const transactionReceipts = await Promise.all(
    block.transactions.map(getTransactionReceipt)
  );

  const contractCreationTransactionReceipts = transactionReceipts.filter(
    findContractCreationReceipts
  );

  const contractCreationAddresses = contractCreationTransactionReceipts.map(
    (transactionReceipt) => transactionReceipt.contractAddress
  );

  if (contractCreationAddresses.length > 0) {
    contractCreationAddresses.forEach(testNewContract);
  }
};

const start = async () => {
  // farmLike("0xc0d8994Cd78eE1980885DF1A0C5470fC977b5cFe");
  web3.eth.subscribe("newBlockHeaders", processBlockHeader);
};

start();
