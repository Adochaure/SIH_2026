"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Stethoscope, User, Globe, LogOut, ShieldCheck, ChevronDown } from "lucide-react";
import { useLanguage, Language } from "../lib/languageContext";

export interface NavbarProps {
  isLoggedIn?: boolean;
  userType?: "patient" | "doctor";
  patientName?: string;
  patientInitials?: string;
  avatarUrl?: string;
  onDoctorLoginClick?: () => void;
  onPatientLoginClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
  language?: Language | string;
  onLanguageChange?: (lang: Language) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn = false,
  userType = "patient",
  patientName = "Shriram Vaidya",
  patientInitials = "SV",
  avatarUrl = "/assets/login.png",
  onDoctorLoginClick,
  onPatientLoginClick,
  onProfileClick,
  onLogout,
  language: controlledLanguage,
  onLanguageChange,
}) => {
  const { language: ctxLang, setLanguage: ctxSetLanguage, t } = useLanguage();
  const currentLang = (controlledLanguage as Language) ?? ctxLang;

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProfileMenuOpen]);

  const handleLanguageChange = (val: string) => {
    const l = val as Language;
    ctxSetLanguage(l);
    if (onLanguageChange) onLanguageChange(l);
  };

  return (
    <header className="h-14 sm:h-16 px-3 sm:px-6 md:px-8 flex items-center justify-between border-b border-[#002619] bg-[#003d29] text-[#f0fff4] sticky top-0 z-40 flex-shrink-0 shadow-sm w-full">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <a
          href="#"
          className="inline-flex items-center gap-2 text-[#f0fff4] no-underline group flex-shrink-0"
          aria-label="Carelink home"
        >
          <div className="grid place-items-center w-7 h-7 sm:w-9 sm:h-9 rounded-lg bg-white p-1 shadow-xs border border-white/10 transition-transform group-hover:scale-105">
            <Image
              src="/assets/carelink.png"
              alt="Carelink logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith("/carelink.png")) {
                  target.src = "/carelink.png";
                }
              }}
            />
          </div>
          <span className="font-bold tracking-tight lowercase text-sm sm:text-lg text-[#f0fff4]">
            {t("carelink")}
          </span>
        </a>

        {userType === "doctor" && (
          <span className="hidden md:inline-block px-2.5 py-0.5 rounded-full bg-[#c9fdd7]/15 text-[#c9fdd7] text-[10px] sm:text-[11px] font-bold border border-[#c9fdd7]/25">
            {t("doctorPortal")}
          </span>
        )}
      </div>

      {/* Right Corner Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
        {/* Pre-Login Actions */}
        {!isLoggedIn && (
          <>
            {userType === "patient" ? (
              <button
                type="button"
                onClick={onDoctorLoginClick}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#c9fdd7]/25 bg-white/10 hover:bg-white/20 text-[#f0fff4] text-xs font-bold transition-all shadow-xs cursor-pointer group"
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#c9fdd7] group-hover:text-white transition-colors stroke-[2.2]" />
                <span className="whitespace-nowrap">{t("doctorLogin")}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPatientLoginClick}
                className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-[#c9fdd7]/25 bg-white/10 hover:bg-white/20 text-[#f0fff4] text-xs font-bold transition-all shadow-xs cursor-pointer group"
              >
                <User className="w-3.5 h-3.5 text-[#c9fdd7] group-hover:text-white transition-colors stroke-[2.2]" />
                <span className="whitespace-nowrap">{t("patientLogin")}</span>
              </button>
            )}
          </>
        )}

        {/* Post-Login: Profile Avatar & Dropdown Menu with Logout */}
        {isLoggedIn && (
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full border border-[#c9fdd7]/30 bg-white/10 hover:bg-white/20 text-[#f0fff4] transition-all shadow-xs cursor-pointer group"
              title={`Logged in as ${patientName}`}
              aria-label="Profile options"
            >
              {/* Circular Avatar */}
              <div className="relative w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#c9fdd7] text-[#003d29] font-bold text-xs flex items-center justify-center overflow-hidden ring-1 ring-white/30 flex-shrink-0">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={patientName}
                    width={28}
                    height={28}
                    className="w-full h-full object-cover scale-110"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span>{patientInitials}</span>
                )}
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#48bb78] ring-1.5 ring-[#003d29]" />
              </div>

              {/* Patient Name - Compact on Mobile */}
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-bold text-[#f0fff4] leading-tight group-hover:text-[#c9fdd7] transition-colors truncate max-w-[100px] sm:max-w-[130px]">
                  {patientName}
                </span>
                <span className="text-[9px] font-semibold text-[#c9fdd7]/80 leading-none">
                  {userType === "doctor" ? "Physician OPD" : t("abhaVerified")}
                </span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[#c9fdd7]/80 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-60 sm:w-64 bg-[#f0fff4] text-[#092c20] rounded-2xl shadow-2xl border border-[#003d29]/20 py-2 z-50 animate-fade-in font-mono text-xs">
                <div className="px-4 py-3 border-b border-[#003d29]/10">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="w-8 h-8 rounded-full bg-[#003d29] text-[#c9fdd7] font-bold flex items-center justify-center text-xs flex-shrink-0">
                      {patientInitials}
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs sm:text-sm font-bold text-[#003d29] truncate">
                        {patientName}
                      </strong>
                      <span className="block text-[10px] text-[#587366] truncate">
                        {userType === "doctor" ? "OPD Room 3 · DemoCare Hospital" : "ABHA: 12-3456-7890-1234"}
                      </span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" />
                    <span>Active Session</span>
                  </span>
                </div>

                {onProfileClick && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onProfileClick();
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-[#c9fdd7]/50 text-[#003d29] font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#347355]" />
                    <span>View Profile Details</span>
                  </button>
                )}

                {onLogout && (
                  <div className="pt-1 mt-1 border-t border-[#003d29]/10">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-700 font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-600" />
                      <span>{t("logout")}</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Multilingual Selector: English, Marathi, Hindi */}
        <div className="relative flex-shrink-0">
          <select
            value={currentLang}
            aria-label="Select language"
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="appearance-none pl-6 sm:pl-7 pr-4 sm:pr-6 py-1 sm:py-1.5 rounded-lg border border-[#c9fdd7]/25 bg-white/10 hover:bg-white/20 text-[#f0fff4] text-[11px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c9fdd7]/40"
          >
            <option value="en" className="bg-[#003d29] text-[#f0fff4]">
              EN
            </option>
            <option value="mr" className="bg-[#003d29] text-[#f0fff4]">
              मराठी
            </option>
            <option value="hi" className="bg-[#003d29] text-[#f0fff4]">
              हिंदी
            </option>
          </select>
          <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#c9fdd7] absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;
