/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Airdrop, User, Transaction, SystemSettings, PaymentNetwork, SecurityLog } from "../types";
import {
  Sparkles,
  Lock,
  Plus,
  Trash,
  Settings,
  ShieldCheck,
  AlertOctagon,
  UserCheck,
  Coins,
  Cpu,
  RefreshCw,
  Search,
  Check,
  AlertCircle,
  Edit,
  Eye,
  ShieldAlert,
  Activity,
  FileText
} from "lucide-react";

interface AdminPanelProps {
  onAirdropChange: () => void;
  airdrops: Airdrop[];
  users: User[];
  transactions: Transaction[];
  settings: SystemSettings;
  onUpdateSettings: (settings: SystemSettings) => void;
}

export default function AdminPanel({
  onAirdropChange,
  airdrops,
  users,
  transactions,
  settings,
  onUpdateSettings,
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'stats' | 'airdrops' | 'users' | 'settings' | 'wallet_config' | 'withdrawals' | 'security'>('stats');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState("");

  // Security Panel States
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [isLoadingSecurityLogs, setIsLoadingSecurityLogs] = useState(false);
  const [securitySearch, setSecuritySearch] = useState("");
  const [securitySeverityFilter, setSecuritySeverityFilter] = useState<string>("all");
  const [securityEventFilter, setSecurityEventFilter] = useState<string>("all");
  const [securityViewMode, setSecurityViewMode] = useState<'wallet_data_option' | 'standard'>('wallet_data_option');
  const [selectedLogDetail, setSelectedLogDetail] = useState<SecurityLog | null>(null);
  const [showAddLogModal, setShowAddLogModal] = useState(false);

  const [newLogTitle, setNewLogTitle] = useState("");
  const [newLogDetails, setNewLogDetails] = useState("");
  const [newLogWallet, setNewLogWallet] = useState("");
  const [newLogSeverity, setNewLogSeverity] = useState<'info' | 'warning' | 'error' | 'critical'>("info");
  const [newLogEventType, setNewLogEventType] = useState<string>("security_event");

  const fetchSecurityLogs = async () => {
    setIsLoadingSecurityLogs(true);
    try {
      const res = await fetch('/api/security-logs');
      if (res.ok) {
        const data = await res.json();
        setSecurityLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch security logs:", e);
    } finally {
      setIsLoadingSecurityLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'security') {
      fetchSecurityLogs();
    }
  }, [activeTab]);

  const handleAddSecurityLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogTitle.trim() || !newLogDetails.trim()) {
      alert("Please enter title and details for the security event.");
      return;
    }

    try {
      const res = await fetch('/api/security-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newLogTitle,
          details: newLogDetails,
          actorWallet: newLogWallet,
          severity: newLogSeverity,
          eventType: newLogEventType
        })
      });

      if (res.ok) {
        setNewLogTitle("");
        setNewLogDetails("");
        setNewLogWallet("");
        setShowAddLogModal(false);
        fetchSecurityLogs();
      } else {
        alert("Failed to record security log entry.");
      }
    } catch (err) {
      console.error(err);
      alert("Error recording security log.");
    }
  };

  const handleDeleteSecurityLog = async (id: string) => {
    if (confirm("Are you sure you want to delete this security log record?")) {
      try {
        const res = await fetch(`/api/security-logs/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchSecurityLogs();
          if (selectedLogDetail?.id === id) setSelectedLogDetail(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClearAllSecurityLogs = async () => {
    if (confirm("Are you sure you want to clear all recorded security logs?")) {
      try {
        const res = await fetch('/api/security-logs/all', { method: 'DELETE' });
        if (res.ok) {
          fetchSecurityLogs();
          setSelectedLogDetail(null);
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const [selectedTxScreenshot, setSelectedTxScreenshot] = useState<string | null>(null);

  const handleUpdateTransactionStatus = async (id: string, status: 'success' | 'rejected') => {
    try {
      const res = await fetch(`/api/transactions/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Transaction updated to ${status === 'success' ? 'Approved' : 'Rejected'} successfully!`);
        onAirdropChange(); // refresh snapshot data
      } else {
        alert("Failed to update transaction status.");
      }
    } catch (e) {
      console.error(e);
      alert("Error updating transaction status.");
    }
  };

  // Withdrawal system states
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [withdrawEnabled, setWithdrawEnabled] = useState(settings.withdrawEnabled !== false);
  const [minWithdrawAmount, setMinWithdrawAmount] = useState(settings.minWithdrawAmount || 50);
  const [maxWithdrawAmount, setMaxWithdrawAmount] = useState(settings.maxWithdrawAmount || 5000);
  const [withdrawStatus, setWithdrawStatus] = useState(settings.withdrawStatus || 'active');
  const [withdrawalProcessingTime, setWithdrawalProcessingTime] = useState(settings.withdrawalProcessingTime || "1-2 Business Days");
  const [withdrawalVerificationRequirement, setWithdrawalVerificationRequirement] = useState(settings.withdrawalVerificationRequirement || 'wallet_signature');
  const [minAirdropsRequired, setMinAirdropsRequired] = useState(settings.minAirdropsRequired || 2);
  const [requireAccountVerification, setRequireAccountVerification] = useState(settings.requireAccountVerification || false);

  const fetchWithdrawals = async () => {
    setIsLoadingWithdrawals(true);
    try {
      const res = await fetch('/api/withdrawals');
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (e) {
      console.error("Failed to fetch withdrawals:", e);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'withdrawals') {
      fetchWithdrawals();
    }
  }, [activeTab]);

  const handleUpdateWithdrawalStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/withdrawals/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        alert(`Withdrawal request status updated to ${status} successfully!`);
        fetchWithdrawals();
        if (onAirdropChange) onAirdropChange();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update withdrawal request");
      }
    } catch (e) {
      console.error(e);
      alert("An error occurred while updating withdrawal status.");
    }
  };

  // Manual Multi-Currency Balance Adjustment States
  const [adjWalletAddress, setAdjWalletAddress] = useState("");
  const [adjCoin, setAdjCoin] = useState("USDT");
  const [adjType, setAdjType] = useState<"available" | "pending" | "total">("available");
  const [adjAction, setAdjAction] = useState<"credit" | "deduct" | "set">("credit");
  const [adjAmount, setAdjAmount] = useState("");
  const [isSubmittingAdj, setIsSubmittingAdj] = useState(false);

  // Pending Payouts Direct Adjustment Modal States
  const [editingPendingUser, setEditingPendingUser] = useState<User | null>(null);
  const [pendingAdjAction, setPendingAdjAction] = useState<"credit" | "deduct" | "set">("credit");
  const [pendingAdjAmount, setPendingAdjAmount] = useState("");
  const [isSavingPendingAdj, setIsSavingPendingAdj] = useState(false);

  const handleSavePendingPayoutAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPendingUser) return;
    const num = parseFloat(pendingAdjAmount);
    if (isNaN(num) || num < 0) {
      alert("Please enter a valid positive dollar amount.");
      return;
    }

    setIsSavingPendingAdj(true);
    try {
      const res = await fetch(`/api/users/${editingPendingUser.walletAddress}/balance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coin: "USDT",
          type: "pending",
          action: pendingAdjAction,
          amount: num
        })
      });

      if (res.ok) {
        alert(`Successfully updated Pending Payouts for ${editingPendingUser.walletAddress.substring(0, 8)}...!`);
        setEditingPendingUser(null);
        setPendingAdjAmount("");
        if (onAirdropChange) onAirdropChange();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to update pending payouts");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating pending payouts.");
    } finally {
      setIsSavingPendingAdj(false);
    }
  };

  const handleApplyBalanceAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjWalletAddress) {
      alert("Please select or enter a valid user wallet address.");
      return;
    }
    const amountVal = parseFloat(adjAmount);
    if (isNaN(amountVal) || amountVal < 0) {
      alert("Please provide a valid, positive numeric amount.");
      return;
    }

    setIsSubmittingAdj(true);
    try {
      const res = await fetch(`/api/users/${adjWalletAddress}/balance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coin: adjCoin,
          type: adjType,
          action: adjAction,
          amount: amountVal
        })
      });

      if (res.ok) {
        alert(`Successfully applied balance adjustment!`);
        setAdjAmount("");
        if (onAirdropChange) onAirdropChange();
      } else {
        const err = await res.json();
        alert(`Adjustment failed: ${err.error || 'Server error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to submit balance adjustment request.");
    } finally {
      setIsSubmittingAdj(false);
    }
  };

  const handleSaveWithdrawalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...settings,
      withdrawEnabled,
      minWithdrawAmount: Number(minWithdrawAmount),
      maxWithdrawAmount: Number(maxWithdrawAmount),
      withdrawStatus,
      withdrawalProcessingTime,
      withdrawalVerificationRequirement,
      minAirdropsRequired: Number(minAirdropsRequired),
      requireAccountVerification
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      if (res.ok) {
        onUpdateSettings(updatedSettings);
        alert("Withdrawal system configuration saved successfully!");
      } else {
        alert("Failed to save configurations.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving configurations.");
    }
  };

  // Create Airdrop Form State
  const [newAirdropName, setNewAirdropName] = useState("");
  const [newAirdropLogo, setNewAirdropLogo] = useState("💎");
  const [newAirdropDesc, setNewAirdropDesc] = useState("");
  const [newAirdropReward, setNewAirdropReward] = useState("$500-$1000");
  const [newAirdropDifficulty, setNewAirdropDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>("Medium");
  const [newAirdropTime, setNewAirdropTime] = useState("30 days left");
  const [newAirdropBlockchain, setNewAirdropBlockchain] = useState("Ethereum");
  const [newAirdropUrl, setNewAirdropUrl] = useState("https://");
  const [newAirdropCategory, setNewAirdropCategory] = useState("defi");
  const [newAirdropFeatured, setNewAirdropFeatured] = useState(false);
  const [newAirdropClaimFee, setNewAirdropClaimFee] = useState("");
  const [editingAirdropId, setEditingAirdropId] = useState<string | null>(null);

  // AI Gen States
  const [aiProjectName, setAiProjectName] = useState("");
  const [aiBlockchain, setAiBlockchain] = useState("Base");
  const [aiCategory, setAiCategory] = useState("defi");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiNotification, setAiNotification] = useState("");

  // Edit platform state
  const [editSiteName, setEditSiteName] = useState(settings.siteName);
  const [editSiteLogo, setEditSiteLogo] = useState(settings.siteLogo);
  const [editHeroTitle, setEditHeroTitle] = useState(settings.heroTitle);
  const [editHeroSub, setEditHeroSub] = useState(settings.heroSubtitle);
  const [editFooterText, setEditFooterText] = useState(settings.footerText);
  const [editAnnouncement, setEditAnnouncement] = useState(settings.announcement);
  const [editJoinFee, setEditJoinFee] = useState(settings.joinFee);
  const [editMaintenance, setEditMaintenance] = useState(settings.isMaintenance);
  const [editOwnerWalletAddress, setEditOwnerWalletAddress] = useState(settings.ownerWalletAddress || "");

  // Wallet Configuration States
  const [editUsdtAddress, setEditUsdtAddress] = useState(settings.usdtAddress || "");
  const [editEthAddress, setEditEthAddress] = useState(settings.ethAddress || "");
  const [editBnbAddress, setEditBnbAddress] = useState(settings.bnbAddress || "");
  const [editBtcAddress, setEditBtcAddress] = useState(settings.btcAddress || "");
  const [editQrCodeAutoGeneration, setEditQrCodeAutoGeneration] = useState(settings.qrCodeAutoGeneration ?? true);
  const [editEnablePaymentRequirement, setEditEnablePaymentRequirement] = useState(settings.enablePaymentRequirement ?? true);
  const [editRequiredFeeAmount, setEditRequiredFeeAmount] = useState(settings.requiredFeeAmount || "0.003");
  const [editSupportedNetworks, setEditSupportedNetworks] = useState<string[]>(settings.supportedNetworks || ["USDT", "ETH", "BNB", "BTC"]);

  // Dynamic Payment Wallet Configurations State
  const [paymentNetworks, setPaymentNetworks] = useState<PaymentNetwork[]>(settings.paymentNetworks || []);
  const [isAddingNetwork, setIsAddingNetwork] = useState(false);
  const [editingNetworkId, setEditingNetworkId] = useState<string | null>(null);

  // Form states for adding/editing payment network
  const [formCoin, setFormCoin] = useState("USDT");
  const [formNetwork, setFormNetwork] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formQrCodeUrl, setFormQrCodeUrl] = useState("");
  const [formEnabled, setFormEnabled] = useState(true);

  useEffect(() => {
    setEditSiteName(settings.siteName);
    setEditSiteLogo(settings.siteLogo);
    setEditHeroTitle(settings.heroTitle);
    setEditHeroSub(settings.heroSubtitle);
    setEditFooterText(settings.footerText);
    setEditAnnouncement(settings.announcement);
    setEditJoinFee(settings.joinFee);
    setEditMaintenance(settings.isMaintenance);
    setEditOwnerWalletAddress(settings.ownerWalletAddress || "");
    
    setEditUsdtAddress(settings.usdtAddress || "");
    setEditEthAddress(settings.ethAddress || "");
    setEditBnbAddress(settings.bnbAddress || "");
    setEditBtcAddress(settings.btcAddress || "");
    setEditQrCodeAutoGeneration(settings.qrCodeAutoGeneration ?? true);
    setEditEnablePaymentRequirement(settings.enablePaymentRequirement ?? true);
    setEditRequiredFeeAmount(settings.requiredFeeAmount || "0.003");
    setEditSupportedNetworks(settings.supportedNetworks || ["USDT", "ETH", "BNB", "BTC"]);
    setPaymentNetworks(settings.paymentNetworks || []);

    setWithdrawEnabled(settings.withdrawEnabled !== false);
    setMinWithdrawAmount(settings.minWithdrawAmount || 50);
    setMaxWithdrawAmount(settings.maxWithdrawAmount || 5000);
    setWithdrawStatus(settings.withdrawStatus || 'active');
    setWithdrawalProcessingTime(settings.withdrawalProcessingTime || "1-2 Business Days");
    setWithdrawalVerificationRequirement(settings.withdrawalVerificationRequirement || 'wallet_signature');
    setMinAirdropsRequired(settings.minAirdropsRequired || 2);
    setRequireAccountVerification(settings.requireAccountVerification || false);
  }, [settings]);

  const handleToggleNetworkStatus = async (id: string) => {
    const updatedList = paymentNetworks.map((net) =>
      net.id === id ? { ...net, enabled: !net.enabled } : net
    );
    setPaymentNetworks(updatedList);

    const updatedSettings = {
      ...settings,
      paymentNetworks: updatedList,
    };

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSettings),
    });
    if (res.ok) {
      onUpdateSettings(updatedSettings);
    }
  };

  const handleDeleteNetwork = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this blockchain network configuration?")) return;
    const updatedList = paymentNetworks.filter((net) => net.id !== id);
    setPaymentNetworks(updatedList);

    const updatedSettings = {
      ...settings,
      paymentNetworks: updatedList,
    };

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSettings),
    });
    if (res.ok) {
      onUpdateSettings(updatedSettings);
    }
  };

  const handleSaveNetworkConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNetwork.trim() || !formAddress.trim()) {
      alert("Blockchain Network and Receiving Wallet Address are required.");
      return;
    }

    let updatedList: PaymentNetwork[] = [];

    if (editingNetworkId) {
      // Editing
      updatedList = paymentNetworks.map((net) =>
        net.id === editingNetworkId
          ? {
              ...net,
              coin: formCoin,
              network: formNetwork.trim(),
              address: formAddress.trim(),
              qrCodeUrl: formQrCodeUrl,
              enabled: formEnabled,
            }
          : net
      );
    } else {
      // Adding
      const newNet: PaymentNetwork = {
        id: `${formCoin.toLowerCase()}-${formNetwork.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`,
        coin: formCoin,
        network: formNetwork.trim(),
        address: formAddress.trim(),
        qrCodeUrl: formQrCodeUrl,
        enabled: formEnabled,
      };
      updatedList = [...paymentNetworks, newNet];
    }

    setPaymentNetworks(updatedList);
    setEditingNetworkId(null);
    setIsAddingNetwork(false);

    // Reset form
    setFormCoin("USDT");
    setFormNetwork("");
    setFormAddress("");
    setFormQrCodeUrl("");
    setFormEnabled(true);

    const updatedSettings = {
      ...settings,
      paymentNetworks: updatedList,
    };

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedSettings),
    });
    if (res.ok) {
      onUpdateSettings(updatedSettings);
      alert("Payment network saved successfully!");
    } else {
      alert("Failed to save network configuration on server.");
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "admin123" || adminPassword === "admin") {
      setIsAdminAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid administrative secret credentials.");
    }
  };

  const handleCreateAirdropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payLoad = {
      name: newAirdropName,
      logo: newAirdropLogo,
      description: newAirdropDesc,
      reward: newAirdropReward,
      difficulty: newAirdropDifficulty,
      timeRemaining: newAirdropTime,
      blockchain: newAirdropBlockchain,
      joinUrl: newAirdropUrl,
      category: newAirdropCategory,
      featured: newAirdropFeatured,
      claimFee: newAirdropClaimFee !== "" ? Number(newAirdropClaimFee) : null,
      detailedSteps: [
        "Connect compatible Web3 software wallet.",
        "Secure network gas requirements.",
        "Perform contract execution and swaps."
      ],
      requirements: ["Decentralized wallet", "Active network gas balances"]
    };

    const url = editingAirdropId ? `/api/airdrops/${editingAirdropId}` : "/api/airdrops";
    const method = editingAirdropId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payLoad),
    });

    if (res.ok) {
      alert(editingAirdropId ? "Airdrop updated successfully!" : "Airdrop registered successfully!");
      setNewAirdropName("");
      setNewAirdropLogo("💎");
      setNewAirdropDesc("");
      setNewAirdropReward("$500-$1000");
      setNewAirdropDifficulty("Medium");
      setNewAirdropTime("30 days left");
      setNewAirdropBlockchain("Ethereum");
      setNewAirdropUrl("https://");
      setNewAirdropCategory("defi");
      setNewAirdropFeatured(false);
      setNewAirdropClaimFee("");
      setEditingAirdropId(null);
      onAirdropChange();
    }
  };

  const handleAirdropEditInit = (a: Airdrop) => {
    setEditingAirdropId(a.id);
    setNewAirdropName(a.name);
    setNewAirdropLogo(a.logo);
    setNewAirdropDesc(a.description);
    setNewAirdropReward(a.reward);
    setNewAirdropDifficulty(a.difficulty);
    setNewAirdropTime(a.timeRemaining);
    setNewAirdropBlockchain(a.blockchain);
    setNewAirdropUrl(a.joinUrl);
    setNewAirdropCategory(a.category);
    setNewAirdropFeatured(a.featured || false);
    setNewAirdropClaimFee(a.claimFee !== undefined && a.claimFee !== null ? String(a.claimFee) : "");
    
    const formElement = document.getElementById("airdrop-form-section");
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingAirdropId(null);
    setNewAirdropName("");
    setNewAirdropLogo("💎");
    setNewAirdropDesc("");
    setNewAirdropReward("$500-$1000");
    setNewAirdropDifficulty("Medium");
    setNewAirdropTime("30 days left");
    setNewAirdropBlockchain("Ethereum");
    setNewAirdropUrl("https://");
    setNewAirdropCategory("defi");
    setNewAirdropFeatured(false);
    setNewAirdropClaimFee("");
  };

  const handleAirdropDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this airdrop?")) {
      const res = await fetch(`/api/airdrops/${id}`, { method: "DELETE" });
      if (res.ok) {
        onAirdropChange();
      }
    }
  };

  const handleBlockUser = async (wallet: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "blocked" : "active";
    const res = await fetch(`/api/users/${wallet}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      onAirdropChange();
    }
  };

  const handleUpdateSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...settings,
      siteName: editSiteName,
      siteLogo: editSiteLogo,
      heroTitle: editHeroTitle,
      heroSubtitle: editHeroSub,
      footerText: editFooterText,
      announcement: editAnnouncement,
      joinFee: Number(editJoinFee),
      isMaintenance: editMaintenance,
      ownerWalletAddress: editOwnerWalletAddress,
    };

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    if (res.ok) {
      alert("Settings saved successfully!");
      onUpdateSettings(updated);
    }
  };

  const handleUpdateWalletConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...settings,
      usdtAddress: editUsdtAddress,
      ethAddress: editEthAddress,
      bnbAddress: editBnbAddress,
      btcAddress: editBtcAddress,
      qrCodeAutoGeneration: editQrCodeAutoGeneration,
      enablePaymentRequirement: editEnablePaymentRequirement,
      requiredFeeAmount: editRequiredFeeAmount,
      supportedNetworks: editSupportedNetworks,
    };

    const res = await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });

    if (res.ok) {
      alert("Wallet Configuration saved successfully!");
      onUpdateSettings(updated);
    } else {
      alert("Failed to save Wallet Configuration.");
    }
  };

  const handleAIGenerate = async () => {
    if (!aiProjectName) {
      setAiNotification("Please input a mock project name first.");
      return;
    }
    setIsAiGenerating(true);
    setAiNotification("Prompting Gemini AI model for structured Web3 airdrop parameters...");

    try {
      const res = await fetch("/api/generate-airdrop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: aiProjectName,
          blockchain: aiBlockchain,
          category: aiCategory
        })
      });

      if (res.ok) {
        const data = await res.json();
        setNewAirdropName(data.name || aiProjectName);
        setNewAirdropLogo(data.logo || "💎");
        setNewAirdropDesc(data.description || "");
        setNewAirdropReward(data.reward || "$500-$1000");
        setNewAirdropDifficulty(data.difficulty || "Medium");
        setNewAirdropTime(data.timeRemaining || "30 days left");
        setNewAirdropBlockchain(data.blockchain || aiBlockchain);
        setNewAirdropUrl(data.joinUrl || "https://");
        setNewAirdropCategory(data.category || aiCategory);
        setAiNotification("AI draft generated successfully! Press publish below to deploy live.");
      } else {
        setAiNotification("Failed to generate details. Returning basic templates.");
      }
    } catch (e) {
      setAiNotification("API error. Reverting to manual entry inputs.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const totalRevenue = transactions.reduce((acc, curr) => acc + (curr.status === "success" ? curr.amount : 0), 0);

  if (!isAdminAuthenticated) {
    return (
      <div id="admin-login-screen" className="max-w-md mx-auto my-12 p-8 glass-panel rounded-3xl border border-white/5 text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 mb-4 text-brand-primary">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">Admin Dashboard</h2>
        <p className="text-gray-400 text-sm mb-6 leading-relaxed">
          Provide your portal security passcode to unlock platform configuration settings.
        </p>

        {authError && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
            {authError}
          </div>
        )}

        <form onSubmit={handleAdminLogin}>
          <div className="mb-4 text-left">
            <label className="text-gray-500 text-xs font-semibold block mb-2">Administrative Password</label>
            <input
              type="password"
              id="admin-pass-input"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-brand-primary outline-none"
              placeholder="Enter passcode (default: admin123)"
              required
            />
          </div>

          <button
            type="submit"
            id="admin-auth-submit"
            className="w-full py-3 rounded-xl bg-brand-primary font-bold text-white text-xs shadow-neon hover:opacity-95 transition-all cursor-pointer"
          >
            Authenticate Portal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-panel" className="w-full glass-panel rounded-3xl border border-white/5 overflow-hidden">
      {/* Tab Selectors */}
      <div className="flex border-b border-white/5 bg-black/20 px-6 py-2 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'stats' ? 'text-brand-secondary bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          Overview Statistics
        </button>
        <button
          onClick={() => setActiveTab('airdrops')}
          className={`px-4 py-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'airdrops' ? 'text-brand-secondary bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          Manage Airdrops
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'users' ? 'text-brand-secondary bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          Wallets & Users
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'settings' ? 'text-brand-secondary bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          Portal Settings
        </button>
        <button
          onClick={() => setActiveTab('wallet_config')}
          className={`px-4 py-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'wallet_config' ? 'text-brand-secondary bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          Wallet Configuration
        </button>
        <button
          onClick={() => setActiveTab('withdrawals')}
          className={`px-4 py-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${activeTab === 'withdrawals' ? 'text-brand-secondary bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          💳 Withdraw Management
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-3 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'security' ? 'text-brand-secondary bg-white/5' : 'text-gray-400 hover:text-white'}`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Security Panel</span>
        </button>
      </div>

      <div className="p-6">
        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 text-center">
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Total Users</span>
                <span className="text-2xl font-bold text-brand-secondary">{users.length}</span>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Connected Wallets</span>
                <span className="text-2xl font-bold text-brand-accent">{users.length}</span>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Airdrops Indexed</span>
                <span className="text-2xl font-bold text-brand-primary">{airdrops.length}</span>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Platform Revenue</span>
                <span className="text-2xl font-bold text-green-400">{totalRevenue.toFixed(3)} ETH</span>
              </div>
            </div>

            {/* Recent transactions list */}
            <div>
              <h3 className="font-display font-bold text-white text-base mb-4 flex items-center gap-1.5">
                <Coins className="w-4 h-4 text-brand-accent animate-pulse" />
                <span>Recent Platform Join Logs & Payment Verification</span>
              </h3>

              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/25">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-white/2 text-gray-400 uppercase text-[10px] font-bold border-b border-white/5">
                    <tr>
                      <th className="p-4">Tx ID</th>
                      <th className="p-4">Sender Wallet</th>
                      <th className="p-4">Airdrop Project</th>
                      <th className="p-4">Asset Standard</th>
                      <th className="p-4">Receipt Proof</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-white/2 transition-all">
                        <td className="p-4 font-mono font-bold text-white">{tx.id}</td>
                        <td className="p-4 font-mono text-gray-400">
                          {tx.walletAddress.substring(0, 8)}...{tx.walletAddress.substring(34)}
                        </td>
                        <td className="p-4 font-semibold text-brand-secondary">{tx.airdropName}</td>
                        <td className="p-4">
                          <span className="font-bold text-white text-xs block">
                            {tx.coin || "ETH"}
                          </span>
                          <span className="text-[9px] text-gray-500 font-mono block">
                            {tx.network || "Ethereum Mainnet"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-mono text-gray-500 block truncate max-w-[120px]" title={tx.txHash}>
                              {tx.txHash.substring(0, 10)}...
                            </span>
                            {tx.screenshot && (
                              <button
                                type="button"
                                onClick={() => setSelectedTxScreenshot(tx.screenshot || null)}
                                className="text-[10px] text-left text-brand-accent hover:underline font-bold flex items-center gap-1"
                              >
                                🖼️ View Receipt
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                            tx.status === "success"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : tx.status === "rejected" || tx.status === "failed"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 animate-pulse"
                          }`}>
                            {tx.status === "success" ? "Approved" : tx.status === "rejected" ? "Rejected" : tx.status === "failed" ? "Failed" : "Pending Review"}
                          </span>
                        </td>
                        <td className="p-4 text-gray-400 text-[10px]">{new Date(tx.timestamp).toLocaleString()}</td>
                        <td className="p-4 text-right">
                          {tx.status === "pending" ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleUpdateTransactionStatus(tx.id, "success")}
                                className="px-2.5 py-1.5 bg-green-500/20 hover:bg-green-500 text-green-300 hover:text-black rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleUpdateTransactionStatus(tx.id, "rejected")}
                                className="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-gray-600 italic">No Action Needed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-gray-500">
                          No transactions completed on this portal session yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Screenshot Lightbox Modal */}
            {selectedTxScreenshot && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                <div className="max-w-xl w-full bg-brand-bg border border-white/10 rounded-3xl p-6 relative flex flex-col items-center gap-4">
                  <h4 className="text-white text-xs font-bold uppercase tracking-wider">Transaction Proof Screenshot</h4>
                  <div className="w-full bg-black/50 border border-white/5 rounded-2xl p-2 max-h-[70vh] overflow-auto flex justify-center">
                    <img referrerPolicy="no-referrer" src={selectedTxScreenshot} alt="Proof Receipt" className="max-w-full h-auto object-contain rounded-lg" />
                  </div>
                  <button
                    onClick={() => setSelectedTxScreenshot(null)}
                    className="px-5 py-2.5 bg-brand-primary text-white text-xs font-bold rounded-xl cursor-pointer hover:opacity-90 transition-all uppercase tracking-wider"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Manage Airdrops Tab */}
        {activeTab === 'airdrops' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Create Airdrop / AI Builder Panel */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              {/* Magical Gemini AI Builder Box */}
              <div className="bg-gradient-to-r from-brand-primary/10 to-brand-secondary/5 border border-brand-primary/20 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-brand-secondary animate-pulse" />
                  <h4 className="font-display font-bold text-white text-sm">Gemini AI Airdrop Draft Generator</h4>
                </div>
                <p className="text-gray-400 text-xs mb-4 leading-normal">
                  Type any real/upcoming crypto project. Our integrated Gemini AI model will automatically draft its description, logo emoji, tasks, and requirements.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={aiProjectName}
                    onChange={(e) => setAiProjectName(e.target.value)}
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:border-brand-secondary outline-none"
                    placeholder="e.g. zkSync Era, Monad, Berachain"
                  />
                  <button
                    type="button"
                    onClick={handleAIGenerate}
                    disabled={isAiGenerating}
                    className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Cpu className={`w-4 h-4 ${isAiGenerating ? "animate-spin" : ""}`} />
                    <span>{isAiGenerating ? "Thinking..." : "AI Generate"}</span>
                  </button>
                </div>

                {aiNotification && (
                  <div className="mt-3 flex items-start gap-2 text-[11px] text-brand-secondary">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{aiNotification}</span>
                  </div>
                )}
              </div>

              {/* Standard Airdrop Creation form */}
              <div id="airdrop-form-section" className="bg-black/30 border border-white/5 rounded-2xl p-5">
                <h4 className="font-display font-bold text-white text-sm mb-4">
                  {editingAirdropId ? "Edit Indexed Airdrop" : "Create or Edit Airdrop"}
                </h4>
                <form onSubmit={handleCreateAirdropSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Project Name</label>
                      <input
                        type="text"
                        value={newAirdropName}
                        onChange={(e) => setNewAirdropName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Logo Emoji</label>
                      <input
                        type="text"
                        value={newAirdropLogo}
                        onChange={(e) => setNewAirdropLogo(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Description</label>
                      <textarea
                        value={newAirdropDesc}
                        onChange={(e) => setNewAirdropDesc(e.target.value)}
                        rows={2}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Reward Value</label>
                      <input
                        type="text"
                        value={newAirdropReward}
                        onChange={(e) => setNewAirdropReward(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Difficulty</label>
                      <select
                        value={newAirdropDifficulty}
                        onChange={(e) => setNewAirdropDifficulty(e.target.value as any)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Blockchain Network</label>
                      <input
                        type="text"
                        value={newAirdropBlockchain}
                        onChange={(e) => setNewAirdropBlockchain(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Time Remaining</label>
                      <input
                        type="text"
                        value={newAirdropTime}
                        onChange={(e) => setNewAirdropTime(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Join Target URL</label>
                      <input
                        type="text"
                        value={newAirdropUrl}
                        onChange={(e) => setNewAirdropUrl(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Category Slug</label>
                      <select
                        value={newAirdropCategory}
                        onChange={(e) => setNewAirdropCategory(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                      >
                        <option value="defi">DeFi Protocols</option>
                        <option value="layer-2">Layer 2 & Rollups</option>
                        <option value="nfts">NFTs & Gaming</option>
                        <option value="socialfi">SocialFi & Web3</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-gray-500 text-xs font-semibold block mb-1">Custom Claim Fee (ETH)</label>
                      <input
                        type="number"
                        step="0.0001"
                        placeholder="e.g. 0.005 (Leave blank for global fee)"
                        value={newAirdropClaimFee}
                        onChange={(e) => setNewAirdropClaimFee(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
                        <input
                          type="checkbox"
                          checked={newAirdropFeatured}
                          onChange={(e) => setNewAirdropFeatured(e.target.checked)}
                          className="rounded border-white/10 text-brand-primary"
                        />
                        <span>Feature on Homepage</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    {editingAirdropId && (
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-brand-primary text-white font-bold text-xs rounded-xl shadow-neon hover:opacity-95 cursor-pointer"
                    >
                      {editingAirdropId ? "Save Changes" : "Publish Airdrop live"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Existing airdrops directory table */}
            <div className="lg:col-span-5">
              <div className="bg-black/30 border border-white/5 rounded-2xl p-5">
                <h4 className="font-display font-bold text-white text-sm mb-4">Indexed Campaign Logs</h4>

                <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1">
                  {airdrops.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-xl border border-white/5 bg-black/20 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl">{a.logo}</span>
                        <div className="min-w-0">
                          <span className="font-semibold text-xs text-white block truncate">{a.name}</span>
                          <span className="text-[10px] text-brand-secondary font-mono block">{a.blockchain}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[10px] font-mono text-brand-accent px-1.5 py-0.5 rounded border border-brand-accent/20 bg-brand-accent/5">
                            {a.reward}
                          </span>
                          {a.claimFee !== undefined && a.claimFee !== null && (
                            <span className="text-[9px] text-gray-400 font-mono">
                              Fee: {a.claimFee} ETH
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleAirdropEditInit(a)}
                          className="p-1.5 text-gray-400 hover:text-brand-secondary hover:bg-white/5 rounded-lg cursor-pointer transition-colors"
                          title="Edit Airdrop"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleAirdropDelete(a.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Delete Airdrop"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {airdrops.length === 0 && (
                    <p className="text-gray-500 text-center py-12 text-xs">No active airdrops currently indexed.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wallets & Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h3 className="font-display font-bold text-white text-base mb-4 flex items-center gap-1.5">
              <UserCheck className="w-5 h-5 text-brand-secondary" />
              <span>Active Connected Web3 Wallet Accounts ({users.length})</span>
            </h3>

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/25">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-white/2 text-gray-400 uppercase text-[10px] font-bold border-b border-white/5">
                  <tr>
                    <th className="p-4">Wallet ID</th>
                    <th className="p-4">Sync Scores</th>
                    <th className="p-4">Pending Payouts</th>
                    <th className="p-4">Joined Count</th>
                    <th className="p-4">Airdrop Indices Joined</th>
                    <th className="p-4">Account Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {users.map((u) => (
                    <tr key={u.walletAddress} className="hover:bg-white/2">
                      <td className="p-4 font-mono text-white select-all">{u.walletAddress}</td>
                      <td className="p-4 font-bold text-brand-secondary">{u.points} pts</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400 font-semibold font-mono">{u.pendingRewards}</span>
                          <button
                            onClick={() => {
                              setEditingPendingUser(u);
                              setPendingAdjAction("credit");
                              setPendingAdjAmount("");
                            }}
                            className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-brand-secondary border border-white/10 transition-all cursor-pointer text-[10px] font-bold flex items-center gap-1"
                            title="Edit Pending Payouts"
                          >
                            <span>✏️</span>
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold">{u.joinedAirdrops.length}</td>
                      <td className="p-4 text-gray-400 font-mono">
                        {u.joinedAirdrops.join(", ") || "None"}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            u.status === "active"
                              ? "bg-green-500/10 text-green-400 border border-green-500/20"
                              : "bg-red-500/10 text-red-400 border border-red-500/20"
                          }`}
                        >
                          {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setAdjWalletAddress(u.walletAddress);
                              const el = document.getElementById("balance-adjuster-board");
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-brand-secondary/10 text-brand-secondary border border-brand-secondary/20 hover:bg-brand-secondary/20 transition-all cursor-pointer flex items-center gap-1"
                            title="Edit User Balance"
                          >
                            <span>✏️</span>
                            <span>Edit Balance</span>
                          </button>
                          <button
                            onClick={() => handleBlockUser(u.walletAddress, u.status)}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              u.status === "active"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                                : "bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                            }`}
                          >
                            {u.status === "active" ? "Block Wallet" : "Unblock Wallet"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        No connected user records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Balance Adjuster Section */}
            <div id="balance-adjuster-board" className="mt-8 p-6 rounded-2xl border border-white/5 bg-black/40">
              <h4 className="font-display font-bold text-white text-sm mb-4 flex items-center gap-2">
                <span>🔧 Ledger Balance Adjuster Board</span>
              </h4>
              <form onSubmit={handleApplyBalanceAdjustment} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <label className="text-gray-500 text-[10px] uppercase font-bold block mb-1.5">Select User Account</label>
                  <select
                    value={adjWalletAddress}
                    onChange={(e) => setAdjWalletAddress(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-brand-secondary font-mono"
                  >
                    <option value="">-- Choose Connected Wallet --</option>
                    {users.map((u) => (
                      <option key={u.walletAddress} value={u.walletAddress}>
                        {u.walletAddress.substring(0, 8)}...{u.walletAddress.substring(u.walletAddress.length - 6)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 text-[10px] uppercase font-bold block mb-1.5">Select Asset Coin</label>
                  <select
                    value={adjCoin}
                    onChange={(e) => setAdjCoin(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-brand-secondary"
                  >
                    <option value="USDT">USDT</option>
                    <option value="ETH">ETH</option>
                    <option value="BNB">BNB</option>
                    <option value="BTC">BTC</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 text-[10px] uppercase font-bold block mb-1.5">Balance Ledger Type</label>
                  <select
                    value={adjType}
                    onChange={(e) => setAdjType(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-brand-secondary"
                  >
                    <option value="available">Available Balance</option>
                    <option value="pending">Pending Balance</option>
                    <option value="total">Total Earnings</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-500 text-[10px] uppercase font-bold block mb-1.5">Ledger Operation</label>
                  <select
                    value={adjAction}
                    onChange={(e) => setAdjAction(e.target.value as any)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-brand-secondary"
                  >
                    <option value="credit">➕ Credit / Add</option>
                    <option value="deduct">➖ Deduct / Subtract</option>
                    <option value="set">✏️ Set Absolute</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-gray-500 text-[10px] uppercase font-bold block mb-1.5">Amount</label>
                    <input
                      type="number"
                      step="any"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      placeholder="e.g. 150.00"
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-brand-secondary font-mono"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmittingAdj}
                    className="bg-brand-secondary hover:bg-brand-secondary/90 disabled:opacity-50 text-black text-xs font-bold px-4 py-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer h-[38px] uppercase tracking-wider"
                  >
                    {isSubmittingAdj ? "..." : "Apply"}
                  </button>
                </div>
              </form>
            </div>

            {/* Pending Payouts Modal */}
            {editingPendingUser && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
                <div className="w-full max-w-md bg-brand-bg border border-white/10 rounded-3xl p-6 shadow-2xl relative text-left">
                  <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
                    <div>
                      <h3 className="font-display font-bold text-white text-base flex items-center gap-2">
                        <span>💰</span>
                        <span>Edit Pending Payouts</span>
                      </h3>
                      <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                        Wallet: {editingPendingUser.walletAddress}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingPendingUser(null)}
                      className="text-gray-400 hover:text-white p-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="p-3 bg-brand-secondary/10 border border-brand-secondary/20 rounded-2xl mb-4">
                    <span className="text-gray-400 text-xs block">Current Pending Payouts:</span>
                    <span className="text-xl font-bold font-mono text-brand-secondary">
                      {editingPendingUser.pendingRewards || "$0.00"}
                    </span>
                  </div>

                  <form onSubmit={handleSavePendingPayoutAdjustment} className="space-y-4">
                    <div>
                      <label className="text-gray-400 text-[11px] font-bold block mb-1 uppercase tracking-wider">
                        Adjustment Action
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingAdjAction("credit")}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            pendingAdjAction === "credit"
                              ? "bg-green-500/20 text-green-400 border-green-500/50"
                              : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          ➕ Increase (+)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAdjAction("deduct")}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            pendingAdjAction === "deduct"
                              ? "bg-red-500/20 text-red-400 border-red-500/50"
                              : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          ➖ Decrease (-)
                        </button>
                        <button
                          type="button"
                          onClick={() => setPendingAdjAction("set")}
                          className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            pendingAdjAction === "set"
                              ? "bg-brand-secondary/20 text-brand-secondary border-brand-secondary/50"
                              : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          ✏️ Set Exact
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-gray-400 text-[11px] font-bold block mb-1 uppercase tracking-wider">
                        Dollar Amount ($ USD)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={pendingAdjAmount}
                        onChange={(e) => setPendingAdjAmount(e.target.value)}
                        placeholder="e.g. 150.00"
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-sm text-white font-mono outline-none focus:border-brand-secondary"
                        required
                      />
                    </div>

                    {/* Presets */}
                    <div className="flex flex-wrap gap-1.5">
                      {["50", "100", "250", "500", "1000"].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setPendingAdjAmount(preset)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[11px] font-mono border border-white/10 transition-all cursor-pointer"
                        >
                          ${preset}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingPendingUser(null)}
                        className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-bold text-xs transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingPendingAdj}
                        className="flex-1 py-2.5 rounded-xl bg-brand-secondary hover:bg-brand-secondary/90 disabled:opacity-50 text-black font-bold text-xs transition-all cursor-pointer uppercase tracking-wider"
                      >
                        {isSavingPendingAdj ? "Updating..." : "Save Payouts"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl">
            <h3 className="font-display font-bold text-white text-base mb-6 flex items-center gap-1.5">
              <Settings className="w-5 h-5 text-brand-primary" />
              <span>Platform Core Parameters</span>
            </h3>

            <form onSubmit={handleUpdateSettingsSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Site Portal Name</label>
                  <input
                    type="text"
                    value={editSiteName}
                    onChange={(e) => setEditSiteName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Site Logo Emoji</label>
                  <input
                    type="text"
                    value={editSiteLogo}
                    onChange={(e) => setEditSiteLogo(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Hero Display Header</label>
                  <input
                    type="text"
                    value={editHeroTitle}
                    onChange={(e) => setEditHeroTitle(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Hero Description Paragraph</label>
                  <textarea
                    value={editHeroSub}
                    onChange={(e) => setEditHeroSub(e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Portal Footer Text</label>
                  <textarea
                    value={editFooterText}
                    onChange={(e) => setEditFooterText(e.target.value)}
                    rows={2}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Announcement Bar Message</label>
                  <input
                    type="text"
                    value={editAnnouncement}
                    onChange={(e) => setEditAnnouncement(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                  />
                </div>
                <div>
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Join Transaction Catalog Fee (ETH)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={editJoinFee}
                    onChange={(e) => setEditJoinFee(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                  />
                </div>

                <div>
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Website Owner Wallet Address (Fee Recipient)</label>
                  <input
                    type="text"
                    placeholder="e.g. 0x96B217983637e12763321528b9A26A207d5D66D5"
                    value={editOwnerWalletAddress}
                    onChange={(e) => setEditOwnerWalletAddress(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-brand-secondary"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1">
                    All processed custom airdrop claim fees will be credited to this specific target wallet address.
                  </span>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={editMaintenance}
                      onChange={(e) => setEditMaintenance(e.target.checked)}
                      className="rounded border-white/10 text-brand-primary"
                    />
                    <div>
                      <strong className="text-white block">Portal Maintenance Mode</strong>
                      <span>Overrides user dashboard visits with maintenance screens</span>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-brand-primary text-white text-xs font-bold rounded-xl mt-8 shadow-neon hover:opacity-95 cursor-pointer"
              >
                Save General Configuration
              </button>
            </form>
          </div>
        )}

        {/* Wallet Configuration Tab */}
        {activeTab === 'wallet_config' && (
          <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="font-display font-bold text-white text-base flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-brand-accent animate-pulse" />
                  <span>Payment Wallet & Network Management</span>
                </h3>
                <p className="text-gray-400 text-xs mt-1 leading-relaxed">
                  Only the Website Owner (Administrator) can configure receiving wallet addresses and QR codes for different network standards.
                </p>
              </div>

              {!isAddingNetwork && !editingNetworkId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingNetworkId(null);
                    setFormCoin("USDT");
                    setFormNetwork("");
                    setFormAddress("");
                    setFormQrCodeUrl("");
                    setFormEnabled(true);
                    setIsAddingNetwork(true);
                  }}
                  className="px-4 py-2.5 bg-gradient-to-r from-brand-primary to-brand-secondary text-white rounded-xl text-xs font-bold hover:opacity-95 shadow-neon cursor-pointer transition-all flex items-center gap-1.5 uppercase tracking-wider"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Blockchain Network</span>
                </button>
              )}
            </div>

            {/* A. Add / Edit Form */}
            {(isAddingNetwork || editingNetworkId) && (
              <form onSubmit={handleSaveNetworkConfig} className="bg-black/40 border border-white/10 rounded-3xl p-6 mb-8 max-w-2xl animate-fadeIn">
                <h4 className="text-sm font-bold text-brand-secondary uppercase tracking-wider mb-4 pb-2 border-b border-white/5">
                  {editingNetworkId ? "✏️ Edit Blockchain Network" : "➕ Add Blockchain Network"}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-gray-400 text-xs font-semibold block mb-1.5">Coin Symbol Name</label>
                    <select
                      value={formCoin}
                      onChange={(e) => setFormCoin(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary cursor-pointer"
                    >
                      <option value="USDT">USDT (Tether)</option>
                      <option value="ETH">ETH (Ethereum)</option>
                      <option value="BNB">BNB (Binance Coin)</option>
                      <option value="BTC">BTC (Bitcoin)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-gray-400 text-xs font-semibold block mb-1.5">Blockchain Network Standard</label>
                    <input
                      type="text"
                      value={formNetwork}
                      onChange={(e) => setFormNetwork(e.target.value)}
                      placeholder="e.g. ERC20, TRC20, BEP20, Mainnet"
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                      required
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-gray-400 text-xs font-semibold block mb-1.5">Receiving Wallet Address</label>
                    <input
                      type="text"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      placeholder="Paste your precise deposit wallet address"
                      className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-brand-secondary"
                      required
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="text-gray-400 text-xs font-semibold block mb-1">Custom QR Code Image (Optional)</label>
                    <p className="text-gray-500 text-[10px] mb-2">Upload a QR Code screenshot or enter an image URL. If none is supplied, high-contrast QR Codes are generated automatically from the wallet address.</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <div className="flex-1 w-full">
                        <input
                          type="text"
                          value={formQrCodeUrl}
                          onChange={(e) => setFormQrCodeUrl(e.target.value)}
                          placeholder="Image URL or Base64 String (Optional)"
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-3 text-white text-xs font-mono outline-none focus:border-brand-secondary mb-2"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs bg-white/5 border border-white/10 text-gray-300 hover:text-white px-3 py-2 rounded-xl cursor-pointer transition-colors hover:bg-white/10 text-center font-bold">
                            📂 Choose Image File
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  const file = e.target.files[0];
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setFormQrCodeUrl(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          {formQrCodeUrl && (
                            <button
                              type="button"
                              onClick={() => setFormQrCodeUrl("")}
                              className="text-xs text-red-400 bg-red-500/5 border border-red-500/10 px-3 py-2 rounded-xl hover:bg-red-500/10 transition-colors font-bold"
                            >
                              Clear QR
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex-shrink-0 w-24 h-24 bg-black/60 border border-white/5 rounded-xl flex items-center justify-center p-2">
                        {formQrCodeUrl ? (
                          <img
                            referrerPolicy="no-referrer"
                            src={formQrCodeUrl}
                            alt="QR Preview"
                            className="w-full h-full object-contain rounded"
                          />
                        ) : formAddress ? (
                          <img
                            referrerPolicy="no-referrer"
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=8&data=${encodeURIComponent(formAddress)}`}
                            alt="Auto Generated QR"
                            className="w-full h-full object-contain rounded bg-white p-1"
                          />
                        ) : (
                          <span className="text-[10px] text-gray-600 font-semibold text-center leading-tight">Address Required</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 md:col-span-2">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-300">
                      <input
                        type="checkbox"
                        checked={formEnabled}
                        onChange={(e) => setFormEnabled(e.target.checked)}
                        className="rounded border-white/10 text-brand-primary focus:ring-0 bg-black"
                      />
                      <div>
                        <strong className="text-white block">Enable this Network</strong>
                        <span>Allow users to select this standard during the payments flow</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingNetwork(false);
                      setEditingNetworkId(null);
                    }}
                    className="px-4 py-2.5 border border-white/5 text-gray-400 hover:text-white rounded-xl text-xs font-bold hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-brand-accent text-brand-bg rounded-xl text-xs font-extrabold hover:opacity-95 cursor-pointer transition-all uppercase tracking-wider shadow-neon"
                  >
                    {editingNetworkId ? "Save Changes" : "Create Network"}
                  </button>
                </div>
              </form>
            )}

            {/* B. Configured Networks Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {paymentNetworks.map((net) => (
                <div key={net.id} className={`glass-panel border rounded-2xl p-4 flex flex-col justify-between gap-4 relative transition-all duration-300 ${net.enabled ? 'border-white/10 bg-black/40' : 'border-white/5 bg-black/10 opacity-60'}`}>
                  
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">
                        {net.coin === "USDT" ? "🟢" : net.coin === "ETH" ? "🔷" : net.coin === "BNB" ? "🟡" : "🟠"}
                      </span>
                      <div>
                        <h5 className="font-display font-extrabold text-white text-xs block">{net.coin}</h5>
                        <span className="text-[10px] text-brand-secondary font-bold font-mono tracking-wider">{net.network}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingNetworkId(net.id);
                          setFormCoin(net.coin);
                          setFormNetwork(net.network);
                          setFormAddress(net.address);
                          setFormQrCodeUrl(net.qrCodeUrl || "");
                          setFormEnabled(net.enabled);
                          setIsAddingNetwork(false);
                        }}
                        className="p-1.5 text-gray-400 hover:text-brand-accent hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                        title="Edit Network"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteNetwork(net.id)}
                        className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                        title="Delete Network"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Wallet address and QR */}
                  <div className="flex gap-3 items-center bg-black/30 border border-white/5 p-2.5 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <span className="text-[9px] text-gray-500 font-bold block uppercase tracking-wider">Receiving Address</span>
                      <span className="text-[10px] font-mono text-gray-300 break-all leading-normal select-all font-semibold block">{net.address}</span>
                    </div>
                    <div className="flex-shrink-0 w-11 h-11 bg-white p-0.5 rounded-md flex items-center justify-center">
                      <img
                        referrerPolicy="no-referrer"
                        src={net.qrCodeUrl || `https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=4&data=${encodeURIComponent(net.address)}`}
                        alt="QR small"
                        className="w-full h-full object-contain rounded"
                      />
                    </div>
                  </div>

                  {/* Status Toggle Bar */}
                  <div className="flex justify-between items-center border-t border-white/5 pt-2 text-[10px] text-gray-400">
                    <span className="font-semibold uppercase tracking-wider">Status: <span className={net.enabled ? "text-green-400 font-bold" : "text-gray-500 font-bold"}>{net.enabled ? "Enabled" : "Disabled"}</span></span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={net.enabled}
                        onChange={() => handleToggleNetworkStatus(net.id)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4.5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                  </div>

                </div>
              ))}

              {paymentNetworks.length === 0 && (
                <div className="col-span-full border border-dashed border-white/10 rounded-2xl py-8 text-center text-gray-500 text-xs">
                  ⚠️ No configured blockchain payment networks found. Click "Add Blockchain Network" to bootstrap.
                </div>
              )}
            </div>

            {/* C. General Requirement Rules Rules */}
            <form onSubmit={handleUpdateWalletConfigSubmit} className="border-t border-white/5 pt-6 mt-6">
              <h4 className="text-xs font-bold text-brand-accent uppercase tracking-wider mb-4">Payment Rule Configuration</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/20 border border-white/5 rounded-3xl p-6 mb-6">
                
                <div className="flex items-center">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={editEnablePaymentRequirement}
                      onChange={(e) => setEditEnablePaymentRequirement(e.target.checked)}
                      className="rounded border-white/10 text-brand-primary focus:ring-0"
                    />
                    <div>
                      <strong className="text-white block">Enable Payment Requirement</strong>
                      <span>Requires manual proof submission and review prior to unlocking airdrop claims</span>
                    </div>
                  </label>
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs text-gray-400">
                    <input
                      type="checkbox"
                      checked={editQrCodeAutoGeneration}
                      onChange={(e) => setEditQrCodeAutoGeneration(e.target.checked)}
                      className="rounded border-white/10 text-brand-accent focus:ring-0"
                    />
                    <div>
                      <strong className="text-white block">Fallback Auto QR Codes</strong>
                      <span>Automatically renders high-fidelity visual QRs from address string if custom upload is empty</span>
                    </div>
                  </label>
                </div>

                <div>
                  <label className="text-gray-500 text-xs font-semibold block mb-1">General Claim Setup Fee (Crypto Equivalent)</label>
                  <input
                    type="text"
                    value={editRequiredFeeAmount}
                    onChange={(e) => setEditRequiredFeeAmount(e.target.value)}
                    placeholder="e.g. 0.003"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-xs outline-none focus:border-brand-secondary"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1 leading-normal">
                    Serves as default fee for users. Overrides default setup fee parameters.
                  </span>
                </div>

                <div>
                  <label className="text-gray-500 text-xs font-semibold block mb-1">Supported Assets (For Info Visualizer)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {["USDT", "ETH", "BNB", "BTC"].map((coin) => {
                      const isChecked = editSupportedNetworks.includes(coin);
                      return (
                        <label
                          key={coin}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] cursor-pointer select-none transition-all ${isChecked ? "bg-brand-primary/10 border-brand-primary/40 text-white font-bold" : "bg-black/20 border-white/5 text-gray-500 hover:border-white/10"}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            className="hidden"
                            onChange={() => {
                              if (isChecked) {
                                setEditSupportedNetworks(editSupportedNetworks.filter((c) => c !== coin));
                              } else {
                                setEditSupportedNetworks([...editSupportedNetworks, coin]);
                              }
                            }}
                          />
                          <span>{coin}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-brand-primary text-white text-xs font-bold rounded-xl shadow-neon hover:opacity-95 cursor-pointer uppercase tracking-wider transition-all"
              >
                Save General Rules
              </button>
            </form>
          </div>
        )}

        {/* Withdraw Management Tab */}
        {activeTab === 'withdrawals' && (
          <div className="w-full">
            <h3 className="font-display font-bold text-white text-base mb-6 flex items-center gap-2">
              <span className="text-xl">💳</span>
              <span>Withdraw Management & System Configurations</span>
            </h3>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left Column: Configuration Settings (5 cols) */}
              <div className="xl:col-span-5 flex flex-col gap-6">
                <form onSubmit={handleSaveWithdrawalSettings} className="glass-panel border border-white/5 rounded-3xl p-6 bg-black/30">
                  <h4 className="text-sm font-bold text-brand-secondary uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                    System Parameters
                  </h4>

                  <div className="flex flex-col gap-4">
                    {/* Enable / Disable Switch */}
                    <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-2xl">
                      <div>
                        <strong className="text-white text-xs block">Withdrawal Feature</strong>
                        <span className="text-gray-400 text-[10px]">Toggle entire system withdrawal access</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={withdrawEnabled}
                          onChange={(e) => setWithdrawEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                      </label>
                    </div>

                    {/* Status Select */}
                    <div>
                      <label className="text-gray-400 text-[11px] font-semibold block mb-1">Withdrawal Status</label>
                      <select
                        value={withdrawStatus}
                        onChange={(e: any) => setWithdrawStatus(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-secondary"
                      >
                        <option value="active" className="bg-brand-bg text-white">Active (Eligible users can request)</option>
                        <option value="paused" className="bg-brand-bg text-white">Paused (Temporarily locked for maintenance)</option>
                      </select>
                    </div>

                    {/* Limits */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-gray-400 text-[11px] font-semibold block mb-1">Min Withdraw ($)</label>
                        <input
                          type="number"
                          value={minWithdrawAmount}
                          onChange={(e) => setMinWithdrawAmount(Number(e.target.value))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-brand-secondary"
                        />
                      </div>
                      <div>
                        <label className="text-gray-400 text-[11px] font-semibold block mb-1">Max Withdraw ($)</label>
                        <input
                          type="number"
                          value={maxWithdrawAmount}
                          onChange={(e) => setMaxWithdrawAmount(Number(e.target.value))}
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-brand-secondary"
                        />
                      </div>
                    </div>

                    {/* Minimum Joined Airdrops Task Limit */}
                    <div>
                      <label className="text-gray-400 text-[11px] font-semibold block mb-1">Min Joined Quests Required</label>
                      <input
                        type="number"
                        value={minAirdropsRequired}
                        onChange={(e) => setMinAirdropsRequired(Number(e.target.value))}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs font-mono outline-none focus:border-brand-secondary"
                        min="0"
                      />
                      <span className="text-[9px] text-gray-500 block mt-1">
                        Users must join at least this many campaign quests to unlock the Withdraw button.
                      </span>
                    </div>

                    {/* Require Account Verification Toggle */}
                    <div className="flex items-center justify-between p-3 bg-black/40 border border-white/5 rounded-2xl mt-1">
                      <div>
                        <strong className="text-white text-xs block">Account Verification</strong>
                        <span className="text-gray-400 text-[10px]">Require user to be marked verified</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={requireAccountVerification}
                          onChange={(e) => setRequireAccountVerification(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-accent"></div>
                      </label>
                    </div>

                    {/* Verification Method Requirement */}
                    <div>
                      <label className="text-gray-400 text-[11px] font-semibold block mb-1">Required Verification Method</label>
                      <select
                        value={withdrawalVerificationRequirement}
                        onChange={(e: any) => setWithdrawalVerificationRequirement(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-secondary"
                      >
                        <option value="none" className="bg-brand-bg text-white">None (No extra checks)</option>
                        <option value="wallet_signature" className="bg-brand-bg text-white">Wallet Cryptographic Signature</option>
                        <option value="email_otp" className="bg-brand-bg text-white">Email Verification OTP</option>
                        <option value="otp" className="bg-brand-bg text-white">One-Time Verification Code (OTP)</option>
                        <option value="multi_layer" className="bg-brand-bg text-white">Multi-Layer (Wallet Signature + OTP)</option>
                      </select>
                    </div>

                    {/* Processing Time */}
                    <div>
                      <label className="text-gray-400 text-[11px] font-semibold block mb-1">Processing Time Window</label>
                      <input
                        type="text"
                        value={withdrawalProcessingTime}
                        onChange={(e) => setWithdrawalProcessingTime(e.target.value)}
                        placeholder="e.g. 1-2 Business Days"
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white text-xs outline-none focus:border-brand-secondary"
                      />
                    </div>

                    {/* Static Preconfigured Coins & Wallets indicators */}
                    <div className="border-t border-white/5 pt-3">
                      <span className="text-[10px] text-gray-500 font-bold block uppercase mb-1.5">Supported Assets</span>
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {["USDT", "ETH", "BNB", "BTC"].map((coin) => (
                          <span key={coin} className="text-[9px] bg-white/5 border border-white/10 text-brand-secondary px-2 py-0.5 rounded-md">
                            🪙 {coin}
                          </span>
                        ))}
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold block uppercase mb-1.5">Supported Wallets</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["MetaMask", "Trust Wallet", "Phantom Wallet", "Coinbase Wallet"].map((wallet) => (
                          <span key={wallet} className="text-[9px] bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded-md">
                            🦊 {wallet}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-brand-primary text-white text-xs font-bold rounded-xl mt-6 shadow-neon hover:opacity-95 cursor-pointer transition-all uppercase tracking-wider"
                  >
                    Save System Parameters
                  </button>
                </form>
              </div>

              {/* Right Column: Withdrawal Requests History & Tables (7 cols) */}
              <div className="xl:col-span-7 flex flex-col gap-6">
                <div className="glass-panel border border-white/5 rounded-3xl p-6 bg-black/20 min-h-[400px]">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Request History Logs
                    </h4>
                    <button
                      onClick={fetchWithdrawals}
                      className="px-3 py-1.5 border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] rounded-lg transition-all cursor-pointer font-bold"
                    >
                      {isLoadingWithdrawals ? "Loading..." : "🔄 Refresh"}
                    </button>
                  </div>

                  {/* Summary counts */}
                  <div className="grid grid-cols-3 gap-3 text-center mb-6">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5">
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Pending</span>
                      <span className="text-base font-mono font-bold text-yellow-400">
                        {withdrawals.filter(w => w.status === 'pending').length}
                      </span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5">
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Approved</span>
                      <span className="text-base font-mono font-bold text-green-400">
                        {withdrawals.filter(w => w.status === 'approved').length}
                      </span>
                    </div>
                    <div className="bg-black/30 border border-white/5 rounded-xl p-2.5">
                      <span className="text-[9px] text-gray-500 uppercase font-bold block">Rejected</span>
                      <span className="text-base font-mono font-bold text-red-400">
                        {withdrawals.filter(w => w.status === 'rejected').length}
                      </span>
                    </div>
                  </div>

                  {/* Requests Table wrapper */}
                  <div className="overflow-x-auto">
                    {withdrawals.length === 0 ? (
                      <div className="py-16 text-center text-xs text-gray-500">
                        No withdrawal request logs are stored in the persistent database.
                      </div>
                    ) : (
                      <table className="w-full text-left text-xs font-sans min-w-[650px]">
                        <thead>
                          <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider text-[9px] font-bold">
                            <th className="pb-3 pl-2">ID</th>
                            <th className="pb-3">User Address</th>
                            <th className="pb-3">Asset & Net</th>
                            <th className="pb-3">Dest Address</th>
                            <th className="pb-3">Status</th>
                            <th className="pb-3 pr-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {withdrawals.map((w) => (
                            <tr key={w.id} className="hover:bg-white/2 transition-all">
                              <td className="py-3 pl-2 font-mono text-[10px] text-brand-secondary">{w.id}</td>
                              <td className="py-3">
                                <span className="font-mono text-[10px] text-gray-400 block" title={w.walletAddress}>
                                  {w.walletAddress.slice(0, 6)}...{w.walletAddress.slice(-4)}
                                </span>
                                <span className="text-[9px] text-gray-500 font-semibold block uppercase">
                                  🦊 {w.walletType}
                                </span>
                              </td>
                              <td className="py-3">
                                <span className="font-bold text-white block text-xs">
                                  ${w.amount}
                                </span>
                                <span className="text-[9px] font-mono text-brand-accent block uppercase">
                                  {w.coin} ({w.network})
                                </span>
                              </td>
                              <td className="py-3 font-mono text-[10px] text-gray-400" title={w.destinationAddress}>
                                {w.destinationAddress.slice(0, 6)}...{w.destinationAddress.slice(-4)}
                              </td>
                              <td className="py-3">
                                {w.status === "pending" && (
                                  <span className="px-2 py-0.5 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[9px] font-bold uppercase animate-pulse">
                                    Pending
                                  </span>
                                )}
                                {w.status === "approved" && (
                                  <span className="px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-bold uppercase">
                                    Approved
                                  </span>
                                )}
                                {w.status === "rejected" && (
                                  <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-bold uppercase">
                                    Rejected
                                  </span>
                                )}
                              </td>
                              <td className="py-3 pr-2 text-right">
                                {w.status === "pending" ? (
                                  <div className="flex gap-1.5 justify-end">
                                    <button
                                      onClick={() => handleUpdateWithdrawalStatus(w.id, "approved")}
                                      className="px-2 py-1 bg-green-500 hover:bg-green-600 text-black font-extrabold text-[9px] rounded uppercase cursor-pointer"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleUpdateWithdrawalStatus(w.id, "rejected")}
                                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white font-bold text-[9px] rounded uppercase cursor-pointer"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[9px] text-gray-500 font-mono">
                                    {w.processedAt ? new Date(w.processedAt).toLocaleDateString() : new Date(w.createdAt).toLocaleDateString()}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Panel Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Header & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-black/40 border border-white/5 p-5 rounded-2xl">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Security & Activity Audit Logs</span>
                </h3>
                <p className="text-gray-400 text-xs mt-1">
                  Monitor application activity, system events, authentication audits, and non-sensitive operational activity logs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchSecurityLogs}
                  disabled={isLoadingSecurityLogs}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl border border-white/10 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSecurityLogs ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={() => setShowAddLogModal(true)}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Log Entry</span>
                </button>
                {securityLogs.length > 0 && (
                  <button
                    onClick={handleClearAllSecurityLogs}
                    className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>
            </div>

            {/* Overview Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Total Logs</span>
                <span className="text-2xl font-bold text-white">{securityLogs.length}</span>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">System Status</span>
                <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active / Protected
                </span>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Warnings / Alerts</span>
                <span className="text-2xl font-bold text-amber-400">
                  {securityLogs.filter(l => l.severity === 'warning' || l.severity === 'error' || l.severity === 'critical').length}
                </span>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-2xl p-4">
                <span className="block text-[10px] text-gray-500 font-bold uppercase mb-1">Last Activity</span>
                <span className="text-xs font-mono text-gray-300 block mt-2 truncate">
                  {securityLogs.length > 0 ? new Date(securityLogs[0].timestamp).toLocaleString() : 'No activity logged'}
                </span>
              </div>
            </div>

            {/* Filter Bar & View Toggle */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-black/30 border border-white/5 p-4 rounded-2xl">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={securitySearch}
                  onChange={(e) => setSecuritySearch(e.target.value)}
                  placeholder="Search logs by Wallet Name or Data Text..."
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center bg-black/50 border border-white/10 rounded-xl p-1 gap-1">
                  <button
                    onClick={() => setSecurityViewMode('wallet_data_option')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      securityViewMode === 'wallet_data_option'
                        ? 'bg-emerald-500 text-black font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Wallet & Data Text View
                  </button>
                  <button
                    onClick={() => setSecurityViewMode('standard')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                      securityViewMode === 'standard'
                        ? 'bg-emerald-500 text-black font-bold shadow'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Full Security Logs
                  </button>
                </div>

                {securityViewMode === 'standard' && (
                  <>
                    <select
                      value={securitySeverityFilter}
                      onChange={(e) => setSecuritySeverityFilter(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Severities</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="critical">Critical</option>
                    </select>

                    <select
                      value={securityEventFilter}
                      onChange={(e) => setSecurityEventFilter(e.target.value)}
                      className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 outline-none focus:border-emerald-500"
                    >
                      <option value="all">All Event Types</option>
                      <option value="admin_login">Admin Login</option>
                      <option value="system_alert">System Alert</option>
                      <option value="security_event">Security Event</option>
                      <option value="settings_updated">Settings Updated</option>
                      <option value="wallet_connected">Wallet Connected</option>
                      <option value="withdrawal_request">Withdrawal Request</option>
                    </select>
                  </>
                )}
              </div>
            </div>

            {/* Security Table Display based on selected option */}
            {securityViewMode === 'wallet_data_option' ? (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/40 shadow-xl">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead className="bg-white/5 text-gray-200 uppercase text-[11px] font-bold border-b border-white/10">
                    <tr>
                      <th className="p-4 border-r border-white/10 w-1/2">Wallet Name</th>
                      <th className="p-4 w-1/2">Data Text</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10 text-gray-300">
                    {securityLogs.length > 0 ? (
                      securityLogs
                        .filter(log => {
                          const matchesSearch =
                            log.title.toLowerCase().includes(securitySearch.toLowerCase()) ||
                            log.details.toLowerCase().includes(securitySearch.toLowerCase()) ||
                            (log.actorWallet && log.actorWallet.toLowerCase().includes(securitySearch.toLowerCase()));
                          return matchesSearch;
                        })
                        .map((log) => (
                          <tr key={log.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 border-r border-white/10 font-medium text-emerald-400">
                              {log.actorWallet || "When a user selects a wallet"}
                            </td>
                            <td className="p-4 text-gray-200 font-mono text-[11px]">
                              {log.details || log.title || "When a user imports data"}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 border-r border-white/10 font-medium text-emerald-400">When a user selects a wallet</td>
                          <td className="p-4 text-gray-200 font-mono text-[11px]">When a user imports data</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 border-r border-white/10 font-medium text-emerald-400">When a user selects a wallet</td>
                          <td className="p-4 text-gray-200 font-mono text-[11px]">When a user imports data</td>
                        </tr>
                        <tr className="hover:bg-white/5 transition-colors">
                          <td className="p-4 border-r border-white/10 font-medium text-emerald-400">When a user selects a wallet</td>
                          <td className="p-4 text-gray-200 font-mono text-[11px]">When a user imports data</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/25">
                <table className="w-full text-left text-xs font-sans">
                  <thead className="bg-white/2 text-gray-400 uppercase text-[10px] font-bold border-b border-white/5">
                    <tr>
                      <th className="p-4">Wallet Name</th>
                      <th className="p-4">Data Text</th>
                      <th className="p-4">Event Type</th>
                      <th className="p-4">Severity</th>
                      <th className="p-4">Timestamp & IP</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {securityLogs
                      .filter(log => {
                        const matchesSearch =
                          log.title.toLowerCase().includes(securitySearch.toLowerCase()) ||
                          log.details.toLowerCase().includes(securitySearch.toLowerCase()) ||
                          (log.sourceIp && log.sourceIp.includes(securitySearch)) ||
                          (log.actorWallet && log.actorWallet.toLowerCase().includes(securitySearch.toLowerCase()));
                        const matchesSeverity = securitySeverityFilter === 'all' || log.severity === securitySeverityFilter;
                        const matchesEvent = securityEventFilter === 'all' || log.eventType === securityEventFilter;
                        return matchesSearch && matchesSeverity && matchesEvent;
                      })
                      .map(log => (
                        <tr key={log.id} className="hover:bg-white/2 transition-colors">
                          <td className="p-4 font-mono text-emerald-400 font-bold">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <span>{log.actorWallet || 'MetaMask / System'}</span>
                            </div>
                            <span className="text-[10px] text-gray-500 font-normal block mt-0.5">{log.id}</span>
                          </td>
                          <td className="p-4 max-w-sm">
                            <div className="font-bold text-white text-xs">{log.title}</div>
                            <div className="text-gray-400 text-[11px] mt-0.5 line-clamp-2" title={log.details}>
                              {log.details}
                            </div>
                          </td>
                          <td className="p-4 font-mono text-gray-300 text-[11px]">
                            {log.eventType}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.severity === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                              log.severity === 'error' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                              log.severity === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {log.severity}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-gray-400 text-[11px]">
                            <div>{new Date(log.timestamp).toLocaleString()}</div>
                            <div className="text-[10px] text-gray-500">{log.sourceIp || '127.0.0.1'}</div>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setSelectedLogDetail(log)}
                                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-300 hover:text-white cursor-pointer transition-colors"
                                title="View Full Details"
                              >
                                <Search className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSecurityLog(log.id)}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer transition-colors"
                                title="Delete Log Entry"
                              >
                                <Trash className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {securityLogs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No security logs found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Modal: Add Manual Security Log Entry */}
            {showAddLogModal && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Create Security Audit Entry</span>
                    </h3>
                    <button
                      onClick={() => setShowAddLogModal(false)}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddSecurityLog} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Option 1: Wallet Name</label>
                      <input
                        type="text"
                        value={newLogWallet}
                        onChange={(e) => setNewLogWallet(e.target.value)}
                        placeholder="e.g. MetaMask / Trust Wallet / User Address"
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Event Title</label>
                      <input
                        type="text"
                        value={newLogTitle}
                        onChange={(e) => setNewLogTitle(e.target.value)}
                        placeholder="e.g. Withdrawal Request Submitted"
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 mb-1">Option 2: Data Text</label>
                      <textarea
                        value={newLogDetails}
                        onChange={(e) => setNewLogDetails(e.target.value)}
                        placeholder="Sequential data record text..."
                        rows={3}
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-emerald-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Severity</label>
                        <select
                          value={newLogSeverity}
                          onChange={(e: any) => setNewLogSeverity(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-xs text-white outline-none focus:border-emerald-500"
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="error">Error</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-400 mb-1">Event Type</label>
                        <select
                          value={newLogEventType}
                          onChange={(e) => setNewLogEventType(e.target.value)}
                          className="w-full bg-black/50 border border-white/10 rounded-xl p-2 text-xs text-white outline-none focus:border-emerald-500"
                        >
                          <option value="security_event">Security Event</option>
                          <option value="system_alert">System Alert</option>
                          <option value="admin_login">Admin Login</option>
                          <option value="settings_updated">Settings Updated</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddLogModal(false)}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Save Entry
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: View Selected Security Log Detail */}
            {selectedLogDetail && (
              <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-gray-900 border border-white/10 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <h3 className="font-bold text-white text-base flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Security Log Details</span>
                    </h3>
                    <button
                      onClick={() => setSelectedLogDetail(null)}
                      className="text-gray-400 hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="text-gray-500 block uppercase text-[10px] font-bold">Log ID</span>
                      <span className="font-mono text-emerald-400 font-bold">{selectedLogDetail.id}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 block uppercase text-[10px] font-bold">Timestamp</span>
                      <span className="text-gray-300 font-mono">{new Date(selectedLogDetail.timestamp).toLocaleString()}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 block uppercase text-[10px] font-bold">Wallet Name / Source</span>
                      <span className="text-emerald-400 font-mono font-bold">{selectedLogDetail.actorWallet || 'MetaMask / System'}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 block uppercase text-[10px] font-bold">Event Title</span>
                      <span className="text-white font-bold">{selectedLogDetail.title}</span>
                    </div>

                    <div>
                      <span className="text-gray-500 block uppercase text-[10px] font-bold">Details</span>
                      <p className="text-gray-300 bg-black/40 border border-white/5 p-3 rounded-xl mt-1 leading-relaxed">
                        {selectedLogDetail.details}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-gray-500 block uppercase text-[10px] font-bold">Severity</span>
                        <span className="font-mono text-gray-300 uppercase font-bold">{selectedLogDetail.severity}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block uppercase text-[10px] font-bold">Source IP</span>
                        <span className="font-mono text-gray-300">{selectedLogDetail.sourceIp || '127.0.0.1'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <button
                      onClick={() => handleDeleteSecurityLog(selectedLogDetail.id)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Delete Log
                    </button>
                    <button
                      onClick={() => setSelectedLogDetail(null)}
                      className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
