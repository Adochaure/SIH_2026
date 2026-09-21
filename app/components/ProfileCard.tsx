"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Lock,
  Check,
  RefreshCw,
} from "lucide-react";
import { Navbar } from "./Navbar";

export interface ProfileCardProps {
  patientName?: string;
  age?: number | string;
  gender?: string;
  abhaId?: string;
  abhaAddress?: string;
  isVerified?: boolean;
  avatarUrl?: string;
  onConfirm?: () => void;
  onChangeProfile?: () => void;
  onBack?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  patientName = "Shriram Vaidya",
  age = 29,
  gender = "Male",
  abhaId = "12-3456-7890-1234",
  abhaAddress = "shriram.vaidya@abdm",
  isVerified = true,
  avatarUrl = "/assets/login.png",
  onConfirm,
  onChangeProfile,
  onBack,
}) => {
  const [statusMessage, setStatusMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleContinue = () => {
    setIsProcessing(true);
    setStatusMessage("Profile confirmed! Navigating to consent...");
    if (onConfirm) {
      setTimeout(() => {
        onConfirm();
      }, 500);
    }
  };

  const handleNotYou = () => {
    setStatusMessage("Please sign in with a different ABHA ID or mobile number.");
    if (onChangeProfile) {
      onChangeProfile();
    }
  };

  const initials = patientName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen w-full bg-[#f0fff4] text-[#092c20] font-mono antialiased flex flex-col">
      {/* Top Navigation Bar with Profile Icon */}
      <Navbar
        isLoggedIn={true}
        patientName={patientName}
        patientInitials={initials}
        avatarUrl={avatarUrl}
        onProfileClick={() => {}}
      />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(320px,0.85fr)_minmax(420px,1.15fr)] overflow-y-auto lg:overflow-hidden">
        {/* Left Visual Panel */}
        <section
          aria-label="Carelink visual"
          className="relative hidden lg:flex flex-col justify-between items-center p-12 bg-[#003d29] text-[#f0fff4] overflow-hidden"
        >
          {/* Decorative ring */}
          <div
            className="pointer-events-none absolute w-[440px] h-[440px] rounded-full border border-[#c9fdd7]/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          />

          {/* Identity Badge */}
          <div className="w-full flex items-center justify-between relative z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-[#c9fdd7]/15 text-[#c9fdd7] text-[11px] font-bold border border-[#c9fdd7]/25">
              ABDM Identity Match
            </span>
            <span className="text-[11px] text-[#c9fdd7]/70 font-semibold">
              Step 1 of 3
            </span>
          </div>

          {/* Illustration */}
          <div className="relative z-10 my-auto w-full max-w-[380px] aspect-square">
            <Image
              src="/assets/login.png"
              alt="Carelink patient verification"
              fill
              sizes="(max-width: 1024px) 100vw, 380px"
              priority
              className="object-contain drop-shadow-[0_24px_28px_rgba(0,0,0,0.28)]"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith("/login.png")) {
                  target.src = "/login.png";
                }
              }}
            />
          </div>

          <p className="relative z-10 text-xs text-[#f0fff4]/70 max-w-[280px] text-center leading-relaxed">
            Fast, secure patient matching backed by Ayushman Bharat Digital Mission.
          </p>
        </section>

        {/* Right Content Panel */}
        <section
          aria-label="Confirm patient profile"
          className="flex items-center justify-center p-6 sm:p-10 lg:p-16"
        >
          <div className="w-full max-w-[480px]">
            {/* Back button */}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 mb-6 text-xs sm:text-sm font-bold text-[#347355] hover:text-[#003d29] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to sign in</span>
            </button>


            <p className="text-[11px] font-bold uppercase tracking-widest text-[#347355] mb-2">
              Profile Confirmation
            </p>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#003d29] tracking-tight leading-tight">
              Is this you?
            </h1>

            <p className="mt-2 mb-6 text-xs sm:text-sm text-[#587366] leading-relaxed">
              Please confirm your details before we continue with your care journey.
            </p>

            {/* Profile Confirmation Card */}
            <article className="p-5 sm:p-6 bg-white border border-[#003d29]/15 rounded-2xl shadow-[0_12px_32px_rgba(0,61,41,0.08)]">
              {/* Profile Top */}
              <div className="flex items-center gap-4 pb-5 border-b border-[#003d29]/15">
                {/* Avatar with image or initials */}
                <div className="relative grid place-items-center w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 rounded-full bg-[#c9fdd7] text-[#003d29] font-bold text-lg overflow-hidden border-2 border-[#347355]/20 shadow-inner">
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={patientName}
                      fill
                      sizes="64px"
                      className="object-cover scale-110"
                      onError={(e) => {
                        // Fallback to text initials if image fails
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-[#003d29] truncate">
                    {patientName}
                  </h2>
                  <p className="text-xs text-[#587366] mt-0.5">
                    {age} years · {gender}
                  </p>
                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 bg-[#c9fdd7]/70 text-[#003d29] text-[10px] font-bold rounded-md border border-[#347355]/20">
                      <span className="grid place-items-center w-3.5 h-3.5 rounded-full bg-[#347355] text-white">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                      <span>ABHA verified</span>
                    </span>
                  )}
                </div>
              </div>

              {/* ABHA Identifier Row */}
              <div className="flex items-center justify-between gap-3 py-4 border-b border-[#003d29]/15">
                <div>
                  <span className="block text-[10px] uppercase font-bold tracking-wider text-[#587366]">
                    ABHA ID / Number
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#003d29] tracking-wide block">
                    {abhaId}
                  </span>
                  {abhaAddress && (
                    <span className="text-[11px] text-[#347355] font-medium block mt-0.5">
                      {abhaAddress}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-[#347355] bg-[#f0fff4] px-2.5 py-1 rounded-md border border-[#003d29]/10">
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </div>
              </div>

              {/* Not You Action */}
              <button
                type="button"
                onClick={handleNotYou}
                className="flex items-center justify-center gap-1.5 w-full mt-4 text-xs font-bold text-[#347355] hover:text-[#003d29] underline underline-offset-4 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Not you? Change profile</span>
              </button>
            </article>

            {/* Confirm & Continue Button */}
            <button
              type="button"
              onClick={handleContinue}
              disabled={isProcessing}
              className="group flex items-center justify-between w-full mt-5 px-5 py-3.5 sm:py-4 bg-[#003d29] hover:bg-[#347355] active:bg-[#003d29] text-[#f0fff4] rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-[#003d29]/15 hover:shadow-[#003d29]/25 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-80"
            >
              <span>{isProcessing ? "Confirming..." : "Yes, continue"}</span>
              <span className="grid place-items-center w-7 h-7 rounded-lg border border-[#f0fff4]/30 bg-white/10 group-hover:translate-x-1 transition-transform duration-200">
                <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            {/* Status notification */}
            {statusMessage && (
              <p
                role="status"
                aria-live="polite"
                className="mt-3 text-center text-xs font-semibold text-[#003d29] bg-[#c9fdd7]/70 p-2.5 rounded-lg border border-[#347355]/30"
              >
                {statusMessage}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfileCard;

