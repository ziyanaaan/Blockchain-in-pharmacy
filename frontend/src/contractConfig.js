export const CONTRACT_ADDRESS = "0xYourDeployedContractAddressHere";

export const CONTRACT_ABI = [
  "function manufactureMedicine(string memory _name, string memory _batchNumber) public",
  "function transferOwnership(uint256 _id, address _newOwner) public",
  "function getHistory(uint256 _id) public view returns (address[] memory)",
  "function medicines(uint256) public view returns (uint256 id, string memory name, string memory batchNumber, address manufacturer, address currentOwner, uint8 currentState)",
  "function medicineCount() public view returns (uint256)"
];