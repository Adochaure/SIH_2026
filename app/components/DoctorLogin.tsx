"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Phone,
  HelpCircle,
} from "lucide-react";
import { Navbar } from "./Navbar";
import { useLanguage } from "../lib/languageContext";

export interface DoctorLoginProps {
  onSuccess?: (data: { mobile: string }) => void;
  onPatientLogin?: () => void;
  onRequestAccess?: () => void;
}

export const DoctorLogin: React.FC<DoctorLoginProps> = ({
  onSuccess,
  onPatientLogin,
  onRequestAccess,
}) => {
  const { t, language, setLanguage } = useLanguage();
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "error" | "success">("info");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone) {
      setStatus("Please enter your registered mobile number.");
      setStatusType("error");
      return;
    }
    if (cleanPhone.length < 10) {
      setStatus("Please enter a valid 10-digit mobile number.");
      setStatusType("error");
      return;
    }

    setStatus("Verifying doctor credentials...");
    setStatusType("success");

    if (onSuccess) {
      setTimeout(() => {
        onSuccess({ mobile: cleanPhone });
      }, 500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f0fff4] text-[#092c20] font-mono antialiased flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        isLoggedIn={false}
        userType="doctor"
        onPatientLoginClick={onPatientLogin}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main Page Shell */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(360px,0.92fr)_minmax(460px,1.08fr)] overflow-hidden">
        {/* Visual Panel for Doctors */}
        <section
          aria-label="Carelink doctor portal introduction"
          className="relative flex flex-col justify-between min-h-[300px] sm:min-h-[440px] md:min-h-full p-6 sm:p-10 lg:p-16 text-[#f0fff4] bg-[#003d29] overflow-hidden rounded-b-[30%] md:rounded-b-none md:rounded-tr-[30%] md:rounded-br-[30%]"
        >
          {/* Background Decorative Rings */}
          <div
            className="pointer-events-none absolute -right-[230px] top-[8%] w-[520px] h-[520px] rounded-full border border-[#c9fdd7]/15 z-0"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -left-[170px] bottom-[8%] w-[280px] h-[280px] rounded-full border border-[#c9fdd7]/15 z-0"
            aria-hidden="true"
          />

          {/* Centered Doctor Illustration */}
          <div className="relative z-0 my-auto py-4 flex items-center justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[560px] aspect-[4/3] max-h-[36vh] sm:max-h-[48vh] md:max-h-[57vh]">
              <Image
                src="/assets/doctorlogin.png"
                alt="Doctor reviewing complete patient history"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                priority
                className="object-contain drop-shadow-[0_28px_18px_rgba(0,0,0,0.18)]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith("/doctorlogin.png")) {
                    target.src = "/doctorlogin.png";
                  }
                }}
              />
            </div>
          </div>

          {/* Visual Copy for Doctors at bottom */}
          <div className="relative z-10 w-full max-w-[450px] mx-auto text-center mt-2">
            <p className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6bbf8c] mb-3 sm:mb-5">
              {t("doctorWorkstation")}
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-bold tracking-tight leading-[1.12]">
              {t("doctorPortalTitle")}
            </h1>
            <p className="hidden sm:block mt-3 text-xs sm:text-[13px] text-[#f0fff4]/70 leading-[1.8] max-w-[390px] mx-auto">
              {t("doctorPortalDesc")}
            </p>
          </div>
        </section>

        {/* Form Panel: Mobile Number Login Only */}
        <section
          aria-label="Doctor login form"
          className="flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#f0fff4]"
        >
          <div className="w-full max-w-[510px]">
            {/* Form Heading tailored for doctors */}
            <div className="mb-6 sm:mb-9">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6bbf8c]">
                  {t("doctorPortal")}
                </p>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#003d29] tracking-tight leading-[1.2]">
                {t("doctorSignInHeading")}
              </h2>
              <p className="mt-3 text-xs sm:text-[12px] text-[#587366] leading-[1.7]">
                {t("doctorSignInDesc")}
              </p>
            </div>

            {/* Direct Number Login Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center justify-between gap-4 mb-2.5 text-[11px] font-bold text-[#003d29]">
                  <label htmlFor="doctor-mobile">
                    {t("registeredMobileNumber")}
                  </label>
                  <span className="text-[#347355] text-[10px] font-mono">
                    Demo: 98765 00001
                  </span>
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#347355] flex items-center justify-center pointer-events-none">
                    <Phone className="w-[18px] h-[18px]" strokeWidth={1.8} />
                  </div>

                  <input
                    id="doctor-mobile"
                    name="doctor-mobile"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (status) setStatus("");
                    }}
                    placeholder="e.g. 98765 00001"
                    className="w-full py-3.5 sm:py-4 pl-12 pr-4 text-xs sm:text-sm text-[#003d29] bg-white/60 hover:bg-white focus:bg-white border border-[#003d29]/15 rounded-[10px] outline-none transition-all focus:border-[#6bbf8c] focus:ring-4 focus:ring-[#6bbf8c]/20 placeholder-[#587366]/60 font-mono"
                    required
                  />
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="submit"
                className="group flex items-center justify-between w-full py-3.5 sm:py-4 pl-5 pr-4 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] border border-[#003d29] rounded-[10px] text-xs font-bold transition-all duration-180 cursor-pointer hover:shadow-[0_12px_20px_rgba(0,61,41,0.18)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>{t("verifyDoctorLogin")}</span>
                <span
                  className="flex items-center justify-center w-[26px] h-[26px] border border-[#f0fff4]/50 rounded-[20%] transition-transform duration-180 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </span>
              </button>

              {/* 1-Click Doctor Demo Button */}
              <button
                type="button"
                onClick={() => {
                  setPhone("9876500001");
                  setStatus("Verified Dr. Ananya Kulkarni (DemoCare Hospital). Opening workstation...");
                  setStatusType("success");
                  if (onSuccess) {
                    setTimeout(() => onSuccess({ mobile: "9876500001" }), 400);
                  }
                }}
                className="w-full mt-2.5 py-2.5 px-3 bg-[#c9fdd7] hover:bg-[#b5f8c6] text-[#003d29] border border-[#003d29]/20 rounded-[10px] text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡ 1-Click Demo: Dr. Ananya Kulkarni</span>
              </button>

              {/* Status Message */}
              {status && (
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-4 text-center text-[11px] font-semibold p-2.5 rounded-lg ${
                    statusType === "error"
                      ? "text-red-700 bg-red-50 border border-red-200"
                      : "text-[#003d29] bg-[#c9fdd7]/70 border border-[#347355]/20"
                  }`}
                >
                  {status}
                </p>
              )}
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3.5 my-6 sm:my-8 text-[#587366] text-[11px] before:h-[1px] before:flex-1 before:bg-[#003d29]/15 after:h-[1px] after:flex-1 after:bg-[#003d29]/15">
              <span>or</span>
            </div>

            {/* Link back to Patient Login */}
            {onPatientLogin && (
              <p className="text-center text-[11px] text-[#587366]">
                {t("areYouPatient")}{" "}
                <button
                  type="button"
                  onClick={onPatientLogin}
                  className="ml-1 text-[#347355] hover:text-[#003d29] font-bold underline underline-offset-4 cursor-pointer inline-flex items-center gap-1 group"
                >
                  <span>{t("switchToPatientLogin")}</span>
                  <ArrowRight className="w-3 h-3 stroke-[2.2] inline group-hover:translate-x-0.5 transition-transform" />
                </button>
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default DoctorLogin;
