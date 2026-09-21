"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Volume2,
  VolumeX,
  CheckCircle2,
  FileText,
  Activity,
  ShieldCheck,
  Clock,
  Sparkles,
} from "lucide-react";
import { Navbar } from "./Navbar";
import { useLanguage } from "../lib/languageContext";

export interface ConsentProps {
  onBack?: () => void;
  onConsent?: () => void;
  step?: string;
  patientName?: string;
}

export const Consent: React.FC<ConsentProps> = ({
  onBack,
  onConsent,
  step = "Step 2 of 3",
  patientName = "Shriram Vaidya",
}) => {
  const { t } = useLanguage();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handlePlayAudio = () => {
    setIsPlayingAudio((prev) => !prev);
    if (!isPlayingAudio) {
      setStatusMessage("Audio explanation is now playing in Marathi / Hindi / English...");
    } else {
      setStatusMessage("Audio playback paused.");
    }
  };

  const handleGiveConsent = () => {
    setHasConsented(true);
    setStatusMessage("Consent confirmed securely. Proceeding to consultation...");
    if (onConsent) {
      setTimeout(() => {
        onConsent();
      }, 400);
    }
  };

  const consentPoints = [
    {
      icon: <FileText className="w-5 h-5 text-[#347355]" />,
      title: t("whatWeCollect"),
      desc: t("whatWeCollectDesc"),
    },
    {
      icon: <Activity className="w-5 h-5 text-[#347355]" />,
      title: t("howItIsUsed"),
      desc: t("howItIsUsedDesc"),
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#347355]" />,
      title: t("dataProtection"),
      desc: t("dataProtectionDesc"),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-[#f0fff4] text-[#092c20] font-mono antialiased flex flex-col">
      {/* Top Navigation Bar with Profile Icon */}
      <Navbar
        isLoggedIn={true}
        patientName={patientName || "Shriram Vaidya"}
        onProfileClick={onBack}
      />

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] overflow-y-auto lg:overflow-hidden">
        {/* Content Section */}
        <section
          aria-label="Consent form"
          className="flex items-center justify-center p-6 sm:p-10 lg:p-16"
        >
          <div className="w-full max-w-[620px]">
            {/* Back button */}
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 mb-6 text-xs sm:text-sm font-bold text-[#347355] hover:text-[#003d29] transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              <span>← {t("cancel")}</span>
            </button>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#347355] bg-[#c9fdd7]/70 px-2.5 py-0.5 rounded-full border border-[#003d29]/10">
                {t("step2of3")}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#003d29] tracking-tight leading-tight">
              {t("abdmConsentRequest")}
            </h1>

            <p className="mt-3 mb-6 text-xs sm:text-sm text-[#587366] leading-relaxed">
              {t("consentRequestSubtitle")}
            </p>

            {/* Itemized consent points */}
            <ul className="divide-y divide-[#003d29]/15 border-y border-[#003d29]/15 mb-6">
              {consentPoints.map((item, idx) => (
                <li key={idx} className="grid grid-cols-[32px_1fr] gap-3.5 py-3.5 sm:py-4 items-start">
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-[#c9fdd7]/40 border border-[#003d29]/10">
                    {item.icon}
                  </div>
                  <div>
                    <strong className="block text-xs sm:text-sm font-bold text-[#003d29]">
                      {item.title}
                    </strong>
                    <span className="block mt-0.5 text-xs text-[#587366] leading-relaxed">
                      {item.desc}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            {/* Action buttons */}
            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePlayAudio}
                className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isPlayingAudio
                    ? "bg-[#c9fdd7] border-[#347355] text-[#003d29] shadow-sm animate-pulse"
                    : "border-[#003d29]/30 text-[#003d29] bg-white/50 hover:bg-[#c9fdd7]/40"
                }`}
              >
                {isPlayingAudio ? (
                  <>
                    <VolumeX className="w-4 h-4 text-[#003d29]" />
                    <span>Pause Audio</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4 text-[#347355]" />
                    <span>Play Audio</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleGiveConsent}
                className="flex-[1.2] flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] text-xs sm:text-sm font-bold shadow-lg shadow-[#003d29]/15 hover:shadow-[#003d29]/25 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              >
                <CheckCircle2 className="w-4 h-4 text-[#6bbf8c]" />
                <span>{t("grantConsent")}</span>
              </button>
            </div>

            {/* Status notice */}
            {statusMessage && (
              <p
                role="status"
                aria-live="polite"
                className={`mt-4 text-center text-xs font-semibold p-2.5 rounded-lg border ${
                  hasConsented
                    ? "bg-[#c9fdd7]/70 text-[#003d29] border-[#347355]/30"
                    : "bg-white/80 text-[#347355] border-[#003d29]/15"
                }`}
              >
                {statusMessage}
              </p>
            )}
          </div>
        </section>

        {/* Visual Panel */}
        <aside
          aria-label="Carelink visual info"
          className="relative order-first lg:order-last flex flex-col justify-between items-center min-h-[260px] sm:min-h-[340px] lg:min-h-screen p-6 sm:p-10 lg:p-14 bg-[#003d29] text-[#f0fff4] overflow-hidden"
        >
          {/* Concentric rings */}
          <div
            className="pointer-events-none absolute w-[300px] sm:w-[420px] h-[300px] sm:h-[420px] rounded-full border border-[#c9fdd7]/15 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            aria-hidden="true"
          />

          {/* Top Status Badges */}
          <div className="w-full flex items-center justify-between relative z-10">
            <span className="px-2.5 py-0.5 rounded-full bg-[#c9fdd7]/15 text-[#c9fdd7] text-[11px] font-bold border border-[#c9fdd7]/25">
              Secure Data Sharing
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[#6bbf8c] font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ABDM Compliant</span>
            </div>
          </div>

          {/* Central Illustration */}
          <div className="relative z-10 my-4 sm:my-auto w-full max-w-[240px] sm:max-w-[340px] lg:max-w-[420px] aspect-square">
            <Image
              src="/assets/consent.png"
              alt="Carelink patient consent and privacy shield"
              fill
              sizes="(max-width: 768px) 240px, (max-width: 1024px) 340px, 420px"
              priority
              className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)]"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith("/consent.png")) {
                  target.src = "/consent.png";
                }
              }}
            />
          </div>

          {/* Bottom Note */}
          <p className="hidden sm:block relative z-10 text-right w-full text-[11px] text-[#f0fff4]/70 max-w-[260px] ml-auto leading-relaxed">
            {t("dataProtectionDesc")}
          </p>
        </aside>
      </main>
    </div>
  );
};

export default Consent;
