"use client";

import React, { useState, useEffect } from "react";
import {
  Login,
  DoctorLogin,
  DoctorDashboard,
  ProfileCard,
  Consent,
  PatientDashboard,
  SummaryToken,
} from "./components";
import { demoStore, DEFAULT_PATIENT } from "./lib/demoStore";
import { Stethoscope, User, RotateCcw } from "lucide-react";

export default function Home() {
  const [authMode, setAuthMode] = useState<"patient" | "doctor">("patient");
  const [doctorStep, setDoctorStep] = useState<"login" | "dashboard">("dashboard");
  const [step, setStep] = useState<
    "login" | "profile" | "consent" | "dashboard" | "summary"
  >("login");

  const [patient, setPatient] = useState(() => demoStore.getPatient());
  const [consultations, setConsultations] = useState(() => demoStore.getConsultations());

  useEffect(() => {
    const unsubscribe = demoStore.subscribe(() => {
      setPatient(demoStore.getPatient());
      setConsultations(demoStore.getConsultations());
    });
    return () => unsubscribe();
  }, []);

  const latestConsultation = consultations[0] || null;
  const currentTokenNumber = latestConsultation?.tokenNumber || "A-104";
  const currentQueuePos = latestConsultation?.queuePosition || 1;

  const handleResetDemo = () => {
    demoStore.resetDemo();
    setStep("login");
    setDoctorStep("login");
    setAuthMode("patient");
  };

  return (
    <div className="relative min-h-screen">
      {/* Sleek Floating Demo Quick Switcher Banner */}
      <aside
        aria-label="Demo Controller"
        className="fixed top-2 right-2 sm:top-3 sm:right-4 z-50 flex items-center gap-1.5 p-1 bg-[#003d29]/90 backdrop-blur-md rounded-xl border border-[#c9fdd7]/30 shadow-lg text-white text-[11px] font-mono"
      >
        <button
          type="button"
          onClick={() => {
            setAuthMode("patient");
            if (step === "login") setStep("dashboard");
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            authMode === "patient"
              ? "bg-[#c9fdd7] text-[#003d29] font-bold shadow-xs"
              : "text-[#f0fff4]/80 hover:text-white hover:bg-white/10"
          }`}
        >
          <User className="w-3 h-3" />
          <span>Patient (Shriram)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setAuthMode("doctor");
            setDoctorStep("dashboard");
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
            authMode === "doctor"
              ? "bg-[#c9fdd7] text-[#003d29] font-bold shadow-xs"
              : "text-[#f0fff4]/80 hover:text-white hover:bg-white/10"
          }`}
        >
          <Stethoscope className="w-3 h-3" />
          <span>Doctor (Dr. Ananya)</span>
        </button>

        <button
          type="button"
          onClick={handleResetDemo}
          title="Reset Demo Data to Initial Empty State"
          className="p-1 text-[#f0fff4]/70 hover:text-white hover:bg-white/10 rounded-lg transition-all cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
        </button>
      </aside>

      {/* VIEW ROUTING */}
      {authMode === "doctor" ? (
        doctorStep === "login" ? (
          <DoctorLogin
            onSuccess={() => setDoctorStep("dashboard")}
            onPatientLogin={() => setAuthMode("patient")}
          />
        ) : (
          <DoctorDashboard
            doctorName="Dr. Ananya Kulkarni"
            department="General Medicine"
            hospital="DemoCare Hospital"
            roomNumber="OPD Room 3"
            onLogout={() => setDoctorStep("login")}
            onPatientPortal={() => setAuthMode("patient")}
          />
        )
      ) : step === "profile" ? (
        <ProfileCard
          patientName={patient.name}
          age={patient.age}
          gender={patient.gender}
          abhaId={patient.abhaId}
          abhaAddress={patient.abhaAddress}
          isVerified={true}
          onBack={() => setStep("login")}
          onChangeProfile={() => setStep("login")}
          onConfirm={() => setStep("consent")}
        />
      ) : step === "consent" ? (
        <Consent
          patientName={patient.name}
          onBack={() => setStep("profile")}
          onConsent={() => setStep("dashboard")}
        />
      ) : step === "dashboard" ? (
        <PatientDashboard
          patientName={patient.name.split(" ")[0]}
          fullName={patient.name}
          tokenNumber={currentTokenNumber}
          queuePosition={currentQueuePos}
          department={latestConsultation?.pathway === "ayush" ? "AYUSH Holistic Care" : "General Medicine"}
          onProfileClick={() => setStep("profile")}
          onViewSummaryClick={() => setStep("summary")}
        />
      ) : step === "summary" ? (
        <SummaryToken
          patientName={patient.name}
          tokenNumber={currentTokenNumber}
          queuePosition={currentQueuePos}
          estimatedWaitMinutes={8}
          onReturnToDashboard={() => setStep("dashboard")}
        />
      ) : (
        <Login
          defaultMethod="mobile"
          defaultIdentifier="9876543210"
          onDoctorLogin={() => {
            setAuthMode("doctor");
            setDoctorStep("dashboard");
          }}
          onSuccess={(data) => {
            if (data.identifier) {
              setPatient((prev) => ({
                ...prev,
                abhaId: data.method === "abha" ? data.identifier : prev.abhaId,
                mobile: data.method === "mobile" ? data.identifier : prev.mobile,
              }));
            }
            setStep("profile");
          }}
        />
      )}
    </div>
  );
}
