/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { X, ShieldCheck, AlertTriangle, Key, ArrowRight } from "lucide-react";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string, walletName?: string) => void;
}

export default function WalletModal({ isOpen, onClose, onConnect }: WalletModalProps) {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'sign' | 'connecting'>('select');
  const [signatureProgress, setSignatureProgress] = useState(0);
  const [detectedAddress, setDetectedAddress] = useState<string | null>(null);
  const [error, setError] = useState<{
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  } | null>(null);

  if (!isOpen) return null;

  const wallets = [
    { name: "MetaMask", logo: "🦊", color: "hover:border-orange-500/30" },
    { name: "Phantom Wallet", logo: "🔮", color: "hover:border-purple-500/30" },
    { name: "Trust Wallet", logo: "🛡️", color: "hover:border-blue-500/30" },
    { name: "Coinbase Wallet", logo: "🔵", color: "hover:border-cyan-500/30" },
  ];

  const handleWalletSelect = async (walletName: string) => {
    setSelectedWallet(walletName);
    setStep('connecting');
    setError(null);

    let isInstalled = false;
    let installUrl = "";

    if (walletName === "MetaMask") {
      isInstalled = !!((window as any).ethereum);
      installUrl = "https://metamask.io/download/";
    } else if (walletName === "Phantom Wallet") {
      isInstalled = !!((window as any).solana?.isPhantom || (window as any).phantom?.solana);
      installUrl = "https://phantom.app/download";
    } else if (walletName === "Trust Wallet") {
      isInstalled = !!((window as any).trustwallet || (window as any).ethereum?.isTrust);
      installUrl = "https://trustwallet.com/download";
    } else if (walletName === "Coinbase Wallet") {
      isInstalled = !!((window as any).coinbaseWalletExtension || (window as any).ethereum?.isCoinbaseWallet);
      installUrl = "https://www.coinbase.com/wallet";
    }

    if (!isInstalled) {
      setTimeout(() => {
        setError({
          title: `Genuine ${walletName} Not Detected`,
          message: `To log in, you must use the genuine, authentic version of ${walletName}. Cryptographic authorization requires an active wallet extension. Please install it to continue.`,
          actionUrl: installUrl,
          actionText: `Download Genuine ${walletName}`
        });
      }, 800);
      return;
    }

    try {
      let address = "";
      if (walletName === "MetaMask" || walletName === "Trust Wallet" || walletName === "Coinbase Wallet") {
        const provider = (window as any).ethereum;
        if (provider) {
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            address = accounts[0];
          } else {
            throw new Error("No accounts were returned by the wallet.");
          }
        } else {
          throw new Error("Web3 provider not found.");
        }
      } else if (walletName === "Phantom Wallet") {
        const provider = (window as any).solana || (window as any).phantom?.solana;
        if (provider) {
          const resp = await provider.connect();
          address = resp.publicKey.toString();
        } else {
          throw new Error("Phantom provider not found.");
        }
      }

      if (address) {
        setDetectedAddress(address);
        setStep('sign');
      } else {
        throw new Error("Could not retrieve wallet address.");
      }
    } catch (err: any) {
      console.error("Genuine wallet connection failed:", err);
      setError({
        title: "Connection Handshake Failed",
        message: err.message || "The wallet connection request was rejected or interrupted. Please ensure your extension is unlocked and try again."
      });
    }
  };

  const handleSignMessage = async () => {
    if (!detectedAddress || !selectedWallet) return;
    
    setSignatureProgress(10);
    try {
      const message = `Welcome to Crytobox!\n\nSign this secure handshake to log in without passwords or cookies.\n\nDomain: https://crytobox.io\nTimestamp: ${new Date().toISOString()}`;
      
      setSignatureProgress(40);
      let signature = "";
      if (selectedWallet === "MetaMask" || selectedWallet === "Trust Wallet" || selectedWallet === "Coinbase Wallet") {
        const provider = (window as any).ethereum;
        if (provider) {
          const hexMessage = "0x" + Array.from(new TextEncoder().encode(message))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          
          signature = await provider.request({
            method: 'personal_sign',
            params: [hexMessage, detectedAddress],
          });
        }
      } else if (selectedWallet === "Phantom Wallet") {
        const provider = (window as any).solana || (window as any).phantom?.solana;
        if (provider && provider.signMessage) {
          const encodedMessage = new TextEncoder().encode(message);
          const signedMessage = await provider.signMessage(encodedMessage, "utf8");
          signature = Array.from(new Uint8Array(signedMessage.signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        }
      }
      
      setSignatureProgress(80);
      
      setTimeout(() => {
        setSignatureProgress(100);
        setTimeout(() => {
          onConnect(detectedAddress, selectedWallet);
          onClose();
          setSelectedWallet(null);
          setStep('select');
          setSignatureProgress(0);
          setDetectedAddress(null);
        }, 300);
      }, 500);
      
    } catch (err: any) {
      console.error("Handshake signing failed:", err);
      setSignatureProgress(0);
      setError({
        title: "Handshake Authorization Denied",
        message: err.message || "You must sign the cryptographic handshake using your genuine wallet to securely log in to Crytobox."
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div 
        id="wallet-modal"
        className="relative w-full max-w-md overflow-hidden rounded-3xl glass-panel border border-white/10 shadow-glass max-h-[88vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛡️</span>
            <h3 className="font-display font-bold text-lg text-white">Connect Wallet</h3>
          </div>
          <button
            id="close-wallet-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {error ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center p-3 rounded-full bg-red-500/10 border border-red-500/30 mb-4 text-red-500 animate-pulse">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h4 className="font-display font-bold text-white text-lg mb-2">{error.title}</h4>
              <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                {error.message}
              </p>
              
              <div className="flex flex-col gap-3">
                {error.actionUrl && (
                  <a
                    id="install-wallet-link"
                    href={error.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-neon hover:opacity-90 transition-all text-center block cursor-pointer"
                  >
                    {error.actionText || "Get Wallet"}
                  </a>
                )}
                <button
                  id="error-back-btn"
                  onClick={() => {
                    setError(null);
                    setStep('select');
                    setSelectedWallet(null);
                  }}
                  className="w-full py-3 rounded-xl border border-white/5 text-gray-300 text-sm font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                >
                  Back to Wallets
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 'select' && (
                <div className="transition-all duration-300">
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                    Connect your decentralized Web3 wallet to explore verified airdrops, sign messages securely, and claim catalog points.
                  </p>

                  <div className="flex flex-col gap-3">
                    {wallets.map((wallet) => (
                      <button
                        key={wallet.name}
                        id={`wallet-option-${wallet.name.toLowerCase().replace(/\s+/g, "-")}`}
                        onClick={() => handleWalletSelect(wallet.name)}
                        className={`flex items-center justify-between p-4 rounded-2xl bg-black/30 border border-white/5 ${wallet.color} hover:bg-white/5 hover:translate-x-1 transition-all duration-200 text-left cursor-pointer`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{wallet.logo}</span>
                          <div>
                            <span className="font-display font-semibold text-white block">
                              {wallet.name}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">Authentic Extension Authorization</span>
                          </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-gray-500" />
                      </button>
                    ))}
                  </div>

                  <div className="mt-6 flex items-start gap-2.5 bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4">
                    <ShieldCheck className="w-5 h-5 text-brand-secondary flex-shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      <strong>Non-Custodial Security Mandate:</strong> Crytobox never asks for your private keys, recovery seed phrases, or master passcodes. Your wallet actions remain safe and decentralized.
                    </p>
                  </div>
                </div>
              )}

              {step === 'connecting' && (
                <div className="py-12 text-center flex flex-col items-center">
                  <div className="relative flex items-center justify-center mb-6">
                    <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-brand-secondary animate-spin" />
                    <span className="absolute text-2xl">⚡</span>
                  </div>
                  <h4 className="font-display font-semibold text-white text-lg mb-2">Connecting to {selectedWallet}</h4>
                  <p className="text-gray-400 text-sm">Please authorize the connection handshake prompt in your browser extension window.</p>
                </div>
              )}

              {step === 'sign' && (
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-brand-secondary/15 border border-brand-secondary/30 mb-4 text-brand-secondary">
                    <Key className="w-8 h-8" />
                  </div>
                  <h4 className="font-display font-bold text-white text-lg mb-2">Signature Request</h4>
                  <p className="text-gray-400 text-xs mb-4">
                    To establish your wallet ID as the platform account index, please authorize the simulated cryptographic signature.
                  </p>

                  {/* Message box */}
                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 text-left font-mono text-[10px] text-gray-400 mb-6 max-h-[140px] overflow-y-auto leading-normal">
                    <p className="font-bold text-white mb-2">Message to Sign:</p>
                    <p>Welcome to Crytobox!</p>
                    <p className="mt-1">Sign this secure handshake to log in without passwords or cookies.</p>
                    <p className="mt-2">Domain: https://crytobox.io</p>
                    <p>Nonce: {Math.floor(1000000 + Math.random() * 9000000)}</p>
                    <p>Timestamp: {new Date().toISOString()}</p>
                    <p className="mt-2 text-yellow-500">Notice: No gas or network fees will be consumed by signing this message.</p>
                  </div>

                  {signatureProgress > 0 ? (
                    <div className="mb-4">
                      <div className="w-full bg-black/50 rounded-full h-2 mb-2 border border-white/5 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-brand-primary to-brand-secondary h-full transition-all duration-150" 
                          style={{ width: `${signatureProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-brand-secondary font-mono">Signing handshake: {signatureProgress}%</span>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <button
                        id="cancel-sign-btn"
                        onClick={() => setStep('select')}
                        className="flex-1 py-3 rounded-xl border border-white/5 text-gray-400 text-sm font-semibold hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        id="confirm-sign-btn"
                        onClick={handleSignMessage}
                        className="flex-1 py-3 rounded-xl bg-brand-primary text-white text-sm font-bold shadow-neon hover:opacity-90 transition-all cursor-pointer"
                      >
                        Sign Message
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
