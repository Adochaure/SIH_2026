"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  IdCard,
  Phone,
} from "lucide-react";
import { Navbar } from "./Navbar";

export interface LoginProps {
  onSuccess?: (data: { method: "abha" | "mobile"; identifier: string }) => void;
  onRegisterClick?: () => void;
  onDoctorLogin?: () => void;
  defaultMethod?: "abha" | "mobile";
  defaultIdentifier?: string;
}

export const Login: React.FC<LoginProps> = ({
  onSuccess,
  onRegisterClick,
  onDoctorLogin,
  defaultMethod = "abha",
  defaultIdentifier,
}) => {
  const [method, setMethod] = useState<"abha" | "mobile">(defaultMethod);
  const [inputValue, setInputValue] = useState(
    defaultIdentifier ?? (defaultMethod === "abha" ? "12-3456-7890-1234" : "9876543210")
  );
  const [language, setLanguage] = useState("en");
  const [status, setStatus] = useState<string>("");
  const [statusType, setStatusType] = useState<"info" | "error" | "success">("info");

  const handleMethodChange = (newMethod: "abha" | "mobile") => {
    setMethod(newMethod);
    setInputValue(newMethod === "abha" ? "12-3456-7890-1234" : "9876543210");
    setStatus("");
  };

  const handleDoctorLoginClick = () => {
    if (onDoctorLogin) {
      onDoctorLogin();
    } else {
      setStatus("Redirecting to Doctor Login portal...");
      setStatusType("info");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setStatus("Please enter your details to continue.");
      setStatusType("error");
      return;
    }

    if (method === "mobile") {
      const cleanPhone = inputValue.replace(/\D/g, "");
      if (cleanPhone.length < 10) {
        setStatus("Please enter a valid 10-digit mobile number.");
        setStatusType("error");
        return;
      }
    } else {
      if (inputValue.trim().length < 6) {
        setStatus("Please enter a valid ABHA ID / Address.");
        setStatusType("error");
        return;
      }
    }

    setStatus(
      method === "abha"
        ? "ABHA ID verified! Loading profile..."
        : "Mobile verified! Loading profile..."
    );
    setStatusType("success");

    if (onSuccess) {
      setTimeout(() => {
        onSuccess({ method, identifier: inputValue.trim() });
      }, 400);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f0fff4] text-[#092c20] font-mono antialiased flex flex-col">
      {/* Top Navigation Bar */}
      <Navbar
        isLoggedIn={false}
        userType="patient"
        onDoctorLoginClick={handleDoctorLoginClick}
        language={language}
        onLanguageChange={setLanguage}
      />

      {/* Main Page Shell: Exact HTML Design */}
      <main className="flex-1 grid grid-cols-1 md:grid-cols-[minmax(360px,0.92fr)_minmax(460px,1.08fr)] overflow-hidden">
        {/* Visual Panel */}
        <section
          aria-label="Carelink introduction"
          className="relative flex flex-col justify-between min-h-[300px] sm:min-h-[440px] md:min-h-full p-6 sm:p-10 lg:p-16 text-[#f0fff4] bg-[#003d29] overflow-hidden rounded-b-[30%] md:rounded-b-none md:rounded-tr-[30%] md:rounded-br-[30%]"
        >
          {/* Background Ring 1 */}
          <div
            className="pointer-events-none absolute -right-[230px] top-[8%] w-[520px] h-[520px] rounded-full border border-[#c9fdd7]/15 z-0"
            aria-hidden="true"
          />

          {/* Background Ring 2 */}
          <div
            className="pointer-events-none absolute -left-[170px] bottom-[8%] w-[280px] h-[280px] rounded-full border border-[#c9fdd7]/15 z-0"
            aria-hidden="true"
          />

      

          {/* Illustration */}
          <div className="relative z-0 my-auto py-4 flex items-center justify-center">
            <div className="relative w-full max-w-[320px] sm:max-w-[440px] md:max-w-[480px] lg:max-w-[560px] aspect-[4/3] max-h-[36vh] sm:max-h-[48vh] md:max-h-[57vh]">
              <Image
                src="/assets/login.png"
                alt="A person connecting with a doctor through their phone"
                fill
                sizes="(max-width: 768px) 100vw, 560px"
                priority
                className="object-contain drop-shadow-[0_28px_18px_rgba(0,0,0,0.18)]"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.endsWith("/login.png")) {
                    target.src = "/login.png";
                  }
                }}
              />
            </div>
          </div>

          {/* Visual Copy at bottom */}
          <div className="relative z-10 w-full max-w-[450px] mx-auto text-center mt-2">
            <p className="hidden sm:block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6bbf8c] mb-3 sm:mb-5">
              Care Journey
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-[40px] font-bold tracking-tight leading-[1.12]">
              Your health, in one place
            </h1>
            <p className="hidden sm:block mt-3 text-xs sm:text-[13px] text-[#f0fff4]/70 leading-[1.8] max-w-[390px] mx-auto">
              Keep your medical history close, so every care decision can feel a little more personal.
            </p>
          </div>
        </section>

        {/* Form Panel */}
        <section
          aria-label="Login form"
          className="flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-[#f0fff4]"
        >
          <div className="w-full max-w-[510px]">
            {/* Form Heading */}
            <div className="mb-6 sm:mb-9">
              <div className="flex items-center justify-between gap-4 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#6bbf8c]">
                  Welcome back
                </p>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-bold text-[#003d29] tracking-tight leading-[1.2]">
                Let&apos;s continue<br />your care journey.
              </h2>
              <p className="mt-3 text-xs sm:text-[12px] text-[#587366] leading-[1.7]">
                Sign in to access your medical history and personalized care.
              </p>
            </div>

            {/* Method Switch Tabs */}
            <div
              className="grid grid-cols-2 gap-1 p-1 mb-6 sm:mb-8 bg-[#c9fdd7]/65 rounded-xl"
              role="tablist"
              aria-label="Login method"
            >
              <button
                type="button"
                role="tab"
                aria-selected={method === "abha"}
                onClick={() => handleMethodChange("abha")}
                className={`flex items-center justify-center py-3 px-2.5 rounded-[9px] text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                  method === "abha"
                    ? "bg-[#347355] text-[#f0fff4] shadow-[0_5px_12px_rgba(52,115,85,0.2)]"
                    : "text-[#347355] hover:-translate-y-0.5 bg-transparent"
                }`}
              >
                Login with ABHA
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={method === "mobile"}
                onClick={() => handleMethodChange("mobile")}
                className={`flex items-center justify-center py-3 px-2.5 rounded-[9px] text-[11px] font-semibold transition-all duration-200 cursor-pointer ${
                  method === "mobile"
                    ? "bg-[#347355] text-[#f0fff4] shadow-[0_5px_12px_rgba(52,115,85,0.2)]"
                    : "text-[#347355] hover:-translate-y-0.5 bg-transparent"
                }`}
              >
                Login with mobile
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-5 sm:mb-6">
                <div className="flex items-center justify-between gap-4 mb-2.5 text-[11px] font-bold text-[#003d29]">
                  <label htmlFor="login-value">
                    {method === "abha" ? "Enter your ABHA ID" : "Enter your mobile number"}
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setInputValue(
                        method === "abha" ? "14-1234-5678-4821" : "9876543210"
                      )
                    }
                    className="text-[#347355] hover:text-[#003d29] text-[10px] font-normal underline underline-offset-4 cursor-pointer transition-colors"
                    title="Click to fill dummy credentials"
                  >
                    {method === "abha" ? "Demo ID: 14-1234-5678-4821" : "Demo: 98765 43210"}
                  </button>
                </div>

                <div className="relative">
                  {/* Proper Vector Icon for Input */}
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#347355] flex items-center justify-center pointer-events-none">
                    {method === "abha" ? (
                      <IdCard className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    ) : (
                      <Phone className="w-[18px] h-[18px]" strokeWidth={1.8} />
                    )}
                  </div>

                  <input
                    id="login-value"
                    name="login-value"
                    type={method === "mobile" ? "tel" : "text"}
                    inputMode={method === "mobile" ? "tel" : "text"}
                    autoComplete={method === "mobile" ? "tel" : "username"}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      if (status) setStatus("");
                    }}
                    placeholder={
                      method === "abha" ? "e.g. 14-1234-5678-4821" : "e.g. 98765 43210"
                    }
                    className="w-full py-3.5 sm:py-4 pl-12 pr-4 text-xs sm:text-sm text-[#003d29] bg-white/60 hover:bg-white focus:bg-white border border-[#003d29]/15 rounded-[10px] outline-none transition-all focus:border-[#6bbf8c] focus:ring-4 focus:ring-[#6bbf8c]/20 placeholder-[#587366]/60"
                    required
                  />
                </div>
              </div>

              {/* Continue Button with Proper Vector Arrow */}
              <button
                type="submit"
                className="group flex items-center justify-between w-full py-3.5 sm:py-4 pl-5 pr-4 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] border border-[#003d29] rounded-[10px] text-xs font-bold transition-all duration-200 cursor-pointer hover:shadow-[0_12px_20px_rgba(0,61,41,0.18)] hover:-translate-y-0.5 active:translate-y-0"
              >
                <span>Continue</span>
                <span
                  className="flex items-center justify-center w-[26px] h-[26px] border border-[#f0fff4]/50 rounded-[20%] transition-transform duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                >
                  <ArrowRight className="w-4 h-4 stroke-[2.2]" />
                </span>
              </button>

              {/* 1-Click Demo Button */}
              <button
                type="button"
                onClick={() => {
                  setMethod("mobile");
                  setInputValue("9876543210");
                  setStatus("Demo credentials verified! Loading Shriram Vaidya's profile...");
                  setStatusType("success");
                  if (onSuccess) {
                    setTimeout(() => onSuccess({ method: "mobile", identifier: "9876543210" }), 400);
                  }
                }}
                className="w-full mt-2.5 py-2.5 px-3 bg-[#c9fdd7] hover:bg-[#b5f8c6] text-[#003d29] border border-[#003d29]/20 rounded-[10px] text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>⚡ 1-Click Demo: Sign in as Shriram Vaidya</span>
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

            {/* Signup Link */}
            <p className="text-center text-[11px] text-[#587366]">
              Don&apos;t have an ABHA ID?{" "}
              <button
                type="button"
                onClick={onRegisterClick}
                className="ml-1 text-[#347355] hover:text-[#003d29] font-bold underline underline-offset-4 cursor-pointer inline-flex items-center gap-1 group"
              >
                <span>Create one here</span>
                <ArrowRight className="w-3 h-3 stroke-[2.2] inline group-hover:translate-x-0.5 transition-transform" />
              </button>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Login;
