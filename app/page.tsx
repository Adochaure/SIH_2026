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
import { demoStore } from "./lib/demoStore";
import { LanguageProvider } from "./lib/languageContext";

export default function Home() {
  const [authMode, setAuthMode] = useState<"patient" | "doctor">("patient");
  const [doctorStep, setDoctorStep] = useState<"login" | "dashboard">("login");
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

  const handleResetDemo = () => {
    demoStore.resetDemo();
    setStep("login");
    setDoctorStep("login");
    setAuthMode("patient");
  };

  return (
    <LanguageProvider>
      <div className="relative min-h-screen">
        {/* VIEW ROUTING */}
        {authMode === "doctor" ? (
          doctorStep === "login" ? (
            <DoctorLogin
              onSuccess={() => setDoctorStep("dashboard")}
              onPatientLogin={() => {
                setAuthMode("patient");
                setStep("login");
              }}
            />
          ) : (
            <DoctorDashboard
              doctorName="Dr. Ananya Kulkarni"
              department="General Medicine"
              hospital="DemoCare Hospital"
              roomNumber="OPD Room 3"
              onLogout={() => {
                setDoctorStep("login");
              }}
              onPatientPortal={() => {
                setAuthMode("patient");
                setStep("dashboard");
              }}
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
            department={
              latestConsultation?.pathway === "ayush"
                ? "AYUSH Holistic Care"
                : "General Medicine"
            }
            onProfileClick={() => setStep("profile")}
            onLogout={() => setStep("login")}
            onViewSummaryClick={() => setStep("summary")}
          />
        ) : step === "summary" ? (
          <SummaryToken
            patientName={patient.name}
            tokenNumber={currentTokenNumber}
            doctorName={latestConsultation?.doctorName || "Dr. Ananya Kulkarni"}
            doctorRoom={
              latestConsultation?.doctorRoom ||
              (latestConsultation?.doctorQrCode
                ? `Room ${latestConsultation.doctorQrCode}`
                : "OPD Room 3")
            }
            doctorHospital={latestConsultation?.doctorHospital || "DemoCare Hospital"}
            doctorQrCode={latestConsultation?.doctorQrCode || "OPD-DEMOCARE-3"}
            onReturnToDashboard={() => setStep("dashboard")}
          />
        ) : (
          <Login
            defaultMethod="mobile"
            defaultIdentifier="9876543210"
            onDoctorLogin={() => {
              setAuthMode("doctor");
              setDoctorStep("login");
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
    </LanguageProvider>
  );
}
