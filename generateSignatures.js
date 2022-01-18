#! /usr/bin/env node
const Web3 = require("web3");
const fetch = require("node-fetch");
const delay = require("delay");
const provider =
  "wss://eth-mainnet.ws.alchemyapi.io/v2/<your_key>";
const web3 = new Web3(provider);
const fs = require("fs");

const getCode = async (address) => {
  const code = await web3.eth.getCode(address);
  return code;
};

const fetchAbi = async (address) => {
  const apiKey = "<your_key>";
  const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`;
  const response = await fetch(url);
  const responseData = await response.json();
  const abi = JSON.parse(responseData.result);
  delay(600);
  return abi;
};

let farms = [
  {
    name: "Synthetix Staking",
    address: "0xc0d8994Cd78eE1980885DF1A0C5470fC977b5cFe",
    category: "staking",
  },
  {
    name: "Sushiswap MasterChef",
    address: "0xc2EdaD668740f1aA35E4D8f227fB8E17dcA888Cd",
    category: "staking",
  },
  {
    name: "Ampleforth Geyser",
    address: "0x92B30E2b504C4AfBbf518db8c74DE5cDfBEd369d",
    category: "staking",
  },
  {
    name: "Badger Geyser",
    address: "0xE0B94a7BB45dD905c79bB1992C9879f40F1CAeD5",
    category: "staking",
  },
  {
    name: "Cover Blacksmith",
    address: "0xE0B94a7BB45dD905c79bB1992C9879f40F1CAeD5",
    category: "staking",
  },
  {
    name: "Curve Gauge",
    address: "0xFA712EE4788C042e2B7BB55E6cb8ec569C4530c1",
    category: "staking",
  },
  {
    name: "Harvest Vault",
    address: "0x9B3bE0cc5dD26fd0254088d03D8206792715588B",
    category: "vault",
  },
  {
    name: "MEME LtdPool V2",
    address: "0x49445598Dc7e4D02De22318C525EBa18003b6261",
  },
  {
    name: "Pickle Jar",
    address: "0x68d14d66B2B0d6E157c06Dc8Fefa3D8ba0e66a89",
  },
  {
    name: "Pylon Staking",
    address: "0xA1C50AfAc5e0f57368B6993CC76e3897dAbaECf2",
  },
  {
    name: "Swerve Gauge",
    address: "0xb4d0C929cD3A1FbDc6d57E7D3315cF0C4d6B4bFa",
  },
  {
    name: "Yearn V1 Vault",
    address: "0x5dbcF33D8c2E976c6b560249878e6F1491Bca25c",
  },
  {
    name: "Uniswap Router",
    address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
  },
  {
    name: "Cream Comptroller",
    address: "0x3d5BC3c8d13dcB8bF317092d84783c2697AE9258",
  },
];

const addSignaturesToFarms = async () => {
  for (farm of farms) {
    const { name: farmName, address } = farm;
    console.log(`Generating signatures: ${address} (${farmName})`);
    abi = await fetchAbi(address);
    const methods = [];
    for (method of abi) {
      const { name: methodName, inputs, type } = method;
      if (type === "constructor" || type == "event") {
        continue;
      }
      let argsArr = [];
      let argsStr = "";
      const buildArgs = ({ type }) => {
        argsArr.push(type);
      };
      if (!methodName) {
        continue;
      }
      inputs.forEach(buildArgs);
      argsStr = argsArr.join(",");
      const signatureStr = `${methodName}(${argsStr})`;
      const signatureBytes4 = web3.utils.sha3(signatureStr).substring(2, 10);
      methods.push({ name: signatureStr, signature: signatureBytes4 });
    }
    const code = await getCode(address);
    farm.methods = methods;
    farm.code = code;
  }
};

const start = async () => {
  await addSignaturesToFarms();
  fs.writeFile("farms.json", JSON.stringify(farms, null, 2), "utf8", function (
    err
  ) {
    if (!err) {
      console.log("Saved farms");
    }
    process.exit();
  });
};

start();
