const LendingAndBorrowing = artifacts.require("LendingAndBorrowing");
const MockDAIToken = artifacts.require("MockDAIToken");
const ADE = artifacts.require("ADE");

contract("LendingAndBorrowing", (accounts) => {
  let lendingAndBorrowingInstance;
  let daiInstance;
  let adeInstance;

  before(async () => {
    lendingAndBorrowingInstance = await LendingAndBorrowing.deployed();
    daiInstance = await MockDAIToken.deployed();
    adeInstance = await ADE.deployed();
  });

  it("should lend and borrow correctly", async () => {
    const amount = 10 * (10 ** 18);
    
    // Approve and lend DAI
    await daiInstance.approve(lendingAndBorrowingInstance.address, amount, { from: accounts[0] });
    await lendingAndBorrowingInstance.lend(daiInstance.address, amount, { from: accounts[0] });

    // Check balance in the contract
    const contractBalance = await daiInstance.balanceOf(lendingAndBorrowingInstance.address);
    assert.equal(contractBalance.toNumber(), amount, "Lending amount not reflected in contract balance");

    // Borrow ADE
    await lendingAndBorrowingInstance.borrow(amount, adeInstance.address, { from: accounts[0] });

    // Check ADE balance of the borrower
    const adeBalance = await adeInstance.balanceOf(accounts[0]);
    assert.equal(adeBalance.toNumber(), amount, "Borrowed amount not reflected in borrower's balance");
  });
});
