const MockV3Aggregator = artifacts.require('MockV3Aggregator');
const MockDAIToken = artifacts.require('MockDAIToken');
const Web3 = require("web3");
const web3 = new Web3();
var Eth = require('web3-eth');
var eth = new Eth(Eth.givenProvider || 'ws://some.local-or-remote.node:8546');

let deployed = false;
let tokenDai = {};
let mockV3 = {};

const token_address = {
    "dai_usd_price_feed_address": '0x14866185B1962B63C3Ea9E03Bc1da838bab34C19',
    "eth_usd_price_feed_address": '0x694AA1769357215DE4FAC081bf1f309aDC325306',
    "link_usd_price_feed_address": '0xc59E3633BAAC79493d908e63626716e204A45EdF',
    "dai_token_address": '0x68194a729C2450ad26072b3D33ADaCbcef39D574',
    "weth_token_address": '0xf531B8F309Be94191af87605CfBf600D71C2cFe0',
    "link_token_address": '0x779877A7B0D9E8603169DdbD7836e478b4624789',
    "dapp_token_address": '0x747c276c9a714C79A6b9B9eA1A995888cc9e35E4'
};

function toWei(amount) {
    return web3.utils.toWei(amount, "ether");
}

const contract_to_mock = {
    "dai_usd_price_feed_address": MockV3Aggregator,
    "dapp_usd_price_feed_address": MockV3Aggregator,
    "eth_usd_price_feed_address": MockV3Aggregator,
    "link_usd_price_feed_address": MockV3Aggregator,
    "dai_token_address": MockDAIToken,
    "weth_token_address": MockDAIToken,
    "link_token_address": MockDAIToken,
    "dapp_token_address": MockDAIToken
};

const deploy_mocks = async (deployer) => {
    await deployer.deploy(MockDAIToken);
    await deployer.deploy(MockV3Aggregator, 8, 2 * 10 ** 8);
    tokenDai = await MockDAIToken.deployed();
    mockV3 = await MockV3Aggregator.deployed();
    deployed = true;
    return [tokenDai.address, mockV3._address];
};

const get_contract = async (contract_name, current_network, current_deployer) => {
    let contract_addr;
    let contract_type = contract_to_mock[contract_name];
    if (current_network == "development") {
        if (deployed) {
            contract_addr = contract_type["contractName"] == "MockDAIToken" ? tokenDai.address : mockV3.address;
        } else {
            var token = await deploy_mocks(current_deployer);
            contract_addr = contract_type["contractName"] == "MockDAIToken" ? token[0] : token[1];
        }
    } else {
        const contract = new web3.eth.Contract(contract_type.abi, token_address[contract_name]);
        contract_addr = contract._address;
    }
    return contract_addr;
};

module.exports = { get_contract, deploy_mocks, contract_to_mock, toWei };
