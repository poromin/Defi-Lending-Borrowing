const MockV3Aggregator = artifacts.require("MockV3Aggregator");

contract("MockV3Aggregator", () => {
  it("should return the correct answer", async () => {
    const instance = await MockV3Aggregator.deployed();
    const answer = await instance.latestAnswer();
    assert.equal(answer.toNumber(), 20000000000, "Answer wasn't 20000000000");
  });

  it("should update the answer", async () => {
    const instance = await MockV3Aggregator.deployed();
    await instance.updateAnswer(30000000000);

    const answer = await instance.latestAnswer();
    assert.equal(answer.toNumber(), 30000000000, "Answer wasn't updated to 30000000000");
  });
});
