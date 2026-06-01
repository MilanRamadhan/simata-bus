"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/AppContext";
import { fadeSlideUp } from "@/animations/variants";

interface Props {
  onNavigate: (page: string) => void;
}

export default function CustomerNavbar({ onNavigate }: Props) {
  const { user, logout } = useAppStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "transparent",
        height: "var(--header-h, 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "24px 48px",
      }}
    >
      {/* Brand */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate("home")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          userSelect: "none",
          background: "none",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "10px",
            background: "rgba(51, 51, 51, 0.1)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#333333",
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "Inter, sans-serif",
          }}
        >
          S
        </div>
        <span style={{ fontWeight: 600, fontSize: 24, color: "#333333", fontFamily: "Inter, sans-serif", letterSpacing: "-0.025em" }}>SIMATA</span>
      </motion.div>

      {/* Nav Links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {[
          { key: "home", label: "Beranda", target: "home" },
          { key: "history", label: "Pesanan Saya", target: "history" },
        ].map((item) =>
          (() => {
            const isActive = item.key === "history" ? pathname === "/history" : pathname === "/home";
            return (
              <motion.button
                key={item.key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onNavigate(item.target)}
                style={{
                  border: "none",
                  background: "transparent",
                  color: isActive ? "#333333" : "rgba(51, 51, 51, 0.7)",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "color 0.3s",
                  fontFamily: "Inter, sans-serif",
                  padding: 0,
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#333333";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = isActive ? "#333333" : "rgba(51, 51, 51, 0.7)";
                }}
              >
                {item.label}
                <span
                  style={{
                    position: "absolute",
                    bottom: -4,
                    left: 0,
                    height: 1,
                    width: isActive ? "100%" : 0,
                    background: "#333333",
                    borderRadius: 1,
                    transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                />
              </motion.button>
            );
          })(),
        )}
      </div>

      {/* User Section */}
      <div style={{ position: "relative" }}>
        {user ? (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowDropdown((p) => !p)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "6px 16px 6px 6px",
              borderRadius: "var(--radius-full)",
              border: "1px solid rgba(51, 51, 51, 0.15)",
              background: "rgba(255,255,255,0.78)",
              backdropFilter: "blur(12px)",
              cursor: "pointer",
              transition: "all var(--transition)",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-main)", paddingRight: 8 }}>{user.name}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-light)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate("/")}
            style={{
              padding: "8px 24px",
              borderRadius: "var(--radius-full)",
              border: "none",
              background: "var(--primary)",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            Masuk / Daftar
          </motion.button>
        )}

        <AnimatePresence>
          {showDropdown && user && (
            <>
              {/* Invisible backdrop to close dropdown */}
              <div onClick={() => setShowDropdown(false)} style={{ position: "fixed", inset: 0, zIndex: 50 }} />
              <motion.div
                variants={fadeSlideUp}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={{
                  position: "absolute",
                  top: "calc(100% + 12px)",
                  right: 0,
                  width: 260,
                  background: "var(--bg-white)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-xl)",
                  boxShadow: "var(--shadow-card)",
                  overflow: "hidden",
                  zIndex: 51,
                }}
              >
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", background: "var(--bg-main)" }}>
                  <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-main)" }}>{user?.name}</div>
                  <div style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>{user?.email}</div>
                </div>
                <div style={{ padding: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      borderRadius: "var(--radius)",
                      border: "none",
                      background: "transparent",
                      color: "#B91C1C", // red 700
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "background var(--transition)",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "#FEE2E2"; // light red
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Keluar / Logout
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
