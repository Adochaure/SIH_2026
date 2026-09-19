"use client";

import React, { useState } from "react";
import {
  Login,
  DoctorLogin,
  ProfileCard,
  Consent,
  PatientDashboard,
  SummaryToken,
} from "./components";

export default function Home() {
  const [authMode, setAuthMode] = useState<"patient" | "doctor">("patient");
  const [step, setStep] = useState<
    "login" | "profile" | "consent" | "dashboard" | "summary"
  >("login");

  const [patient, setPatient] = useState({
    name: "Priya Sharma",
    age: 28,
    gender: "Female",
    abhaId: "14-1234-5678-4821",
    abhaAddress: "priyasharma@abdm",
    mobile: "9876543210",
  });

  if (authMode === "doctor") {
    return <DoctorLogin onPatientLogin={() => setAuthMode("patient")} />;
  }

  if (step === "profile") {
    return (
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
    );
  }

  if (step === "consent") {
    return (
      <Consent
        patientName={patient.name}
        onBack={() => setStep("profile")}
        onConsent={() => setStep("dashboard")}
      />
    );
  }

  if (step === "dashboard") {
    return (
      <PatientDashboard
        patientName="Priya"
        fullName={patient.name}
        tokenNumber="C-214"
        queuePosition={3}
        onProfileClick={() => setStep("profile")}
        onViewSummaryClick={() => setStep("summary")}
      />
    );
  }

  if (step === "summary") {
    return (
      <SummaryToken
        tokenNumber="C-214"
        queuePosition={3}
        estimatedWaitMinutes={12}
        onReturnToDashboard={() => setStep("dashboard")}
      />
    );
  }

  return (
    <Login
      onDoctorLogin={() => setAuthMode("doctor")}
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
  );
}
