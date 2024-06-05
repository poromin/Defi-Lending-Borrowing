const LARToken = artifacts.require('LARToken');
const ADEToken = artifacts.require('ADE');
const LendingAndBorrowing = artifacts.require('LendingAndBorrowing');
const CreditScore = artifacts.require('CreditScore');
const tools = require("../scripts/helpful_scripts");

const KEPT_BALANCE = web3.utils.toWei("1000", "ether");
const MAX_RETRIES = 5;
const DELAY = 120000; // 2 minutes

const token_info = {
    "dai_token": { "name": "DAI", "LTV": tools.toWei("0.8"), "borrow_stable_rate": tools.toWei("0.025") },
    "weth_token": { "name": "WETH", "LTV": tools.toWei("0.75"), "borrow_stable_rate": tools.toWei("0.01") },
    "link_token": { "name": "LINK", "LTV": tools.toWei("0.8"), "borrow_stable_rate": tools.toWei("0.05") },
};

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
};

const deployWithRetries = async (deployer, contract, ...args) => {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            await deployer.deploy(contract, ...args);
            return contract.deployed();
        } catch (error) {
            console.error(`Deployment attempt ${attempt} failed for ${contract.contractName}:`, error);
            if (attempt === MAX_RETRIES) {
                throw error;
            }
            await sleep(DELAY);
        }
    }
};

const addTokenToPriceFeed = async (network, deployer, dai_token_address, weth_token_address, link_token_address) => {
    const dai_usd_price_feed_address = await tools.get_contract("dai_usd_price_feed_address", network, deployer);
    const weth_usd_price_feed_address = await tools.get_contract("eth_usd_price_feed_address", network, deployer);
    const link_usd_price_feed_address = await tools.get_contract("link_usd_price_feed_address", network, deployer);

    const token_to_price_feed = {
        [dai_token_address]: dai_usd_price_feed_address,
        [weth_token_address]: weth_usd_price_feed_address,
        [link_token_address]: link_usd_price_feed_address,
    };

    return token_to_price_feed;
};

const add_token_to_price_feed_mapping = async (lending_and_borrowing, token_to_price_feed, ...tokens) => {
    for (const token of tokens) {
        const price_feed_address = token_to_price_feed[token];
        if (!price_feed_address) {
            console.error(`Price feed address for token ${token} not found`);
            continue;
        }
        await lending_and_borrowing.addTokenToPriceFeedMapping(token, price_feed_address);
        console.log(`Added ${token} to price feed mapping`);
    }
};

const addTokensToLend = async (lending_and_borrowing, dai_token_address, weth_token_address, link_token_address) => {
    await lending_and_borrowing.addTokensForLending(
        token_info["dai_token"]["name"],
        dai_token_address,
        token_info["dai_token"]["LTV"],
        token_info["dai_token"]["borrow_stable_rate"]
    );
    console.log("Added DAI for lending");

    await lending_and_borrowing.addTokensForLending(
        token_info["weth_token"]["name"],
        weth_token_address,
        token_info["weth_token"]["LTV"],
        token_info["weth_token"]["borrow_stable_rate"]
    );
    console.log("Added WETH for lending");

    await lending_and_borrowing.addTokensForLending(
        token_info["link_token"]["name"],
        link_token_address,
        token_info["link_token"]["LTV"],
        token_info["link_token"]["borrow_stable_rate"]
    );
    console.log("Added LINK for lending");
};

const addTokensToBorrow = async (lending_and_borrowing, dai_token_address, weth_token_address, link_token_address) => {
    await lending_and_borrowing.addTokensForBorrowing(
        token_info["dai_token"]["name"],
        dai_token_address,
        token_info["dai_token"]["LTV"],
        token_info["dai_token"]["borrow_stable_rate"]
    );
    console.log("Added DAI for borrowing");

    await lending_and_borrowing.addTokensForBorrowing(
        token_info["weth_token"]["name"],
        weth_token_address,
        token_info["weth_token"]["LTV"],
        token_info["weth_token"]["borrow_stable_rate"]
    );
    console.log("Added WETH for borrowing");

    await lending_and_borrowing.addTokensForBorrowing(
        token_info["link_token"]["name"],
        link_token_address,
        token_info["link_token"]["LTV"],
        token_info["link_token"]["borrow_stable_rate"]
    );
    console.log("Added LINK for borrowing");
};

module.exports = async function (deployer, network, accounts) {
    try {
        const lar_token = await deployWithRetries(deployer, LARToken);
        console.log("LARToken deployed at", lar_token.address);
        await sleep(DELAY);

        const ade_token = await deployWithRetries(deployer, ADEToken);
        console.log("ADEToken deployed at", ade_token.address);
        await sleep(DELAY);

        const credit_score = await deployWithRetries(deployer, CreditScore);
        console.log("CreditScore deployed at", credit_score.address);
        await sleep(DELAY);

        const lending_and_borrowing = await deployWithRetries(deployer, LendingAndBorrowing, lar_token.address, credit_score.address);
        console.log("LendingAndBorrowing deployed at", lending_and_borrowing.address);
        await sleep(DELAY);

        const dai_token_address = await tools.get_contract("dai_token_address", network, deployer);
        const weth_token_address = await tools.get_contract("weth_token_address", network, deployer);
        const link_token_address = await tools.get_contract("link_token_address", network, deployer);

        const token_to_price_feed = await addTokenToPriceFeed(network, deployer, dai_token_address, weth_token_address, link_token_address);

        const total = await lar_token.totalSupply();
        await lar_token.transfer(lending_and_borrowing.address, BigInt(total) - BigInt(KEPT_BALANCE));
        console.log("LARToken transferred to LendingAndBorrowing");
        await sleep(DELAY);

        await add_token_to_price_feed_mapping(
            lending_and_borrowing,
            token_to_price_feed,
            dai_token_address,
            weth_token_address,
            link_token_address
        );

        await sleep(DELAY);

        await addTokensToLend(lending_and_borrowing, dai_token_address, weth_token_address, link_token_address);
        await sleep(DELAY);

        await addTokensToBorrow(lending_and_borrowing, dai_token_address, weth_token_address, link_token_address);

        console.log("Deployment and setup complete");
    } catch (error) {
        console.error("Deployment failed with error:", error);
    }
};
