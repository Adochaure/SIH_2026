"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Stethoscope, User, Globe } from "lucide-react";

export interface NavbarProps {
  isLoggedIn?: boolean;
  userType?: "patient" | "doctor";
  patientName?: string;
  patientInitials?: string;
  avatarUrl?: string;
  onDoctorLoginClick?: () => void;
  onPatientLoginClick?: () => void;
  onProfileClick?: () => void;
  language?: string;
  onLanguageChange?: (lang: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLoggedIn = false,
  userType = "patient",
  patientName = "Priya Sharma",
  patientInitials = "PS",
  avatarUrl = "/assets/login.png",
  onDoctorLoginClick,
  onPatientLoginClick,
  onProfileClick,
  language: controlledLanguage,
  onLanguageChange,
}) => {
  const [internalLanguage, setInternalLanguage] = useState("en");
  const language = controlledLanguage ?? internalLanguage;

  const handleLanguageChange = (val: string) => {
    setInternalLanguage(val);
    if (onLanguageChange) onLanguageChange(val);
  };

  return (
    <header className="h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between border-b border-[#002619] bg-[#003d29] text-[#f0fff4] sticky top-0 z-30 flex-shrink-0 shadow-sm">
      {/* Brand Logo & Title */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          className="inline-flex items-center gap-2.5 text-[#f0fff4] no-underline group"
          aria-label="Carelink home"
        >
          <div className="grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white p-1 shadow-xs border border-white/10 transition-transform group-hover:scale-105">
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
          <span className="font-bold tracking-tight lowercase text-base sm:text-lg text-[#f0fff4]">
            carelink
          </span>
        </a>

        {userType === "doctor" && (
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-[#c9fdd7]/15 text-[#c9fdd7] text-[11px] font-bold border border-[#c9fdd7]/25">
            Doctor Portal
          </span>
        )}
      </div>

      {/* Right Corner Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Pre-Login Actions */}
        {!isLoggedIn && (
          <>
            {userType === "patient" ? (
              <button
                type="button"
                onClick={onDoctorLoginClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c9fdd7]/25 bg-white/10 hover:bg-white/20 text-[#f0fff4] text-xs font-bold transition-all duration-200 shadow-xs cursor-pointer group"
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#c9fdd7] group-hover:text-white transition-colors stroke-[2.2]" />
                <span className="whitespace-nowrap">Doctor Login</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onPatientLoginClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#c9fdd7]/25 bg-white/10 hover:bg-white/20 text-[#f0fff4] text-xs font-bold transition-all duration-200 shadow-xs cursor-pointer group"
              >
                <User className="w-3.5 h-3.5 text-[#c9fdd7] group-hover:text-white transition-colors stroke-[2.2]" />
                <span className="whitespace-nowrap">Patient Login</span>
              </button>
            )}
          </>
        )}

        {/* Post-Login: Profile Icon & Patient Chip */}
        {isLoggedIn && (
          <button
            type="button"
            onClick={onProfileClick}
            className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#c9fdd7]/30 bg-white/10 hover:bg-white/20 text-[#f0fff4] transition-all duration-200 shadow-xs cursor-pointer group"
            title={`Logged in as ${patientName}`}
            aria-label="Patient Profile"
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
              {/* Active / Verified Green Dot */}
              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#48bb78] ring-1.5 ring-[#003d29]" />
            </div>

            {/* Patient Name & Subtitle */}
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-[#f0fff4] leading-tight group-hover:text-[#c9fdd7] transition-colors truncate max-w-[110px] sm:max-w-[150px]">
                {patientName}
              </span>
              <span className="text-[9px] font-semibold text-[#c9fdd7]/80 leading-none">
                ABHA Verified
              </span>
            </div>
          </button>
        )}

        {/* Dark Language Selector */}
        <div className="relative">
          <select
            value={language}
            aria-label="Select language"
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="appearance-none pl-7 pr-6 py-1.5 rounded-lg border border-[#c9fdd7]/25 bg-white/10 hover:bg-white/20 text-[#f0fff4] text-xs font-bold transition-all shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#c9fdd7]/40"
          >
            <option value="en" className="bg-[#003d29] text-[#f0fff4]">
              EN
            </option>
            <option value="hi" className="bg-[#003d29] text-[#f0fff4]">
              हिंदी
            </option>
            <option value="kn" className="bg-[#003d29] text-[#f0fff4]">
              ಕನ್ನಡ
            </option>
            <option value="te" className="bg-[#003d29] text-[#f0fff4]">
              తెలుగు
            </option>
          </select>
          <Globe className="w-3.5 h-3.5 text-[#c9fdd7] absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.2]" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;

