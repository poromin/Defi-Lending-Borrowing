// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./LendingHelper.sol";
import "./CreditScore.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract LendingAndBorrowing is Ownable {
    using LendingHelper for address;

    address[] public lenders;
    address[] public borrowers;

    mapping(address => mapping(address => uint256)) public tokensLentAmount;
    mapping(address => mapping(address => uint256)) public tokensBorrowedAmount;
    mapping(uint256 => mapping(address => address)) public tokensLent;
    mapping(uint256 => mapping(address => address)) public tokensBorrowed;
    mapping(address => address) public tokenToPriceFeed;

    event Withdraw(
        address sender,
        uint256 amount,
        uint256 tokenToWithdrawInDollars,
        uint256 availableToWithdraw,
        uint256 totalAmountLentInDollars,
        uint256 larTokenToRemove
    );
    event PayDebt(
        address sender,
        int256 index,
        uint256 tokenAmountBorrowed,
        uint256 totalTokenAmountToCollectFromUser,
        address[] borrowers
    );
    event Borrow(
        address sender,
        uint256 amountInDollars,
        uint256 totalAmountAvailableForBorrowInDollars,
        bool userPresent,
        int256 userIndex,
        address[] borrowers,
        uint256 currentUserTokenBorrowedAmount
    );
    event Supply(address sender, address[] lenders, uint256 currentUserTokenLentAmount);
    event WithdrawTesting(address sender, uint256 tokentoWithdrawInDollars, uint256 availableToWithdraw);
    event BorrowTesting1(address sender, uint256 amountInDollars, uint256 totalAmountAvailableForBorrowInDollars);
    event BorrowTesting2(address sender, uint256 balance, uint256 amount);
    event RepayTesting1(address sender, int256 index);
    event RepayTesting2(address sender, uint256 tokenBorrowed);

    struct Token {
        address tokenAddress;
        uint256 LTV;
        uint256 stableRate;
        string name;
    }

    Token[] public tokensForLending;
    Token[] public tokensForBorrowing;

    IERC20 public larToken;
    CreditScore public creditScore;

    uint256 public noOfTokensLent = 0;
    uint256 public noOfTokensBorrowed = 0;

    constructor(address _token, address _creditScore) {
        larToken = IERC20(_token);
        creditScore = CreditScore(_creditScore);
    }

    function addTokensForLending(
        string memory name,
        address tokenAddress,
        uint256 LTV,
        uint256 borrowStableRate
    ) external onlyOwner {
        Token memory token = Token(tokenAddress, LTV, borrowStableRate, name);

        if (!tokenIsAlreadyThere(token, tokensForLending)) {
            tokensForLending.push(token);
        }
    }

    function addTokensForBorrowing(
        string memory name,
        address tokenAddress,
        uint256 LTV,
        uint256 borrowStableRate
    ) external onlyOwner {
        Token memory token = Token(tokenAddress, LTV, borrowStableRate, name);

        if (!tokenIsAlreadyThere(token, tokensForBorrowing)) {
            tokensForBorrowing.push(token);
        }
    }

    function addTokenToPriceFeedMapping(address tokenAddress, address tokenToUsdPriceFeed) external onlyOwner {
        tokenToPriceFeed[tokenAddress] = tokenToUsdPriceFeed;
    }

    function getLendersArray() public view returns (address[] memory) {
        return lenders;
    }

    function getBorrowersArray() public view returns (address[] memory) {
        return borrowers;
    }

    function getTokensForLendingArray() public view returns (Token[] memory) {
        return tokensForLending;
    }

    function getTokensForBorrowingArray() public view returns (Token[] memory) {
        return tokensForBorrowing;
    }

    function lend(address tokenAddress, uint256 amount) external payable {
        require(tokenIsAllowed(tokenAddress, tokensForLending));
        require(amount > 0);

        IERC20 token = IERC20(tokenAddress);

        require(token.balanceOf(msg.sender) >= amount);

        token.transferFrom(msg.sender, address(this), amount);

        (bool userPresent, int256 userIndex) = msg.sender.isUserPresentIn(lenders);

        if (userPresent) {
            string memory userIndexStr = Strings.toString(userIndex);
            updateUserTokensBorrowedOrLent(tokenAddress, amount, userIndexStr);  // Pass userIndex
        } else {
            lenders.push(msg.sender);
            tokensLentAmount[tokenAddress][msg.sender] = amount;
            tokensLent[noOfTokensLent++][msg.sender] = tokenAddress;
        }

        larToken.transfer(msg.sender, getAmountInDollars(amount, tokenAddress));

        emit Supply(msg.sender, lenders, tokensLentAmount[tokenAddress][msg.sender]);

        updateCreditScore(msg.sender);
    }

    function borrow(uint256 amount, address tokenAddress) external {
        require(tokenIsAllowed(tokenAddress, tokensForBorrowing));
        require(amount > 0);

        uint256 totalAmountAvailableForBorrowInDollars = getUserTotalAmountAvailableForBorrowInDollars(msg.sender);
        uint256 amountInDollars = getAmountInDollars(amount, tokenAddress);

        emit BorrowTesting1(msg.sender, amountInDollars, totalAmountAvailableForBorrowInDollars);

        require(amountInDollars <= totalAmountAvailableForBorrowInDollars);

        IERC20 token = IERC20(tokenAddress);

        emit BorrowTesting2(msg.sender, token.balanceOf(address(this)), amount);

        require(token.balanceOf(address(this)) >= amount, "Insufficient Token");

        token.transfer(msg.sender, amount);

        (bool userPresent, int256 userIndex) = msg.sender.isUserPresentIn(borrowers);

        if (userPresent) {
            string memory userIndexStr = Strings.toString(userIndex);
            updateUserTokensBorrowedOrLent(tokenAddress, amount, userIndexStr);
        } else {
            borrowers.push(msg.sender);
            tokensBorrowedAmount[tokenAddress][msg.sender] = amount;
            tokensBorrowed[noOfTokensBorrowed++][msg.sender] = tokenAddress;
        }

        emit Borrow(
            msg.sender,
            amountInDollars,
            totalAmountAvailableForBorrowInDollars,
            userPresent,
            userIndex,
            borrowers,
            tokensBorrowedAmount[tokenAddress][msg.sender]
        );

        updateCreditScore(msg.sender);
    }

    function payDebt(address tokenAddress, uint256 amount) external {
        require(amount > 0);

        int256 index = msg.sender.indexOf(borrowers);

        emit RepayTesting1(msg.sender, index);
        require(index >= 0);

        uint256 tokenBorrowed = tokensBorrowedAmount[tokenAddress][msg.sender];

        emit RepayTesting2(msg.sender, tokenBorrowed);

        require(tokenBorrowed > 0);
        IERC20 token = IERC20(tokenAddress);

        token.transferFrom(msg.sender, address(this), amount + interest(tokenAddress, tokenBorrowed));

        tokensBorrowedAmount[tokenAddress][msg.sender] -= amount;

        if (getTotalAmountBorrowedInDollars(msg.sender) == 0) {
            borrowers[uint256(index)] = borrowers[borrowers.length - 1];
            borrowers.pop();
        }

        emit PayDebt(
            msg.sender,
            index,
            tokenBorrowed,
            amount + interest(tokenAddress, tokenBorrowed),
            borrowers
        );

        updateCreditScore(msg.sender);
    }

    function withdraw(address tokenAddress, uint256 amount) external {
        require(amount > 0);
        require(msg.sender.indexOf(lenders) >= 0);

        IERC20 token = IERC20(tokenAddress);

        uint256 tokenToWithdrawInDollars = getAmountInDollars(amount, tokenAddress);
        uint256 availableToWithdraw = getTokenAvailableToWithdraw(msg.sender);

        uint totalTokenSuppliedInContract = getTotalTokenSupplied(tokenAddress);
        uint totalTokenBorrowedInContract = getTotalTokenBorrowed(tokenAddress);

        require(amount <= (totalTokenSuppliedInContract - totalTokenBorrowedInContract));

        emit WithdrawTesting(msg.sender, tokenToWithdrawInDollars, availableToWithdraw);

        require(tokenToWithdrawInDollars <= availableToWithdraw);

        uint256 larTokenToRemove = getAmountInDollars(amount, tokenAddress);
        uint256 larTokenBalance = larToken.balanceOf(msg.sender);

        if (larTokenToRemove <= larTokenBalance) {
            larToken.transferFrom(msg.sender, address(this), larTokenToRemove);
        } else {
            larToken.transferFrom(msg.sender, address(this), larTokenBalance);
        }

        token.transfer(msg.sender, amount);

        tokensLentAmount[tokenAddress][msg.sender] -= amount;

        emit Withdraw(
            msg.sender,
            amount,
            tokenToWithdrawInDollars,
            availableToWithdraw,
            getTotalAmountLentInDollars(msg.sender),
            larTokenToRemove
        );

        if (getTotalAmountLentInDollars(msg.sender) <= 0) {
            lenders[uint256(msg.sender.indexOf(lenders))] = lenders[lenders.length - 1];
            lenders.pop();
        }

        updateCreditScore(msg.sender);
    }

    function getTokenAvailableToWithdraw(address user) public view returns (uint256) {
        uint256 totalAmountBorrowedInDollars = getTotalAmountBorrowedInDollars(user);
        uint remainingCollateral = 0;

        if (totalAmountBorrowedInDollars > 0) {
            remainingCollateral = getUserRemainingCollateral(user, totalAmountBorrowedInDollars);
        } else {
            remainingCollateral = getTotalAmountLentInDollars(user);
        }

        return remainingCollateral;
    }

    function getUserRemainingCollateral(address user, uint totalAmountBorrowedInDollars) internal view returns (uint256) {
        return getTotalAmountLentInDollars(user) - totalAmountBorrowedInDollars;
    }

    function getTotalAmountBorrowedInDollars(address user) public view returns (uint256) {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < noOfTokensBorrowed; i++) {
            address tokenAddress = tokensBorrowed[i][user];
            totalAmount += getAmountInDollars(tokensBorrowedAmount[tokenAddress][user], tokenAddress);
        }
        return totalAmount;
    }

    function getTotalAmountLentInDollars(address user) public view returns (uint256) {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < noOfTokensLent; i++) {
            address tokenAddress = tokensLent[i][user];
            totalAmount += getAmountInDollars(tokensLentAmount[tokenAddress][user], tokenAddress);
        }
        return totalAmount;
    }

    function getUserTotalAmountAvailableForBorrowInDollars(address user) public view returns (uint256) {
        return getTotalAmountLentInDollars(user) - getTotalAmountBorrowedInDollars(user);
    }

    function getTotalTokenSupplied(address tokenAddress) public view returns (uint256) {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < lenders.length; i++) {
            totalAmount += tokensLentAmount[tokenAddress][lenders[i]];
        }
        return totalAmount;
    }

    function getTotalTokenBorrowed(address tokenAddress) public view returns (uint256) {
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < borrowers.length; i++) {
            totalAmount += tokensBorrowedAmount[tokenAddress][borrowers[i]];
        }
        return totalAmount;
    }

    function updateUserTokensBorrowedOrLent(
        address tokenAddress,
        uint256 amount,
        // int256 userIndex,
        string memory userType
    ) internal {
        if (keccak256(abi.encodePacked(userType)) == keccak256(abi.encodePacked("lenders"))) {
            tokensLentAmount[tokenAddress][msg.sender] += amount;
            tokensLent[noOfTokensLent++][msg.sender] = tokenAddress;
        } else if (keccak256(abi.encodePacked(userType)) == keccak256(abi.encodePacked("borrowers"))) {
            tokensBorrowedAmount[tokenAddress][msg.sender] += amount;
            tokensBorrowed[noOfTokensBorrowed++][msg.sender] = tokenAddress;
        }
    }

    function getAmountInDollars(uint256 amount, address tokenAddress) public view returns (uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(tokenToPriceFeed[tokenAddress]);
        (, int256 price, , , ) = priceFeed.latestRoundData();

        uint8 decimals = priceFeed.decimals();
        return (amount * uint256(price)) / (10 ** decimals);
    }

    function interest(address tokenAddress, uint256 amountBorrowed) internal view returns (uint256) {
        uint256 interestRate = getStableRate(tokenAddress);
        return (amountBorrowed * interestRate) / 100;
    }

    function getStableRate(address tokenAddress) public view returns (uint256) {
        for (uint256 i = 0; i < tokensForBorrowing.length; i++) {
            if (tokensForBorrowing[i].tokenAddress == tokenAddress) {
                return tokensForBorrowing[i].stableRate;
            }
        }
        return 0;
    }

    function tokenIsAllowed(address tokenAddress, Token[] memory tokensArray) internal pure returns (bool) {
        for (uint256 i = 0; i < tokensArray.length; i++) {
            if (tokensArray[i].tokenAddress == tokenAddress) {
                return true;
            }
        }
        return false;
    }

    function tokenIsAlreadyThere(Token memory token, Token[] memory tokensArray) internal pure returns (bool) {
        for (uint256 i = 0; i < tokensArray.length; i++) {
            if (tokensArray[i].tokenAddress == token.tokenAddress) {
                return true;
            }
        }
        return false;
    }

    function updateCreditScore(address user) internal {
        uint256 totalAssets = getTotalAmountLentInDollars(user);
        uint256 transactionCount = lenders.length + borrowers.length; // Example transaction count
        uint256 creditUtilization = getTotalAmountBorrowedInDollars(user);

        creditScore.calculateCreditScore(user, totalAssets, transactionCount, creditUtilization);
    }
}
