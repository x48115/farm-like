#! /usr/bin/env node
const farms = require("./farms.json");
const fetch = require("node-fetch");
const Web3 = require("web3");
const provider =
  "wss://eth-mainnet.ws.alchemyapi.io/v2/<your_key>";
const web3 = new Web3(provider);

const printMatch = async (farmAddress, farmName, accuracy, missingMethods) => {
  console.log(
    `Farm (${farmAddress}) matches "${farmName}" with ${
      accuracy * 100
    }% accuracy`
  );

  let url = `https://api.telegram.org/<tg_bot>:<tg_bot_code>/sendMessage?chat_id=@secret_farmer&disable_web_page_preview=true&parse_mode=Markdown&text=*New farm*: ${farmAddress}%0a*Type*: ${farmName}%0a*Match*: ${
    accuracy * 100
  }%`;

  const flattenMethod = (method) => {
    const { name, signature } = method;
    return `_0x${signature}_ "${name}"`;
  };
  if (missingMethods.length) {
    url += `%0a*Missing methods*:%0a`;
    const flattenedMethods = missingMethods.map(flattenMethod);
    const flattenedJoinedMethods = flattenedMethods.join("%0a");
    url += flattenedJoinedMethods;
    console.log(`Missing methods:`);
    console.log(missingMethods);
  }
  const response = await fetch(url);
};

const push4OpCode = "63";
const threshold = 0.7;

const getCode = async (address) => {
  const code = await web3.eth.getCode(address);
  return code;
};

const farmLike = async (addressToTest) => {
  const code = await getCode(addressToTest);
  for (farm of farms) {
    const { name: farmName, methods: farmMethods, code: farmCode } = farm;
    const numberOfMethods = farmMethods.length;
    const missingMethods = [];
    let matchCount = 0;
    for (methodIdx = 0; methodIdx < numberOfMethods; methodIdx++) {
      const method = farmMethods[methodIdx];
      const { signature } = method;
      const methodExists = code.indexOf(`${push4OpCode}${signature}`) != -1;
      if (methodExists) {
        matchCount++;
      } else {
        missingMethods.push(method);
      }
    }
    let matchRatio = matchCount / numberOfMethods;
    if (matchRatio >= threshold) {
      const newCode = await getCode(addressToTest);
      const exactMatch = newCode.indexOf(`${farmCode}`) != -1;
      if (exactMatch) {
        // matchRatio = 1;
      }
      await printMatch(addressToTest, farmName, matchRatio, missingMethods);
    }
  }
};

module.exports = farmLike;
