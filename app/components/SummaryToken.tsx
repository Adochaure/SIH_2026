"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import { Navbar } from "./Navbar";

export interface SummaryTokenProps {
  patientName?: string;
  tokenNumber?: string;
  queuePosition?: number | string;
  estimatedWaitMinutes?: number;
  onReturnToDashboard?: () => void;
}

export const SummaryToken: React.FC<SummaryTokenProps> = ({
  patientName = "Shriram Vaidya",
  tokenNumber = "A-104",
  queuePosition = 1,
  estimatedWaitMinutes = 8,
  onReturnToDashboard,
}) => {
  return (
    <div className="min-h-screen w-full bg-[#f0fff4] text-[#092c20] font-mono antialiased flex flex-col">
      {/* Top Navigation Bar with Profile Icon */}
      <Navbar
        isLoggedIn={true}
        patientName={patientName}
        onProfileClick={onReturnToDashboard}
      />

      {/* Main Center Card */}
      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto text-center px-4 py-8">
        {onReturnToDashboard && (
          <div className="w-full flex justify-start mb-4">
            <button
              type="button"
              onClick={onReturnToDashboard}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#347355] hover:text-[#003d29] cursor-pointer transition-colors bg-white px-3 py-1.5 rounded-lg border border-[#003d29]/15 shadow-xs"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        )}
        {/* Circle illustration */}
        <div className="relative mx-auto mb-6 sm:mb-8 w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full bg-[#c9fdd7] flex items-center justify-center overflow-hidden border-4 border-white shadow-xl shadow-[#003d29]/10">
          <div className="relative w-40 h-40 sm:w-56 sm:h-56">
            <Image
              src="/assets/summary.png"
              alt="Medical history summary ready"
              fill
              sizes="(max-width: 640px) 160px, 224px"
              priority
              className="object-contain drop-shadow-md"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith("/summary.png")) {
                  target.src = "/summary.png";
                }
              }}
            />
          </div>
        </div>

        {/* Heading & Subheading */}
        <div className="flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-[#347355] mb-2">
          <CheckCircle2 className="w-4 h-4 text-[#347355]" />
          <span>Synchronized with ABDM</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#003d29] tracking-tight leading-tight">
          Your medical history is ready
        </h1>

        <p className="mt-3 mb-8 text-xs sm:text-sm text-[#587366] leading-relaxed max-w-md mx-auto">
          Your doctor can now review your health history and symptoms before calling you into the consultation.
        </p>

        {/* Notched Voucher / Ticket Card */}
        <div className="relative mx-auto max-w-lg bg-[#e8efea] border border-[#003d29]/15 rounded-2xl shadow-lg shadow-[#003d29]/05 overflow-hidden ticket-notch">
          <div className="grid grid-cols-2 divide-x divide-dashed divide-[#003d29]/25 py-6 px-4 sm:px-8 items-center">
            {/* Left Ticket Half */}
            <div className="text-center px-2">
              <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#587366]">
                Your Token Number
              </span>
              <strong className="block mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#003d29] tracking-tight">
                {tokenNumber}
              </strong>
            </div>

            {/* Right Ticket Half */}
            <div className="text-center px-2">
              <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#587366]">
                Queue Position
              </span>
              <strong className="block mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#347355] tracking-tight">
                {queuePosition}
              </strong>
            </div>
          </div>

          {/* Sub-bar inside ticket */}
          {estimatedWaitMinutes && (
            <div className="bg-[#003d29]/5 py-2.5 px-4 text-center border-t border-[#003d29]/10 flex items-center justify-center gap-1.5 text-xs text-[#587366]">
              <Clock className="w-3.5 h-3.5 text-[#347355]" />
              <span>
                Estimated wait: <strong>~{estimatedWaitMinutes} mins</strong>
              </span>
            </div>
          )}
        </div>

        {/* Live waiting announcement */}
        <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 border border-[#003d29]/15 text-xs text-[#587366] shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6bbf8c] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#347355]" />
          </span>
          <span>Please wait in the waiting area. You will be called.</span>
        </div>
      </main>
    </div>
  );
};

export default SummaryToken;

