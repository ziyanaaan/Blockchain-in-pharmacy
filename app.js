// --- Web3 Configuration ---
const CONTRACT_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"; // ⚠️ REPLACE after every redeploy
const HARDHAT_CHAIN_ID = 31337;

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

// ... (Rest of configuration)

// ...



let provider;
let signer;
let contract;
let userAddress;

const appState = {
    currentView: 'dashboard',
    isConnected: false,
    medicines: []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    document.getElementById('connect-wallet-btn').addEventListener('click', connectWallet);
    navigateTo('dashboard');
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
        if (Number(network.chainId) !== HARDHAT_CHAIN_ID) {
            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x7A69" }] // 31337
            });
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

        appState.isConnected = true;
        updateWalletUI();
        navigateTo(appState.currentView);

        console.log("Connected on Hardhat:", userAddress);

    } catch (error) {
        console.error(error);
        alert("Wallet connection or network switch failed.");
    }
}

function updateWalletUI() {
    const btn = document.getElementById('connect-wallet-btn');
    btn.innerHTML = `Connected: ${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
    btn.classList.add('connected');
}

// --- Navigation ---
const views = {
    dashboard: renderDashboard,
    inventory: renderInventory,
    'add-medicine': renderAddMedicine,
    track: renderTrack
};

function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            navigateTo(e.currentTarget.getAttribute('data-view'));
        });
    });
}

async function navigateTo(viewName) {
    appState.currentView = viewName;
    const container = document.getElementById('view-container');
    container.innerHTML = '<div class="loading">Loading blockchain data...</div>';

    if (appState.isConnected && ['dashboard', 'inventory', 'track'].includes(viewName)) {
        try {
            const rawData = await contract.getAllMedicines();
            appState.medicines = rawData.map(m => ({
                id: m.id.toString(), // Convert BigInt/Number to string
                name: m.name,
                category: m.category,
                stock: Number(m.stock),
                price: Number(m.price),
                expiry: m.expiry,
                location: m.location,
                holder: m.holder
            }));
        } catch (e) {
            container.innerHTML = `<div class="card error">Blockchain fetch failed.</div>`;
            return;
        }
    }

    if (views[viewName]) views[viewName](container);
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
    const totalStock = data.reduce((acc, curr) => acc + curr.stock, 0);
    const lowStockCount = data.filter(m => m.stock < 50).length;
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
                <div class="stat-trend ${lowStockCount > 0 ? 'negative' : ''}">${lowStockCount > 0 ? 'Action needed' : 'Optimal'}</div>
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
                    ${data.slice(-5).reverse().map(m => `
                        <tr>
                            <td><span class="badge" style="background:#eee;">${m.id}</span></td>
                            <td>${m.name}</td>
                            <td>${m.stock}</td>
                            <td>${m.category}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;
}

function renderInventory(container) {
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
                        ${data.map(m => {
        const isMyMedicine = m.holder.toLowerCase() === userAddress.toLowerCase();
        const holderDisplay = isMyMedicine ? '<span class="badge" style="background:#d1fae5; color:#065f46;">You</span>' : `<span title="${m.holder}">${m.holder.substring(0, 6)}...</span>`;

        return `
                                <tr>
                                    <td><span style="font-weight: 600;">${m.id}</span></td>
                                    <td>${m.name}<br><span style="font-size:0.8em; color:gray;">${m.category}</span></td>
                                    <td>${m.stock}</td>
                                    <td>${m.location}</td>
                                    <td>${holderDisplay}</td>
                                    <td>
                                        ${isMyMedicine ?
                `<button class="btn-xs transfer-btn" data-id="${m.id}" style="background:var(--primary-main); color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Transfer</button>`
                : '<span style="color:gray; font-size:0.8em;">Read Only</span>'}
                                    </td>
                                </tr>
                            `;
    }).join('')}
                    </tbody>
                </table>
            </div>
             ${data.length === 0 ? '<p style="padding: 2rem; text-align: center;">No medicines found on chain.</p>' : ''}
        </div>
    `;
    container.innerHTML = html;

    // Attach Transfer Handlers
    document.querySelectorAll('.transfer-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const newHolder = prompt(`Transfer Batch #${id} to new wallet address:`);

            if (newHolder && ethers.isAddress(newHolder)) {
                try {
                    const tx = await contract.transferMedicine(id, newHolder);
                    e.target.innerText = "Processing...";
                    e.target.disabled = true;
                    await tx.wait();
                    alert("Transfer Successful!");
                    navigateTo('inventory'); // Refresh
                } catch (err) {
                    console.error(err);
                    alert("Transfer Failed: " + (err.reason || err.message));
                    e.target.innerText = "Transfer";
                    e.target.disabled = false;
                }
            } else if (newHolder) {
                alert("Invalid Ethereum Address");
            }
        });
    });
}

function renderAddMedicine(container) {
    const html = `
        <div class="card fade-in" style="max-width: 600px; margin: 0 auto;">
            <form id="add-form">
                 <div class="grid-2">
                    <!-- Removed ID Input - Auto Generated -->
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
                        <input type="number" name="stock" required class="form-input">
                    </div>
                     <div class="form-group">
                         <label class="form-label">Price</label>
                        <input type="number" step="0.01" name="price" required class="form-input">
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
                <p style="text-align: center; font-size: 0.8rem; color: #666; margin-top: 1rem;">
                    * Batch ID (16-bit random) will be auto-generated by the System
                </p>
            </form>
        </div>
    `;
    container.innerHTML = html;

    document.getElementById('add-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const network = await provider.getNetwork();
        if (Number(network.chainId) !== HARDHAT_CHAIN_ID) {
            alert("Wrong network. Please switch to Hardhat Localhost (Chain ID: 31337).");
            return;
        }

        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerHTML;

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="material-icons-round">hourglass_empty</span> Requesting Signature...';

            // Helper to get form values safely
            const val = (name) => formData.get(name);

            const tx = await contract.addMedicine(
                // REMOVED ID ARGUMENT
                val('name'),
                val('category'),
                BigInt(val('stock')),
                BigInt(Math.floor(Number(val('price')))),
                val('expiry'),
                val('location')
            );

            submitBtn.innerHTML = '<span class="material-icons-round">loop</span> Confirming Transaction...';
            console.log("Tx sent:", tx);

            await tx.wait();

            alert('Medicine added! Batch ID generated by system.');
            navigateTo('inventory');

        } catch (error) {
            console.error("Tx Error:", error);
            alert("Transaction failed: " + (error.reason || error.message));
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });
}

function renderTrack(container) {
    const html = `
        <div style="max-width: 600px; margin: 0 auto;" class="fade-in">
            <div class="search-bar-container">
                <input type="text" id="track-search" class="form-input" placeholder="Search by ID..." style="padding: 1rem 1.5rem; font-size: 1.1rem; border: none; box-shadow: var(--shadow-md);">
                <button id="search-btn" class="btn-primary" style="width: auto; padding: 0 2rem;">Search</button>
            </div>
            <div id="track-results"></div>
        </div>
    `;
    container.innerHTML = html;

    const performSearch = () => {
        const query = document.getElementById('track-search').value.toLowerCase();

        const results = appState.medicines.filter(m =>
            m.id.toLowerCase().includes(query) || m.name.toLowerCase().includes(query)
        );
        const resultsContainer = document.getElementById('track-results');

        if (results.length === 0) {
            resultsContainer.innerHTML = `<div class="card" style="text-align: center; color: var(--danger);"><p>No matches found on blockchain.</p></div>`;
            return;
        }

        resultsContainer.innerHTML = results.map(m => `
            <div class="search-result fade-in" style="background: white; padding: 1.5rem; border-radius: 12px; margin-top: 1rem; box-shadow: var(--shadow-sm);">
                <h3>${m.name} <span style="font-size: 0.8em; color: gray;">(${m.id})</span></h3>
                <p><strong>Stock:</strong> ${m.stock}</p>
                 <p><strong>Location:</strong> ${m.location}</p>
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #eee; text-align: center; font-size: 0.8rem; color: #666;">
                    Verified on Blockchain
                </div>
            </div>
        `).join('');
    };

    document.getElementById('search-btn').addEventListener('click', performSearch);
}

