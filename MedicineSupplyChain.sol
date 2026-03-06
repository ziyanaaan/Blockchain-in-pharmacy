// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicineSupplyChain {
    enum ProductStatus {
        Available,
        Sold
    }

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

    struct SerializedUnit {
        uint64 productId;
        uint16 medicineId;
        address manufacturer;
        ProductStatus status;
        uint256 createdAt;
        uint256 soldAt;
        bool exists;
    }

    mapping(uint16 => Medicine) private medicines;
    uint16[] private medicineIds;
    mapping(uint64 => SerializedUnit) private serializedUnits;
    uint64[] private serializedUnitIds;
    address public owner;

    event MedicineAdded(uint16 id, string name, uint256 stock);
    event StockUpdated(uint16 id, uint256 newStock);
    event MedicineTransferred(uint16 id, address from, address to);
    event SerializedUnitRegistered(uint64 productId, uint16 medicineId, address manufacturer);
    event SerializedUnitSold(uint64 productId, address verifiedBy, uint256 soldAt);

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

    function createSerializedUnit(uint16 _medicineId, uint64 _productId, address _manufacturer) public {
        require(medicines[_medicineId].exists, "Medicine does not exist");
        require(
            medicines[_medicineId].holder == msg.sender || msg.sender == owner,
            "Only holder or owner can serialize"
        );
        require(!serializedUnits[_productId].exists, "Product ID already exists");
        require(_manufacturer != address(0), "Invalid manufacturer");

        serializedUnits[_productId] = SerializedUnit({
            productId: _productId,
            medicineId: _medicineId,
            manufacturer: _manufacturer,
            status: ProductStatus.Available,
            createdAt: block.timestamp,
            soldAt: 0,
            exists: true
        });

        serializedUnitIds.push(_productId);
        emit SerializedUnitRegistered(_productId, _medicineId, _manufacturer);
    }

    function getSerializedUnit(uint64 _productId) public view returns (SerializedUnit memory) {
        require(serializedUnits[_productId].exists, "Serialized unit does not exist");
        return serializedUnits[_productId];
    }

    function getSerializedUnitCount() public view returns (uint256) {
        return serializedUnitIds.length;
    }

    function getQrSigningHash(uint64 _productId) public view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), block.chainid, _productId));
    }

    function isUnitSignatureValid(uint64 _productId, bytes memory _signature) public view returns (bool) {
        if (!serializedUnits[_productId].exists || _signature.length != 65) {
            return false;
        }

        bytes32 digest = _toEthSignedMessageHash(getQrSigningHash(_productId));
        address recoveredSigner = _recoverSigner(digest, _signature);
        return recoveredSigner == serializedUnits[_productId].manufacturer;
    }

    function verifyAndMarkSold(uint64 _productId, bytes memory _signature) public returns (bool) {
        require(serializedUnits[_productId].exists, "Serialized unit does not exist");

        SerializedUnit storage unit = serializedUnits[_productId];
        require(medicines[unit.medicineId].exists, "Linked medicine missing");
        require(
            msg.sender == owner || msg.sender == medicines[unit.medicineId].holder,
            "Not authorized to mark sold"
        );
        require(unit.status == ProductStatus.Available, "Product already sold");
        require(_signature.length == 65, "Invalid signature length");

        bytes32 digest = _toEthSignedMessageHash(getQrSigningHash(_productId));
        address recoveredSigner = _recoverSigner(digest, _signature);
        require(recoveredSigner == unit.manufacturer, "Invalid manufacturer signature");

        unit.status = ProductStatus.Sold;
        unit.soldAt = block.timestamp;

        emit SerializedUnitSold(_productId, msg.sender, block.timestamp);
        return true;
    }

    function _toEthSignedMessageHash(bytes32 _hash) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", _hash));
    }

    function _recoverSigner(bytes32 _digest, bytes memory _signature) internal pure returns (address) {
        (bytes32 r, bytes32 s, uint8 v) = _splitSignature(_signature);
        return ecrecover(_digest, v, r, s);
    }

    function _splitSignature(bytes memory _signature) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(_signature.length == 65, "Invalid signature length");

        assembly {
            r := mload(add(_signature, 32))
            s := mload(add(_signature, 64))
            v := byte(0, mload(add(_signature, 96)))
        }

        if (v < 27) {
            v += 27;
        }
        require(v == 27 || v == 28, "Invalid signature");
    }
}
