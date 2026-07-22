/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  Filter,
  Globe,
  HelpCircle,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  Send,
  Calendar,
  Award,
  Activity,
  Flame,
  Bookmark,
  CheckCircle,
  Copy,
  ChevronDown,
  Coins,
  ChevronRight,
  Check,
  Minus,
  Square,
  X,
  Settings,
  Info,
  Upload,
  QrCode
} from "lucide-react";

import { Airdrop, User, Transaction, SystemSettings, Category, FAQItem, PaymentNetwork } from "./types";
import Navbar from "./components/Navbar";
import WalletModal from "./components/WalletModal";
import WithdrawModal from "./components/WithdrawModal";
import AirdropCard from "./components/AirdropCard";
import AdminPanel from "./components/AdminPanel";
import PhpExporter from "./components/PhpExporter";

const COIN_CONVERSION_RATES: Record<string, number> = {
  USDT: 1.0,
  ETH: 3150.0, // $3,150 per ETH
  BNB: 580.0,  // $580 per BNB
  BTC: 64200.0 // $64,200 per BTC
};

export default function App() {
  // Database States
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: "Crytobox",
    siteLogo: "📦",
    heroTitle: "Discover Next-Gen Web3 Airdrops Securely",
    heroSubtitle: "Explore, filter, and instantly join verified high-reward cryptocurrency airdrops.",
    footerText: "Crytobox is the premier catalog for Web3 enthusiasts. We index verified projects.",
    announcement: "🚀 Solana Blinks Campaign is now live!",
    isMaintenance: false,
    joinFee: 0.003,
    seoTitle: "Crytobox - Premium Web3 Crypto Airdrop Portal",
    seoDescription: "Discover and secure active airdrops.",
    telegramLink: "https://t.me/crytobox",
    twitterLink: "https://twitter.com/crytobox",
    discordLink: "https://discord.gg/crytobox",
    analyticsCode: "",
    ownerWalletAddress: "0x96B217983637e12763321528b9A26A207d5D66D5"
  });

  // UI Control States
  const [activeView, setActiveView] = useState<'explore' | 'dashboard' | 'admin' | 'exporter' | 'about' | 'privacy'>('explore');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const [connectedWalletType, setConnectedWalletType] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Search & Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedChain, setSelectedChain] = useState<string>("All");

  // Interaction Modals States
  const [selectedAirdropDetail, setSelectedAirdropDetail] = useState<Airdrop | null>(null);
  const [joiningAirdrop, setJoiningAirdrop] = useState<Airdrop | null>(null);
  const [joinStep, setJoinStep] = useState<'network_select' | 'payment_details' | 'upload_proof' | 'success'>('network_select');
  const [selectedCoin, setSelectedCoin] = useState<"USDT" | "ETH" | "BNB" | "BTC" | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<PaymentNetwork | null>(null);
  const [proofTxId, setProofTxId] = useState("");
  const [proofScreenshot, setProofScreenshot] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [isSimulatedWalletPaying, setIsSimulatedWalletPaying] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [submittingStep, setSubmittingStep] = useState(0);
  const [simulatedTxHash, setSimulatedTxHash] = useState("");
  const [showMetaMask, setShowMetaMask] = useState(false);
  const [metaMaskStep, setMetaMaskStep] = useState<'deploy' | 'submitted' | 'complete'>('deploy');
  const [claimedRewardInfo, setClaimedRewardInfo] = useState<{ amount: number; coin: string } | null>(null);

  // Generic Extras State
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [cookieAccepted, setCookieAccepted] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Fetch all DB snapshot information on mount
  const fetchDBSnapshot = async () => {
    try {
      const res = await fetch("/api/db");
      if (res.ok) {
        const data = await res.json();
        setAirdrops(data.airdrops || []);
        setCategories(data.categories || []);
        setTransactions(data.transactions || []);
        setUsers(data.users || []);
        if (data.settings) setSettings(data.settings);
      }
    } catch (error) {
      // Quietly swallow transient fetch network errors during background updates
    }
  };

  useEffect(() => {
    fetchDBSnapshot();
    
    // Auto-refresh DB snapshot every 3 seconds to sync admin balance edits in real-time
    const interval = setInterval(() => {
      fetchDBSnapshot();
    }, 3000);

    // Read local storage for wallet address
    const savedWallet = sessionStorage.getItem("walletAddress");
    const savedWalletType = sessionStorage.getItem("walletType");
    if (savedWallet) {
      handleWalletConnect(savedWallet, savedWalletType || undefined);
    }

    // Read cookie banner acceptance
    const savedCookie = localStorage.getItem("cookie_accepted");
    if (savedCookie) {
      setCookieAccepted(true);
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (connectedWallet && users.length > 0) {
      const match = users.find(u => u.walletAddress.toLowerCase() === connectedWallet.toLowerCase());
      if (match) {
        setCurrentUser(match);
      }
    }
  }, [users, connectedWallet]);

  const handleWalletConnect = async (address: string, walletType?: string) => {
    try {
      const res = await fetch("/api/users/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });
      if (res.ok) {
        const userRow: User = await res.json();
        setConnectedWallet(userRow.walletAddress);
        setCurrentUser(userRow);
        sessionStorage.setItem("walletAddress", userRow.walletAddress);
        if (walletType) {
          setConnectedWalletType(walletType);
          sessionStorage.setItem("walletType", walletType);
        }
        
        // Fetch favorites
        const favRes = await fetch(`/api/favorites/${userRow.walletAddress}`);
        if (favRes.ok) {
          const favIds = await favRes.json();
          setFavorites(favIds);
        }
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to connect wallet.");
      }
    } catch (e) {
      console.error("Auth server error", e);
    }
  };

  const handleWalletDisconnect = () => {
    setConnectedWallet(null);
    setConnectedWalletType(null);
    setCurrentUser(null);
    setFavorites([]);
    sessionStorage.removeItem("walletAddress");
    sessionStorage.removeItem("walletType");
    alert("Wallet connection severed.");
  };

  const handleToggleFavorite = async (airdropId: string) => {
    if (!connectedWallet) {
      setIsWalletModalOpen(true);
      return;
    }

    try {
      const res = await fetch("/api/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: connectedWallet, airdropId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.isFavorite) {
          setFavorites((prev) => [...prev, airdropId]);
        } else {
          setFavorites((prev) => prev.filter((id) => id !== airdropId));
        }
      }
    } catch (e) {
      console.error("Failed to toggle favorite on server", e);
    }
  };

  const handleJoinInitiate = (airdrop: Airdrop) => {
    if (!connectedWallet) {
      setIsWalletModalOpen(true);
      return;
    }
    setJoiningAirdrop(airdrop);
    setJoinStep('network_select');

    // Auto detect network from connected wallet brand
    if (connectedWalletType) {
      if (connectedWalletType === "MetaMask") {
        setSelectedCoin("ETH");
      } else if (connectedWalletType === "Trust Wallet") {
        setSelectedCoin("BNB");
      } else if (connectedWalletType === "Phantom Wallet") {
        setSelectedCoin("BTC");
      } else if (connectedWalletType === "Coinbase Wallet") {
        setSelectedCoin("USDT");
      } else {
        setSelectedCoin(null);
      }
    } else {
      setSelectedCoin(null);
    }

    setProofTxId("");
    setProofScreenshot(null);
    setProofFile(null);
    setCopiedAddress(false);
    setIsSimulatedWalletPaying(false);
  };

  const handleJoinConfirm = async () => {
    if (!joiningAirdrop || !connectedWallet) return;
    
    // Validate if the connected user has sufficient simulated balance
    const feeAmount = (joiningAirdrop.claimFee !== undefined && joiningAirdrop.claimFee !== null) ? joiningAirdrop.claimFee : settings.joinFee;
    if (currentUser && currentUser.balance !== undefined && currentUser.balance < feeAmount) {
      alert("Insufficient wallet balance to authorize transaction. Initial balance is 5.00 ETH.");
      return;
    }
    
    setMetaMaskStep('deploy');
    setShowMetaMask(true);
  };

  const handleSubmitProof = async () => {
    if (!joiningAirdrop || !connectedWallet || !selectedNetwork) return;
    setIsSubmittingProof(true);
    setSubmittingStep(1);

    const feeAmount = (joiningAirdrop.claimFee !== undefined && joiningAirdrop.claimFee !== null) ? joiningAirdrop.claimFee : settings.joinFee;

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: connectedWallet,
          airdropId: joiningAirdrop.id,
          airdropName: joiningAirdrop.name,
          amount: feeAmount,
          txHash: proofTxId || `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
          coin: selectedCoin,
          network: selectedNetwork.network,
          screenshot: proofScreenshot || ""
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.transaction && data.transaction.claimedReward) {
          setClaimedRewardInfo({
            amount: data.transaction.claimedReward,
            coin: data.transaction.claimedCoin || "USDT"
          });
        }
      }

      setTimeout(() => {
        setSubmittingStep(2);
      }, 1200);

      setTimeout(() => {
        setSubmittingStep(3);
      }, 2400);

      setTimeout(() => {
        setIsSubmittingProof(false);
        setJoinStep('success');
        fetchDBSnapshot(); // Refresh snapshot (updates stats, tx log, joined status)
      }, 3600);

    } catch (e) {
      console.error("Failed to submit manual proof to server", e);
      setIsSubmittingProof(false);
      alert("Verification server error. Please try again.");
    }
  };

  const handleMetaMaskConfirm = async () => {
    if (!joiningAirdrop || !connectedWallet) return;
    setMetaMaskStep('submitted');

    try {
      const feeAmount = (joiningAirdrop.claimFee !== undefined && joiningAirdrop.claimFee !== null) ? joiningAirdrop.claimFee : settings.joinFee;
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: connectedWallet,
          airdropId: joiningAirdrop.id,
          airdropName: joiningAirdrop.name,
          amount: feeAmount,
          coin: selectedCoin || "ETH",
          network: selectedNetwork?.network || "Ethereum Mainnet",
          screenshot: ""
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSimulatedTxHash(data.transaction.txHash);
        if (data.transaction && data.transaction.claimedReward) {
          setClaimedRewardInfo({
            amount: data.transaction.claimedReward,
            coin: data.transaction.claimedCoin || "USDT"
          });
        }
        
        // After 1.8 seconds of broadcasting, move to complete
        setTimeout(() => {
          setMetaMaskStep('complete');
          // Refresh user snapshot to see local balance deducted!
          fetchDBSnapshot();
          if (currentUser) {
            setCurrentUser(data.user);
          }
        }, 1800);
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to authorize transaction.");
        setShowMetaMask(false);
        setJoinStep('network_select');
      }
    } catch (e) {
      console.error("Failed to submit transaction", e);
      setShowMetaMask(false);
      setJoinStep('network_select');
    }
  };

  const handleMetaMaskCancel = () => {
    setShowMetaMask(false);
    if (isSimulatedWalletPaying) {
      setJoinStep('payment_details');
    } else {
      setJoinStep('network_select');
    }
  };

  const handleMetaMaskClose = () => {
    setShowMetaMask(false);
    if (isSimulatedWalletPaying) {
      setProofTxId(simulatedTxHash);
      setJoinStep('upload_proof');
    } else {
      setJoinStep('success');
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setNewsletterSubscribed(true);
      setNewsletterEmail("");
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (contactName && contactEmail && contactMessage) {
      setContactSubmitted(true);
      setContactName("");
      setContactEmail("");
      setContactMessage("");
      setTimeout(() => setContactSubmitted(false), 5000);
    }
  };

  const handleAcceptCookie = () => {
    localStorage.setItem("cookie_accepted", "true");
    setCookieAccepted(true);
  };

  // Filter computations
  const filteredAirdrops = airdrops.filter((air) => {
    const matchesSearch =
      air.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      air.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || air.category === selectedCategory;
    const matchesChain = selectedChain === "All" || air.blockchain.toLowerCase() === selectedChain.toLowerCase();
    return matchesSearch && matchesCategory && matchesChain;
  });

  const activeUserJoinedCount = currentUser?.joinedAirdrops.length || 0;

  // Dynamic Withdrawal Eligibility Calculations
  const minAirdropsRequired = settings.minAirdropsRequired ?? 2;
  const minWithdrawAmount = settings.minWithdrawAmount ?? 50;

  const totalAvailableUSD = Object.entries(currentUser?.availableBalances || {}).reduce(
    (acc, [coin, val]) => acc + ((val as number) * (COIN_CONVERSION_RATES[coin] || 1)),
    0
  );
  const totalPendingUSD = Object.entries(currentUser?.pendingBalances || {}).reduce(
    (acc, [coin, val]) => acc + ((val as number) * (COIN_CONVERSION_RATES[coin] || 1)),
    0
  );
  const totalEarningsUSD = Object.entries(currentUser?.totalEarnings || {}).reduce(
    (acc, [coin, val]) => acc + ((val as number) * (COIN_CONVERSION_RATES[coin] || 1)),
    0
  );
  
  const eligibilityHasJoinedMinQuests = activeUserJoinedCount >= minAirdropsRequired;
  const eligibilityHasMinBalance = totalAvailableUSD >= minWithdrawAmount;
  const eligibilityIsVerified = !settings.requireAccountVerification || (currentUser?.points && currentUser.points >= 20); // standard threshold
  const isWithdrawEligible = !!connectedWallet && 
                             settings.withdrawStatus !== 'paused';

  // Render list of FAQs
  const faqItems: FAQItem[] = [
    {
      question: "How do I secure eligibility for indexed airdrops?",
      answer: "Each campaign features specific checklists under 'Details'. Generally, you need to connect your Web3 wallet, complete on-chain swaps, supply testnet liquidity, or participate in task boards to log on-chain footprints."
    },
    {
      question: "Why is there a platform transaction catalog fee?",
      answer: "We verify every contract and link to prevent phishing. The small catalog join fee covers our manual audits, threat assessment filters, and secure decentralized hosting environments."
    },
    {
      question: "Are these airdrop campaigns fully safe?",
      answer: "We inspect smart contract codes and official handles thoroughly. However, in DeFi, you should always employ separate burner wallets for testnet interactions to isolate risks."
    }
  ];

  const teamMembers = [
    {
      name: "John",
      designation: "Foundation President & Lead Architect",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80",
      bio: "Web3 pioneer with a decade of expertise in decentralized infrastructure, cryptographic auditing, and network operations.",
      specialty: "Founder & Owner",
      isOwner: true,
    },
    {
      name: "Sophia Vance",
      designation: "Chief Operating Officer",
      photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80",
      bio: "Oversees global operations, community listing validations, and strategic integrations with leading chain registries.",
      specialty: "Core Operations",
      isOwner: false,
    },
    {
      name: "Michael Chen",
      designation: "Chief Technology Officer",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80",
      bio: "Maintains our secure, high-fidelity indexing protocols, multi-VM signature validations, and PHP export APIs.",
      specialty: "Lead Developer",
      isOwner: false,
    },
    {
      name: "Emily Rodriguez",
      designation: "Head of Web3 Research",
      photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=300&q=80",
      bio: "Leads manual threat intelligence auditing and risk score evaluations across testnets and high-yield protocols.",
      specialty: "Risk Analyst",
      isOwner: false,
    },
    {
      name: "David Kross",
      designation: "Lead Smart Contract Architect",
      photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80",
      bio: "Audits verified contract codes and coordinates decentralized security filters to safeguard connection signatures.",
      specialty: "Solidity Audit",
      isOwner: false,
    },
    {
      name: "Sarah Jenkins",
      designation: "Director of Community Relations",
      photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80",
      bio: "Nurtures platform user support, coordinates official partner listings, and verifies community-driven quests.",
      specialty: "User Relations",
      isOwner: false,
    }
  ];

  return (
    <div className="min-h-screen bg-brand-bg text-white font-sans relative overflow-x-hidden selection:bg-brand-primary selection:text-white">
      {/* Background glowing gradients */}
      <div className="absolute top-0 left-0 right-0 h-[100vh] grid-bg -z-10 pointer-events-none opacity-80" />

      {/* Navigation Header */}
      <Navbar
        walletAddress={connectedWallet}
        onConnectClick={() => setIsWalletModalOpen(true)}
        onDisconnect={handleWalletDisconnect}
        isAdminMode={activeView === 'admin'}
        onToggleAdmin={() => setActiveView(activeView === 'admin' ? 'explore' : 'admin')}
        announcement={settings.announcement}
        currentUser={currentUser}
        onWithdrawClick={() => setIsWithdrawModalOpen(true)}
        isWithdrawEligible={isWithdrawEligible}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Maintenance Screen */}
        {settings.isMaintenance && activeView !== 'admin' ? (
          <div className="py-24 text-center max-w-lg mx-auto">
            <span className="text-6xl block mb-6 animate-pulse">⚙️</span>
            <h1 className="font-display font-extrabold text-3xl text-white mb-3">Portal Under Maintenance</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              Our Web3 engineers are currently executing security migrations and smart contract upgrades. We will return online momentarily.
            </p>
            <div className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-xs text-brand-secondary">
              If you are the platform administrator, connect inside the top Admin toggle.
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            
            {/* 1. Explore/Landing view */}
            {activeView === 'explore' && (
              <motion.div
                key="explore"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                {/* Hero section */}
                <header className="py-12 md:py-20 text-center relative z-10 max-w-4xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-primary/20 bg-brand-primary/5 text-xs font-semibold text-brand-secondary mb-4 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Next-Gen Airdrop Discovery Engine</span>
                  </div>

                  <h1 className="font-display font-black text-4xl sm:text-6xl tracking-tight leading-none text-white mb-6">
                    <span className="text-gradient">{settings.heroTitle}</span>
                  </h1>

                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl mx-auto">
                    {settings.heroSubtitle}
                  </p>

                  {/* Quick view selectors */}
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      id="view-portfolio-btn"
                      onClick={() => {
                        if (!connectedWallet) setIsWalletModalOpen(true);
                        else setActiveView('dashboard');
                      }}
                      className="px-6 py-3 rounded-xl font-display font-bold text-xs text-brand-bg bg-brand-accent hover:opacity-90 shadow-neon-green transition-all cursor-pointer"
                    >
                      My Connected Dashboard
                    </button>
                  </div>
                </header>

                {/* Filters, search and airdrops section */}
                <section id="explore" className="py-8 scroll-mt-24">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Left Sidebar filter blocks */}
                    <aside className="lg:col-span-3">
                      <div className="glass-panel border border-white/5 rounded-2xl p-5 sticky top-24">
                        <h4 className="font-display font-bold text-white text-sm mb-4">Search Queries</h4>
                        
                        <div className="relative mb-6">
                          <input
                            type="text"
                            id="search-box"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white outline-none focus:border-brand-primary transition-all font-sans"
                            placeholder="Search project keys..."
                          />
                          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                        </div>

                        <h4 className="font-display font-bold text-white text-sm mb-3">Categories</h4>
                        <div className="flex flex-col gap-1.5 mb-6">
                          <button
                            id="cat-tab-all"
                            onClick={() => setSelectedCategory("All")}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                              selectedCategory === "All"
                                ? "bg-brand-primary/15 text-white font-bold border border-brand-primary/20"
                                : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                            }`}
                          >
                            📦 All Collections
                          </button>
                          {categories.map((cat) => (
                            <button
                              key={cat.id}
                              id={`cat-tab-${cat.slug}`}
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs transition-colors cursor-pointer ${
                                selectedCategory === cat.id
                                  ? "bg-brand-primary/15 text-white font-bold border border-brand-primary/20"
                                  : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
                              }`}
                            >
                              ⚡ {cat.name}
                            </button>
                          ))}
                        </div>

                        <h4 className="font-display font-bold text-white text-sm mb-3">Blockchains</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {["All", "Ethereum", "BNB Chain", "Solana", "Polygon", "Base", "Arbitrum", "Avalanche"].map((chain) => (
                            <button
                              key={chain}
                              id={`chain-badge-${chain.toLowerCase().replace(/\s+/g, "-")}`}
                              onClick={() => setSelectedChain(chain)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold transition-all cursor-pointer ${
                                selectedChain === chain
                                  ? "bg-brand-secondary text-brand-bg shadow-neon"
                                  : "border border-white/5 bg-white/2 text-gray-400 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              {chain}
                            </button>
                          ))}
                        </div>
                      </div>
                    </aside>

                    {/* Right core grid layout */}
                    <div className="lg:col-span-9">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="font-display font-bold text-white text-lg">
                          Active Campaigns ({filteredAirdrops.length})
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredAirdrops.map((air) => (
                          <div key={air.id}>
                            <AirdropCard
                              airdrop={air}
                              onViewDetails={setSelectedAirdropDetail}
                              onJoin={handleJoinInitiate}
                              isFavorite={favorites.includes(air.id)}
                              onToggleFavorite={handleToggleFavorite}
                              isJoined={currentUser?.joinedAirdrops.includes(air.id) || false}
                            />
                          </div>
                        ))}
                        {filteredAirdrops.length === 0 && (
                          <div className="col-span-2 py-16 text-center border border-dashed border-white/5 rounded-2xl bg-black/10">
                            <span className="text-4xl block mb-3">🔍</span>
                            <h4 className="text-white text-sm font-bold">No verified campaigns found</h4>
                            <p className="text-gray-500 text-xs mt-1">Try resetting your category or text filters.</p>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </section>

                {/* FAQ section */}
                <section id="faq" className="py-16 scroll-mt-24 border-t border-white/5 mt-12">
                  <div className="max-w-3xl mx-auto">
                    <h2 className="font-display font-bold text-2xl text-white text-center mb-12">
                      Frequently Asked Questions
                    </h2>
                    
                    <div className="flex flex-col gap-4">
                      {faqItems.map((faq, index) => (
                        <div key={index} className="p-6 rounded-2xl glass-panel border border-white/5">
                          <h4 className="font-display font-bold text-white text-base mb-2 flex items-center gap-2">
                            <span className="text-brand-secondary font-mono">Q{index+1}.</span>
                            <span>{faq.question}</span>
                          </h4>
                          <p className="text-gray-400 text-sm leading-relaxed pl-6">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* About and Newsletter split section */}
                <section id="about" className="py-16 border-t border-white/5 scroll-mt-24">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                    <div className="md:col-span-6">
                      <h3 className="font-display font-extrabold text-2xl text-white mb-4">
                        About the Crytobox Verified Catalog
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed mb-4">
                        Crytobox indexes the absolute latest active cryptocurrency testnet and mainnet campaigns. Our manual audit protocols safeguard Web3 enthusiasts from phishing sites and fake decentralized faucet loops.
                      </p>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        By integrating dynamic MetaMask/Trust signatures and secure platform databases, users can securely track points, rank multipliers, and complete eligibility tasks in seconds.
                      </p>
                    </div>

                    <div className="md:col-span-6 bg-black/25 rounded-3xl border border-white/5 p-6 md:p-8">
                      <h4 className="font-display font-bold text-white text-lg mb-2">Subscribe to Airdrop Alerts</h4>
                      <p className="text-gray-400 text-xs mb-6">Receive immediate smart notification telemetry when new $1000+ potential campaigns launch.</p>

                      {newsletterSubscribed ? (
                        <div className="p-4 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-xs text-brand-accent">
                          Success! You have subscribed to high-fidelity Web3 notification triggers.
                        </div>
                      ) : (
                        <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                          <input
                            type="email"
                            value={newsletterEmail}
                            onChange={(e) => setNewsletterEmail(e.target.value)}
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-brand-primary"
                            placeholder="Enter email address"
                            required
                          />
                          <button
                            type="submit"
                            className="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-neon"
                          >
                            Subscribe
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                </section>

                {/* Contact Page integration */}
                <section id="contact" className="py-16 border-t border-white/5 max-w-3xl mx-auto">
                  <div className="glass-panel rounded-3xl p-8 border border-white/5">
                    <h3 className="font-display font-bold text-white text-xl text-center mb-2">Need Support or Have Questions?</h3>
                    <p className="text-gray-400 text-xs text-center mb-8">Reach our technical desk directly for listings, partnerships, or connection inquiries.</p>

                    {contactSubmitted ? (
                      <div className="p-4 rounded-xl bg-brand-accent/10 border border-brand-accent/20 text-xs text-brand-accent text-center">
                        Message submitted! Our administrative workspace will respond shortly.
                      </div>
                    ) : (
                      <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-gray-500 text-xs font-semibold block mb-1">Your Name</label>
                            <input
                              type="text"
                              value={contactName}
                              onChange={(e) => setContactName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-brand-primary outline-none"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-gray-500 text-xs font-semibold block mb-1">Email Address</label>
                            <input
                              type="email"
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-brand-primary outline-none"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-gray-500 text-xs font-semibold block mb-1">Your Message</label>
                          <textarea
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            rows={3}
                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-brand-primary outline-none"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-3 bg-brand-primary text-white font-bold text-xs rounded-xl shadow-neon transition-all hover:opacity-95 cursor-pointer"
                        >
                          Submit Message to Support
                        </button>
                      </form>
                    )}
                  </div>
                </section>

                {/* Foundation Team section */}
                <section id="foundation" className="py-16 border-t border-white/5 scroll-mt-24">
                  <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                      <span className="px-3 py-1.5 text-[10px] font-mono font-bold text-brand-secondary border border-brand-secondary/30 bg-brand-secondary/5 rounded-full uppercase tracking-wider">
                        Foundation Leadership
                      </span>
                      <h3 className="font-display font-extrabold text-3xl text-white mt-3 mb-4">
                        Meet Our Elite Core Team
                      </h3>
                      <p className="text-gray-400 text-xs max-w-xl mx-auto leading-relaxed">
                        The stewards and builders behind the {settings.siteName} platform. We audit, verify, and secure Web3 discovery pipelines.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                      {teamMembers.map((member, idx) => (
                        <div key={idx} className="glass-panel rounded-3xl p-5 border border-white/5 flex flex-col items-center text-center group hover:border-brand-primary/40 transition-all duration-300 transform hover:-translate-y-1">
                          <div className="relative w-24 h-24 mb-4 rounded-2xl overflow-hidden border-2 border-white/5 group-hover:border-brand-primary/50 transition-all duration-300">
                            <img
                              src={member.photo}
                              alt={member.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {member.isOwner && (
                              <span className="absolute bottom-1 right-1 bg-brand-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow">
                                Owner
                              </span>
                            )}
                          </div>
                          <h4 className="font-display font-bold text-white text-base mb-1">{member.name}</h4>
                          <span className="text-brand-secondary text-xs font-medium mb-3">{member.designation}</span>
                          <p className="text-gray-500 text-[11px] leading-relaxed mb-4 max-w-[220px]">
                            {member.bio}
                          </p>
                          <div className="flex gap-2.5 mt-auto">
                            <span className="text-[10px] font-mono text-gray-500 px-2 py-0.5 rounded bg-white/2 border border-white/5">
                              {member.specialty}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {/* 2. Admin View */}
            {activeView === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="font-display font-extrabold text-2xl text-white">Administrative Workspace</h2>
                  <button
                    onClick={() => setActiveView('explore')}
                    className="px-4 py-2 border border-white/10 bg-white/2 hover:bg-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ← Exit Console
                  </button>
                </div>
                
                <AdminPanel
                  onAirdropChange={fetchDBSnapshot}
                  airdrops={airdrops}
                  users={users}
                  transactions={transactions}
                  settings={settings}
                  onUpdateSettings={setSettings}
                />
              </motion.div>
            )}

            {/* 3. Dashboard View */}
            {activeView === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="font-display font-extrabold text-2xl text-white">My Decentralized Portfolio</h2>
                  <button
                    onClick={() => setActiveView('explore')}
                    className="px-4 py-2 border border-white/10 bg-white/2 hover:bg-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ← Back to Explorer
                  </button>
                </div>

                {!connectedWallet ? (
                  <div className="py-24 text-center max-w-md mx-auto bg-black/10 border border-white/5 rounded-3xl p-8">
                    <span className="text-5xl block mb-4">🦊</span>
                    <h3 className="font-display font-bold text-white text-lg mb-2">Connect Wallet First</h3>
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      Please initialize and confirm your decentralized Web3 authentication on the home page before accessing private portfolios.
                    </p>
                    <button
                      onClick={() => setIsWalletModalOpen(true)}
                      className="px-6 py-3 rounded-xl bg-brand-primary text-white font-bold text-xs shadow-neon cursor-pointer"
                    >
                      Connect Wallet
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Welcome sidebar and score */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                      <div className="glass-panel rounded-2xl p-6 border border-white/5">
                        <span className="px-2.5 py-1 text-[10px] font-bold text-green-400 border border-green-500/20 bg-green-500/5 rounded-full uppercase">
                          Authorized Successfully
                        </span>
                        
                        <div className="mt-4">
                          <small className="text-gray-500 text-[10px] font-mono tracking-wider block">Wallet Index Address</small>
                          <code className="text-xs text-brand-secondary font-mono block mt-1 break-all select-all">{connectedWallet}</code>
                        </div>

                        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4 text-center">
                          <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                            <small className="text-gray-500 text-[9px] font-bold block uppercase mb-1">My Catalog Score</small>
                            <span className="text-lg font-bold text-brand-accent">{currentUser?.points || 20} pts</span>
                          </div>
                          <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                            <small className="text-gray-500 text-[9px] font-bold block uppercase mb-1">Platform Rank</small>
                            <span className="text-lg font-bold text-brand-secondary">#{currentUser?.rank || 12}</span>
                          </div>
                        </div>
                      </div>

                      {/* Referral setup */}
                      <div className="glass-panel rounded-2xl p-6 border border-white/5">
                        <h4 className="font-display font-bold text-white text-sm mb-2 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-brand-accent" />
                          <span>Dynamic Referral System</span>
                        </h4>
                        <p className="text-gray-400 text-xs mb-4 leading-normal">
                          Invite other Web3 explorers to connect and earn <strong className="text-brand-accent">+50 score points</strong> per connection.
                        </p>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            readOnly
                            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-mono text-gray-400 select-all"
                            value={`${window.location.origin}?ref=${connectedWallet.substring(2, 10)}`}
                          />
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}?ref=${connectedWallet.substring(2, 10)}`);
                              alert("Referral link copied!");
                            }}
                            className="p-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl text-xs transition-colors cursor-pointer"
                          >
                            Copy
                          </button>
                        </div>
                      </div>

                      {/* Withdrawal Portal Widget */}
                      <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
                        <h4 className="font-display font-bold text-white text-sm flex items-center gap-2">
                          <span>💳</span>
                          <span>Rewards Withdrawal Portal</span>
                        </h4>
                        <p className="text-gray-400 text-[11px] leading-relaxed">
                          Securely claim and convert your accrued campaign earnings into native cryptocurrency.
                        </p>

                        {/* Checklist */}
                        <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex flex-col gap-2.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 font-semibold">1. Airdrop Quests Participation ({activeUserJoinedCount}/{minAirdropsRequired})</span>
                            <span className={eligibilityHasJoinedMinQuests ? "text-green-400 font-bold" : "text-yellow-500 font-semibold"}>
                              {eligibilityHasJoinedMinQuests ? "✓ Completed" : "Pending"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 font-semibold">2. Minimum Withdrawal Balance (${minWithdrawAmount})</span>
                            <span className={eligibilityHasMinBalance ? "text-green-400 font-bold" : "text-yellow-500 font-semibold"}>
                              {eligibilityHasMinBalance ? "✓ Fulfilled" : `Pending (${currentUser?.pendingRewards || "$0"})`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 font-semibold">3. Mandatory Verification Steps</span>
                            <span className={eligibilityIsVerified ? "text-green-400 font-bold" : "text-yellow-500 font-semibold"}>
                              {eligibilityIsVerified ? "✓ Verified" : "Pending Points"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 font-semibold">4. Account Standing & System Audit</span>
                            <span className={currentUser?.status === 'active' ? "text-green-400 font-bold" : "text-red-500 font-semibold"}>
                              {currentUser?.status === 'active' ? "✓ Confirmed" : "Blocked"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-gray-500 font-semibold">5. Withdrawal Eligibility Status</span>
                            <span className={isWithdrawEligible ? "text-green-400 font-bold" : "text-yellow-500 font-semibold"}>
                              {isWithdrawEligible ? "✓ Unlocked" : "Locked"}
                            </span>
                          </div>
                        </div>

                        {/* Withdraw Trigger button */}
                        <button
                          id="dashboard-withdraw-btn"
                          disabled={!isWithdrawEligible}
                          onClick={() => setIsWithdrawModalOpen(true)}
                          className={`w-full py-3 rounded-xl font-display font-bold text-xs transition-all duration-300 uppercase tracking-wider ${
                            isWithdrawEligible
                              ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-neon cursor-pointer hover:opacity-95"
                              : "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
                          }`}
                        >
                          {settings.withdrawStatus === 'paused' ? "Withdrawals Paused" : "Request Payout"}
                        </button>
                      </div>
                    </div>

                    {/* Joined list and statistics */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      <div className="grid grid-cols-3 gap-4 text-left">
                        {/* Card 1: Available Balance */}
                        <div className="glass-panel rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                          <small className="text-gray-500 text-[10px] font-bold block uppercase tracking-wider">Available Balance</small>
                          <div className="mt-2 flex flex-col">
                            <span className="text-xl font-black font-display text-white tracking-tight">
                              ${totalAvailableUSD === 0 ? "0.00" : totalAvailableUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {/* Coin breakdown list */}
                            <div className="mt-1.5 flex flex-col gap-1">
                              {Object.entries(currentUser?.availableBalances || {}).filter(([_, val]) => (val as number) > 0).map(([coin, val]) => (
                                <span key={coin} className="text-[10px] font-mono text-brand-secondary font-bold flex items-center justify-between">
                                  <span>{coin}</span>
                                  <span>{coin === 'BTC' ? (val as number).toFixed(6) : coin === 'ETH' ? (val as number).toFixed(4) : (val as number).toFixed(2)}</span>
                                </span>
                              ))}
                              {Object.entries(currentUser?.availableBalances || {}).filter(([_, val]) => (val as number) > 0).length === 0 && (
                                <span className="text-[9px] text-gray-600 italic">No withdrawable funds</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card 2: Pending Balance */}
                        <div className="glass-panel rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                          <small className="text-gray-500 text-[10px] font-bold block uppercase tracking-wider">Pending Balance</small>
                          <div className="mt-2 flex flex-col">
                            <span className="text-xl font-black font-display text-yellow-400 tracking-tight">
                              ${totalPendingUSD === 0 ? "0.00" : totalPendingUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {/* Coin breakdown list */}
                            <div className="mt-1.5 flex flex-col gap-1">
                              {Object.entries(currentUser?.pendingBalances || {}).filter(([_, val]) => (val as number) > 0).map(([coin, val]) => (
                                <span key={coin} className="text-[10px] font-mono text-yellow-500/80 font-bold flex items-center justify-between">
                                  <span>{coin}</span>
                                  <span>{coin === 'BTC' ? (val as number).toFixed(6) : coin === 'ETH' ? (val as number).toFixed(4) : (val as number).toFixed(2)}</span>
                                </span>
                              ))}
                              {Object.entries(currentUser?.pendingBalances || {}).filter(([_, val]) => (val as number) > 0).length === 0 && (
                                <span className="text-[9px] text-gray-600 italic">No pending settlements</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Total Earnings */}
                        <div className="glass-panel rounded-2xl p-4 border border-white/5 relative overflow-hidden group">
                          <small className="text-gray-500 text-[10px] font-bold block uppercase tracking-wider">Total Earnings</small>
                          <div className="mt-2 flex flex-col">
                            <span className="text-xl font-black font-display text-brand-accent tracking-tight">
                              ${totalEarningsUSD === 0 ? "0.00" : totalEarningsUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            {/* Coin breakdown list */}
                            <div className="mt-1.5 flex flex-col gap-1">
                              {Object.entries(currentUser?.totalEarnings || {}).filter(([_, val]) => (val as number) > 0).map(([coin, val]) => (
                                <span key={coin} className="text-[10px] font-mono text-brand-accent/80 font-bold flex items-center justify-between">
                                  <span>{coin}</span>
                                  <span>{coin === 'BTC' ? (val as number).toFixed(6) : coin === 'ETH' ? (val as number).toFixed(4) : (val as number).toFixed(2)}</span>
                                </span>
                              ))}
                              {Object.entries(currentUser?.totalEarnings || {}).filter(([_, val]) => (val as number) > 0).length === 0 && (
                                <span className="text-[9px] text-gray-600 italic">No historical earnings</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Professional Empty State design when Available Balance is 0.00 */}
                      {totalAvailableUSD === 0 && (
                        <div id="portfolio-empty-state" className="glass-panel rounded-2xl p-6 border border-white/5 bg-white/[0.01] flex flex-col items-center justify-center text-center py-10 relative overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />
                          <div className="w-12 h-12 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-secondary text-xl mb-4 border border-brand-primary/15 animate-bounce">
                            💰
                          </div>
                          <h4 className="font-display font-bold text-white text-sm">Asset Portfolio Empty</h4>
                          <p className="text-xs text-gray-400 mt-2 max-w-md leading-relaxed">
                            Complete available high-reward campaigns and airdrops. Once verified by administrators, your available balance will automatically reflect here in real-time.
                          </p>
                          <button
                            onClick={() => {
                              const feedEl = document.getElementById("airdrops-feed-section");
                              if (feedEl) feedEl.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="mt-5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-bold text-white hover:text-brand-secondary transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
                          >
                            <span>Explore Active Airdrops</span>
                            <span>→</span>
                          </button>
                        </div>
                      )}

                      {/* Joined campaigns detail */}
                      <div className="glass-panel rounded-2xl p-6 border border-white/5">
                        <h4 className="font-display font-bold text-white text-sm mb-4">My Joined Web3 Quests</h4>

                        <div className="flex flex-col gap-3">
                          {(() => {
                            if (!currentUser) return null;
                            const userWalletLower = currentUser.walletAddress.toLowerCase();
                            
                            // Find all unique airdrops this user has either successfully joined or has transactions for
                            const involvedAirdrops = airdrops.filter((a) => {
                              const hasJoined = currentUser.joinedAirdrops.includes(a.id);
                              const hasTx = transactions.some(t => t.airdropId === a.id && t.walletAddress.toLowerCase() === userWalletLower);
                              return hasJoined || hasTx;
                            });

                            return involvedAirdrops.map((a) => {
                              // Find newest transaction for this airdrop by this user
                              const tx = [...transactions]
                                .filter(t => t.airdropId === a.id && t.walletAddress.toLowerCase() === userWalletLower)
                                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

                              // If payment review is disabled, it is success
                              const isReviewOn = settings.enablePaymentRequirement !== false;
                              const status = tx ? tx.status : (currentUser.joinedAirdrops.includes(a.id) ? "success" : "pending");

                              return (
                                <div
                                  key={a.id}
                                  className="p-4 rounded-xl border border-white/5 bg-black/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="text-2xl">{a.logo}</span>
                                    <div>
                                      <strong className="text-xs text-white block">{a.name}</strong>
                                      <span className="text-[10px] font-mono text-brand-secondary block">{a.blockchain}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                    <span className="text-xs font-bold text-brand-accent">{a.reward}</span>
                                    
                                    {status === "pending" && isReviewOn ? (
                                      <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1">
                                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                                          <span>Pending Approval</span>
                                        </span>
                                        <button
                                          disabled
                                          className="px-3 py-1.5 bg-white/5 border border-white/5 text-gray-500 text-[10px] font-bold rounded-lg cursor-not-allowed"
                                          title="Claim is locked until transaction is verified"
                                        >
                                          Locked
                                        </button>
                                      </div>
                                    ) : status === "rejected" && isReviewOn ? (
                                      <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold rounded-lg uppercase">
                                          Declined
                                        </span>
                                        <button
                                          onClick={() => {
                                            setJoiningAirdrop(a);
                                            setJoinStep('network_select');
                                          }}
                                          className="px-3 py-1.5 bg-brand-primary text-white text-[10px] font-bold rounded-lg flex items-center gap-1 hover:opacity-90 cursor-pointer"
                                        >
                                          <span>Retry Pay</span>
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold rounded-lg uppercase">
                                          Approved
                                        </span>
                                        <a
                                          href={a.joinUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="px-3 py-1.5 bg-white/5 border border-white/5 text-gray-300 hover:text-white text-[10px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                                        >
                                          <span>Tasks</span>
                                          <ArrowUpRight className="w-3.5 h-3.5" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            });
                          })()}

                          {activeUserJoinedCount === 0 && !transactions.some(t => t.walletAddress.toLowerCase() === currentUser?.walletAddress.toLowerCase()) && (
                            <div className="py-12 text-center text-gray-500 text-xs">
                              You have not logged any completed join signatures yet on this session catalog.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. Exporter View */}
            {activeView === 'exporter' && (
              <motion.div
                key="exporter"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6 flex justify-between items-center">
                  <h2 className="font-display font-extrabold text-2xl text-white">PHP Code Exporter</h2>
                  <button
                    onClick={() => setActiveView('explore')}
                    className="px-4 py-2 border border-white/10 bg-white/2 hover:bg-white/5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    ← Back to Explorer
                  </button>
                </div>
                
                <PhpExporter />
              </motion.div>
            )}

          </AnimatePresence>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/5 bg-black/40 mt-20 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 text-center md:text-left">
            
            <div className="md:col-span-6 flex flex-col items-center md:items-start gap-3">
              <span className="text-4xl">📦</span>
              <h4 className="font-display font-black text-xl text-white">Crytobox Discovery Platform</h4>
              <p className="text-gray-500 text-xs leading-relaxed max-w-md">
                {settings.footerText}
              </p>
            </div>

            <div className="md:col-span-3">
              <h5 className="font-display font-bold text-gray-400 text-xs uppercase tracking-wider mb-4">Core Directory</h5>
              <ul className="flex flex-col gap-2.5 text-xs text-gray-500">
                <li>
                  <a
                    href="#explore"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView('explore');
                      setTimeout(() => document.getElementById("explore")?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Verified Airdrops
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView('explore');
                      setTimeout(() => document.getElementById("about")?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Core Audit Mission
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView('explore');
                      setTimeout(() => document.getElementById("faq")?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Platform FAQs
                  </a>
                </li>
                <li>
                  <a
                    href="#foundation"
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveView('explore');
                      setTimeout(() => document.getElementById("foundation")?.scrollIntoView({ behavior: 'smooth' }), 100);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Foundation Leadership
                  </a>
                </li>
              </ul>
            </div>

            <div className="md:col-span-3">
              <h5 className="font-display font-bold text-gray-400 text-xs uppercase tracking-wider mb-4">Support Channels</h5>
              <div className="flex flex-col gap-3 items-center md:items-start text-xs text-gray-500">
                <a href={settings.telegramLink} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <span>Telegram Hub</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <a href={settings.twitterLink} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <span>Twitter Portal</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
                <a href={settings.discordLink} target="_blank" rel="noreferrer" className="hover:text-white flex items-center gap-1.5 transition-colors">
                  <span>Discord server</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

          </div>

          <hr className="border-white/5 my-8" />

          <p className="text-center text-gray-600 text-[10px] font-mono leading-relaxed">
            © 2026 {settings.siteName}. Designed and optimized for direct shared hosting (InfinityFree/ProFreeHost) deployments. All on-chain simulations remain non-custodial and secure.
          </p>
        </div>
      </footer>

      {/* Dynamic Interaction Modals */}

      {/* A. Wallet Connection Overlay */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
        onConnect={handleWalletConnect}
      />

      {/* B. Detailed Airdrop Inspection Drawer */}
      {selectedAirdropDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl h-full bg-brand-bg border-l border-white/5 rounded-l-3xl p-6 sm:p-8 overflow-y-auto relative animate-slideLeft flex flex-col justify-between shadow-glass">
            <div>
              {/* Header */}
              <div className="flex justify-between items-start mb-6 border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <span className="flex items-center justify-center text-4xl w-16 h-16 rounded-2xl bg-black/30 border border-white/5">
                    {selectedAirdropDetail.logo}
                  </span>
                  <div>
                    <span className="px-2 py-0.5 text-[9px] font-mono font-bold text-brand-secondary border border-brand-secondary/30 bg-brand-secondary/5 rounded-full uppercase">
                      {selectedAirdropDetail.blockchain} Network
                    </span>
                    <h3 className="font-display font-bold text-2xl text-white mt-1">{selectedAirdropDetail.name}</h3>
                  </div>
                </div>
                <button
                  id="close-drawer-btn"
                  onClick={() => setSelectedAirdropDetail(null)}
                  className="px-3 py-1.5 rounded-lg border border-white/5 bg-white/2 hover:text-white hover:bg-white/5 text-gray-400 text-xs font-semibold cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>

              {/* Description */}
              <p className="text-gray-400 text-sm leading-relaxed mb-8">{selectedAirdropDetail.description}</p>

              {/* Steps */}
              <h4 className="font-display font-bold text-white text-sm mb-4">Task Walkthrough Guidance</h4>
              <div className="flex flex-col gap-3 mb-8">
                {selectedAirdropDetail.detailedSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-black/20 border border-white/5">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-primary text-white text-xs font-bold font-mono">
                      {index + 1}
                    </span>
                    <p className="text-xs text-gray-300 leading-normal pt-0.5">{step}</p>
                  </div>
                ))}
              </div>

              {/* Requirements Checklist */}
              <h4 className="font-display font-bold text-white text-sm mb-3">Pre-requisite criteria</h4>
              <ul className="text-xs text-gray-400 space-y-2 list-disc pl-4 mb-8">
                {selectedAirdropDetail.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
                <li>Web3 non-custodial browser wallet</li>
                <li>Native network gas balance to cover execution</li>
              </ul>
            </div>

            {/* Action buttons */}
            <div className="pt-6 border-t border-white/5 flex gap-4">
              <button
                id="drawer-fav-btn"
                onClick={() => handleToggleFavorite(selectedAirdropDetail.id)}
                className={`flex-1 py-3.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  favorites.includes(selectedAirdropDetail.id)
                    ? "border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/15"
                    : "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                {favorites.includes(selectedAirdropDetail.id) ? "Saved in Favorites ♥" : "Add to Favorites"}
              </button>
              <button
                id="drawer-join-btn"
                onClick={() => {
                  const item = selectedAirdropDetail;
                  setSelectedAirdropDetail(null);
                  handleJoinInitiate(item);
                }}
                className="flex-1 py-3.5 rounded-xl bg-brand-primary text-white text-xs font-bold shadow-neon hover:opacity-95 cursor-pointer text-center"
              >
                Verify & Join Campaign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. Join Web3 Authorization Modal */}
      {joiningAirdrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl glass-panel border border-white/10 p-6 shadow-glass relative text-left max-h-[88vh] flex flex-col">
            
            {/* Header / Title */}
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="font-display font-extrabold text-white text-lg">Join This Airdrop</h3>
              </div>
              <button
                id="close-join-modal-btn"
                onClick={() => setJoiningAirdrop(null)}
                className="text-gray-400 hover:text-white hover:bg-white/5 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Stepper indicators */}
            <div className="grid grid-cols-4 gap-2 mb-4 flex-shrink-0">
              {[
                { label: "1. Network", key: "network_select" },
                { label: "2. Payment", key: "payment_details" },
                { label: "3. Verify Proof", key: "upload_proof" },
                { label: "4. Status", key: "success" }
              ].map((st, i) => {
                const steps = ["network_select", "payment_details", "upload_proof", "success"];
                const activeIndex = steps.indexOf(joinStep);
                const isCompleted = i < activeIndex;
                const isActive = joinStep === st.key;
                
                return (
                  <div key={st.key} className="flex flex-col gap-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCompleted ? "bg-brand-primary" : isActive ? "bg-brand-accent animate-pulse" : "bg-white/5"
                    }`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider hidden sm:inline ${
                      isActive ? "text-brand-accent" : isCompleted ? "text-brand-primary" : "text-gray-500"
                    }`}>
                      {st.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Scrollable Step Content */}
            <div className="overflow-y-auto pr-1 flex-1 custom-scrollbar space-y-4">

            {/* Step 1: Network Selection */}
            {joinStep === 'network_select' && (() => {
              const enabledNetworks = (settings.paymentNetworks || []).length > 0
                ? settings.paymentNetworks!.filter(n => n.enabled)
                : [
                    { id: "usdt-erc20", coin: "USDT", network: "ERC20", address: settings.usdtAddress || "0x4ed2338188d0e2e3b460a108274cb1d79a332d37", enabled: true },
                    { id: "usdt-trc20", coin: "USDT", network: "TRC20", address: "TX7yLgJv9XW2gE7FmEdfaPzU89sCdEf21A", enabled: true },
                    { id: "usdt-bep20", coin: "USDT", network: "BEP20", address: settings.usdtAddress || "0x4ed2338188d0e2e3b460a108274cb1d79a332d37", enabled: true },
                    { id: "eth-mainnet", coin: "ETH", network: "Ethereum Mainnet", address: settings.ethAddress || "0x96B217983637e12763321528b9A26A207d5D66D5", enabled: true },
                    { id: "bnb-bsc", coin: "BNB", network: "BNB Smart Chain", address: settings.bnbAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", enabled: true },
                    { id: "btc-native", coin: "BTC", network: "BTC Network", address: settings.btcAddress || "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", enabled: true }
                  ].filter(n => n.enabled);

              const availableCoins = Array.from(new Set(enabledNetworks.map(n => n.coin)));

              return (
                <div>
                  <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                    Select your preferred payment asset. Each coin has specific receiving wallet configurations.
                  </p>

                  {/* Coin Selection Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {[
                      { id: "USDT", name: "Tether USD", logo: "🟢", desc: "USDT Stablecoin" },
                      { id: "ETH", name: "Ethereum", logo: "🔷", desc: "ETH Currency" },
                      { id: "BNB", name: "BNB Token", logo: "🟡", desc: "BNB Smart Chain" },
                      { id: "BTC", name: "Bitcoin", logo: "🟠", desc: "BTC Network" }
                    ].map((coin) => {
                      const isSupported = availableCoins.includes(coin.id) && (!settings.supportedNetworks || settings.supportedNetworks.length === 0 || settings.supportedNetworks.includes(coin.id));
                      const isSelected = selectedCoin === coin.id;

                      return (
                        <button
                          key={coin.id}
                          disabled={!isSupported}
                          onClick={() => {
                            setSelectedCoin(coin.id as any);
                            const filtered = enabledNetworks.filter(n => n.coin === coin.id);
                            if (filtered.length === 1) {
                              setSelectedNetwork(filtered[0]);
                            } else {
                              setSelectedNetwork(null);
                            }
                          }}
                          className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between h-24 relative transition-all duration-200 ${
                            !isSupported 
                              ? "opacity-30 cursor-not-allowed border-white/5 bg-black/10" 
                              : isSelected 
                                ? "border-brand-accent bg-brand-accent/5 ring-1 ring-brand-accent/30" 
                                : "border-white/5 bg-black/40 hover:bg-black/20 hover:border-white/10 cursor-pointer"
                          }`}
                        >
                          <div className="flex justify-between items-start w-full">
                            <span className="text-xl">{coin.logo}</span>
                            {isSelected && (
                              <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
                            )}
                          </div>
                          <div>
                            <span className="text-white text-xs font-bold block">{coin.name}</span>
                            <span className="text-[10px] text-gray-500 block font-medium">{coin.id} standard</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Network selection if multiple networks exist for selected coin */}
                  {selectedCoin && enabledNetworks.filter(n => n.coin === selectedCoin).length > 1 && (
                    <div className="bg-black/20 border border-white/5 rounded-2xl p-4 mb-5 animate-fadeIn">
                      <span className="text-gray-400 text-[10px] uppercase font-bold tracking-wider block mb-2">Select Network Standard for {selectedCoin}</span>
                      <div className="grid grid-cols-2 gap-2">
                        {enabledNetworks.filter(n => n.coin === selectedCoin).map((net) => {
                          const isNetSelected = selectedNetwork?.id === net.id;
                          return (
                            <button
                              key={net.id}
                              type="button"
                              onClick={() => setSelectedNetwork(net)}
                              className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                isNetSelected
                                  ? "bg-brand-accent text-brand-bg border-brand-accent font-extrabold shadow-neon"
                                  : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
                              }`}
                            >
                              {net.network}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      disabled={!selectedCoin || !selectedNetwork}
                      onClick={() => setJoinStep('payment_details')}
                      className={`px-5 py-3 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1 cursor-pointer ${
                        selectedCoin && selectedNetwork
                          ? "bg-brand-primary text-white shadow-neon hover:opacity-95" 
                          : "bg-white/5 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <span>Next: Payment Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Step 2: Payment Details */}
            {joinStep === 'payment_details' && selectedCoin && selectedNetwork && (
              <div>
                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-4 flex items-center gap-3">
                  <span className="text-3xl">
                    {selectedCoin === "USDT" ? "🟢" : selectedCoin === "ETH" ? "🔷" : selectedCoin === "BNB" ? "🟡" : "🟠"}
                  </span>
                  <div>
                    <span className="text-xs text-gray-400 block font-semibold">Selected Token Network:</span>
                    <strong className="text-white text-sm block uppercase">{selectedCoin} ({selectedNetwork.network})</strong>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-6 mb-6">
                  {/* Left Column - Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Receiving Wallet Address</span>
                      <div className="flex items-center gap-2">
                        <div className="bg-black/50 border border-white/5 rounded-xl p-3 font-mono text-[11px] text-brand-secondary select-all break-all flex-1">
                          {selectedNetwork.address}
                        </div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(selectedNetwork.address);
                            setCopiedAddress(true);
                            setTimeout(() => setCopiedAddress(false), 2000);
                          }}
                          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-colors cursor-pointer text-gray-300 hover:text-white flex-shrink-0"
                          title="Copy Address"
                        >
                          {copiedAddress ? <Check className="w-4 h-4 text-brand-accent" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1">Required Fee</span>
                      <div className="text-lg font-bold text-white flex items-center gap-1.5 font-display">
                        <Coins className="w-5 h-5 text-brand-accent" />
                        <span>{joiningAirdrop.claimFee !== undefined && joiningAirdrop.claimFee !== null ? joiningAirdrop.claimFee : settings.joinFee}</span>
                        <span className="text-brand-secondary text-xs uppercase font-mono">{selectedCoin}</span>
                      </div>
                    </div>

                    <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-3.5 flex items-start gap-2.5 text-left">
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-[10px] text-gray-400 leading-normal">
                        <strong>Network Transfer Rule:</strong> Please transfer the required fee to the receiving address above. Proof of blockchain verification is required to complete the catalog footprint.
                      </p>
                    </div>
                  </div>

                  {/* Right Column - QR Code (Generated or Custom URL/Base64) */}
                  <div className="flex flex-col items-center justify-center p-4 bg-black/30 border border-white/5 rounded-2xl w-full md:w-44 text-center">
                    <div className="bg-white p-2 rounded-xl mb-2 shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                      <img
                        referrerPolicy="no-referrer"
                        src={selectedNetwork.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=8&data=${encodeURIComponent(selectedNetwork.address)}`}
                        alt="Receiving Wallet QR"
                        className="w-28 h-28 select-none"
                      />
                    </div>
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">
                      {selectedNetwork.qrCode ? "Official Admin QR" : "Auto QR Assigned"}
                    </span>
                  </div>
                </div>

                {/* Optional Wallet Experience Integrator */}
                {connectedWalletType && (
                  <div className="border border-white/5 bg-white/2 rounded-2xl p-4 mb-6">
                    <h5 className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-2 flex items-center gap-1">
                      <span>🛡️</span>
                      <span>Connected Wallet Experience ({connectedWalletType})</span>
                    </h5>
                    <p className="text-gray-400 text-[11px] mb-3">
                      Your non-custodial {connectedWalletType} is logged. You can authorize the transfer directly or input the verification proof manually below.
                    </p>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsSimulatedWalletPaying(true);
                        handleJoinConfirm();
                      }}
                      className="w-full py-2.5 bg-brand-accent/15 border border-brand-accent/30 hover:bg-brand-accent/25 hover:border-brand-accent/50 text-brand-accent text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 animate-spin-slow" />
                      <span>⚡ Pay Fee via Connected {connectedWalletType}</span>
                    </button>
                  </div>
                )}

                <div className="flex justify-between gap-3 mt-6 border-t border-white/5 pt-4">
                  <button
                    onClick={() => setJoinStep('network_select')}
                    className="px-4 py-2.5 rounded-xl border border-white/5 text-gray-400 hover:text-white text-xs font-semibold hover:bg-white/5 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setJoinStep('upload_proof')}
                    className="px-5 py-3 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-neon hover:opacity-95 cursor-pointer flex items-center gap-1"
                  >
                    <span>Verify Proof of Transaction</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Upload Proof */}
            {joinStep === 'upload_proof' && selectedCoin && (
              <div>
                {isSubmittingProof ? (
                  <div className="py-12 text-center flex flex-col items-center">
                    <div className="relative flex items-center justify-center mb-6">
                      <div className="w-14 h-14 rounded-full border-t-2 border-r-2 border-brand-secondary animate-spin" />
                      <span className="absolute text-xl">🛡️</span>
                    </div>
                    <h4 className="font-display font-bold text-white text-base mb-1 text-center">
                      {submittingStep === 1 && "Verifying Block Confirmation..."}
                      {submittingStep === 2 && "Verifying Transaction Proof..."}
                      {submittingStep === 3 && "Creating Non-Custodial Catalog Index..."}
                    </h4>
                    <p className="text-gray-500 text-xs">Awaiting ledger consensus. This takes just a few seconds.</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-400 text-xs mb-4 leading-relaxed">
                      Submit proof of the transfer to allow the review team to confirm your eligibility. Your catalog point multipliers will activate instantly.
                    </p>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1.5">Transaction ID / TxHash</label>
                        <input
                          type="text"
                          value={proofTxId}
                          onChange={(e) => setProofTxId(e.target.value)}
                          placeholder="e.g. 0x7a8d...f39a"
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-brand-secondary"
                        />
                      </div>

                      <div>
                        <label className="text-gray-500 text-[10px] uppercase font-bold tracking-wider block mb-1.5">Upload Screenshot (TX confirmation or receipt)</label>
                        
                        {proofScreenshot ? (
                          <div className="relative border border-white/10 rounded-2xl p-4 bg-black/40 flex flex-col items-center justify-center text-center">
                            <img
                              referrerPolicy="no-referrer"
                              src={proofScreenshot}
                              alt="Upload preview"
                              className="w-full max-h-32 object-contain rounded-lg mb-2.5"
                            />
                            <div className="text-xs text-brand-secondary font-semibold font-mono truncate max-w-xs mb-2">
                              {proofFile ? proofFile.name : "Screenshot attached"}
                            </div>
                            <button
                              onClick={() => {
                                setProofFile(null);
                                setProofScreenshot(null);
                              }}
                              className="text-[10px] font-bold text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 bg-red-500/5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Remove Screenshot
                            </button>
                          </div>
                        ) : (
                          <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                const file = e.dataTransfer.files[0];
                                setProofFile(file);
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setProofScreenshot(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            onClick={() => {
                              const fileInput = document.getElementById("proof-file-input");
                              fileInput?.click();
                            }}
                            className="border border-dashed border-white/10 rounded-2xl p-6 bg-black/20 hover:bg-white/5 transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
                          >
                            <input
                              id="proof-file-input"
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  setProofFile(file);
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setProofScreenshot(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                            <Upload className="w-8 h-8 text-gray-500 group-hover:text-white transition-colors mb-2" />
                            <span className="text-xs text-gray-300 font-semibold block mb-1">Drag & Drop Screenshot</span>
                            <span className="text-[10px] text-gray-500">Supports JPG, PNG formats up to 10MB</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between gap-3 mt-6 border-t border-white/5 pt-4">
                      <button
                        onClick={() => setJoinStep('payment_details')}
                        className="px-4 py-2.5 rounded-xl border border-white/5 text-gray-400 hover:text-white text-xs font-semibold hover:bg-white/5 cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        disabled={proofTxId.trim().length < 8 && !proofScreenshot}
                        onClick={handleSubmitProof}
                        className={`px-5 py-3 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-1.5 uppercase tracking-wider ${
                          proofTxId.trim().length >= 8 || proofScreenshot
                            ? "bg-brand-accent text-brand-bg shadow-neon hover:opacity-95 cursor-pointer"
                            : "bg-white/5 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Submit & Verify Proof</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Success */}
            {joinStep === 'success' && (
              <div className="text-center py-6">
                <div className="relative inline-flex items-center justify-center mb-6">
                  {/* Floating particles effect */}
                  <div className="absolute inset-0 bg-brand-accent/20 rounded-full blur-xl scale-125 animate-pulse" />
                  <div className="w-16 h-16 rounded-full bg-brand-accent flex items-center justify-center text-brand-bg text-3xl font-extrabold shadow-[0_0_25px_rgba(0,240,255,0.4)] relative">
                    ✓
                  </div>
                </div>

                <h4 className="font-display font-extrabold text-white text-xl mb-3 tracking-tight">🎉 Congratulations!</h4>
                
                {claimedRewardInfo && (
                  <div className="bg-brand-secondary/10 border border-brand-secondary/30 rounded-2xl p-4 mb-4 text-center">
                    <span className="text-[11px] text-gray-300 font-bold block uppercase tracking-wider mb-1">Generated & Claimed Reward:</span>
                    <span className="text-2xl font-extrabold text-brand-secondary font-mono block">
                      +${claimedRewardInfo.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {claimedRewardInfo.coin}
                    </span>
                    <span className="text-[11px] text-green-400 font-semibold block mt-1">
                      ✓ Reflected live in your website balance
                    </span>
                  </div>
                )}

                <div className="bg-black/30 border border-white/5 rounded-2xl p-4.5 text-xs text-gray-300 leading-relaxed text-left space-y-2 mb-6">
                  <p>
                    Your request to join this airdrop has been submitted successfully.
                  </p>
                  <p>
                    Thank you for participating. Your submission will be reviewed, and once the airdrop campaign has ended and your eligibility is confirmed, your reward will be distributed according to the project's schedule.
                  </p>
                </div>

                {proofTxId && (
                  <div className="p-3 bg-black/40 border border-white/5 rounded-xl font-mono text-[10px] text-gray-500 mb-6 text-left select-all break-all">
                    <span className="block text-[9px] text-gray-600 font-bold uppercase mb-0.5">Assigned Ledger TxHash:</span>
                    <span>{proofTxId}</span>
                  </div>
                )}

                <button
                  id="done-join-modal-btn"
                  onClick={() => {
                    setJoiningAirdrop(null);
                    setJoinStep('network_select');
                  }}
                  className="w-full py-3.5 bg-brand-primary text-white text-xs font-extrabold rounded-xl shadow-neon hover:opacity-95 transition-all cursor-pointer uppercase tracking-wider"
                >
                  Done
                </button>
              </div>
            )}
            </div>

          </div>
        </div>
      )}

      {/* MetaMask Simulated Extension Popup Modal */}
      {showMetaMask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-[360px] h-[580px] rounded-3xl bg-[#0e0f11] border border-white/10 flex flex-col justify-between overflow-hidden shadow-[0_24px_64px_rgba(0,0,0,0.85)] relative font-sans text-white select-none">
            
            {/* 1. Header Bar */}
            <div className="bg-[#1e2025] px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <svg className="w-5 h-5 text-[#f6851b]" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 11.52c0-.52-.36-.97-.86-1.09l-3.37-.84.71-2.14c.16-.48-.09-1-.56-1.16-.48-.16-1 .09-1.16.56l-.8 2.4-2.83-2.83c-.39-.39-1.02-.39-1.41 0L9.48 8.82l-.8-2.4c-.16-.48-.68-.73-1.16-.56-.48.16-.73.68-.56 1.16l.71 2.14-3.37.84c-.5.12-.86.57-.86 1.09v.09c0 .48.31.9.77 1.02l4.89 1.22c.24.06.49-.03.65-.22l2.25-2.81 2.25 2.81c.16.2.41.28.65.22l4.89-1.22c.46-.12.77-.54.77-1.02v-.09z"/>
                  <path d="M12 14c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" fill="#fff"/>
                </svg>
                <span className="font-bold text-[11px] text-gray-300 tracking-wider font-sans uppercase">MetaMask</span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <button onClick={handleMetaMaskCancel} className="hover:text-white transition-colors cursor-pointer">
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button className="hover:text-white transition-colors cursor-pointer">
                  <Square className="w-3 h-3" />
                </button>
                <button onClick={handleMetaMaskCancel} className="hover:text-white transition-colors cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. Account Header */}
            <div className="px-4 py-3 bg-[#111214] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-orange-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow">
                  A1
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-semibold text-gray-200">Account 1</span>
                  <span className="block text-[9px] text-gray-500 font-mono">
                    {connectedWallet ? `${connectedWallet.slice(0, 6)}...${connectedWallet.slice(-4)}` : "0x00...0000"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-gray-400">
                <Info className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-colors" />
                <Settings className="w-3.5 h-3.5 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>

            {/* 3. Steps Body */}
            <div className="flex-1 p-5 flex flex-col justify-between bg-[#0e0f11] overflow-y-auto">
              {metaMaskStep === 'deploy' && (
                <div className="flex flex-col h-full justify-between">
                  <div>
                    <div className="text-center mt-2 mb-6">
                      <h4 className="font-display font-extrabold text-white text-lg tracking-tight">Deploy a contract</h4>
                      <p className="text-gray-400 text-xs mt-1">This site wants you to deploy a contract</p>
                    </div>

                    {/* Estimated changes box */}
                    <div className="bg-[#141619] border border-white/5 rounded-2xl p-3.5 flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1 text-gray-400 text-xs">
                        <span>Estimated changes</span>
                        <HelpCircle className="w-3 h-3" />
                      </div>
                      <span className="text-gray-400 text-xs font-semibold">No changes</span>
                    </div>

                    {/* Transaction details card */}
                    <div className="bg-[#141619] border border-white/5 rounded-2xl overflow-hidden text-xs">
                      <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
                        <span className="text-gray-400">Request from</span>
                        <span className="text-brand-secondary font-medium tracking-tight">
                          {window.location.host || "remix.ethereum.org"}
                        </span>
                      </div>
                      <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
                        <span className="text-gray-400">Network fee</span>
                        <div className="flex items-center gap-1.5 font-mono font-bold text-white">
                          <span className="text-brand-accent">
                            {(joiningAirdrop?.claimFee !== undefined && joiningAirdrop?.claimFee !== null) ? joiningAirdrop.claimFee : settings.joinFee} ETH
                          </span>
                        </div>
                      </div>
                      <div className="p-3.5 flex items-center justify-between text-gray-400">
                        <span>Speed</span>
                        <div className="flex items-center gap-1 text-[11px] text-brand-accent">
                          <Globe className="w-3 h-3" />
                          <span>Site suggested ~12 sec</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-3 pt-6 mt-auto">
                    <button
                      id="metamask-cancel-btn"
                      onClick={handleMetaMaskCancel}
                      className="flex-1 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-full text-xs font-bold transition-all cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      id="metamask-confirm-btn"
                      onClick={handleMetaMaskConfirm}
                      className="flex-1 py-3 bg-white text-black hover:bg-white/90 rounded-full text-xs font-extrabold shadow-md transition-all cursor-pointer text-center"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              {metaMaskStep === 'submitted' && (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-[#037dd6]/10 border border-[#037dd6]/20 flex items-center justify-center mb-6 animate-pulse text-[#037dd6]">
                    <Send className="w-7 h-7 transform -rotate-45" />
                  </div>
                  <h4 className="font-display font-extrabold text-white text-base mb-2">Your transaction was submitted</h4>
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-[#037dd6] hover:underline text-xs font-semibold block mb-2">
                    View transaction
                  </a>
                  <p className="text-gray-500 text-[10px]">You may close this window anytime.</p>
                  
                  <button
                    disabled
                    className="w-full py-3 bg-white/5 text-gray-500 rounded-full text-xs font-bold mt-auto cursor-not-allowed text-center"
                  >
                    Close extension
                  </button>
                </div>
              )}

              {metaMaskStep === 'complete' && (
                <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                  <div className="w-16 h-16 rounded-full bg-[#037dd6] flex items-center justify-center mb-6 text-white shadow-[0_0_25px_rgba(3,125,214,0.4)] animate-bounce">
                    <Check className="w-8 h-8 stroke-[3px]" />
                  </div>
                  <h4 className="font-display font-extrabold text-white text-base mb-1">Your transaction is complete</h4>
                  {claimedRewardInfo && (
                    <div className="my-2 p-2.5 bg-green-500/10 border border-green-500/30 rounded-xl text-center w-full">
                      <span className="text-[10px] text-gray-300 font-bold block uppercase">Claimed Reward:</span>
                      <span className="text-lg font-bold text-green-400 font-mono">
                        +${claimedRewardInfo.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {claimedRewardInfo.coin}
                      </span>
                    </div>
                  )}
                  <a href="#" onClick={(e) => e.preventDefault()} className="text-[#037dd6] hover:underline text-xs font-semibold block mb-8">
                    View transaction
                  </a>
                  
                  <button
                    id="metamask-close-btn"
                    onClick={handleMetaMaskClose}
                    className="w-full py-3 bg-[#037dd6] text-white hover:bg-[#037dd6]/90 rounded-full text-xs font-extrabold shadow-md transition-all cursor-pointer text-center"
                  >
                    Close extension
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* D. Cookie Banner */}
      {!cookieAccepted && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-40 max-w-sm glass-panel border border-white/10 rounded-2xl p-5 shadow-glass animate-fadeIn">
          <h5 className="font-display font-bold text-white text-xs mb-1.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-secondary" />
            <span>Web3 Cookies & Tracking Notice</span>
          </h5>
          <p className="text-gray-400 text-[11px] leading-relaxed mb-4">
            We employ non-custodial metadata state tracking to log wallet catalogs. No password credentials or personal information are collected.
          </p>
          <div className="flex gap-2">
            <button
              id="cookie-deny-btn"
              onClick={() => setCookieAccepted(true)}
              className="flex-1 py-1.5 rounded-lg border border-white/5 text-gray-500 hover:text-white text-[10px] transition-colors cursor-pointer"
            >
              Decline
            </button>
            <button
              id="cookie-accept-btn"
              onClick={handleAcceptCookie}
              className="flex-1 py-1.5 rounded-lg bg-brand-primary text-white text-[10px] font-bold transition-all cursor-pointer text-center"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}

      {/* E. Secured Withdrawal Modal */}
      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => setIsWithdrawModalOpen(false)}
        currentUser={currentUser}
        settings={settings}
        onSuccess={fetchDBSnapshot}
      />

    </div>
  );
}
