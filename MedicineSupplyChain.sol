// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicineSupplyChain {
    struct Medicine {
        uint16 id;
        string name;
        string category;
        uint256 stock;
        uint256 price;
        string expiry;
        string location;
        address holder; // Current owner of the batch
        bool exists;
    }

    mapping(uint16 => Medicine) private medicines;
    uint16[] private medicineIds;
    address public owner;

    event MedicineAdded(uint16 id, string name, uint256 stock);
    event StockUpdated(uint16 id, uint256 newStock);
    event MedicineTransferred(uint16 id, address from, address to);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addMedicine(
        string memory _name,
        string memory _category,
        uint256 _stock,
        uint256 _price,
        string memory _expiry,
        string memory _location
    ) public {
        // Generate pseudo-random 16-bit number
        uint256 randomHash = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender, _name, block.prevrandao)));
        uint16 _id = uint16(randomHash % 65535) + 1;

        while (medicines[_id].exists) {
            _id++;
            if (_id == 0) _id = 1;
        }

        Medicine memory newMedicine = Medicine({
            id: _id,
            name: _name,
            category: _category,
            stock: _stock,
            price: _price,
            expiry: _expiry,
            location: _location,
            holder: msg.sender, // Set initial holder
            exists: true
        });

        medicines[_id] = newMedicine;
        medicineIds.push(_id);

        emit MedicineAdded(_id, _name, _stock);
    }

    function updateStock(uint16 _id, uint256 _newStock) public {
        require(medicines[_id].exists, "Medicine does not exist");
        require(medicines[_id].holder == msg.sender, "Not authorized"); // Only holder can update stock
        medicines[_id].stock = _newStock;
        emit StockUpdated(_id, _newStock);
    }

    function transferMedicine(uint16 _id, address _to) public {
        require(medicines[_id].exists, "Medicine does not exist");
        require(medicines[_id].holder == msg.sender, "Only the current holder can transfer");
        require(_to != address(0), "Invalid address");

        medicines[_id].holder = _to;
        emit MedicineTransferred(_id, msg.sender, _to);
    }

    function getMedicine(uint16 _id) public view returns (Medicine memory) {
        require(medicines[_id].exists, "Medicine does not exist");
        return medicines[_id];
    }

    function getAllMedicines() public view returns (Medicine[] memory) {
        Medicine[] memory allMedicines = new Medicine[](medicineIds.length);
        for (uint256 i = 0; i < medicineIds.length; i++) {
            allMedicines[i] = medicines[medicineIds[i]];
        }
        return allMedicines;
    }

    function getMedicineCount() public view returns (uint256) {
        return medicineIds.length;
    }
}
