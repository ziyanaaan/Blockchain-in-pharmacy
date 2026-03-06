// --- Web3 Configuration ---
const CONTRACT_ADDRESS = "0x73EC8F1810dd6114A13aaBEBDb45fCE406C560a1"; // ⚠️ REPLACE after every redeploy
const TARGET_NETWORK = {
    chainId: 11155111,
    chainIdHex: "0xaa36a7",
    chainName: "Sepolia",
    rpcUrls: ["https://rpc.sepolia.org"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"]
};

const PRODUCT_STATUS = {
    Available: 0,
    Sold: 1
};

const ABI = [
    {
        "inputs": [
            { "internalType": "string", "name": "_name", "type": "string" },
            { "internalType": "string", "name": "_category", "type": "string" },
            { "internalType": "uint256", "name": "_stock", "type": "uint256" },
            { "internalType": "uint256", "name": "_price", "type": "uint256" },
            { "internalType": "string", "name": "_expiry", "type": "string" },
            { "internalType": "string", "name": "_location", "type": "string" }
        ],
        "name": "addMedicine",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint16", "name": "_id", "type": "uint16" },
            { "internalType": "address", "name": "_to", "type": "address" }
        ],
        "name": "transferMedicine",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint16", "name": "_medicineId", "type": "uint16" },
            { "internalType": "uint64", "name": "_productId", "type": "uint64" },
            { "internalType": "address", "name": "_manufacturer", "type": "address" }
        ],
        "name": "createSerializedUnit",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint64", "name": "_productId", "type": "uint64" }
        ],
        "name": "getSerializedUnit",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint64", "name": "productId", "type": "uint64" },
                    { "internalType": "uint16", "name": "medicineId", "type": "uint16" },
                    { "internalType": "address", "name": "manufacturer", "type": "address" },
                    { "internalType": "uint8", "name": "status", "type": "uint8" },
                    { "internalType": "uint256", "name": "createdAt", "type": "uint256" },
                    { "internalType": "uint256", "name": "soldAt", "type": "uint256" },
                    { "internalType": "bool", "name": "exists", "type": "bool" }
                ],
                "internalType": "struct MedicineSupplyChain.SerializedUnit",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint64", "name": "_productId", "type": "uint64" }
        ],
        "name": "getQrSigningHash",
        "outputs": [
            { "internalType": "bytes32", "name": "", "type": "bytes32" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint64", "name": "_productId", "type": "uint64" },
            { "internalType": "bytes", "name": "_signature", "type": "bytes" }
        ],
        "name": "isUnitSignatureValid",
        "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "uint64", "name": "_productId", "type": "uint64" },
            { "internalType": "bytes", "name": "_signature", "type": "bytes" }
        ],
        "name": "verifyAndMarkSold",
        "outputs": [
            { "internalType": "bool", "name": "", "type": "bool" }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getSerializedUnitCount",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getAllMedicines",
        "outputs": [
            {
                "components": [
                    { "internalType": "uint16", "name": "id", "type": "uint16" },
                    { "internalType": "string", "name": "name", "type": "string" },
                    { "internalType": "string", "name": "category", "type": "string" },
                    { "internalType": "uint256", "name": "stock", "type": "uint256" },
                    { "internalType": "uint256", "name": "price", "type": "uint256" },
                    { "internalType": "string", "name": "expiry", "type": "string" },
                    { "internalType": "string", "name": "location", "type": "string" },
                    { "internalType": "address", "name": "holder", "type": "address" },
                    { "internalType": "bool", "name": "exists", "type": "bool" }
                ],
                "internalType": "struct MedicineSupplyChain.Medicine[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

let provider;
let signer;
let contract;
let readProvider;
let readContract;
let userAddress;
let activeQrScanner = null;

const appState = {
    currentView: "dashboard",
    isConnected: false,
    medicines: []
};

const pageTitles = {
    dashboard: "Dashboard",
    inventory: "Inventory",
    "add-medicine": "Add Medicine",
    "serialize-unit": "Unit Serialization",
    track: "Track / Search",
    "verify-qr": "Customer QR Verification"
};

// --- Initialization ---
document.addEventListener("DOMContentLoaded", async () => {
    initReadOnlyContract();
    setupNavigation();
    document.getElementById("connect-wallet-btn").addEventListener("click", connectWallet);
    navigateTo("dashboard");
});

// --- Wallet Connection with Network Enforcement ---
async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask not detected.");
        return;
    }

    try {
        await window.ethereum.request({ method: "eth_requestAccounts" });
        provider = new ethers.BrowserProvider(window.ethereum);

        const network = await provider.getNetwork();
        if (Number(network.chainId) !== TARGET_NETWORK.chainId) {
            try {
                await window.ethereum.request({
                    method: "wallet_switchEthereumChain",
                    params: [{ chainId: TARGET_NETWORK.chainIdHex }]
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [{
                            chainId: TARGET_NETWORK.chainIdHex,
                            chainName: TARGET_NETWORK.chainName,
                            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
                            rpcUrls: TARGET_NETWORK.rpcUrls,
                            blockExplorerUrls: TARGET_NETWORK.blockExplorerUrls
                        }]
                    });

                    await window.ethereum.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: TARGET_NETWORK.chainIdHex }]
                    });
                } else {
                    throw switchError;
                }
            }
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        appState.isConnected = true;
        updateWalletUI();
        navigateTo(appState.currentView);

        console.log(`Connected on ${TARGET_NETWORK.chainName}:`, userAddress);
    } catch (error) {
        console.error(error);
        alert(`Wallet connection or network switch failed. Please use ${TARGET_NETWORK.chainName}.`);
    }
}

function updateWalletUI() {
    const btn = document.getElementById("connect-wallet-btn");
    btn.innerHTML = `Connected: ${shortAddress(userAddress)}`;
    btn.classList.add("connected");
}

function initReadOnlyContract() {
    try {
        readProvider = new ethers.JsonRpcProvider(TARGET_NETWORK.rpcUrls[0], TARGET_NETWORK.chainId);
        readContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, readProvider);
    } catch (error) {
        console.error("Failed to initialize read-only provider:", error);
    }
}

function getReadContract() {
    return readContract || contract || null;
}

// --- Navigation ---
const views = {
    dashboard: renderDashboard,
    inventory: renderInventory,
    "add-medicine": renderAddMedicine,
    "serialize-unit": renderSerializeUnit,
    track: renderTrack,
    "verify-qr": renderVerifyQr
};

function setupNavigation() {
    document.querySelectorAll(".nav-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
            e.currentTarget.classList.add("active");
            navigateTo(e.currentTarget.getAttribute("data-view"));
        });
    });
}

async function navigateTo(viewName) {
    appState.currentView = viewName;
    updatePageTitle(viewName);
    const container = document.getElementById("view-container");
    container.innerHTML = '<div class="loading">Loading blockchain data...</div>';

    if (viewName !== "verify-qr") {
        await stopQrScanner();
    }

    const needsMedicineData = ["dashboard", "inventory", "track", "serialize-unit"].includes(viewName);
    if (appState.isConnected && needsMedicineData) {
        try {
            const rawData = await contract.getAllMedicines();
            appState.medicines = rawData.map((m) => ({
                id: m.id.toString(),
                name: m.name,
                category: m.category,
                stock: Number(m.stock),
                price: Number(m.price),
                expiry: m.expiry,
                location: m.location,
                holder: m.holder
            }));
        } catch (e) {
            console.error(e);
            container.innerHTML = '<div class="card error">Blockchain fetch failed.</div>';
            return;
        }
    }

    if (views[viewName]) {
        views[viewName](container);
    }
}

function updatePageTitle(viewName) {
    const title = document.getElementById("page-title");
    if (title) {
        title.textContent = pageTitles[viewName] || "Dashboard";
    }
}

// --- Views ---

function renderDashboard(container) {
    if (!appState.isConnected) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <span class="material-icons-round" style="font-size: 4rem; color: var(--text-muted);">lock</span>
                <h3>Dashboard Locked</h3>
                <p>Connect wallet to view supply chain statistics.</p>
            </div>
         `;
        return;
    }

    const data = appState.medicines;
    const lowStockCount = data.filter((m) => m.stock < 50).length;
    const totalValue = data.reduce((acc, curr) => acc + (curr.stock * curr.price), 0).toFixed(2);

    const html = `
        <div class="grid-3 fade-in">
            <div class="card stat-card">
                <div class="stat-header"><span class="material-icons-round">inventory</span> Total Medicines</div>
                <div class="stat-value">${data.length}</div>
                <div class="stat-trend">On Blockchain</div>
            </div>
            <div class="card stat-card">
                <div class="stat-header"><span class="material-icons-round">warning</span> Low Stock</div>
                <div class="stat-value">${lowStockCount}</div>
                <div class="stat-trend ${lowStockCount > 0 ? "negative" : ""}">${lowStockCount > 0 ? "Action needed" : "Optimal"}</div>
            </div>
            <div class="card stat-card">
                <div class="stat-header"><span class="material-icons-round">attach_money</span> Est. Value</div>
                <div class="stat-value">$${totalValue}</div>
                <div class="stat-trend">Total Assets</div>
            </div>
        </div>

        <h3 style="margin: 2rem 0 1rem; font-weight: 600;">Recent Blockchain Entries</h3>
        <div class="table-container fade-in">
            <table>
                <thead>
                    <tr><th>ID</th><th>Name</th><th>Stock</th><th>Category</th></tr>
                </thead>
                <tbody>
                    ${data.slice(-5).reverse().map((m) => `
                        <tr>
                            <td><span class="badge" style="background:#eee; color:#1f2937;">${m.id}</span></td>
                            <td>${escapeHtml(m.name)}</td>
                            <td>${m.stock}</td>
                            <td>${escapeHtml(m.category)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

function renderInventory(container) {
    if (!appState.isConnected) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <span class="material-icons-round" style="font-size: 4rem; color: var(--text-muted);">lock</span>
                <h3>Inventory Locked</h3>
                <p>Connect wallet to manage inventory.</p>
            </div>
        `;
        return;
    }

    const data = appState.medicines;

    const html = `
        <div class="card fade-in">
            <div class="table-container" style="box-shadow: none; padding: 0;">
                <table id="inventory-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Name</th><th>Stock</th><th>Location</th><th>Holder</th><th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map((m) => {
                            const isMyMedicine = m.holder.toLowerCase() === userAddress.toLowerCase();
                            const holderDisplay = isMyMedicine
                                ? '<span class="badge" style="background:#d1fae5; color:#065f46;">You</span>'
                                : `<span title="${m.holder}">${shortAddress(m.holder)}</span>`;

                            return `
                                <tr>
                                    <td><span style="font-weight: 600;">${m.id}</span></td>
                                    <td>${escapeHtml(m.name)}<br><span style="font-size:0.8em; color:gray;">${escapeHtml(m.category)}</span></td>
                                    <td>${m.stock}</td>
                                    <td>${escapeHtml(m.location)}</td>
                                    <td>${holderDisplay}</td>
                                    <td>
                                        ${isMyMedicine
                                            ? `<button class="btn-xs transfer-btn" data-id="${m.id}" style="background:var(--primary-main); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Transfer</button>`
                                            : '<span style="color:gray; font-size:0.8em;">Read Only</span>'}
                                    </td>
                                </tr>
                            `;
                        }).join("")}
                    </tbody>
                </table>
            </div>
             ${data.length === 0 ? '<p style="padding: 2rem; text-align: center;">No medicines found on chain.</p>' : ""}
        </div>
    `;
    container.innerHTML = html;

    document.querySelectorAll(".transfer-btn").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            const id = e.target.getAttribute("data-id");
            const newHolder = prompt(`Transfer Batch #${id} to new wallet address:`);

            if (newHolder && ethers.isAddress(newHolder)) {
                try {
                    const tx = await contract.transferMedicine(id, newHolder);
                    e.target.innerText = "Processing...";
                    e.target.disabled = true;
                    await tx.wait();
                    alert("Transfer successful.");
                    navigateTo("inventory");
                } catch (err) {
                    console.error(err);
                    alert(`Transfer failed: ${txError(err)}`);
                    e.target.innerText = "Transfer";
                    e.target.disabled = false;
                }
            } else if (newHolder) {
                alert("Invalid Ethereum address.");
            }
        });
    });
}

function renderAddMedicine(container) {
    if (!appState.isConnected) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <span class="material-icons-round" style="font-size: 4rem; color: var(--text-muted);">lock</span>
                <h3>Add Medicine Locked</h3>
                <p>Connect wallet to add medicines.</p>
            </div>
        `;
        return;
    }

    const html = `
        <div class="card fade-in" style="max-width: 600px; margin: 0 auto;">
            <form id="add-form">
                 <div class="grid-2">
                    <div class="form-group" style="grid-column: span 2;">
                        <label class="form-label">Category</label>
                        <select name="category" class="form-input">
                            <option>Antibiotic</option><option>Painkiller</option><option>Supplement</option><option>First Aid</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">Medicine Name</label>
                    <input type="text" name="name" required class="form-input" placeholder="Name">
                </div>
                <div class="grid-2">
                    <div class="form-group">
                         <label class="form-label">Stock</label>
                        <input type="number" name="stock" min="1" required class="form-input">
                    </div>
                     <div class="form-group">
                         <label class="form-label">Price</label>
                        <input type="number" step="0.01" name="price" min="0" required class="form-input">
                    </div>
                </div>
                 <div class="grid-2">
                    <div class="form-group">
                        <label class="form-label">Expiry</label>
                        <input type="date" name="expiry" required class="form-input">
                    </div>
                     <div class="form-group">
                        <label class="form-label">Location</label>
                        <input type="text" name="location" class="form-input" placeholder="Shelf A">
                    </div>
                </div>
                <button type="submit" class="btn-primary" style="margin-top: 1rem; width: 100%;">
                    <span class="material-icons-round">send</span> Record on Blockchain
                </button>
                <p class="hint-text" style="text-align:center; margin-top:1rem;">
                    Batch ID is auto-generated in the smart contract.
                </p>
            </form>
        </div>
    `;
    container.innerHTML = html;

    document.getElementById("add-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const network = await provider.getNetwork();
        if (Number(network.chainId) !== TARGET_NETWORK.chainId) {
            alert(`Wrong network. Please switch to ${TARGET_NETWORK.chainName} (Chain ID: ${TARGET_NETWORK.chainId}).`);
            return;
        }

        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons-round">hourglass_empty</span> Requesting Signature...';

            const val = (name) => formData.get(name);
            const priceAsWhole = BigInt(Math.floor(Number(val("price"))));

            const tx = await contract.addMedicine(
                val("name"),
                val("category"),
                BigInt(val("stock")),
                priceAsWhole,
                val("expiry"),
                val("location")
            );

            submitBtn.innerHTML = '<span class="material-icons-round">loop</span> Confirming Transaction...';
            await tx.wait();

            alert("Medicine added.");
            navigateTo("inventory");
        } catch (error) {
            console.error("Tx Error:", error);
            alert(`Transaction failed: ${txError(error)}`);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

function renderSerializeUnit(container) {
    if (!appState.isConnected) {
        container.innerHTML = `
            <div class="card" style="text-align: center; padding: 3rem;">
                <span class="material-icons-round" style="font-size: 4rem; color: var(--text-muted);">lock</span>
                <h3>Serialization Locked</h3>
                <p>Connect wallet to serialize medicine units and generate QR.</p>
            </div>
        `;
        return;
    }

    const myMedicines = appState.medicines.filter((m) => m.holder.toLowerCase() === userAddress.toLowerCase());

    const html = `
        <div class="card fade-in" style="max-width: 760px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.75rem;">Unit-Level Serialization</h3>
            <p class="hint-text" style="margin-bottom: 1.5rem;">
                Creates one blockchain record and one QR per medicine unit.
                Manufacturer public key is the connected wallet address.
            </p>

            ${myMedicines.length === 0 ? `
                <div class="verify-result warning">
                    You do not currently hold any medicine batches. Transfer ownership or add a medicine first.
                </div>
            ` : `
                <form id="serialize-form">
                    <div class="grid-2">
                        <div class="form-group">
                            <label class="form-label">Medicine Batch</label>
                            <select name="medicineId" class="form-input" required>
                                ${myMedicines.map((m) => `<option value="${m.id}">#${m.id} - ${escapeHtml(m.name)}</option>`).join("")}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Unique Product ID (uint64)</label>
                            <div class="input-inline">
                                <input type="text" inputmode="numeric" pattern="[0-9]+" id="product-id-input" name="productId" required class="form-input" placeholder="e.g. 1729943109001001">
                                <button type="button" class="btn-secondary" id="generate-id-btn">Generate</button>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Manufacturer Public Key</label>
                        <input type="text" class="form-input" value="${userAddress}" readonly>
                    </div>

                    <button type="submit" class="btn-primary">
                        <span class="material-icons-round">qr_code</span> Register Unit + Generate Signed QR
                    </button>
                </form>

                <div id="serialize-output" class="qr-output" style="display:none;">
                    <h4>Signed QR Payload</h4>
                    <div id="qr-code-box" class="qr-code-box"></div>
                    <label class="form-label" style="margin-top:1rem;">Payload (to print inside QR)</label>
                    <textarea id="qr-payload-text" class="form-input" rows="4" readonly></textarea>
                    <button type="button" class="btn-secondary" id="copy-payload-btn" style="margin-top:0.75rem;">Copy Payload</button>
                </div>
            `}
        </div>
    `;

    container.innerHTML = html;

    if (myMedicines.length === 0) {
        return;
    }

    const productIdInput = document.getElementById("product-id-input");
    productIdInput.value = generateProductId();

    document.getElementById("generate-id-btn").addEventListener("click", () => {
        productIdInput.value = generateProductId();
    });

    document.getElementById("serialize-form").addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            const formData = new FormData(e.target);
            const medicineId = BigInt(formData.get("medicineId"));
            const productId = parseProductId(formData.get("productId"));

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons-round">hourglass_empty</span> Registering Unit...';

            const tx = await contract.createSerializedUnit(medicineId, productId, userAddress);
            await tx.wait();

            submitBtn.innerHTML = '<span class="material-icons-round">encrypted</span> Signing Payload...';

            const hashForQr = await contract.getQrSigningHash(productId);
            const signature = await signer.signMessage(ethers.getBytes(hashForQr));

            const payloadObject = {
                productId: productId.toString(),
                signature
            };
            const payloadText = JSON.stringify(payloadObject);

            const output = document.getElementById("serialize-output");
            const payloadTextArea = document.getElementById("qr-payload-text");
            const qrCodeBox = document.getElementById("qr-code-box");

            payloadTextArea.value = payloadText;
            output.style.display = "block";
            qrCodeBox.innerHTML = "";

            if (typeof QRCode !== "undefined") {
                new QRCode(qrCodeBox, {
                    text: payloadText,
                    width: 220,
                    height: 220,
                    correctLevel: QRCode.CorrectLevel.H
                });
            } else {
                qrCodeBox.innerHTML = "<p class=\"hint-text\">QR library unavailable. Use payload text manually.</p>";
            }

            document.getElementById("copy-payload-btn").onclick = async () => {
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(payloadText);
                        alert("QR payload copied.");
                        return;
                    }
                } catch (_error) {
                    // Continue to fallback path.
                }

                payloadTextArea.focus();
                payloadTextArea.select();
                document.execCommand("copy");
                alert("QR payload copied.");
            };

            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            alert("Serialized unit created and QR payload generated.");
        } catch (error) {
            console.error(error);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            alert(`Serialization failed: ${txError(error)}`);
        }
    });
}

function renderTrack(container) {
    const html = `
        <div style="max-width: 600px; margin: 0 auto;" class="fade-in">
            <div class="search-bar-container">
                <input type="text" id="track-search" class="form-input" placeholder="Search by medicine ID or name..." style="padding: 1rem 1.5rem; font-size: 1.1rem; border: none; box-shadow: var(--shadow-md);">
                <button id="search-btn" class="btn-primary" style="width: auto; padding: 0 2rem;">Search</button>
            </div>
            <div id="track-results"></div>
        </div>
    `;
    container.innerHTML = html;

    const performSearch = () => {
        const query = document.getElementById("track-search").value.toLowerCase().trim();

        const results = appState.medicines.filter((m) =>
            m.id.toLowerCase().includes(query) || m.name.toLowerCase().includes(query)
        );
        const resultsContainer = document.getElementById("track-results");

        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="card" style="text-align: center; color: var(--danger);"><p>No matches found on blockchain.</p></div>';
            return;
        }

        resultsContainer.innerHTML = results.map((m) => `
            <div class="search-result fade-in">
                <h3>${escapeHtml(m.name)} <span style="font-size: 0.8em; color: gray;">(${m.id})</span></h3>
                <p><strong>Stock:</strong> ${m.stock}</p>
                <p><strong>Location:</strong> ${escapeHtml(m.location)}</p>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; text-align: center; font-size: 0.8rem; color: #666;">
                    Verified on Blockchain
                </div>
            </div>
        `).join("");
    };

    document.getElementById("search-btn").addEventListener("click", performSearch);
}

function renderVerifyQr(container) {
    const html = `
        <div class="card fade-in" style="max-width: 760px; margin: 0 auto;">
            <h3 style="margin-bottom: 0.75rem;">Step 4: Customer QR Verification</h3>
            <p class="hint-text" style="margin-bottom:1.25rem;">
                Public flow: Scan QR → Extract Product ID + Signature → Verify authenticity + blockchain status.
                Only pharmacy/owner can finalize Sold on-chain.
            </p>
            <p class="hint-text" style="margin-bottom:1.25rem;">
                ${appState.isConnected ? "Wallet connected: pharmacy actions enabled." : "No wallet required for customer verification."}
            </p>

            <div class="verify-controls">
                <button id="start-camera-btn" type="button" class="btn-secondary">Start Camera Scan</button>
                <button id="stop-camera-btn" type="button" class="btn-secondary">Stop Camera</button>
            </div>

            <div id="qr-reader" class="qr-reader"></div>

            <div class="form-group" style="margin-top:1.25rem;">
                <label class="form-label">QR Payload</label>
                <textarea id="verify-payload" class="form-input" rows="4" placeholder='Expected JSON: {"productId":"...","signature":"0x..."}'></textarea>
            </div>

            <button id="verify-btn" type="button" class="btn-primary">
                <span class="material-icons-round">verified</span> Verify Product
            </button>

            <div id="verify-result" style="margin-top:1rem;"></div>
        </div>
    `;

    container.innerHTML = html;

    document.getElementById("start-camera-btn").addEventListener("click", async () => {
        await startQrScanner((decodedText) => {
            document.getElementById("verify-payload").value = decodedText;
        });
    });

    document.getElementById("stop-camera-btn").addEventListener("click", async () => {
        await stopQrScanner();
    });

    document.getElementById("verify-btn").addEventListener("click", verifyCustomerQr);
}

// --- QR Verification Logic ---

async function verifyCustomerQr() {
    const resultContainer = document.getElementById("verify-result");
    const verifyBtn = document.getElementById("verify-btn");

    try {
        const queryContract = getReadContract();
        if (!queryContract) {
            renderVerificationResult(resultContainer, {
                level: "error",
                title: "Verification Unavailable",
                message: "Read-only RPC connection not available. Try refreshing in a moment."
            });
            return;
        }

        const rawPayload = document.getElementById("verify-payload").value;
        const parsed = parseQrPayload(rawPayload);

        if (!parsed) {
            renderVerificationResult(resultContainer, {
                level: "error",
                title: "Fake Product",
                message: "QR format invalid. Could not extract Product ID and Digital Signature."
            });
            return;
        }

        const productId = parseProductId(parsed.productId);
        const signature = parsed.signature;

        let unit;
        try {
            unit = await queryContract.getSerializedUnit(productId);
        } catch (_error) {
            renderVerificationResult(resultContainer, {
                level: "error",
                title: "Fake Product",
                message: "Product ID does not exist on blockchain."
            });
            return;
        }

        const signingHash = await queryContract.getQrSigningHash(productId);
        let recoveredSigner;
        try {
            recoveredSigner = ethers.verifyMessage(ethers.getBytes(signingHash), signature);
        } catch (_error) {
            renderVerificationResult(resultContainer, {
                level: "error",
                title: "Fake Product",
                message: "Digital signature is malformed or unreadable."
            });
            return;
        }

        const manufacturerMatches = recoveredSigner.toLowerCase() === unit.manufacturer.toLowerCase();
        if (!manufacturerMatches) {
            renderVerificationResult(resultContainer, {
                level: "error",
                title: "Fake Product",
                message: "Digital signature does not match manufacturer public key."
            });
            return;
        }

        const status = Number(unit.status);
        if (status === PRODUCT_STATUS.Sold) {
            renderVerificationResult(resultContainer, {
                level: "warning",
                title: "Warning: Product Already Verified",
                message: `This unit was already marked sold on ${formatUnixDate(unit.soldAt)}. Possible QR duplication.`
            });
            return;
        }

        renderVerificationResult(resultContainer, {
            level: "success",
            title: "Genuine Product",
            message: `Signature valid. Product is authentic and currently Available. Product ID: ${unit.productId.toString()}`
        });

        if (appState.isConnected && contract) {
            appendFinalizeAction(resultContainer, productId, signature);
        } else {
            appendResultNote(
                resultContainer,
                "Pharmacy should connect wallet and finalize this sale to mark status as Sold on-chain."
            );
        }
    } catch (error) {
        console.error(error);
        const message = txError(error);
        renderVerificationResult(resultContainer, {
            level: "error",
            title: "Verification Failed",
            message
        });
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<span class="material-icons-round">verified</span> Verify Product';
    }
}

function appendFinalizeAction(container, productId, signature) {
    const actionWrap = document.createElement("div");
    actionWrap.className = "verify-actions";
    actionWrap.innerHTML = `
        <button type="button" id="finalize-sale-btn" class="btn-secondary">
            Mark as Sold (Pharmacy)
        </button>
    `;
    container.appendChild(actionWrap);

    const finalizeBtn = document.getElementById("finalize-sale-btn");
    finalizeBtn.addEventListener("click", async () => {
        await finalizeSale(productId, signature, finalizeBtn);
    });
}

function appendResultNote(container, text) {
    const note = document.createElement("p");
    note.className = "hint-text";
    note.style.marginTop = "0.75rem";
    note.textContent = text;
    container.appendChild(note);
}

async function finalizeSale(productId, signature, buttonEl) {
    const resultContainer = document.getElementById("verify-result");
    if (!appState.isConnected || !contract) {
        alert("Connect pharmacy wallet to finalize sale.");
        return;
    }

    try {
        buttonEl.disabled = true;
        buttonEl.textContent = "Finalizing...";

        const tx = await contract.verifyAndMarkSold(productId, signature);
        await tx.wait();

        const queryContract = getReadContract();
        const updatedUnit = await queryContract.getSerializedUnit(productId);
        renderVerificationResult(resultContainer, {
            level: "success",
            title: "Sale Finalized",
            message: `Product marked Sold on-chain at ${formatUnixDate(updatedUnit.soldAt)}.`
        });
    } catch (error) {
        console.error(error);
        const message = txError(error);
        if (message.toLowerCase().includes("not authorized")) {
            renderVerificationResult(resultContainer, {
                level: "warning",
                title: "Permission Denied",
                message: "Only pharmacy holder/owner can mark this product as Sold."
            });
        } else if (message.toLowerCase().includes("already sold")) {
            renderVerificationResult(resultContainer, {
                level: "warning",
                title: "Already Sold",
                message: "This product is already marked Sold on-chain."
            });
        } else {
            renderVerificationResult(resultContainer, {
                level: "error",
                title: "Finalize Failed",
                message
            });
        }
    } finally {
        if (buttonEl && document.body.contains(buttonEl)) {
            buttonEl.disabled = false;
            buttonEl.textContent = "Mark as Sold (Pharmacy)";
        }
    }
}

function renderVerificationResult(container, result) {
    container.innerHTML = `
        <div class="verify-result ${result.level}">
            <h4>${escapeHtml(result.title)}</h4>
            <p>${escapeHtml(result.message)}</p>
        </div>
    `;
}

async function startQrScanner(onDecoded) {
    if (typeof Html5Qrcode === "undefined") {
        alert("QR camera scanner library unavailable. Paste QR payload manually.");
        return;
    }

    if (activeQrScanner) {
        return;
    }

    const qrRegion = document.getElementById("qr-reader");
    qrRegion.innerHTML = "";

    activeQrScanner = new Html5Qrcode("qr-reader");

    try {
        await activeQrScanner.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            async (decodedText) => {
                onDecoded(decodedText);
                await stopQrScanner();
            }
        );
    } catch (error) {
        console.error(error);
        alert("Unable to start camera scanner. You can still paste payload manually.");
        await stopQrScanner();
    }
}

async function stopQrScanner() {
    if (!activeQrScanner) {
        return;
    }

    try {
        await activeQrScanner.stop();
    } catch (_error) {
        // Scanner may already be stopped.
    }

    try {
        await activeQrScanner.clear();
    } catch (_error) {
        // Ignore cleanup errors.
    }

    activeQrScanner = null;
}

// --- Helpers ---

function parseQrPayload(rawPayload) {
    const payload = String(rawPayload || "").trim();
    if (!payload) {
        return null;
    }

    try {
        const parsed = JSON.parse(payload);
        const productId = parsed.productId || parsed.productID || parsed.id;
        const signature = parsed.signature || parsed.sig;
        if (!productId || !signature) {
            return null;
        }
        return { productId: String(productId), signature: String(signature) };
    } catch (_error) {
        const segments = payload.split("|");
        if (segments.length === 2) {
            return { productId: segments[0].trim(), signature: segments[1].trim() };
        }
        return null;
    }
}

function parseProductId(productIdValue) {
    const cleaned = String(productIdValue || "").trim();
    if (!/^\d+$/.test(cleaned)) {
        throw new Error("Product ID must be a positive integer.");
    }

    const productId = BigInt(cleaned);
    if (productId < 1n) {
        throw new Error("Product ID must be greater than 0.");
    }

    // uint64 max
    const uint64Max = 18446744073709551615n;
    if (productId > uint64Max) {
        throw new Error("Product ID exceeds uint64 limit.");
    }

    return productId;
}

function generateProductId() {
    const nowPart = BigInt(Date.now()) * 1000000n;
    const randomPart = BigInt(Math.floor(Math.random() * 1000000));
    return (nowPart + randomPart).toString();
}

function formatUnixDate(unixTs) {
    const ts = Number(unixTs);
    if (!ts) {
        return "N/A";
    }
    return new Date(ts * 1000).toLocaleString();
}

function txError(error) {
    return error?.reason || error?.shortMessage || error?.message || "Unknown transaction error";
}

function shortAddress(address) {
    if (!address) {
        return "";
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
