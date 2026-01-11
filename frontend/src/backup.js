import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Package, Truck, Search, PlusCircle, Activity } from 'lucide-react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractConfig';

function App() {
  const [account, setAccount] = useState(null);
  const [medicineId, setMedicineId] = useState('');
  const [history, setHistory] = useState([]);
  const [medicineDetails, setMedicineDetails] = useState(null);
  const [formData, setFormData] = useState({ name: '', batch: '' });
  const [transferData, setTransferData] = useState({ id: '', to: '' });

  // 1. Connect Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } else {
      alert("Please install MetaMask");
    }
  };

  // 2. Manufacture Medicine
  const manufacture = async (e) => {
    e.preventDefault();
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    try {
      const tx = await contract.manufactureMedicine(formData.name, formData.batch);
      await tx.wait();
      alert("Medicine Registered on Blockchain!");
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Track History (The Transparency Logic)
  const trackMedicine = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    try {
      const details = await contract.medicines(medicineId);
      const auditTrail = await contract.getHistory(medicineId);
      
      setMedicineDetails(details);
      setHistory(auditTrail);
    } catch (err) {
      alert("Medicine ID not found");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-3xl font-bold text-blue-800 flex items-center gap-2">
          <Activity size={32} /> PharmaChain Transparency
        </h1>
        <button 
          onClick={connectWallet}
          className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700 transition"
        >
          {account ? `Connected: ${account.slice(0,6)}...` : "Connect Wallet"}
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Side: Actions */}
        <div className="space-y-8">
          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PlusCircle className="text-green-500" /> Manufacturer Portal
            </h2>
            <form onSubmit={manufacture} className="space-y-4">
              <input 
                className="w-full border p-2 rounded" 
                placeholder="Medicine Name (e.g. Paracetamol)"
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
              <input 
                className="w-full border p-2 rounded" 
                placeholder="Batch Number"
                onChange={(e) => setFormData({...formData, batch: e.target.value})}
              />
              <button className="w-full bg-green-500 text-white py-2 rounded font-bold">Register Production</button>
            </form>
          </section>

          <section className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Truck className="text-orange-500" /> Transfer Ownership
            </h2>
            <div className="space-y-4">
              <input 
                className="w-full border p-2 rounded" 
                placeholder="Medicine ID"
                onChange={(e) => setTransferData({...transferData, id: e.target.value})}
              />
              <input 
                className="w-full border p-2 rounded" 
                placeholder="Recipient Wallet Address (0x...)"
                onChange={(e) => setTransferData({...transferData, to: e.target.value})}
              />
              <button className="w-full bg-orange-500 text-white py-2 rounded font-bold">Transfer Item</button>
            </div>
          </section>
        </div>

        {/* Right Side: Tracking & Transparency */}
        <div className="bg-white p-6 rounded-xl shadow-md border">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Search className="text-blue-500" /> Public Tracking System
          </h2>
          <div className="flex gap-2 mb-6">
            <input 
              className="flex-1 border p-2 rounded" 
              placeholder="Enter Medicine ID"
              value={medicineId}
              onChange={(e) => setMedicineId(e.target.value)}
            />
            <button onClick={trackMedicine} className="bg-blue-800 text-white px-4 py-2 rounded">Search</button>
          </div>

          {medicineDetails && (
            <div className="mt-4 animate-fade-in">
              <div className="p-4 bg-blue-50 rounded-lg mb-6">
                <p className="font-bold text-lg">{medicineDetails.name}</p>
                <p className="text-gray-600 text-sm">Batch: {medicineDetails.batchNumber}</p>
              </div>

              <h3 className="font-semibold mb-4">Blockchain Audit Trail:</h3>
              <div className="relative border-l-2 border-blue-200 ml-3">
                {history.map((addr, index) => (
                  <div key={index} className="mb-6 ml-6">
                    <span className="absolute -left-2.5 top-1 bg-blue-600 w-5 h-5 rounded-full ring-4 ring-white"></span>
                    <p className="text-xs text-gray-400">STAGE {index + 1}</p>
                    <p className="text-sm font-mono break-all bg-gray-50 p-2 rounded border mt-1">
                      {addr}
                    </p>
                    <p className="text-xs text-blue-600 mt-1 italic font-semibold">
                      {index === 0 ? "Verified Manufacturer" : "Received by Stakeholder"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;