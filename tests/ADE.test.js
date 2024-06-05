const ADE = artifacts.require("ADE");

contract("ADE", (accounts) => {
  it("should put 1,000,000 ADE in the first account", async () => {
    const instance = await ADE.deployed();
    const balance = await instance.balanceOf(accounts[0]);
    assert.equal(balance.toNumber(), 1000000 * (10 ** 18), "1,000,000 wasn't in the first account");
  });

  it("should transfer ADE tokens", async () => {
    const instance = await ADE.deployed();
    const amount = 10 * (10 ** 18);

    // Transfer tokens from accounts[0] to accounts[1]
    await instance.transfer(accounts[1], amount, { from: accounts[0] });

    const balance0 = await instance.balanceOf(accounts[0]);
    const balance1 = await instance.balanceOf(accounts[1]);

    assert.equal(balance0.toNumber(), (1000000 * (10 ** 18)) - amount, "Amount wasn't correctly taken from the sender");
    assert.equal(balance1.toNumber(), amount, "Amount wasn't correctly sent to the receiver");
  });
});
