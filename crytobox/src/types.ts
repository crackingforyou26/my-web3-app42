/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Airdrop {
  id: string;
  name: string;
  logo: string;
  description: string;
  reward: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeRemaining: string; // e.g. "5 days left" or date
  blockchain: string; // e.g. "Ethereum", "Solana", "BNB Chain", "Polygon", "Base", "Arbitrum", "Avalanche"
  joinUrl: string;
  category: string;
  featured: boolean;
  popular: boolean;
  trending: boolean;
  status: 'active' | 'completed' | 'upcoming';
  detailedSteps: string[];
  requirements: string[];
  claimFee?: number;
}

export interface User {
  walletAddress: string;
  joinedAirdrops: string[]; // List of airdrop IDs joined
  pendingRewards: string;
  completedRewards: string;
  status: 'active' | 'blocked';
  joinedAt: string;
  referredBy?: string;
  rank: number;
  points: number;
  balance: number;
  availableBalances?: Record<string, number>;
  pendingBalances?: Record<string, number>;
  totalEarnings?: Record<string, number>;
}

export interface Transaction {
  id: string;
  walletAddress: string;
  airdropId: string;
  airdropName: string;
  amount: number; // Join fee charged
  txHash: string;
  status: 'pending' | 'success' | 'failed' | 'rejected';
  timestamp: string;
  screenshot?: string;
  coin?: string;
  network?: string;
}

export interface Favorite {
  walletAddress: string;
  airdropId: string;
}

export interface PaymentNetwork {
  id: string;
  coin: string;
  network: string;
  address: string;
  qrCodeUrl?: string;
  enabled: boolean;
}

export interface SystemSettings {
  siteName: string;
  siteLogo: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  announcement: string;
  isMaintenance: boolean;
  joinFee: number; // in ETH/BNB or USD
  seoTitle: string;
  seoDescription: string;
  telegramLink: string;
  twitterLink: string;
  discordLink: string;
  analyticsCode: string;
  ownerWalletAddress?: string;
  usdtAddress?: string;
  ethAddress?: string;
  bnbAddress?: string;
  btcAddress?: string;
  qrCodeAutoGeneration?: boolean;
  enablePaymentRequirement?: boolean;
  requiredFeeAmount?: string;
  supportedNetworks?: string[];
  paymentNetworks?: PaymentNetwork[];

  // Withdrawal configurations
  withdrawEnabled?: boolean;
  minWithdrawAmount?: number;
  maxWithdrawAmount?: number;
  withdrawStatus?: 'active' | 'paused';
  withdrawalProcessingTime?: string;
  withdrawalVerificationRequirement?: 'wallet_signature' | 'email_otp' | 'otp' | 'none' | 'multi_layer';
  minAirdropsRequired?: number;
  requireAccountVerification?: boolean;
}

export interface WithdrawalRequest {
  id: string;
  walletAddress: string;
  walletType: string;
  coin: string;
  network: string;
  amount: number;
  fee: number;
  netAmount: number;
  destinationAddress: string;
  status: 'pending' | 'approved' | 'rejected';
  verificationMethod: string;
  createdAt: string;
  processedAt?: string;
}

export interface SecurityLog {
  id: string;
  eventType: 'admin_login' | 'wallet_connected' | 'settings_updated' | 'withdrawal_request' | 'airdrop_modified' | 'system_alert' | 'security_event' | 'user_status_changed';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  details: string;
  sourceIp?: string;
  actorWallet?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string; // Lucide icon name
}

export interface FAQItem {
  question: string;
  answer: string;
}
