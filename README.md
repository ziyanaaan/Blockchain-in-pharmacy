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

## Project Status

Planning in progress.

