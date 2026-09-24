"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  Users,
  Settings as SettingsIcon,
  QrCode,
  Search,
  Bell,
  ArrowLeft,
  ArrowRight,
  Clock,
  FileText,
  Check,
  X,
  ChevronRight,
  Calendar,
  ShieldCheck,
  HeartPulse,
  Printer,
  Stethoscope,
  LogOut,
  Activity,
  Menu,
  Pill,
  FileCheck,
  Plus,
  Trash2,
  CheckCircle2,
  Sparkles,
  Edit2,
  AlertTriangle,
  Lock,
  Share2,
  Send,
  UserCheck,
} from "lucide-react";
import { Navbar } from "./Navbar";
import { demoStore, PrescriptionItem, AttachedDocument, ConsultationRecord, DoctorProfile, KNOWN_DOCTORS } from "../lib/demoStore";
import QRCode from "qrcode";
import { useLanguage } from "../lib/languageContext";

export interface DoctorDashboardProps {
  doctorName?: string;
  department?: string;
  roomNumber?: string;
  hospital?: string;
  onLogout?: () => void;
  onPatientPortal?: () => void;
}

interface PatientRecord {
  id: string;
  name: string;
  patientId: string;
  caseId: string;
  age: number | string;
  gender: string;
  contact: string;
  lastVisit: string;
  status: "Active" | "Follow-up" | "Recent";
  initials: string;
  abhaId: string;
  chiefComplaint: string;
  diagnosis: string;
  treatment: string;
  vitals: string;
  timeline: {
    id: string;
    date: string;
    title: string;
    doctor: string;
    facility: string;
    notes: string;
    tag: string;
    attachments?: AttachedDocument[];
    prescriptions?: PrescriptionItem[];
  }[];
  familyTree: {
    id: string;
    name: string;
    relation: string;
    age: number;
    abhaId: string;
    conditions: string[];
    bloodGroup: string;
  }[];
  hereditaryRisk: string;
  consultationRef?: ConsultationRecord;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctorName = "Dr. Ananya Kulkarni",
  department = "General Medicine",
  roomNumber = "OPD Room 3",
  hospital = "DemoCare Hospital",
  onLogout,
  onPatientPortal,
}) => {
  const { t, language } = useLanguage();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    QRCode.toDataURL("OPD-DEMOCARE-3", {
      width: 280,
      margin: 1,
      color: {
        dark: "#003d29",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("Error generating QR:", err));
  }, []);

  // DemoStore Synchronized Consultations
  const [storeConsultations, setStoreConsultations] = useState<ConsultationRecord[]>(() => demoStore.getConsultations());
  const [notifications, setNotifications] = useState(() => demoStore.getDoctorNotifications());
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const unsubscribe = demoStore.subscribe(() => {
      setStoreConsultations(demoStore.getConsultations());
      setNotifications(demoStore.getDoctorNotifications());
    });
    return () => unsubscribe();
  }, []);

  // Doctor Consultation Form State
  const [doctorDiagnosis, setDoctorDiagnosis] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    { id: "rx-1", name: "Tab. Amoxicillin 500mg", dosage: "1 Tablet", frequency: "1-0-1", duration: "5 days" },
    { id: "rx-2", name: "Tab. Paracetamol 650mg", dosage: "1 Tablet", frequency: "SOS (as needed)", duration: "3 days" },
  ]);
  const [consultationSuccessMsg, setConsultationSuccessMsg] = useState("");

  // ABDM HPR Referral Modal State
  const [isReferralModalOpen, setIsReferralModalOpen] = useState(false);
  const [selectedReferralDoctor, setSelectedReferralDoctor] = useState<DoctorProfile | null>(
    KNOWN_DOCTORS[1] || null
  );
  const [referralReason, setReferralReason] = useState("");
  const [referralSearchQuery, setReferralSearchQuery] = useState("");

  // Navigation state: "dashboard" | "patients" | "settings"
  const [activeNav, setActiveNav] = useState<"dashboard" | "patients" | "settings">("dashboard");

  // Mobile sidebar drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search queries
  const [searchQuery, setSearchQuery] = useState("");
  const [patientFilter, setPatientFilter] = useState<"all" | "active" | "follow-up" | "recent">("all");

  // Notifications Modal/Dropdown
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Doctor QR Code Modal
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);

  // Patient Detailed View State
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null);
  const [patientDetailTab, setPatientDetailTab] = useState<"case" | "timeline" | "family-tree">("case");
  const [activeDocPreview, setActiveDocPreview] = useState<AttachedDocument | null>(null);

  // Editable Intake & Vitals State for Doctor
  const [isEditingIntake, setIsEditingIntake] = useState(false);
  const [editedComplaint, setEditedComplaint] = useState("");
  const [editedHpi, setEditedHpi] = useState("");
  const [editedDuration, setEditedDuration] = useState("");
  const [editedSeverity, setEditedSeverity] = useState("");
  const [editedVitals, setEditedVitals] = useState("");
  const [intakeSavedMsg, setIntakeSavedMsg] = useState("");

  // Demo Patients Database (Unified with Carelink patient ecosystem)
  const [patients, setPatients] = useState<PatientRecord[]>([
    {
      id: "pt-1000",
      name: "Priya Sharma",
      patientId: "PT-1000",
      caseId: "CL-1028",
      age: 28,
      gender: "Female",
      contact: "+91 98765 43210",
      lastVisit: "Today (Live)",
      status: "Active",
      initials: "PS",
      abhaId: "14-1234-5678-4821",
      chiefComplaint: "Persistent dry cough, mild chest tightness, and nasal congestion for 4 days.",
      diagnosis: "Acute Bronchitis (Early stage)",
      treatment: "Azithromycin 500mg once daily for 5 days, steam inhalation, warm hydration.",
      vitals: "BP 118/76 mmHg · Pulse 72 bpm · SpO2 99% · Temp 98.6°F",
      timeline: [
        {
          id: "t-1",
          date: "14 Sep 2026",
          title: "General OPD Consultation - Acute Bronchitis",
          doctor: "Dr. Rajesh Rao (MBBS, MD)",
          facility: "Carelink Central OPD, Room 4",
          notes: "Dry cough, mild fatigue. Advised chest rest, antibiotic course, and steam inhalation.",
          tag: "Prescription Active",
        },
        {
          id: "t-2",
          date: "02 Aug 2026",
          title: "Complete Blood Count (CBC) & HbA1c",
          doctor: "Dr. Anita Desai (Pathologist)",
          facility: "Apex Diagnostic Laboratories",
          notes: "HbA1c: 5.4% (Normal reference). Platelets: 2.4L. All parameters within safe limits.",
          tag: "ABDM Verified Lab",
        },
        {
          id: "t-3",
          date: "15 Jan 2026",
          title: "Annual Seasonal Influenza Vaccine",
          doctor: "Dr. S. K. Gupta",
          facility: "Wellness Community Center",
          notes: "Quadrivalent vaccine administered. No adverse reaction recorded.",
          tag: "Immunization",
        },
      ],
      familyTree: [
        {
          id: "fam-1",
          name: "Ramesh Sharma",
          relation: "Father",
          age: 58,
          abhaId: "14-8832-1920-4412",
          conditions: ["Hypertension", "Type 2 Diabetes"],
          bloodGroup: "B+",
        },
        {
          id: "fam-2",
          name: "Sunita Sharma",
          relation: "Mother",
          age: 54,
          abhaId: "14-7741-9923-1109",
          conditions: ["Asthma", "Mild Thyroid"],
          bloodGroup: "O+",
        },
        {
          id: "fam-3",
          name: "Aarav Sharma",
          relation: "Son",
          age: 4,
          abhaId: "14-5512-3344-9988",
          conditions: ["Routine immunization up to date"],
          bloodGroup: "B+",
        },
      ],
      hereditaryRisk: "Hypertension & Type 2 Diabetes recorded in 2 primary relatives (Father, Mother). Recommend annual fasting blood sugar and BP checks.",
    },
    {
      id: "pt-1001",
      name: "Rahul Sharma",
      patientId: "PT-1001",
      caseId: "CL-1024",
      age: 42,
      gender: "Male",
      contact: "+91 98111 22001",
      lastVisit: "15 Sep 2026",
      status: "Active",
      initials: "RS",
      abhaId: "14-9988-7766-5544",
      chiefComplaint: "Intermittent frontal headaches for past two weeks, worse after screen exposure.",
      diagnosis: "Tension-type Headache",
      treatment: "Ergonomic adjustments, regular hydration breaks, Paracetamol 500mg SOS.",
      vitals: "BP 122/80 mmHg · Pulse 76 bpm · Temp 98.4°F",
      timeline: [
        {
          id: "t-4",
          date: "15 Sep 2026",
          title: "Follow-up Consultation - Frontal Headache",
          doctor: "Dr. Rajesh Rao",
          facility: "Carelink Central OPD, Room 4",
          notes: "Mild improvement with screen adjustments. Neurological exam within normal limits.",
          tag: "Follow-up",
        },
      ],
      familyTree: [
        {
          id: "fam-4",
          name: "Manju Sharma",
          relation: "Mother",
          age: 68,
          abhaId: "14-3322-1199-0022",
          conditions: ["Migraine history"],
          bloodGroup: "A+",
        },
      ],
      hereditaryRisk: "Maternal history of chronic migraine. Monitor triggers and sleep duration.",
    },
    {
      id: "pt-1002",
      name: "Priya Patil",
      patientId: "PT-1002",
      caseId: "CL-1025",
      age: 29,
      gender: "Female",
      contact: "+91 98222 33002",
      lastVisit: "14 Sep 2026",
      status: "Follow-up",
      initials: "PP",
      abhaId: "14-4455-6677-8899",
      chiefComplaint: "Mild allergic rhinitis and morning sneezing bouts.",
      diagnosis: "Allergic Rhinitis",
      treatment: "Levocetirizine 5mg at bedtime for 7 days.",
      vitals: "BP 114/72 mmHg · Pulse 68 bpm · Temp 98.2°F",
      timeline: [
        {
          id: "t-5",
          date: "14 Sep 2026",
          title: "Initial Consultation - Allergic Rhinitis",
          doctor: "Dr. Rajesh Rao",
          facility: "Carelink OPD",
          notes: "Pollen and dust allergen sensitivity reported.",
          tag: "New Case",
        },
      ],
      familyTree: [],
      hereditaryRisk: "No significant family hereditary risk reported.",
    },
    {
      id: "pt-1003",
      name: "Amit Joshi",
      patientId: "PT-1003",
      caseId: "CL-1026",
      age: 51,
      gender: "Male",
      contact: "+91 98333 44003",
      lastVisit: "13 Sep 2026",
      status: "Active",
      initials: "AJ",
      abhaId: "14-1122-3344-5566",
      chiefComplaint: "Routine cardiovascular checkup and prescription refill.",
      diagnosis: "Essential Hypertension (Stable)",
      treatment: "Telmisartan 40mg once daily in morning.",
      vitals: "BP 128/82 mmHg · Pulse 74 bpm · Temp 98.4°F",
      timeline: [
        {
          id: "t-6",
          date: "13 Sep 2026",
          title: "Routine Hypertension Review",
          doctor: "Dr. Rajesh Rao",
          facility: "Carelink OPD",
          notes: "BP well-controlled on current monotherapy.",
          tag: "Review",
        },
      ],
      familyTree: [],
      hereditaryRisk: "Family history of early onset coronary artery disease.",
    },
  ]);

  // Filter storeConsultations: only cases checked in via QR scan OR already completed should appear for the doctor.
  // Newly created cases pending QR scan will not dispatch until the patient checks in at the OPD desk.
  const checkedInConsultations = storeConsultations.filter(
    (cons) => cons.checkInStatus === "checked_in" || cons.status === "Completed"
  );

  // Map checked-in consultations into dynamic patient records
  const dynamicPatients: PatientRecord[] = checkedInConsultations.map((cons) => {
    return {
      id: cons.id,
      name: cons.patientName,
      patientId: cons.patientId,
      caseId: cons.tokenNumber,
      age: cons.age,
      gender: cons.gender,
      contact: cons.contact,
      lastVisit: cons.completedAt
        ? `Completed (${cons.completedAt})`
        : `Checked-in via Room 3 QR (${cons.qrScannedAt || cons.createdAt || "Live"})`,
      status: cons.status === "Waiting" ? "Active" : "Recent",
      initials: cons.patientName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
      abhaId: cons.abhaId,
      chiefComplaint: cons.chiefComplaint,
      diagnosis: cons.diagnosis || "Pending Doctor Diagnosis",
      treatment: cons.prescriptions && cons.prescriptions.length > 0
        ? cons.prescriptions.map((p) => `${p.name} (${p.frequency})`).join(", ")
        : "Awaiting clinical prescription",
      vitals: "BP 120/80 mmHg · Pulse 72 bpm · Temp 98.6°F · SpO2 99%",
      timeline: demoStore.getPatient().timeline as any,
      familyTree: [
        { id: "fam-1", name: "Ramesh Vaidya", relation: "Father", age: 60, abhaId: "12-8832-1920-4412", conditions: ["Hypertension"], bloodGroup: "B+" },
        { id: "fam-2", name: "Sunita Vaidya", relation: "Mother", age: 56, abhaId: "12-7741-9923-1109", conditions: ["Mild Acidity"], bloodGroup: "O+" },
      ],
      hereditaryRisk: "Paternal history of mild hypertension noted. Fasting vitals recommended.",
      consultationRef: cons,
    };
  });

  const allPatients = [...dynamicPatients, ...patients];

  // Today's Appointments (Derived from verified consultations with emergency priority at top)
  const allTodayAppointments = [
    ...checkedInConsultations.map((cons) => ({
      time: cons.createdAt || "Live",
      name: cons.patientName,
      tokenNumber: cons.tokenNumber,
      isEmergency: cons.isEmergency,
      meta: `Token ${cons.tokenNumber} · ${
        cons.isEmergency ? "🚨 EMERGENCY FAST-TRACK" : "Room 3 QR Verified"
      } · ${cons.pathway === "ayush" ? "AYUSH Intake" : "General Medicine"}`,
      status: cons.status,
      patientId: cons.id,
    })),
    { time: "11:00 AM", name: "Rahul Sharma", tokenNumber: "A-101", isEmergency: false, meta: "Token A-101 · Case #CL-1024", status: "Upcoming", patientId: "pt-1001" },
    { time: "12:30 PM", name: "Priya Patil", tokenNumber: "A-102", isEmergency: false, meta: "Token A-102 · Case #CL-1025", status: "Upcoming", patientId: "pt-1002" },
    { time: "02:00 PM", name: "Amit Joshi", tokenNumber: "A-103", isEmergency: false, meta: "Token A-103 · Case #CL-1026", status: "Upcoming", patientId: "pt-1003" },
  ];

  const todayAppointments = allTodayAppointments.filter((app) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      app.name.toLowerCase().includes(q) ||
      (app.tokenNumber && app.tokenNumber.toLowerCase().includes(q)) ||
      app.meta.toLowerCase().includes(q)
    );
  });

  // Filtering patients by name, token number, caseId, or ABHA
  const filteredPatients = allPatients.filter((pt) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      q === "" ||
      pt.name.toLowerCase().includes(q) ||
      pt.patientId.toLowerCase().includes(q) ||
      pt.caseId.toLowerCase().includes(q) ||
      pt.abhaId.toLowerCase().includes(q) ||
      (pt.consultationRef?.tokenNumber && pt.consultationRef.tokenNumber.toLowerCase().includes(q));

    const matchesFilter =
      patientFilter === "all" || pt.status.toLowerCase() === patientFilter.toLowerCase();

    return matchesQuery && matchesFilter;
  });

  const handleOpenPatient = (pt: PatientRecord) => {
    setSelectedPatient(pt);
    setPatientDetailTab("case");
    setConsultationSuccessMsg("");
    setEditedComplaint(pt.chiefComplaint || "");
    setEditedHpi(
      pt.consultationRef?.aiSummary?.hpi ||
        `Patient presents with ${pt.chiefComplaint || "acute symptoms"}.`
    );
    setEditedDuration(pt.consultationRef?.aiSummary?.duration || "2-3 days");
    setEditedSeverity(pt.consultationRef?.aiSummary?.severity || "Moderate");
    setEditedVitals(pt.vitals || "BP 120/80 mmHg · Pulse 72 bpm · Temp 98.6°F · SpO2 99%");
    setIsEditingIntake(false);
    setIntakeSavedMsg("");

    if (pt.consultationRef) {
      setDoctorDiagnosis(pt.consultationRef.diagnosis || "Acute Upper Respiratory Tract Infection");
      setDoctorNotes(
        pt.consultationRef.clinicalNotes ||
          "Patient presents with sore throat and dry cough. Pharynx erythematous, no exudates. Chest clear on auscultation. Advised warm hydration and 5-day symptom course."
      );
      if (pt.consultationRef.prescriptions && pt.consultationRef.prescriptions.length > 0) {
        setPrescriptions(pt.consultationRef.prescriptions);
      } else {
        setPrescriptions([
          { id: "rx-1", name: "Tab. Amoxicillin 500mg", dosage: "1 Tablet", frequency: "1-0-1 (After meals)", duration: "5 days" },
          { id: "rx-2", name: "Tab. Paracetamol 650mg", dosage: "1 Tablet", frequency: "SOS (for fever/pain)", duration: "3 days" },
          { id: "rx-3", name: "Syp. Ambroxol 15ml", dosage: "10 ml", frequency: "1-0-1 (After meals)", duration: "5 days" },
        ]);
      }
    }
  };

  const handleSaveIntakeCorrections = () => {
    if (!selectedPatient) return;
    const currentSummary = selectedPatient.consultationRef?.aiSummary;
    const updatedAiSummary: ConsultationRecord["aiSummary"] = {
      chiefComplaint: editedComplaint,
      hpi: editedHpi,
      duration: editedDuration,
      severity: editedSeverity,
      associatedSymptoms: currentSummary?.associatedSymptoms || [],
      redFlags: currentSummary?.redFlags || ["None noted"],
      pathwayNotes: currentSummary?.pathwayNotes || "Intake verified and updated by doctor.",
      disclaimer: currentSummary?.disclaimer || "Intake summary verified for doctor review.",
    };

    if (selectedPatient.consultationRef) {
      demoStore.updateConsultation(selectedPatient.consultationRef.id, {
        chiefComplaint: editedComplaint,
        aiSummary: updatedAiSummary,
      });
    }

    setSelectedPatient((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        chiefComplaint: editedComplaint,
        vitals: editedVitals,
        consultationRef: prev.consultationRef
          ? {
              ...prev.consultationRef,
              chiefComplaint: editedComplaint,
              aiSummary: updatedAiSummary,
            }
          : undefined,
      };
    });

    setIsEditingIntake(false);
    setIntakeSavedMsg("Case history & vitals corrections saved!");
    setTimeout(() => setIntakeSavedMsg(""), 3000);
  };

  const handlePrintCaseSummary = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    demoStore.markAllNotificationsRead();
    setNotifications(demoStore.getDoctorNotifications());
  };

  const handleCopyQrCode = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText("OPD-DEMOCARE-3");
    }
    setQrCopied(true);
    setTimeout(() => setQrCopied(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-[#f0fff4] text-[#092c20] font-mono antialiased flex flex-col">
      {/* 1. Carelink Website Navbar at Top with Logout */}
      <Navbar
        isLoggedIn={true}
        userType="doctor"
        patientName={doctorName}
        patientInitials="DR"
        onProfileClick={() => setActiveNav("settings")}
        onLogout={onLogout}
      />

      {/* Main Workspace Layout (Sidebar + Content) */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* 2. Doctor Sidebar (Cleaned per user request: only Dashboard, Patients, Settings, Doctor Profile, & Unique QR) */}
        <aside
          className={`fixed md:sticky top-0 md:top-14 z-30 h-full md:h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-[#003d29]/15 p-5 flex flex-col justify-between transition-transform duration-200 shadow-md md:shadow-none ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div>
            {/* Mobile close button */}
            <div className="flex md:hidden items-center justify-between pb-3 mb-3 border-b border-[#003d29]/10">
              <span className="text-xs font-bold text-[#003d29]">{t("doctorWorkstation")}</span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 rounded-lg text-[#587366] hover:text-[#003d29] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#587366] mb-2">
              {t("doctorWorkstation")}
            </p>

            {/* Sidebar Navigation: Dashboard & Patients only */}
            <nav className="space-y-1" aria-label="Doctor Main Menu">
              <button
                type="button"
                onClick={() => {
                  setActiveNav("dashboard");
                  setSelectedPatient(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeNav === "dashboard" && !selectedPatient
                    ? "bg-[#c9fdd7] text-[#003d29] shadow-xs"
                    : "text-[#347355] hover:bg-[#c9fdd7]/40 hover:text-[#003d29]"
                }`}
              >
                <LayoutDashboard className="w-4 h-4 stroke-[2.2]" />
                <span>{t("overview")}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveNav("patients");
                  setSelectedPatient(null);
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeNav === "patients"
                    ? "bg-[#c9fdd7] text-[#003d29] shadow-xs"
                    : "text-[#347355] hover:bg-[#c9fdd7]/40 hover:text-[#003d29]"
                }`}
              >
                <Users className="w-4 h-4 stroke-[2.2]" />
                <span>{t("patientDirectory")} ({patients.length})</span>
              </button>
            </nav>

            {/* Unique Doctor QR Code Card */}
            <div className="mt-6 p-4 rounded-xl bg-[#003d29] text-[#f0fff4] border border-[#003d29] shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c9fdd7]">
                  {t("deskQrPlacard")}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#48bb78] animate-pulse" />
              </div>
              <p className="text-[11px] font-bold text-[#f0fff4]">{roomNumber} · {department}</p>
              <p className="text-[10px] text-[#f0fff4]/70 mt-0.5 leading-snug">
                {t("scanDoctorQrToComplete")} <code className="text-[#c9fdd7] font-bold">OPD-DEMOCARE-3</code>.
              </p>

              <button
                type="button"
                onClick={() => setIsQrModalOpen(true)}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#c9fdd7] hover:bg-white text-[#003d29] rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                <QrCode className="w-4 h-4 stroke-[2.2]" />
                <span>{t("showDeskQr")}</span>
              </button>
            </div>
          </div>

          {/* Bottom Settings & Doctor Profile */}
          <div className="pt-4 border-t border-[#003d29]/15 space-y-3">
            <button
              type="button"
              onClick={() => {
                setActiveNav("settings");
                setSelectedPatient(null);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === "settings"
                  ? "bg-[#c9fdd7] text-[#003d29]"
                  : "text-[#347355] hover:bg-[#c9fdd7]/40 hover:text-[#003d29]"
              }`}
            >
              <SettingsIcon className="w-4 h-4 stroke-[2.2]" />
              <span>Settings</span>
            </button>

            {/* Doctor Profile Card at Bottom */}
            <div className="p-3 bg-[#f0fff4] rounded-xl border border-[#003d29]/15 flex items-center gap-3">
              <div className="grid place-items-center w-9 h-9 rounded-full bg-[#003d29] text-[#c9fdd7] font-bold text-xs flex-shrink-0">
                DR
              </div>
              <div className="min-w-0 flex-1">
                <strong className="block text-xs font-bold text-[#003d29] truncate">
                  {doctorName}
                </strong>
                <span className="block text-[10px] text-[#587366] truncate">
                  {roomNumber} · {department}
                </span>
              </div>
            </div>

            {onPatientPortal && (
              <button
                type="button"
                onClick={onPatientPortal}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold text-[#347355] hover:text-[#003d29] underline underline-offset-2 cursor-pointer transition-colors"
              >
                <span>Switch to Patient Kiosk</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="fixed inset-0 z-20 bg-black/40 md:hidden backdrop-blur-2xs"
          />
        )}

        {/* 3. Main Workspace Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Subheader / Action Bar with Search & Notifications */}
          <div className="sticky top-0 z-20 bg-[#f0fff4]/95 backdrop-blur-md px-4 sm:px-8 py-3 border-b border-[#003d29]/15 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 rounded-lg bg-white border border-[#003d29]/15 text-[#003d29] cursor-pointer"
                aria-label="Open menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* Fast Patient Search */}
              <div className="relative w-48 sm:w-80">
                <Search className="w-3.5 h-3.5 text-[#587366] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Find by name, Token # (e.g. A-104), ABHA..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-[#003d29]/15 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#347355]/30 text-[#003d29] placeholder-[#587366]/70 shadow-2xs"
                />
              </div>
            </div>

            {/* Top Right: Notifications + Quick Status */}
            <div className="relative flex items-center gap-3">
              {/* Notification Button */}
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded-lg bg-white border border-[#003d29]/15 text-[#003d29] hover:bg-[#c9fdd7]/40 transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 stroke-[2.2]" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notification Popover Dropdown */}
              {isNotificationOpen && (
                <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white border border-[#003d29]/15 rounded-2xl shadow-xl z-50 p-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-[#003d29]/10">
                    <span className="text-xs font-bold text-[#003d29]">Clinical Alerts & Queue</span>
                    <button
                      type="button"
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[10px] font-bold text-[#347355] hover:underline cursor-pointer"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="divide-y divide-[#003d29]/10 max-h-64 overflow-y-auto">
                    {notifications.map((item) => (
                      <div key={item.id} className="py-2.5 text-left">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs font-bold text-[#003d29]">{item.title}</strong>
                          <span className="text-[9px] text-[#587366]">{item.time}</span>
                        </div>
                        <p className="text-[11px] text-[#587366] mt-0.5 leading-snug">{item.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Area Container */}
          <div className="p-4 sm:p-8 max-w-6xl w-full mx-auto">
            {/* -------------------- VIEW 1: DASHBOARD OVERVIEW -------------------- */}
            {activeNav === "dashboard" && !selectedPatient && (
              <div className="space-y-6 animate-fade-in">
                {/* Hero Greeting Row */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#003d29]/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#347355] bg-[#c9fdd7]/70 px-2.5 py-0.5 rounded-full border border-[#003d29]/10">
                      {t("doctorWorkstation")}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#003d29] tracking-tight mt-1.5">
                      {t("goodMorning")}, {doctorName}
                    </h1>
                    <p className="text-xs text-[#587366] mt-1">
                      {roomNumber} · {department} · {hospital}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsQrModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#003d29]/15 cursor-pointer self-start sm:self-auto"
                  >
                    <QrCode className="w-4 h-4 text-[#c9fdd7]" />
                    <span>{t("showDeskQr")}</span>
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="p-4 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-[#587366]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t("patientDirectory")}</span>
                      <Users className="w-4 h-4 text-[#347355]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#003d29] mt-2">128</div>
                    <span className="text-[10px] text-[#587366]">{t("patientsAndRecords")}</span>
                  </div>

                  <div className="p-4 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-[#587366]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t("todayAppointments")}</span>
                      <Clock className="w-4 h-4 text-[#347355]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#003d29] mt-2">12</div>
                    <span className="text-[10px] text-[#587366]">{t("todaysConsultations")}</span>
                  </div>

                  <div className="p-4 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-[#587366]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t("status")}</span>
                      <Activity className="w-4 h-4 text-[#347355]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#003d29] mt-2">08</div>
                    <span className="text-[10px] text-[#587366]">{t("pendingReviews")}</span>
                  </div>

                  <div className="p-4 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs">
                    <div className="flex items-center justify-between text-[#587366]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t("completedVisits")}</span>
                      <Check className="w-4 h-4 text-[#347355]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-[#003d29] mt-2">24</div>
                    <span className="text-[10px] text-[#587366]">{t("completedVisits")}</span>
                  </div>
                </div>

                {/* Dashboard Grid: Active Consultations & Recent Cases */}
                <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-5">
                  {/* Today's Active Consultations */}
                  <article className="p-5 sm:p-6 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-[#003d29]/10">
                        <h2 className="text-sm font-bold text-[#003d29] flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#347355]" />
                          <span>{t("todaysConsultations")}</span>
                        </h2>
                        <button
                          type="button"
                          onClick={() => setActiveNav("patients")}
                          className="text-[11px] font-bold text-[#347355] hover:text-[#003d29] cursor-pointer"
                        >
                          {t("viewAllPatients")}
                        </button>
                      </div>

                      <div className="divide-y divide-[#003d29]/10 mt-2">
                        {todayAppointments.map((item, idx) => (
                          <div
                            key={idx}
                            className={`py-3 flex items-center justify-between gap-3 ${
                              item.isEmergency
                                ? "bg-red-50/70 p-2.5 rounded-xl border border-red-200"
                                : ""
                            }`}
                          >
                            <div className="text-xs font-bold text-[#003d29] min-w-16 flex items-center gap-1">
                              {item.isEmergency && (
                                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 animate-bounce" />
                              )}
                              <span>{item.time}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-[#003d29] truncate">{item.name}</span>
                                {item.isEmergency && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-red-600 text-white tracking-wide uppercase">
                                    ER ALERT
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-[#587366] truncate">{item.meta}</div>
                            </div>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.isEmergency
                                  ? "bg-red-100 text-red-700 border border-red-300 font-extrabold"
                                  : item.status === "Waiting"
                                  ? "bg-[#c9fdd7] text-[#003d29]"
                                  : "bg-[#003d29]/10 text-[#003d29]"
                              }`}
                            >
                              {item.isEmergency ? "Priority ER" : item.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const pt = allPatients.find((p) => p.id === item.patientId);
                                if (pt) handleOpenPatient(pt);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-xs ${
                                item.isEmergency
                                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                  : "bg-[#003d29] hover:bg-[#347355] text-[#f0fff4]"
                              }`}
                            >
                              {item.isEmergency ? "🚨 Triage Case" : t("openCase")}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>

                  {/* Recent Patient Cases & Quick Actions */}
                  <div className="space-y-5">
                    {/* Quick Actions (Requested: Only "Find Patient" option!) */}
                    <article className="p-5 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-[#003d29]/10 mb-3">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#587366]">
                          Quick Action
                        </h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveNav("patients")}
                        className="w-full flex items-center justify-between p-4 bg-[#f0fff4] hover:bg-[#c9fdd7] border border-[#003d29]/20 rounded-xl transition-all cursor-pointer group shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid place-items-center w-10 h-10 rounded-lg bg-[#003d29] text-[#c9fdd7] group-hover:scale-105 transition-transform">
                            <Search className="w-5 h-5 stroke-[2.2]" />
                          </div>
                          <div className="text-left">
                            <strong className="block text-xs font-bold text-[#003d29]">
                              Find Patient
                            </strong>
                            <span className="text-[10px] text-[#587366]">
                              Search patient records, ABHA IDs, and clinical cases
                            </span>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#347355] group-hover:translate-x-1 transition-transform" />
                      </button>
                    </article>

                    {/* Recent Cases preview */}
                    <article className="p-5 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs">
                      <div className="flex items-center justify-between pb-3 border-b border-[#003d29]/10">
                        <h2 className="text-xs font-bold uppercase tracking-wider text-[#587366]">
                          Recent Active Cases
                        </h2>
                      </div>
                      <div className="divide-y divide-[#003d29]/10">
                        {patients.slice(0, 3).map((pt) => (
                          <div key={pt.id} className="py-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="grid place-items-center w-8 h-8 rounded-full bg-[#c9fdd7] text-[#003d29] text-xs font-bold flex-shrink-0">
                                {pt.initials}
                              </div>
                              <div className="min-w-0">
                                <strong className="block text-xs font-bold text-[#003d29] truncate">
                                  {pt.name}
                                </strong>
                                <span className="block text-[10px] text-[#587366] truncate">
                                  Case #{pt.caseId} · {pt.diagnosis}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenPatient(pt)}
                              className="px-2.5 py-1 text-[10px] font-bold text-[#347355] hover:text-[#003d29] bg-[#f0fff4] hover:bg-[#c9fdd7] rounded-lg border border-[#003d29]/15 cursor-pointer transition-colors"
                            >
                              Review
                            </button>
                          </div>
                        ))}
                      </div>
                    </article>
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- VIEW 2: PATIENTS LIST -------------------- */}
            {activeNav === "patients" && !selectedPatient && (
              <div className="space-y-5 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#003d29]/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#347355]">
                      Patient Directory
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#003d29] tracking-tight mt-0.5">
                      Patients & Clinical Records
                    </h1>
                    <p className="text-xs text-[#587366] mt-0.5">
                      Review registered patient files, ongoing cases, and ABDM linked health histories.
                    </p>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-[11px] font-bold text-[#587366] uppercase">Filter:</span>
                  <button
                    type="button"
                    onClick={() => setPatientFilter("all")}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      patientFilter === "all"
                        ? "bg-[#003d29] text-white"
                        : "bg-white text-[#347355] border border-[#003d29]/15"
                    }`}
                  >
                    All Patients ({patients.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientFilter("active")}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      patientFilter === "active"
                        ? "bg-[#003d29] text-white"
                        : "bg-white text-[#347355] border border-[#003d29]/15"
                    }`}
                  >
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientFilter("follow-up")}
                    className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                      patientFilter === "follow-up"
                        ? "bg-[#003d29] text-white"
                        : "bg-white text-[#347355] border border-[#003d29]/15"
                    }`}
                  >
                    Follow-up
                  </button>
                </div>

                {/* Patient Table / Cards */}
                <div className="bg-white border border-[#003d29]/15 rounded-2xl shadow-xs overflow-hidden">
                  <div className="hidden sm:grid sm:grid-cols-[1.5fr_1fr_0.6fr_0.6fr_1fr_auto] gap-3 p-3.5 bg-[#e8efea] text-[10px] font-bold uppercase tracking-wider text-[#587366] border-b border-[#003d29]/10">
                    <span>Patient</span>
                    <span>Case ID / ABHA</span>
                    <span>Age</span>
                    <span>Gender</span>
                    <span>Status</span>
                    <span>Action</span>
                  </div>

                  <div className="divide-y divide-[#003d29]/10">
                    {filteredPatients.map((pt) => (
                      <div
                        key={pt.id}
                        className="p-3.5 sm:p-4 grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_0.6fr_0.6fr_1fr_auto] gap-3 items-center hover:bg-[#c9fdd7]/20 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="grid place-items-center w-9 h-9 rounded-full bg-[#c9fdd7] text-[#003d29] text-xs font-bold flex-shrink-0">
                            {pt.initials}
                          </div>
                          <div>
                            <strong className="block text-xs font-bold text-[#003d29]">{pt.name}</strong>
                            <span className="text-[10px] text-[#587366]">{pt.patientId}</span>
                          </div>
                        </div>

                        <div>
                          <span className="block text-xs font-bold text-[#003d29]">#{pt.caseId}</span>
                          <span className="text-[10px] text-[#587366]">{pt.abhaId}</span>
                        </div>

                        <div className="text-xs text-[#092c20]">{pt.age}y</div>
                        <div className="text-xs text-[#092c20]">{pt.gender}</div>

                        <div>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              pt.status === "Active"
                                ? "bg-[#c9fdd7] text-[#003d29]"
                                : "bg-[#f0fff4] text-[#347355] border border-[#003d29]/10"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#347355]" />
                            <span>{pt.status}</span>
                          </span>
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenPatient(pt)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-lg text-xs font-bold transition-colors cursor-pointer"
                          >
                            <span>Open File</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {filteredPatients.length === 0 && (
                      <div className="p-8 text-center text-[#587366] text-xs">
                        No patients found matching &quot;{searchQuery}&quot;.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* -------------------- VIEW 3: PATIENT CLINICAL FILE (Cases, History Timeline & Family Tree) -------------------- */}
            {selectedPatient && (() => {
              const isConsultationCompleted =
                selectedPatient.consultationRef?.status === "Completed" ||
                selectedPatient.consultationRef?.checkInStatus === "completed" ||
                selectedPatient.status === "Recent";

              return (
                <div className="space-y-6 animate-fade-in">
                  {/* Back to Patients Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(null)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-[#347355] hover:text-[#003d29] cursor-pointer group transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span>Back to patient directory</span>
                  </button>

                  {/* Patient Header Card */}
                  <div className="p-5 sm:p-6 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-5">
                    <div className="flex items-center gap-4">
                      <div className="grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#c9fdd7] text-[#003d29] font-bold text-lg border-2 border-[#347355]/20 shadow-xs flex-shrink-0">
                        {selectedPatient.initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h1 className="text-xl sm:text-2xl font-bold text-[#003d29]">
                            {selectedPatient.name}
                          </h1>
                          <span className="px-2 py-0.5 rounded-md bg-[#c9fdd7] text-[#003d29] text-[10px] font-bold border border-[#347355]/20">
                            ABHA Verified
                          </span>
                        </div>
                        <p className="text-xs text-[#587366] mt-0.5">
                          {selectedPatient.age} years · {selectedPatient.gender} · {selectedPatient.contact}
                        </p>
                        <p className="text-[11px] text-[#347355] font-mono mt-0.5">
                          ABHA ID: {selectedPatient.abhaId}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 border-t md:border-t-0 pt-3 md:pt-0 border-[#003d29]/10">
                      {selectedPatient.consultationRef?.isEmergency && (
                        <span className="px-3 py-1 bg-red-100 text-red-700 border border-red-300 rounded-lg text-xs font-bold animate-pulse flex items-center gap-1.5 shadow-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          <span>EMERGENCY FAST-TRACK</span>
                        </span>
                      )}
                      {selectedPatient.consultationRef?.isReferred && (
                        <span className="px-3 py-1 bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs">
                          <Share2 className="w-3.5 h-3.5 text-indigo-700 shrink-0" />
                          <span>↩️ Referred via ABDM HPR</span>
                        </span>
                      )}
                      <span className="px-3 py-1 bg-[#f0fff4] text-[#003d29] border border-[#003d29]/15 rounded-lg text-xs font-bold">
                        Case #{selectedPatient.caseId}
                      </span>
                      {isConsultationCompleted ? (
                        <span className="px-3 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs">
                          <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span>ABDM Consent Expired (Locked)</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-[#c9fdd7] text-[#003d29] rounded-lg text-xs font-bold">
                          Status: {selectedPatient.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Clinical HPR Referral Transfer Notice Banner */}
                  {selectedPatient.consultationRef?.isReferred && (
                    <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-950 flex items-start gap-3 shadow-xs animate-fade-in">
                      <Share2 className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-indigo-900 font-bold text-sm">
                          ↩️ ABDM HPR Case Referral Notice:
                        </strong>
                        <p className="mt-0.5 text-indigo-800 text-xs">
                          Referred from <strong>{selectedPatient.consultationRef.referralDetails?.referredFromDoctorName}</strong> ({selectedPatient.consultationRef.referralDetails?.referredFromSpecialty}) at {selectedPatient.consultationRef.referralDetails?.referredAt}.
                        </p>
                        <p className="mt-1.5 font-mono text-[11px] text-indigo-900 bg-white/80 p-2.5 rounded-xl border border-indigo-200">
                          &ldquo;{selectedPatient.consultationRef.referralDetails?.reason}&rdquo;
                        </p>
                        <span className="inline-block mt-1 text-[10px] text-indigo-700 font-bold">
                          Verified HPR Target ID: {selectedPatient.consultationRef.referralDetails?.referredToHprId}
                        </span>
                      </div>
                    </div>
                  )}

                {/* Core Navigation Tabs inside Patient File: Case Details, Health Timeline, Family Tree */}
                <div className="flex items-center gap-2 p-1.5 bg-[#e8efea] rounded-xl border border-[#003d29]/10">
                  <button
                    type="button"
                    onClick={() => setPatientDetailTab("case")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      patientDetailTab === "case"
                        ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                        : "text-[#003d29] hover:bg-white/60"
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Case Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPatientDetailTab("timeline")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      patientDetailTab === "timeline"
                        ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                        : "text-[#003d29] hover:bg-white/60"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Health Timeline ({selectedPatient.timeline.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPatientDetailTab("family-tree")}
                    className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      patientDetailTab === "family-tree"
                        ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                        : "text-[#003d29] hover:bg-white/60"
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Family Tree ({selectedPatient.familyTree.length})</span>
                  </button>
                </div>

                {/* 1. Sub-Tab: Active Case Details */}
                {patientDetailTab === "case" && (
                  <div className="space-y-5 animate-fade-in">
                    {/* Success notification upon completing consultation */}
                    {consultationSuccessMsg && (
                      <div className="p-4 rounded-xl bg-[#c9fdd7] border border-[#347355]/40 text-xs text-[#003d29] flex items-center justify-between shadow-xs animate-fade-in">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#347355]" />
                          <div>
                            <strong className="block font-bold">{consultationSuccessMsg}</strong>
                            <span className="text-[11px] text-[#347355]">
                              Consultation status marked Completed · Timeline updated.
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase bg-white/70 px-2.5 py-1 rounded-md border border-[#003d29]/10">
                          Synced
                        </span>
                      </div>
                    )}

                    {/* Emergency Alert Banner if Case has Red-Flags */}
                    {selectedPatient.consultationRef?.isEmergency && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-red-50 border-2 border-red-400 text-xs text-red-950 flex items-start gap-3.5 shadow-sm animate-fade-in">
                        <div className="p-2 rounded-xl bg-red-100 text-red-600 shrink-0">
                          <AlertTriangle className="w-5 h-5 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-extrabold text-red-800 text-sm sm:text-base">
                              🚨 Emergency Intake Alert: {selectedPatient.consultationRef.emergencyDetails?.title || "Critical Red-Flag Symptoms"}
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-red-600 text-white">
                              Priority ER
                            </span>
                          </div>
                          <p className="mt-1 text-red-800 text-xs leading-relaxed font-medium">
                            {selectedPatient.consultationRef.emergencyDetails?.actionRecommended ||
                              selectedPatient.consultationRef.emergencyDetails?.reason ||
                              "Patient exhibited emergency red-flag symptoms during clinical intake. Fast-tracked for immediate attending physician review."}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* AI CASE INTAKE SUMMARY CARD */}
                    {selectedPatient.consultationRef && (
                      <div className="p-5 sm:p-6 bg-white border border-[#003d29]/20 rounded-2xl shadow-xs space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#003d29]/10 pb-3">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-[#347355]" />
                            <h3 className="text-sm sm:text-base font-bold text-[#003d29]">
                              AI Clinical Intake Summary
                            </h3>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#347355] bg-[#c9fdd7] px-2.5 py-1 rounded-full border border-[#003d29]/15">
                              {selectedPatient.consultationRef.pathway === "ayush" ? "AYUSH Intake" : "General Medicine"}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsEditingIntake(!isEditingIntake)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f0fff4] hover:bg-[#c9fdd7] border border-[#003d29]/20 text-xs font-bold text-[#003d29] cursor-pointer transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#347355]" />
                              <span>{isEditingIntake ? "Cancel Edit" : "Edit / Correct History"}</span>
                            </button>
                            <button
                              type="button"
                              onClick={handlePrintCaseSummary}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#003d29] hover:bg-[#347355] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                            >
                              <Printer className="w-3.5 h-3.5 text-[#c9fdd7]" />
                              <span>Print Summary & Rx</span>
                            </button>
                          </div>
                        </div>

                        {intakeSavedMsg && (
                          <div className="p-2.5 rounded-xl bg-[#c9fdd7] border border-[#347355]/30 text-xs font-bold text-[#003d29] flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#347355]" />
                            <span>{intakeSavedMsg}</span>
                          </div>
                        )}

                        {isEditingIntake ? (
                          /* Doctor Inline Editing Form */
                          <div className="p-4 rounded-xl bg-[#f0fff4] border border-[#347355]/30 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#003d29]">
                                Correct Patient Intake & Clinical History
                              </span>
                              <span className="text-[10px] text-[#587366]">Doctor Verification Mode</span>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#587366] mb-1">
                                Chief Complaint
                              </label>
                              <input
                                type="text"
                                value={editedComplaint}
                                onChange={(e) => setEditedComplaint(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-[#003d29]/20 rounded-lg text-[#003d29] font-medium"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-[#587366] mb-1">
                                  Duration
                                </label>
                                <input
                                  type="text"
                                  value={editedDuration}
                                  onChange={(e) => setEditedDuration(e.target.value)}
                                  className="w-full px-3 py-2 text-xs bg-white border border-[#003d29]/20 rounded-lg text-[#003d29] font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-[#587366] mb-1">
                                  Severity
                                </label>
                                <input
                                  type="text"
                                  value={editedSeverity}
                                  onChange={(e) => setEditedSeverity(e.target.value)}
                                  className="w-full px-3 py-2 text-xs bg-white border border-[#003d29]/20 rounded-lg text-[#003d29] font-medium"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#587366] mb-1">
                                History of Present Illness (HPI)
                              </label>
                              <textarea
                                rows={2}
                                value={editedHpi}
                                onChange={(e) => setEditedHpi(e.target.value)}
                                className="w-full px-3 py-2 text-xs bg-white border border-[#003d29]/20 rounded-lg text-[#003d29] font-medium resize-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase text-[#587366] mb-1">
                                Recorded Clinical Vitals
                              </label>
                              <input
                                type="text"
                                value={editedVitals}
                                onChange={(e) => setEditedVitals(e.target.value)}
                                placeholder="BP 120/80 mmHg · Pulse 72 bpm · Temp 98.6°F · SpO2 99%"
                                className="w-full px-3 py-2 text-xs bg-white border border-[#003d29]/20 rounded-lg text-[#003d29] font-medium"
                              />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => setIsEditingIntake(false)}
                                className="px-3 py-1.5 rounded-lg border border-[#003d29]/20 text-xs text-[#587366] hover:text-[#003d29] cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveIntakeCorrections}
                                className="px-4 py-1.5 rounded-lg bg-[#003d29] hover:bg-[#347355] text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                              >
                                Save Corrections
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              <div className="p-3 bg-[#f0fff4] rounded-xl border border-[#003d29]/10">
                                <span className="text-[10px] uppercase font-bold text-[#587366] block">
                                  Duration
                                </span>
                                <strong className="text-xs text-[#003d29]">
                                  {selectedPatient.consultationRef.aiSummary?.duration || "2-3 days"}
                                </strong>
                              </div>
                              <div className="p-3 bg-[#f0fff4] rounded-xl border border-[#003d29]/10">
                                <span className="text-[10px] uppercase font-bold text-[#587366] block">
                                  Severity
                                </span>
                                <strong className="text-xs text-[#003d29]">
                                  {selectedPatient.consultationRef.aiSummary?.severity || "Moderate"}
                                </strong>
                              </div>
                              <div className="p-3 bg-[#f0fff4] rounded-xl border border-[#003d29]/10 col-span-2 sm:col-span-1">
                                <span className="text-[10px] uppercase font-bold text-[#587366] block">
                                  Red Flags
                                </span>
                                <span className="text-xs font-bold text-emerald-700">
                                  {selectedPatient.consultationRef.aiSummary?.redFlags?.[0] || "None noted"}
                                </span>
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#587366] block mb-1">
                                History of Present Illness (HPI)
                              </span>
                              <p className="text-xs text-[#092c20] leading-relaxed bg-[#f0fff4] p-3 rounded-xl border border-[#003d29]/10">
                                {selectedPatient.consultationRef.aiSummary?.hpi ||
                                  `Patient reports "${selectedPatient.chiefComplaint}" with acute onset.`}
                              </p>
                            </div>
                          </>
                        )}

                        {/* Attached Documents with OCR Text Preview */}
                        {selectedPatient.consultationRef.attachedDocuments &&
                          selectedPatient.consultationRef.attachedDocuments.length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#587366] block mb-1.5 flex items-center gap-1.5">
                                <FileCheck className="w-3.5 h-3.5 text-[#347355]" />
                                <span>Attached Patient Documents & OCR Findings ({selectedPatient.consultationRef.attachedDocuments.length})</span>
                              </span>
                              <div className="space-y-2">
                                {selectedPatient.consultationRef.attachedDocuments.map((doc) => (
                                  <div
                                    key={doc.id}
                                    className="p-3 rounded-xl bg-[#f0fff4] border border-[#003d29]/10 text-xs"
                                  >
                                    <div className="flex items-center justify-between mb-1">
                                      <strong className="text-[#003d29]">{doc.name}</strong>
                                      <span className="text-[10px] font-bold text-[#347355] bg-[#c9fdd7] px-2 py-0.5 rounded">
                                        OCR Verified
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-[#587366] block mb-1.5">
                                      Type: {doc.type.replace("_", " ")} · Date: {doc.date}
                                    </span>
                                    {doc.ocrText && (
                                      <div className="bg-white p-2.5 rounded-lg border border-[#003d29]/10 text-[11px] text-[#092c20] max-h-24 overflow-y-auto">
                                        <span className="font-bold text-[#347355] block mb-0.5">Extracted OCR Text:</span>
                                        <pre className="whitespace-pre-wrap font-mono text-[11px] leading-snug">
                                          {doc.ocrText}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Questions & Answers Transcript */}
                        {selectedPatient.consultationRef.answers &&
                          selectedPatient.consultationRef.answers.length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-[#587366] block mb-1.5">
                                Adaptive Clinical Q&A Transcript ({selectedPatient.consultationRef.answers.length} questions)
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {selectedPatient.consultationRef.answers.map((qa, idx) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-lg bg-[#f0fff4] border border-[#003d29]/10 text-[11px]"
                                  >
                                    <strong className="text-[#003d29] block leading-snug">{qa.question}</strong>
                                    <span className="text-[#347355] font-semibold mt-0.5 block">→ {qa.answer}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Vitals Grid */}
                    <div className="p-4 sm:p-5 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#587366] block">
                          Recorded Clinical Vitals
                        </span>
                        <div className="mt-1 text-xs font-bold text-[#003d29]">
                          {selectedPatient.vitals}
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-[#c9fdd7] text-[#003d29] text-[10px] font-bold rounded-lg self-start sm:self-auto">
                        Stable · OPD Examined
                      </span>
                    </div>

                    {/* DOCTOR CONSULTATION ACTION FORM: DIAGNOSIS & PRESCRIPTION */}
                    <div className="p-5 sm:p-6 bg-white border-2 border-[#003d29]/25 rounded-2xl shadow-md space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-[#003d29]/10">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-5 h-5 text-[#347355]" />
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-[#003d29]">
                              Doctor Consultation & e-Prescription
                            </h3>
                            <p className="text-[11px] text-[#587366]">
                              Attending: <strong>{doctorName}</strong> ({department}, {hospital})
                            </p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#347355] bg-[#c9fdd7] px-2.5 py-1 rounded-md">
                          ABDM Prescription
                        </span>
                      </div>

                      {/* Diagnosis Input */}
                      <div>
                        <label className="block text-xs font-bold text-[#003d29] mb-1.5">
                          Clinical Diagnosis *
                        </label>
                        <input
                          type="text"
                          value={doctorDiagnosis}
                          onChange={(e) => setDoctorDiagnosis(e.target.value)}
                          placeholder="e.g. Acute Upper Respiratory Tract Infection (Viral Pharyngitis)"
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#347355]"
                        />

                        {/* Quick Diagnosis Suggestions */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {[
                            "Acute Pharyngitis / Tonsillitis",
                            "Acute Upper Respiratory Tract Infection",
                            "Viral Bronchitis",
                            "Tension-type Headache",
                            "Allergic Rhinitis",
                          ].map((diag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setDoctorDiagnosis(diag)}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#f0fff4] hover:bg-[#c9fdd7] border border-[#003d29]/15 text-[#003d29] font-medium transition-colors cursor-pointer"
                            >
                              + {diag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clinical Notes */}
                      <div>
                        <label className="block text-xs font-bold text-[#003d29] mb-1.5">
                          Doctor Clinical Notes & Advice *
                        </label>
                        <textarea
                          rows={3}
                          value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          placeholder="Patient examined in OPD Room 3. Advised complete antibiotic course, steam inhalation, and plenty of warm fluids. Review in 5 days if fever persists."
                          className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#347355] resize-none"
                        />
                      </div>

                      {/* Prescription Builder Table */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-[#003d29] flex items-center gap-1.5">
                            <Pill className="w-3.5 h-3.5 text-[#347355]" />
                            <span>Prescribed Medications ({prescriptions.length})</span>
                          </label>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setPrescriptions([
                                  { id: "rx-1", name: "Tab. Amoxicillin 500mg", dosage: "1 Tablet", frequency: "1-0-1 (After meals)", duration: "5 days" },
                                  { id: "rx-2", name: "Tab. Paracetamol 650mg", dosage: "1 Tablet", frequency: "SOS (for fever/pain)", duration: "3 days" },
                                  { id: "rx-3", name: "Syp. Ambroxol 15ml", dosage: "10 ml", frequency: "1-0-1 (After meals)", duration: "5 days" },
                                ]);
                              }}
                              className="text-[10px] font-bold text-[#347355] hover:underline cursor-pointer"
                            >
                              Quick Fill Preset
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const newId = `rx-${Date.now()}`;
                                setPrescriptions((prev) => [
                                  ...prev,
                                  { id: newId, name: "", dosage: "1 Tablet", frequency: "1-0-1", duration: "5 days" },
                                ]);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] text-[10px] font-bold rounded-lg cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Medicine</span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {prescriptions.map((rx, idx) => (
                            <div
                              key={rx.id || idx}
                              className="p-2.5 rounded-xl bg-[#f0fff4] border border-[#003d29]/15 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                            >
                              <div className="sm:col-span-5">
                                <input
                                  type="text"
                                  placeholder="Medicine Name (e.g. Tab. Amoxicillin 500mg)"
                                  value={rx.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPrescriptions((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, name: val } : item))
                                    );
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-white border border-[#003d29]/15 rounded-lg text-xs font-bold text-[#003d29]"
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <input
                                  type="text"
                                  placeholder="Frequency (e.g. 1-0-1)"
                                  value={rx.frequency}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPrescriptions((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, frequency: val } : item))
                                    );
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-white border border-[#003d29]/15 rounded-lg text-xs text-[#003d29]"
                                />
                              </div>
                              <div className="sm:col-span-3">
                                <input
                                  type="text"
                                  placeholder="Duration (e.g. 5 days)"
                                  value={rx.duration}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPrescriptions((prev) =>
                                      prev.map((item, i) => (i === idx ? { ...item, duration: val } : item))
                                    );
                                  }}
                                  className="w-full px-2.5 py-1.5 bg-white border border-[#003d29]/15 rounded-lg text-xs text-[#003d29]"
                                />
                              </div>
                              <div className="sm:col-span-1 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPrescriptions((prev) => prev.filter((_, i) => i !== idx))
                                  }
                                  className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CONFIRM CONSULTATION & REFERRAL CTAs */}
                      <div className="pt-3 border-t border-[#003d29]/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-[11px] text-[#587366]">
                          Confirming saves diagnosis to ABDM timeline, or refer case to an ABDM HPR specialist.
                        </span>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedReferralDoctor(KNOWN_DOCTORS[1]);
                              setIsReferralModalOpen(true);
                            }}
                            className="px-4 py-3 bg-[#f0fff4] hover:bg-[#c9fdd7] text-[#003d29] border border-[#003d29]/25 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                          >
                            <Share2 className="w-4 h-4 text-[#347355]" />
                            <span>↩️ Refer to HPR Specialist</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (selectedPatient.consultationRef) {
                                demoStore.completeConsultation(selectedPatient.consultationRef.id, {
                                  doctorName,
                                  doctorHospital: hospital,
                                  doctorDepartment: department,
                                  diagnosis: doctorDiagnosis || "Acute Upper Respiratory Tract Infection",
                                  clinicalNotes:
                                    doctorNotes ||
                                    "Patient examined in OPD Room 3. Prescribed symptomatic medications. Review if symptoms persist.",
                                  prescriptions,
                                });

                                setConsultationSuccessMsg(
                                  `Consultation confirmed! e-Prescription synced to ${selectedPatient.name}'s ABDM record and health timeline.`
                                );
                                setStoreConsultations(demoStore.getConsultations());
                                setSelectedPatient((prev) =>
                                  prev ? { ...prev, status: "Recent", diagnosis: doctorDiagnosis } : null
                                );
                              }
                            }}
                            className="px-6 py-3 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-[#003d29]/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            <ShieldCheck className="w-4 h-4 text-[#c9fdd7]" />
                            <span>Confirm & Complete Consultation</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Sub-Tab: Patient Health Timeline */}
                {patientDetailTab === "timeline" && (
                  isConsultationCompleted ? (
                    <div className="p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs text-center space-y-4 animate-fade-in">
                      <div className="grid place-items-center w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 mx-auto">
                        <Lock className="w-7 h-7 stroke-[2.2]" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1.5">
                        <h3 className="text-base font-bold text-[#003d29]">
                          🔒 ABDM Data Privacy Lock: Encounter Access Expired
                        </h3>
                        <p className="text-xs text-[#587366] leading-relaxed">
                          In compliance with ABDM Health Data Privacy Protocols, physician access to historical patient health timelines, lab document attachments, and past records automatically revokes once a consultation encounter is marked completed.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#f0fff4] border border-[#003d29]/15 text-xs text-[#003d29] font-bold">
                        <ShieldCheck className="w-4 h-4 text-[#347355]" />
                        <span>✓ ABDM Privacy Protocol Active · Access Restricted Post-Encounter</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 sm:p-6 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs animate-fade-in space-y-4">
                      <div className="pb-3 border-b border-[#003d29]/10">
                        <h3 className="text-sm font-bold text-[#003d29]">
                          Chronological Health Journey
                        </h3>
                        <p className="text-xs text-[#587366] mt-0.5">
                          Encounters, diagnostics, and prescriptions synced from patient&apos;s ABHA locker.
                        </p>
                      </div>

                      <div className="relative pl-6 sm:pl-8 space-y-5 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#003d29]/15">
                        {selectedPatient.timeline.map((item) => (
                          <div key={item.id} className="relative">
                            <div className="absolute -left-6 sm:-left-8 top-1.5 w-3.5 h-3.5 rounded-full bg-[#347355] border-2 border-white ring-2 ring-[#c9fdd7]" />
                            <div className="p-4 rounded-xl bg-[#f0fff4] border border-[#003d29]/10 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                <span className="font-bold text-[#347355] flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  <span>{item.date}</span>
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#c9fdd7] text-[#003d29] rounded">
                                  {item.tag}
                                </span>
                              </div>
                              <strong className="block text-sm font-bold text-[#003d29] mt-1">
                                {item.title}
                              </strong>
                              <p className="text-[11px] text-[#587366] mt-0.5">
                                {item.doctor} · {item.facility}
                              </p>
                              <p className="mt-2 text-xs text-[#092c20] leading-relaxed bg-white p-2.5 rounded-lg border border-[#003d29]/10">
                                {item.notes}
                              </p>

                              {/* Attached Records & OCR Transcripts */}
                              {item.attachments && item.attachments.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-[#003d29]/10">
                                  <span className="text-[10px] uppercase font-bold text-[#347355] block mb-2 flex items-center gap-1.5">
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span>Attached Records & OCR Transcripts ({item.attachments.length})</span>
                                  </span>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {item.attachments.map((doc) => (
                                      <div
                                        key={doc.id}
                                        className="p-3 bg-white rounded-xl border border-[#003d29]/10 flex flex-col justify-between gap-2 shadow-2xs"
                                      >
                                        <div className="flex items-start gap-2.5 min-w-0">
                                          <div className="p-1.5 rounded-lg bg-[#c9fdd7]/70 text-[#003d29] shrink-0 mt-0.5">
                                            <FileText className="w-4 h-4" />
                                          </div>
                                          <div className="min-w-0 flex-1">
                                            <strong className="block text-xs font-bold text-[#003d29] truncate">
                                              {doc.name}
                                            </strong>
                                            <span className="text-[10px] text-[#587366] block capitalize">
                                              {doc.type.replace("_", " ")} · {doc.date} {doc.fileSize ? `· ${doc.fileSize}` : ""}
                                            </span>
                                            {doc.ocrText && (
                                              <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 bg-[#c9fdd7] text-[#003d29] rounded">
                                                ✓ OCR Verified
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => setActiveDocPreview(doc)}
                                          className="w-full py-1.5 px-2 bg-[#f0fff4] hover:bg-[#c9fdd7] text-[#003d29] border border-[#003d29]/15 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center"
                                        >
                                          Inspect Document & OCR Text
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Prescriptions under timeline entry if present */}
                              {item.prescriptions && item.prescriptions.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-[#003d29]/10">
                                  <span className="text-[10px] uppercase font-bold text-[#347355] block mb-1.5 flex items-center gap-1.5">
                                    <Pill className="w-3.5 h-3.5" />
                                    <span>Prescribed Medications</span>
                                  </span>
                                  <div className="space-y-1">
                                    {item.prescriptions.map((rx) => (
                                      <div key={rx.id} className="p-2 bg-white rounded-lg border border-[#003d29]/10 text-[11px] flex justify-between items-center">
                                        <span className="font-bold text-[#003d29]">{rx.name}</span>
                                        <span className="text-[#587366] font-mono text-[10px]">{rx.dosage} · {rx.frequency} · {rx.duration}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}

                {/* 3. Sub-Tab: Family Medical Tree & Hereditary Profile */}
                {patientDetailTab === "family-tree" && (
                  isConsultationCompleted ? (
                    <div className="p-8 sm:p-12 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs text-center space-y-4 animate-fade-in">
                      <div className="w-14 h-14 rounded-full bg-[#f0fff4] border border-[#003d29]/15 flex items-center justify-center mx-auto text-[#003d29]">
                        <Lock className="w-7 h-7 text-[#003d29]" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1.5">
                        <h3 className="text-base font-bold text-[#003d29]">
                          🔒 ABDM Data Privacy Lock: Encounter Access Expired
                        </h3>
                        <p className="text-xs text-[#587366] leading-relaxed">
                          In compliance with ABDM Health Data Privacy Protocols, physician access to historical patient health timelines, lab document attachments, and family medical records automatically revokes once a consultation encounter is marked completed.
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#f0fff4] border border-[#003d29]/15 text-xs text-[#003d29] font-bold">
                        <ShieldCheck className="w-4 h-4 text-[#347355]" />
                        <span>✓ ABDM Privacy Protocol Active · Access Restricted Post-Encounter</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 sm:p-6 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs animate-fade-in space-y-4">
                      <div className="pb-3 border-b border-[#003d29]/10">
                        <h3 className="text-sm font-bold text-[#003d29]">
                          Family Medical Tree & Genetic Insights
                        </h3>
                        <p className="text-xs text-[#587366] mt-0.5">
                          Shared family health data authorized under ABDM consent framework.
                        </p>
                      </div>

                      {/* Hereditary Risk Insight Box */}
                      {selectedPatient.hereditaryRisk && (
                        <div className="p-4 bg-[#f0fff4] border border-[#347355]/30 rounded-xl flex items-start gap-3">
                          <HeartPulse className="w-5 h-5 text-[#347355] flex-shrink-0 mt-0.5" />
                          <div className="text-xs text-[#092c20]">
                            <strong className="block text-[#003d29] font-bold">
                              Clinical Hereditary Risk Advisory:
                            </strong>
                            <span>{selectedPatient.hereditaryRisk}</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                        {selectedPatient.familyTree.map((member) => (
                          <div
                            key={member.id}
                            className="p-4 rounded-xl bg-[#f0fff4] border border-[#003d29]/15 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#347355] border border-[#003d29]/10">
                                  {member.relation}
                                </span>
                                <span className="text-[10px] font-semibold text-[#587366]">
                                  Blood: {member.bloodGroup}
                                </span>
                              </div>
                              <strong className="block text-sm font-bold text-[#003d29] mt-2">
                                {member.name}
                              </strong>
                              <span className="block text-xs text-[#587366] mt-0.5">
                                {member.age} years · Linked ABHA
                              </span>

                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {member.conditions.map((cond, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white text-[#003d29] border border-[#003d29]/10"
                                  >
                                    {cond}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="mt-3 pt-2 border-t border-[#003d29]/10 text-[10px] text-[#347355] font-semibold flex items-center justify-between">
                              <span>ABDM Linked</span>
                              <Check className="w-3.5 h-3.5 text-[#347355]" />
                            </div>
                          </div>
                        ))}

                        {selectedPatient.familyTree.length === 0 && (
                          <div className="col-span-full p-6 text-center text-[#587366] text-xs">
                            No linked family members recorded for this patient file yet.
                          </div>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })()}

            {/* -------------------- VIEW 4: SETTINGS -------------------- */}
            {activeNav === "settings" && !selectedPatient && (
              <div className="space-y-5 animate-fade-in max-w-2xl">
                <div className="pb-3 border-b border-[#003d29]/10">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#003d29]">
                    Doctor Workstation Settings
                  </h1>
                  <p className="text-xs text-[#587366] mt-0.5">
                    Configure your clinical room preferences, ABDM provider sync, and notifications.
                  </p>
                </div>

                <div className="p-5 bg-white border border-[#003d29]/15 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-[#003d29]/10">
                    <div>
                      <strong className="block text-xs font-bold text-[#003d29]">
                        Doctor Room QR Code
                      </strong>
                      <span className="text-[11px] text-[#587366]">
                        {roomNumber} · Code: DOC-ROOM-04-RR
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQrModalOpen(true)}
                      className="px-3 py-1.5 bg-[#f0fff4] hover:bg-[#c9fdd7] text-[#003d29] border border-[#003d29]/20 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      View QR
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#003d29]/10">
                    <div>
                      <strong className="block text-xs font-bold text-[#003d29]">
                        Real-time Queue Audio Alerts
                      </strong>
                      <span className="text-[11px] text-[#587366]">
                        Chime when patient checks in via desk QR
                      </span>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-[#003d29] w-4 h-4 cursor-pointer" />
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#003d29]/10">
                    <div>
                      <strong className="block text-xs font-bold text-[#003d29]">
                        ABDM Provider Registry Sync
                      </strong>
                      <span className="text-[11px] text-[#587366]">
                        Connected with National Health Authority
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#347355] flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-[#347355]" />
                      <span>Verified</span>
                    </span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onLogout}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>End Clinical Session / Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Unique Doctor QR Code Modal (Requested by user) */}
      {isQrModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 border border-[#003d29]/20 shadow-2xl relative text-center">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 text-[#587366] hover:text-[#003d29] p-1 rounded-lg cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid place-items-center w-12 h-12 rounded-xl bg-[#c9fdd7] text-[#003d29] mx-auto mb-3">
              <QrCode className="w-6 h-6 stroke-[2.2]" />
            </div>

            <h3 className="text-base font-bold text-[#003d29]">
              {doctorName}&apos;s Desk QR
            </h3>
            <p className="text-xs text-[#587366] mt-0.5">
              {roomNumber} · {department}
            </p>

            {/* High-Fidelity Authentic Doctor QR Graphic */}
            <div className="my-5 p-4 bg-[#f0fff4] rounded-2xl border-2 border-dashed border-[#003d29]/25 flex flex-col items-center justify-center">
              <div className="p-3 bg-white rounded-xl shadow-md border border-[#003d29]/15 flex items-center justify-center">
                {qrDataUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={qrDataUrl}
                    alt="Doctor OPD Desk QR Code"
                    className="w-44 h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-[#587366]">
                    Generating QR...
                  </div>
                )}
              </div>

              <span className="text-xs font-mono font-bold text-[#003d29] mt-3 bg-[#c9fdd7] px-3 py-1 rounded-md border border-[#003d29]/20">
                CODE: OPD-DEMOCARE-3
              </span>
              <span className="text-[11px] font-bold text-[#003d29] mt-1">
                {doctorName} · {roomNumber}
              </span>
              <span className="text-[10px] text-[#587366]">
                {department} · {hospital}
              </span>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleCopyQrCode}
                className="w-full py-2.5 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
              >
                {qrCopied ? "Desk Code Copied!" : t("copyDeskCode")}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#347355] hover:text-[#003d29] bg-[#f0fff4] border border-[#003d29]/15 rounded-xl cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t("print")} QR Placard</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attached Document & OCR Inspection Modal for Doctor Workstation */}
      {activeDocPreview && (
        <div className="fixed inset-0 bg-[#003d29]/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#003d29]/20 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#003d29]/10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#c9fdd7] text-[#003d29]">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#003d29] truncate max-w-[240px] sm:max-w-xs">
                    {activeDocPreview.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-[#f0fff4] text-[#347355] border border-[#003d29]/10 rounded capitalize">
                      {activeDocPreview.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-[#587366]">{activeDocPreview.date}</span>
                    {activeDocPreview.fileSize && (
                      <span className="text-[10px] text-[#587366]">· {activeDocPreview.fileSize}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="p-1.5 rounded-full hover:bg-[#e8efea] text-[#587366] hover:text-[#003d29] transition-colors cursor-pointer"
                aria-label="Close document modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4">
              {/* Document Image Preview if available */}
              {activeDocPreview.previewUrl && (
                <div className="rounded-xl overflow-hidden border border-[#003d29]/15 bg-neutral-100 flex items-center justify-center max-h-56">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeDocPreview.previewUrl}
                    alt={activeDocPreview.name}
                    className="max-h-56 object-contain w-auto"
                  />
                </div>
              )}

              {/* ABDM Verified Badge */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#f0fff4] border border-[#003d29]/10 text-xs text-[#003d29]">
                <ShieldCheck className="w-4 h-4 text-[#347355] shrink-0" />
                <span className="text-[11px] font-medium">
                  ABDM Verified Health Record · Synchronized from Patient Vault
                </span>
              </div>

              {/* OCR Extracted Text Section */}
              <div className="rounded-xl border border-[#003d29]/15 bg-[#f8faf8] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#003d29] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#347355]" />
                    <span>Clinical OCR Findings</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#347355] bg-[#c9fdd7] px-2 py-0.5 rounded">
                    Tesseract Verified
                  </span>
                </div>
                {activeDocPreview.ocrText ? (
                  <pre className="text-xs font-mono text-[#092c20] bg-white p-3 rounded-lg border border-[#003d29]/10 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {activeDocPreview.ocrText}
                  </pre>
                ) : (
                  <p className="text-xs text-[#587366] italic bg-white p-3 rounded-lg border border-[#003d29]/10">
                    No OCR transcript text found for this record.
                  </p>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-[#003d29]/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setActiveDocPreview(null)}
                className="px-4 py-2 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🏥 ABDM Healthcare Professionals Registry (HPR) Referral Modal */}
      {isReferralModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#003d29]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white border border-[#003d29]/20 rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#003d29]/15">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#c9fdd7] text-[#003d29] text-[10px] font-bold border border-[#003d29]/15">
                  ABDM HPR Referral Network
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#003d29] mt-1">
                  Refer Patient to HPR Specialist
                </h3>
                <p className="text-xs text-[#587366] mt-0.5">
                  Transfer {selectedPatient?.name}&apos;s case file directly to another verified doctor on ABDM HPR.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(false)}
                className="p-1 text-[#587366] hover:text-[#003d29] rounded-lg hover:bg-[#f0fff4]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Doctor Search & Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#003d29]">
                Select HPR Doctor / Specialist:
              </label>

              {/* Doctor Search Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#347355] absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by doctor name, specialty, or HPR ID..."
                  value={referralSearchQuery}
                  onChange={(e) => setReferralSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#f0fff4] border border-[#003d29]/20 rounded-xl text-[#003d29] focus:outline-none focus:ring-2 focus:ring-[#347355]"
                />
              </div>

              {/* Doctor Selection List */}
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-none">
                {KNOWN_DOCTORS.filter(
                  (doc) =>
                    doc.id !== selectedPatient?.consultationRef?.doctorId &&
                    (doc.name.toLowerCase().includes(referralSearchQuery.toLowerCase()) ||
                      doc.specialty.toLowerCase().includes(referralSearchQuery.toLowerCase()) ||
                      (doc.hprId && doc.hprId.toLowerCase().includes(referralSearchQuery.toLowerCase())))
                ).map((doc) => {
                  const isSelected = selectedReferralDoctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedReferralDoctor(doc)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#f0fff4] border-[#003d29] ring-2 ring-[#003d29]/20 shadow-xs"
                          : "bg-white border-[#003d29]/15 hover:bg-[#f0fff4]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          style={{ backgroundColor: doc.avatarColor || "#003d29" }}
                          className="w-10 h-10 rounded-xl text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs"
                        >
                          {doc.name.split(" ").slice(-1)[0][0]}
                        </div>
                        <div className="min-w-0">
                          <strong className="block text-xs font-bold text-[#003d29] truncate">
                            {doc.name}
                          </strong>
                          <span className="block text-[11px] text-[#347355] font-semibold truncate">
                            {doc.specialty}
                          </span>
                          <span className="block text-[10px] text-[#587366] font-mono truncate">
                            HPR ID: {doc.hprId || `${doc.id.toLowerCase()}@hpr.abdm`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#003d29] border border-[#003d29]/10">
                          {doc.roomNumber}
                        </span>
                        <span className="block text-[9px] text-[#587366] mt-0.5">
                          {doc.hospital}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clinical Referral Reason */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#003d29]">
                Clinical Referral Reason & Notes:
              </label>
              <textarea
                rows={3}
                value={referralReason}
                onChange={(e) => setReferralReason(e.target.value)}
                placeholder="Specify clinical rationale (e.g. Referring for cardiology evaluation due to acute onset chest discomfort and elevated blood pressure)..."
                className="w-full p-3 text-xs bg-[#f0fff4] border border-[#003d29]/20 rounded-xl text-[#003d29] focus:outline-none focus:ring-2 focus:ring-[#347355]"
              />
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#003d29]/15 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsReferralModalOpen(false)}
                className="px-4 py-2 bg-[#f0fff4] hover:bg-[#c9fdd7] text-[#003d29] border border-[#003d29]/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedReferralDoctor || !referralReason.trim()}
                onClick={() => {
                  if (!selectedPatient?.consultationRef || !selectedReferralDoctor) return;

                  const fromDoc: DoctorProfile = {
                    id: "DOC-ANANYA-AK",
                    name: doctorName || "Dr. Ananya Kulkarni",
                    specialty: department || "General Physician & Internal Medicine",
                    hospital: hospital || "DemoCare Hospital",
                    department: department || "General Medicine",
                    roomNumber: "Room 3",
                    qrCodeToken: "OPD-DEMOCARE-3",
                    experience: "12 Years",
                    qualifications: "MBBS, MD",
                    hprId: "dr.ananya.kulkarni@hpr.abdm",
                  };

                  const updated = demoStore.referConsultation(
                    selectedPatient.consultationRef.id,
                    fromDoc,
                    selectedReferralDoctor,
                    referralReason
                  );

                  if (updated) {
                    setConsultationSuccessMsg(
                      `✓ Case successfully referred to ${selectedReferralDoctor.name} (${selectedReferralDoctor.specialty}) via ABDM HPR Network! File transferred.`
                    );
                    setStoreConsultations(demoStore.getConsultations());
                    setIsReferralModalOpen(false);
                    setReferralReason("");
                    setSelectedPatient(null);
                  }
                }}
                className="px-5 py-2.5 bg-[#003d29] hover:bg-[#347355] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-3.5 h-3.5 text-[#c9fdd7]" />
                <span>Transfer Case via ABDM HPR</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDashboard;

