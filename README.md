# Blockchain-Based Pharmacy Supply Chain with QR Verification
## Project Overview

This project implements a blockchain-enabled pharmacy system that ensures immutability, traceability, and authenticity of medicines from doctor prescription to patient delivery.
Each medicine pack contains a scannable QR code that allows anyone to verify its legitimacy using blockchain records.

## Problem Statement

Pharmaceutical supply chains are vulnerable to:

Counterfeit medicines

Prescription misuse

Data tampering

Lack of end-to-end traceability

Traditional systems rely on centralized databases that can be altered or compromised.

## Proposed Solution

A web-based decentralized application (DApp) that:

Records every critical step on a blockchain

Links prescriptions to medicine batches

Generates QR codes for each packed medicine

Enables real-time verification by patients, pharmacists, and regulators

All records are immutable and verifiable.

## System Actors

Doctor – Creates digital prescriptions

Pharmacist – Verifies prescription and initiates packing

Patient / Public – Scans QR code to verify medicine

Manufacturer – Provides batch-level drug data (pre-registered)

##  System Workflow

Doctor creates a digital prescription

Prescription hash is stored on the blockchain

Pharmacist receives and verifies prescription

Medicine packing is initiated

Drug batch is linked to prescription

QR code is generated and sealed on medicine pack

Patient scans QR to verify authenticity and details

## QR Code Functionality

Each medicine pack has a unique QR code

QR contains only a hashed identifier

On scan, the system verifies:

Drug authenticity

Manufacturer and batch

Expiry date

Prescription linkage

Supply chain history

If data does not match blockchain records, the medicine is flagged as invalid or counterfeit.

## Blockchain Usage

Blockchain is used to store:

Prescription hashes

Drug batch identifiers

Packing and delivery status

Ownership transitions

Timestamps and role signatures

No raw patient data is stored on-chain.

## Technology Stack

Blockchain: Ethereum (local/testnet)

Smart Contracts: Solidity

Blockchain Tools: Hardhat

Frontend: React.js

Backend: Node.js (Express)

Blockchain Library: ethers.js

Wallet: MetaMask

QR Code: JavaScript QR library

Database (off-chain): MongoDB

## Application Type

Web-based Decentralized Application (Web DApp)

Runs in browser

QR scanning supported via mobile browser

No native mobile app required for MVP

## Minimum Viable Product (MVP) Features

Digital prescription creation

Prescription verification by pharmacist

Medicine packing initiation

QR code generation per medicine pack

Blockchain-backed verification via QR scan

## Non-Goals (Out of MVP Scope)

Mobile native apps

IoT integration

Automated insurance claims

AI analytics

## Future Enhancements

Mobile app or PWA support

Smart drug recall system

Expiry enforcement via QR

Role-based access visibility

Cloud deployment

IoT temperature tracking

## Expected Outcomes

Prevention of counterfeit medicines

Transparent prescription-to-delivery tracking

Tamper-proof pharmaceutical records

Improved trust among patients and pharmacies

## Step 4 Implemented: Customer QR Verification

This repository now includes customer-side QR verification with anti-duplication logic:

1. Customer scans a QR payload containing `productId` and `signature`.
2. App fetches the serialized unit from blockchain.
3. Signature is verified against the manufacturer public key (wallet address) stored on-chain.
4. If signature is valid and status is `Available`, app shows genuine/available.
5. Pharmacy (holder/owner wallet) finalizes sale to update status to `Sold`.
6. If scanned again, status is already `Sold` and the app shows a warning.

This enables public customer verification without wallet login, while keeping Sold updates restricted to pharmacy/owner.

## Unit-Level Serialization

The app supports one QR per individual medicine unit:

- 1 physical unit = 1 unique `productId`
- 1 QR = 1 blockchain serialized-unit record
- 1 successful verification = status transition `Available -> Sold`

## Current Frontend/Contract Scope

Current codebase is:

- Solidity smart contract (`MedicineSupplyChain.sol`)
- Static web frontend (`index.html`, `app.js`, `style.css`)
- MetaMask + ethers.js integration

## Important Deployment Note

After any smart-contract change:

1. Redeploy `MedicineSupplyChain.sol`.
2. Update `CONTRACT_ADDRESS` in `app.js`.
3. Ensure MetaMask is connected to the configured target network in `app.js` (currently Sepolia, `chainId 11155111`).

