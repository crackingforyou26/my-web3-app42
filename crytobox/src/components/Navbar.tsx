/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Coins, LogIn, Menu, X, Settings, UserCheck, LogOut, Bell } from "lucide-react";
import { useState, useEffect } from "react";

interface NavbarProps {
  walletAddress: string | null;
  onConnectClick: () => void;
  onDisconnect: () => void;
  isAdminMode: boolean;
  onToggleAdmin: () => void;
  announcement?: string;
  currentUser?: any;
  onWithdrawClick?: () => void;
  isWithdrawEligible?: boolean;
}

export default function Navbar({
  walletAddress,
  onConnectClick,
  onDisconnect,
  isAdminMode,
  onToggleAdmin,
  announcement,
  currentUser,
  onWithdrawClick,
  isWithdrawEligible = false,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="w-full sticky top-0 z-40">
      {/* Top announcement bar */}
      {announcement && (
        <div className="w-full py-2.5 px-4 bg-brand-accent text-brand-bg font-sans font-bold text-xs text-center relative overflow-hidden flex items-center justify-center gap-2 shadow-neon-green">
          <span className="flex-shrink-0 animate-bounce">⚡</span>
          <span className="truncate">{announcement}</span>
        </div>
      )}

      {/* Main header navbar */}
      <nav
        id="main-nav"
        className={`w-full transition-all duration-300 ${
          scrolled
            ? "bg-brand-bg/90 border-b border-brand-primary/10 backdrop-blur-md shadow-lg py-3"
            : "bg-transparent py-4 border-b border-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center gap-2.5 group cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                window.location.reload();
              }}
            >
              <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(108,92,231,0.5)] transition-transform duration-300 group-hover:scale-110">
                📦
              </span>
              <div className="flex flex-col">
                <span className="font-display font-black text-2xl tracking-tighter text-white">
                  Cryto<span className="text-brand-secondary">box</span>
                </span>
                <span className="text-[9px] font-mono font-bold tracking-widest text-brand-accent uppercase -mt-1">
                  Web3 Discover
                </span>
              </div>
            </a>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              <a
                id="nav-explore"
                href="#explore"
                className="text-gray-300 hover:text-white font-medium text-sm transition-colors cursor-pointer"
              >
                Explorer
              </a>
              <a
                id="nav-about"
                href="#about"
                className="text-gray-300 hover:text-white font-medium text-sm transition-colors cursor-pointer"
              >
                About Us
              </a>
              <a
                id="nav-faq"
                href="#faq"
                className="text-gray-300 hover:text-white font-medium text-sm transition-colors cursor-pointer"
              >
                FAQ
              </a>
              <a
                id="nav-foundation"
                href="#foundation"
                className="text-gray-300 hover:text-white font-medium text-sm transition-colors cursor-pointer"
              >
                Foundation Team
              </a>

              {/* Admin Toggle Button */}
              <button
                id="admin-toggle-btn"
                onClick={onToggleAdmin}
                className={`p-2 rounded-xl border flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isAdminMode
                    ? "bg-brand-primary/15 border-brand-primary text-brand-primary shadow-neon-purple text-xs font-semibold"
                    : "border-white/5 hover:border-white/10 text-gray-400 hover:text-white text-xs font-medium"
                }`}
                title="Toggle Administrative Workspace"
              >
                <Settings className={`w-4 h-4 ${isAdminMode ? "animate-spin" : ""}`} style={{ animationDuration: '6s' }} />
                <span>{isAdminMode ? "Admin Console" : "Admin Panel"}</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button
                  id="notif-btn"
                  onClick={() => setNotificationOpen(!notificationOpen)}
                  className="p-2.5 rounded-xl border border-white/5 hover:border-white/10 text-gray-400 hover:text-white transition-all cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-accent shadow-neon-green" />
                </button>

                {notificationOpen && (
                  <div className="absolute right-0 mt-3 w-80 rounded-2xl glass-panel border border-white/10 p-4 shadow-glass z-50">
                    <h4 className="font-display font-bold text-white text-sm mb-3">Recent Activities</h4>
                    <div className="flex flex-col gap-2">
                      <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs text-gray-300">
                        <strong className="text-brand-secondary">Monad Airdrop</strong> rewards increased to $1000+ per wallet.
                      </div>
                      <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs text-gray-300">
                        Join fees reduced by administrator to <strong className="text-brand-accent">0.003 ETH</strong>.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Connected State vs Connect Trigger */}
              {walletAddress ? (
                <div className="flex items-center gap-2">
                  {currentUser && (() => {
                    const COIN_CONVERSION_RATES: Record<string, number> = { USDT: 1, ETH: 3200, BNB: 580, BTC: 65000 };
                    const totalNavAvailableUSD = Object.entries(currentUser?.availableBalances || {}).reduce(
                      (acc, [coin, val]) => acc + ((val as number) * (COIN_CONVERSION_RATES[coin.toUpperCase()] || 1)),
                      0
                    );
                    const totalNavPendingUSD = Object.entries(currentUser?.pendingBalances || {}).reduce(
                      (acc, [coin, val]) => acc + ((val as number) * (COIN_CONVERSION_RATES[coin.toUpperCase()] || 1)),
                      0
                    );

                    return (
                      <div className="hidden sm:flex items-center gap-2">
                        <div 
                          className="flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1.5 font-mono text-xs text-green-400 font-bold"
                          title="Withdrawable Available Balance (Updated by Admin)"
                        >
                          <Coins className="w-3.5 h-3.5 text-green-400" />
                          <span>${totalNavAvailableUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {onWithdrawClick && (
                    <button
                      id="navbar-withdraw-btn"
                      disabled={!isWithdrawEligible}
                      onClick={onWithdrawClick}
                      className={`px-3.5 py-2 rounded-xl text-xs font-display font-black tracking-tight transition-all duration-300 ${
                        isWithdrawEligible
                          ? "bg-gradient-to-r from-brand-primary to-brand-secondary text-white shadow-neon cursor-pointer hover:opacity-95 animate-pulse"
                          : "bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed"
                      }`}
                      title={isWithdrawEligible ? "Open withdrawal portal" : "Withdrawal is disabled (criteria pending)"}
                    >
                      Withdraw
                    </button>
                  )}

                  <div className="flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 rounded-xl px-4 py-2 font-mono text-xs text-brand-accent">
                    <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse shadow-neon-green" />
                    <span>{formatAddress(walletAddress)}</span>
                  </div>
                  <button
                    id="disconnect-wallet-btn"
                    onClick={onDisconnect}
                    className="p-2 rounded-xl border border-red-500/15 text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Disconnect Wallet"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="connect-wallet-btn"
                  onClick={onConnectClick}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-display font-bold text-xs text-white bg-gradient-to-r from-brand-primary via-brand-primary to-brand-secondary hover:opacity-95 transition-all duration-300 shadow-neon cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Connect Wallet</span>
                </button>
              )}
            </div>

            {/* Mobile Menu Icon */}
            <div className="flex md:hidden items-center gap-3">
              <button
                id="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden w-full bg-brand-bg/95 border-b border-white/5 backdrop-blur-lg px-4 pt-2 pb-6 flex flex-col gap-4 animate-fadeIn">
            <a
              href="#explore"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white font-medium text-sm py-2 border-b border-white/5"
            >
              Explorer
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white font-medium text-sm py-2 border-b border-white/5"
            >
              About Us
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white font-medium text-sm py-2 border-b border-white/5"
            >
              FAQ
            </a>
            <a
              href="#foundation"
              onClick={() => setMobileMenuOpen(false)}
              className="text-gray-300 hover:text-white font-medium text-sm py-2 border-b border-white/5"
            >
              Foundation Team
            </a>

            <button
              onClick={() => {
                onToggleAdmin();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2 text-gray-300 font-medium text-sm py-2 border-b border-white/5"
            >
              <Settings className="w-4 h-4" />
              <span>{isAdminMode ? "Exit Admin Console" : "Admin Panel Setup"}</span>
            </button>

            {walletAddress ? (
              <div className="flex flex-col gap-3 pt-2">
                {currentUser && currentUser.balance !== undefined && (
                  <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-gray-300 w-full">
                    <Coins className="w-4 h-4 text-brand-accent" />
                    <span>Balance: {currentUser.balance.toFixed(4)} ETH</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-brand-accent/10 border border-brand-accent/20 rounded-xl px-4 py-3 font-mono text-xs text-brand-accent w-full">
                  <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse shadow-neon-green" />
                  <span>{formatAddress(walletAddress)}</span>
                </div>
                <button
                  onClick={() => {
                    onDisconnect();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-3 rounded-xl border border-red-500/20 text-red-400 font-bold text-xs bg-red-500/5 hover:bg-red-500/10 cursor-pointer"
                >
                  Disconnect Wallet
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onConnectClick();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-bold text-xs text-center shadow-neon cursor-pointer"
              >
                Connect Wallet
              </button>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}
