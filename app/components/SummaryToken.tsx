"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Navbar } from "./Navbar";
import { useLanguage } from "../lib/languageContext";

export interface SummaryTokenProps {
  patientName?: string;
  tokenNumber?: string;
  doctorName?: string;
  doctorRoom?: string;
  doctorHospital?: string;
  doctorQrCode?: string;
  onReturnToDashboard?: () => void;
}

export const SummaryToken: React.FC<SummaryTokenProps> = ({
  patientName = "Shriram Vaidya",
  tokenNumber = "A-104",
  doctorName = "Dr. Ananya Kulkarni",
  doctorRoom = "OPD Room 3",
  doctorHospital = "DemoCare Hospital",
  doctorQrCode = "OPD-DEMOCARE-3",
  onReturnToDashboard,
}) => {
  const { t } = useLanguage();

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
              <span>{t("backToDashboard")}</span>
            </button>
          </div>
        )}
        {/* Circle illustration */}
        <div className="relative mx-auto mb-6 sm:mb-8 w-44 h-44 sm:w-56 sm:h-56 lg:w-64 lg:h-64 rounded-full bg-[#c9fdd7] flex items-center justify-center overflow-hidden border-4 border-white shadow-xl shadow-[#003d29]/10">
          <div className="relative w-36 h-36 sm:w-48 sm:h-48">
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
          <span>{t("synchronizedWithAbdm")}</span>
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#003d29] tracking-tight leading-tight">
          {t("medicalHistoryReady")}
        </h1>

        <p className="mt-3 mb-8 text-xs sm:text-sm text-[#587366] leading-relaxed max-w-md mx-auto">
          {t("medicalHistoryReadyDesc")}
        </p>

        {/* Notched Token / Ticket Card */}
        <div className="relative mx-auto w-full max-w-lg bg-[#e8efea] border border-[#003d29]/15 rounded-2xl shadow-lg shadow-[#003d29]/05 overflow-hidden ticket-notch">
          <div className="grid grid-cols-2 divide-x divide-dashed divide-[#003d29]/25 py-6 px-4 sm:px-8 items-center">
            {/* Left Ticket Half */}
            <div className="text-center px-2">
              <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#587366]">
                {t("tokenNumberLabel")}
              </span>
              <strong className="block mt-2 text-3xl sm:text-4xl lg:text-5xl font-bold text-[#003d29] tracking-tight">
                {tokenNumber}
              </strong>
            </div>

            {/* Right Ticket Half */}
            <div className="text-center px-2">
              <span className="block text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#587366]">
                {t("assignedOpdLabel")}
              </span>
              <strong className="block mt-2 text-2xl sm:text-3xl font-bold text-[#347355] tracking-tight">
                {doctorRoom}
              </strong>
              <span className="block text-[10px] text-[#587366] mt-1 truncate">
                {doctorName}
              </span>
            </div>
          </div>

          {/* Attending Doctor Row inside ticket */}
          {doctorName && (
            <div className="bg-[#c9fdd7]/50 py-2.5 px-4 sm:px-6 border-t border-[#003d29]/10 flex items-center justify-between text-xs text-[#003d29]">
              <span>
                {doctorHospital} · <strong>{doctorRoom}</strong>
              </span>
              {doctorQrCode && (
                <span className="font-mono text-[10px] font-bold bg-[#003d29] text-[#c9fdd7] px-2 py-0.5 rounded">
                  {doctorQrCode}
                </span>
              )}
            </div>
          )}

          {/* Status announcement inside ticket */}
          <div className="bg-[#003d29]/5 py-2.5 px-4 text-center border-t border-[#003d29]/10 flex items-center justify-center gap-1.5 text-xs text-[#587366]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#347355]" />
            <span>{t("caseForwardedNote")}</span>
          </div>
        </div>

        {/* Live status announcement */}
        <div className="mt-8 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/80 border border-[#003d29]/15 text-xs text-[#587366] shadow-xs">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6bbf8c] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#347355]" />
          </span>
          <span>{t("tokenActiveNote")}</span>
        </div>
      </main>
    </div>
  );
};

export default SummaryToken;
