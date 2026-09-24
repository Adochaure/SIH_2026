"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  QrCode,
  Clock,
  PlusCircle,
  Users,
  Camera,
  Check,
  X,
  FileText,
  AlertCircle,
  LayoutDashboard,
  Plus,
  ChevronRight,
  Stethoscope,
  Pill,
  FileCheck,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
  HeartPulse,
  ScanLine,
  UserPlus,
  Send,
  Video,
  Upload,
  MapPin,
  Star,
  Map,
  Filter,
  Navigation,
} from "lucide-react";
import { Navbar } from "./Navbar";
import {
  demoStore,
  TimelineRecord as StoreTimelineRecord,
  AttachedDocument,
  ConsultationRecord,
  DoctorProfile,
  KNOWN_DOCTORS,
} from "../lib/demoStore";
import { runOcrOnFile, SAMPLE_DOCUMENTS } from "../lib/ocrService";
import { CaseIntake } from "./CaseIntake";
import { useLanguage } from "../lib/languageContext";
import jsQR from "jsqr";

export interface PatientDashboardProps {
  patientName?: string;
  fullName?: string;
  tokenNumber?: string;
  queuePosition?: number | string;
  department?: string;
  onScanClick?: () => void;
  onViewSummaryClick?: () => void;
  onProfileClick?: () => void;
  onLogout?: () => void;
}

interface TimelineRecord {
  id: string;
  date: string;
  type: "consultation" | "lab" | "medication" | "allergy";
  title: string;
  doctor: string;
  facility: string;
  notes: string;
  tag: string;
  attachments?: AttachedDocument[];
  prescriptions?: any[];
}

interface FamilyMember {
  id: string;
  name: string;
  relation: "Father" | "Mother" | "Spouse" | "Brother" | "Sister" | "Son" | "Daughter" | string;
  age: number;
  abhaId: string;
  conditions: string[];
  bloodGroup: string;
  linked: boolean;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientName = "Shriram",
  fullName = "Shriram Vaidya",
  tokenNumber: propTokenNumber,
  queuePosition: propQueuePosition = 1,
  department = "General Medicine",
  onScanClick,
  onViewSummaryClick,
  onProfileClick,
  onLogout,
}) => {
  const { t, language } = useLanguage();

  // Navigation tabs: overview, timeline, scanner, add-history, family-tree
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "scanner" | "add-history" | "family-tree"
  >("overview");

  const [statusMessage, setStatusMessage] = useState("");
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isScanSuccess, setIsScanSuccess] = useState(false);
  const [isCaseIntakeOpen, setIsCaseIntakeOpen] = useState(false);

  // Sync with DemoStore
  const [patientData, setPatientData] = useState(() => demoStore.getPatient());
  const [consultations, setConsultations] = useState<ConsultationRecord[]>(() =>
    demoStore.getConsultations()
  );

  useEffect(() => {
    const unsubscribe = demoStore.subscribe(() => {
      setPatientData(demoStore.getPatient());
      setConsultations(demoStore.getConsultations());
    });
    return () => unsubscribe();
  }, []);

  const latestConsultation = consultations[0] || null;
  const tokenNumber = latestConsultation?.tokenNumber || propTokenNumber || "A-104";
  const queuePosition = latestConsultation?.queuePosition || propQueuePosition || 1;

  // Health Timeline State
  const timelineRecords: TimelineRecord[] = patientData.timeline as TimelineRecord[];

  // OCR state for Timeline & Add History
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ progress: 0, status: "" });
  const [timelineFilter, setTimelineFilter] = useState<
    "all" | "consultation" | "lab" | "medication"
  >("all");

  // Family Tree State (Corrected for Shriram Vaidya)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: "fam-1",
      name: "Ramesh Vaidya",
      relation: "Father",
      age: 60,
      abhaId: "12-8832-1920-4412",
      conditions: ["Hypertension", "Type 2 Diabetes"],
      bloodGroup: "B+",
      linked: true,
    },
    {
      id: "fam-2",
      name: "Sunita Vaidya",
      relation: "Mother",
      age: 56,
      abhaId: "12-7741-9923-1109",
      conditions: ["Mild Acidity", "Thyroid Normal"],
      bloodGroup: "O+",
      linked: true,
    },
    {
      id: "fam-3",
      name: "Ananya Vaidya",
      relation: "Spouse",
      age: 27,
      abhaId: "12-9988-7766-5544",
      conditions: ["None noted", "Healthy vitals"],
      bloodGroup: "A+",
      linked: true,
    },
    {
      id: "fam-4",
      name: "Aarav Vaidya",
      relation: "Son",
      age: 3,
      abhaId: "12-5512-3344-9988",
      conditions: ["Vaccinations up to date"],
      bloodGroup: "B+",
      linked: true,
    },
  ]);

  // Add Family Member Modal State with ABDM Consent
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRelation, setNewMemberRelation] = useState("Father");
  const [newMemberAbha, setNewMemberAbha] = useState("");
  const [newMemberAge, setNewMemberAge] = useState(30);
  const [newMemberBlood, setNewMemberBlood] = useState("B+");
  const [newMemberConditions, setNewMemberConditions] = useState("None");
  const [consentState, setConsentState] = useState<"form" | "sending" | "request_sent" | "accepted">("form");
  const [memberSuccessMsg, setMemberSuccessMsg] = useState("");

  // Form State for Add Medical History
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"consultation" | "lab" | "medication" | "allergy">(
    "consultation"
  );
  const [newDoctor, setNewDoctor] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const [newDate, setNewDate] = useState("2026-09-21");
  const [newNotes, setNewNotes] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [addSuccessMessage, setAddSuccessMessage] = useState("");
  const [attachedDoc, setAttachedDoc] = useState<AttachedDocument | null>(null);
  const [ocrAutoDetectedMsg, setOcrAutoDetectedMsg] = useState("");
  const [activeDocPreview, setActiveDocPreview] = useState<AttachedDocument | null>(null);
  const historyFileInputRef = useRef<HTMLInputElement>(null);

  // Doctor QR scan & assignment state
  const [scannedDoctor, setScannedDoctor] = useState<DoctorProfile | null>(null);
  const [selectedDoctorForNewCase, setSelectedDoctorForNewCase] = useState<DoctorProfile | null>(
    null
  );
  const [qrCodeInput, setQrCodeInput] = useState("");
  const [qrScanStatusMsg, setQrScanStatusMsg] = useState("");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanFrameIdRef = useRef<number | null>(null);

  // Nearby Doctors & OPD Interactive Map state
  const [selectedMapSpecialty, setSelectedMapSpecialty] = useState<string>("All");
  const [selectedMapDoctor, setSelectedMapDoctor] = useState<DoctorProfile | null>(
    KNOWN_DOCTORS[0] || null
  );
  const [isGpsLocating, setIsGpsLocating] = useState<boolean>(false);
  const [gpsAddress, setGpsAddress] = useState<string>(
    "Shivajinagar, Pune 411005 (18.5308° N, 73.8474° E)"
  );

  const handleSimulateGpsLocate = () => {
    setIsGpsLocating(true);
    setTimeout(() => {
      setIsGpsLocating(false);
      setGpsAddress("📍 GPS Locked: Deccan Gymkhana, Pune (18.5167° N, 73.8415° E)");
    }, 1200);
  };

  // Audio confirmation beep on QR detection
  const playSuccessBeep = () => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.22);
    } catch {
      // Audio synthesis fallback
    }
  };

  // Cleanup camera loop on unmount
  useEffect(() => {
    return () => {
      if (scanFrameIdRef.current) {
        cancelAnimationFrame(scanFrameIdRef.current);
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Scanner Open / Camera handler
  const handleOpenScanner = () => {
    setIsScannerModalOpen(true);
    setIsScanSuccess(false);
    setStatusMessage("");
    setScannedDoctor(null);
    setQrScanStatusMsg("");
    setQrCodeInput("");
    if (onScanClick) onScanClick();
  };

  const handleStartCamera = async () => {
    setIsCameraActive(true);
    setQrScanStatusMsg("Camera viewfinder activated. Align doctor desk QR badge...");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          // Active Frame Scanner Loop using jsQR
          const scanFrame = () => {
            if (!videoRef.current || videoRef.current.readyState < 2) {
              scanFrameIdRef.current = requestAnimationFrame(scanFrame);
              return;
            }

            const video = videoRef.current;
            if (!scanCanvasRef.current) {
              scanCanvasRef.current = document.createElement("canvas");
            }
            const canvas = scanCanvasRef.current;
            canvas.width = video.videoWidth || 320;
            canvas.height = video.videoHeight || 240;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (ctx) {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
              });

              if (code && code.data && code.data.trim()) {
                playSuccessBeep();
                handleScanDoctorCode(code.data.trim());
                return;
              }
            }

            scanFrameIdRef.current = requestAnimationFrame(scanFrame);
          };

          scanFrameIdRef.current = requestAnimationFrame(scanFrame);
        }
      }
    } catch {
      // Camera permission or device fallback
      setQrScanStatusMsg("Camera stream active. Tap 1-click test badge if camera is simulated.");
    }
  };

  const handleStopCamera = () => {
    if (scanFrameIdRef.current) {
      cancelAnimationFrame(scanFrameIdRef.current);
      scanFrameIdRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const handleScanDoctorCode = (code: string) => {
    handleStopCamera();
    const doc = demoStore.getDoctorByQr(code);
    if (doc) {
      setScannedDoctor(doc);
      setIsScanSuccess(true);
      setQrScanStatusMsg(`✓ Verified: ${doc.name} (${doc.roomNumber} · ${doc.hospital})`);
    } else {
      setQrScanStatusMsg(`QR code "${code}" recognized, but not mapped to an active OPD. Use 1-click test preset.`);
    }
  };

  const handleCheckInExistingCase = (consId: string, doc: DoctorProfile) => {
    demoStore.assignDoctorToConsultation(consId, doc);
    setQrScanStatusMsg(`✓ Checked in to ${doc.name} (${doc.roomNumber})! Notifying workstation...`);
    setTimeout(() => {
      setIsScannerModalOpen(false);
      setScannedDoctor(null);
      setIsScanSuccess(false);
      setActiveTab("overview");
    }, 1000);
  };

  const handleStartNewCaseForScannedDoctor = (doc: DoctorProfile) => {
    setSelectedDoctorForNewCase(doc);
    setIsScannerModalOpen(false);
    setScannedDoctor(null);
    setIsScanSuccess(false);
    setIsCaseIntakeOpen(true);
  };

  // Add Family Member Handlers
  const handleSendConsentRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberAbha.trim()) return;
    setConsentState("sending");
    setTimeout(() => {
      setConsentState("request_sent");
    }, 800);
  };

  const handleSimulateRelativeAccept = () => {
    const newMember: FamilyMember = {
      id: `fam-${Date.now()}`,
      name: newMemberName.trim(),
      relation: newMemberRelation,
      age: Number(newMemberAge) || 30,
      abhaId: newMemberAbha.trim(),
      conditions: newMemberConditions
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      bloodGroup: newMemberBlood,
      linked: true,
    };
    setFamilyMembers((prev) => [...prev, newMember]);
    setConsentState("accepted");
    setMemberSuccessMsg(t("memberLinkedSuccess"));
    setTimeout(() => {
      setIsAddMemberModalOpen(false);
      setConsentState("form");
      setNewMemberName("");
      setNewMemberAbha("");
      setNewMemberConditions("None");
      setMemberSuccessMsg("");
    }, 1500);
  };

  const handleHistoryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setUploadedFileName(file.name);
    try {
      const ocrRes = await runOcrOnFile(file, (p, s) => setOcrProgress({ progress: p, status: s }));
      const newDoc: AttachedDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        type: ocrRes.parsedSummary.documentType,
        date: ocrRes.parsedSummary.dateFound || new Date().toLocaleDateString("en-GB"),
        ocrText: ocrRes.text,
        fileSize: `${Math.round(file.size / 1024)} KB`,
        previewUrl: URL.createObjectURL(file),
      };
      setAttachedDoc(newDoc);
      autoFillFromOcr(ocrRes, file.name);
    } catch (err) {
      console.error("History file OCR error:", err);
    } finally {
      setOcrLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleAttachHistorySample = async (sampleId: string) => {
    const sample = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
    if (!sample) return;

    setOcrLoading(true);
    setUploadedFileName(sample.name);
    try {
      const ocrRes = await runOcrOnFile(sample.id, (p, s) =>
        setOcrProgress({ progress: p, status: s })
      );
      const newDoc: AttachedDocument = {
        id: `doc-${Date.now()}`,
        name: sample.name,
        type: sample.type,
        date: sample.date,
        ocrText: ocrRes.text,
        fileSize: sample.fileSize,
        previewUrl: sample.previewUrl,
      };
      setAttachedDoc(newDoc);
      autoFillFromOcr(ocrRes, sample.name);
    } catch (err) {
      console.error("History sample OCR error:", err);
    } finally {
      setOcrLoading(false);
    }
  };

  const autoFillFromOcr = (ocrRes: any, filename: string) => {
    if (ocrRes.parsedSummary.documentType === "prescription") {
      setNewType("medication");
      setNewTitle(
        ocrRes.parsedSummary.doctorFound
          ? `Prescription - ${ocrRes.parsedSummary.doctorFound}`
          : `Prescription Record (${filename})`
      );
    } else if (ocrRes.parsedSummary.documentType === "lab_report") {
      setNewType("lab");
      setNewTitle(`Diagnostic Lab Report (${filename})`);
    } else {
      setNewType("consultation");
      setNewTitle(`Clinical Record (${filename})`);
    }

    if (ocrRes.parsedSummary.doctorFound) {
      setNewDoctor(ocrRes.parsedSummary.doctorFound);
    } else {
      setNewDoctor("Dr. Rajesh Sharma");
    }

    if (ocrRes.text.toLowerCase().includes("apex")) {
      setNewFacility("Apex Diagnostic Laboratories");
    } else if (ocrRes.text.toLowerCase().includes("metropolis")) {
      setNewFacility("Metropolis Health Clinic");
    } else {
      setNewFacility("Carelink Primary Care Clinic");
    }

    const todayStr = new Date().toISOString().split("T")[0];
    setNewDate(todayStr);

    if (ocrRes.parsedSummary.extractedItems && ocrRes.parsedSummary.extractedItems.length > 0) {
      setNewNotes(ocrRes.parsedSummary.extractedItems.join("\n"));
    } else if (ocrRes.text) {
      setNewNotes(ocrRes.text.slice(0, 280));
    }

    setOcrAutoDetectedMsg("✓ Document Scanned & Details Auto-Detected via OCR! Review and edit the fields below before saving.");
    setTimeout(() => setOcrAutoDetectedMsg(""), 6000);
  };

  const handleAddHistorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRecord: TimelineRecord = {
      id: String(Date.now()),
      date: new Date(newDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      type: newType,
      title: newTitle.trim(),
      doctor: newDoctor.trim() || "Attending Physician",
      facility: newFacility.trim() || "Carelink Clinical OPD",
      notes: newNotes.trim() || "Record uploaded and linked to ABHA profile.",
      tag: attachedDoc ? `OCR: ${attachedDoc.name}` : uploadedFileName ? `Report: ${uploadedFileName}` : "Patient Self-Reported",
      attachments: attachedDoc ? [attachedDoc] : undefined,
    };

    demoStore.savePatient({
      ...patientData,
      timeline: [newRecord, ...patientData.timeline],
    });
    setAddSuccessMessage("Health record saved successfully to your ABDM timeline!");
    setNewTitle("");
    setNewDoctor("");
    setNewFacility("");
    setNewNotes("");
    setUploadedFileName("");
    setAttachedDoc(null);

    setTimeout(() => {
      setAddSuccessMessage("");
      setActiveTab("timeline");
    }, 1400);
  };

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const filteredTimeline =
    timelineFilter === "all"
      ? timelineRecords
      : timelineRecords.filter((r) => r.type === timelineFilter);

  // Categorize Family Members by Generation for Pedigree Visualization
  const parents = familyMembers.filter(
    (m) => m.relation === "Father" || m.relation === "Mother"
  );
  const siblingsAndSpouse = familyMembers.filter(
    (m) =>
      m.relation === "Spouse" ||
      m.relation === "Brother" ||
      m.relation === "Sister"
  );
  const children = familyMembers.filter(
    (m) => m.relation === "Son" || m.relation === "Daughter"
  );

  return (
    <div className="min-h-screen w-full bg-[#f0fff4] text-[#092c20] font-mono antialiased flex flex-col relative pb-28 sm:pb-32">
      {/* Top Navigation Bar with Profile Dropdown & Logout */}
      <Navbar
        isLoggedIn={true}
        patientName={fullName}
        patientInitials={initials}
        onProfileClick={onProfileClick}
        onLogout={onLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        {/* Header Greeting & Prominent "+ Start New Case" Button at Top */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-[#003d29]/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#347355] bg-[#c9fdd7]/70 px-2.5 py-0.5 rounded-full border border-[#003d29]/10">
                {t("patientPortal")}
              </span>
              <span className="text-[11px] text-[#587366] font-medium">
                {t("abhaId")}: 12-3456-7890-1234
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#003d29] tracking-tight leading-tight">
              {t("goodMorning")}, {patientName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#587366]">
              {t("portalSubtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Prominent "+ Start New Case" CTA at Top */}
            <button
              type="button"
              onClick={() => {
                setSelectedDoctorForNewCase(null);
                setIsCaseIntakeOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs font-bold transition-all shadow-md shadow-[#003d29]/15 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Stethoscope className="w-4 h-4 text-[#c9fdd7]" />
              <span>{t("startNewCase")}</span>
              <span className="text-[10px] px-1.5 py-0.5 bg-[#c9fdd7] text-[#003d29] rounded-md font-bold">
                {t("aiIntake")}
              </span>
            </button>

            {/* Quick Navigation Tabs for Desktop */}
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-[#c9fdd7]/60 rounded-xl border border-[#003d29]/10">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "overview"
                    ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                    : "text-[#003d29] hover:bg-white/50"
                }`}
              >
                {t("overview")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "timeline"
                    ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                    : "text-[#003d29] hover:bg-white/50"
                }`}
              >
                {t("timeline")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("add-history")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "add-history"
                    ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                    : "text-[#003d29] hover:bg-white/50"
                }`}
              >
                {t("addHistory")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("family-tree")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === "family-tree"
                    ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                    : "text-[#003d29] hover:bg-white/50"
                }`}
              >
                {t("familyTree")}
              </button>
            </div>
          </div>
        </div>

        {/* Tab View 1: Overview (Active Token & Cases) */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Top Consultation Card:
                - If active consultation exists, shows the prominent Active Token Card.
                - If initial state / no consultation, shows clean "No Active Consultation" banner without false doctor assignment.
            */}
            {latestConsultation ? (
              <article className="relative overflow-hidden p-6 sm:p-8 bg-[#003d29] text-[#f0fff4] rounded-2xl shadow-xl shadow-[#003d29]/15 flex flex-col justify-between min-h-[220px]">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full border border-[#c9fdd7]/10"
                  aria-hidden="true"
                />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#f0fff4]/70">
                      {latestConsultation.status === "Completed"
                        ? "Completed Consultation"
                        : t("currentActiveToken")}
                    </span>

                    {latestConsultation.status === "Completed" ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-[#c9fdd7] text-[10px] font-bold border border-emerald-400/30">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Consultation Completed</span>
                      </span>
                    ) : latestConsultation.checkInStatus === "pending_qr" || !latestConsultation.doctorId ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/25 text-amber-200 text-[10px] font-bold border border-amber-400/40 animate-pulse">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-300" />
                        <span>Case Created · Awaiting Room QR</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6bbf8c]/20 text-[#c9fdd7] text-[10px] font-bold border border-[#6bbf8c]/30">
                        <span className="w-2 h-2 rounded-full bg-[#6bbf8c] animate-pulse" />
                        <span>{t("activeConsultation")} · {latestConsultation.doctorName || "OPD Desk"}</span>
                      </span>
                    )}
                  </div>

                  <div className="my-4 text-4xl sm:text-5xl lg:text-6xl font-bold text-[#c9fdd7] tracking-tight">
                    {latestConsultation.tokenNumber}
                  </div>

                  {latestConsultation.status === "Completed" ? (
                    <p className="text-xs text-[#c9fdd7]/90 font-medium">
                      Diagnosis: <strong>{latestConsultation.diagnosis}</strong> ({latestConsultation.prescriptions?.length || 0} medicines prescribed)
                    </p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-[#c9fdd7] font-semibold truncate">
                        Complaint: &ldquo;{latestConsultation.chiefComplaint}&rdquo;
                      </p>
                      {latestConsultation.checkInStatus === "pending_qr" || !latestConsultation.doctorId ? (
                        <p className="text-[11px] text-amber-200 font-medium">
                          ⚠️ {t("scanDoctorQrToComplete")}
                        </p>
                      ) : (
                        <p className="text-[11px] text-[#c9fdd7]/85">
                          ✓ {t("checkedInViaQr")} · {latestConsultation.doctorName} ({latestConsultation.doctorDepartment || "OPD Room 3"}).
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 mt-4 border-t border-[#c9fdd7]/20 flex items-center justify-between">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[11px] text-[#f0fff4]/65">{t("consultationStatus")}</span>
                      <strong className="block mt-0.5 text-sm sm:text-base font-bold text-[#f0fff4]">
                        {latestConsultation.status === "Completed"
                          ? "Completed"
                          : latestConsultation.checkInStatus === "pending_qr" || !latestConsultation.doctorId
                          ? "Pending Desk QR"
                          : "Checked In & Ready"}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[11px] text-[#f0fff4]/65">{t("attendingOpd")}</span>
                      <strong className="block mt-0.5 text-sm sm:text-base font-bold text-[#f0fff4] truncate">
                        {latestConsultation.doctorName
                          ? `${latestConsultation.doctorName} (${latestConsultation.doctorDepartment || "OPD Room 3"})`
                          : "Pending Desk QR (Scan QR)"}
                      </strong>
                    </div>
                  </div>

                  {latestConsultation.checkInStatus === "pending_qr" || !latestConsultation.doctorId ? (
                    <button
                      type="button"
                      onClick={handleOpenScanner}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#003d29] text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{t("scanRoomQr")}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onViewSummaryClick}
                      className="px-4 py-2 rounded-xl bg-[#c9fdd7] hover:bg-white text-[#003d29] text-xs font-bold transition-all cursor-pointer shadow-sm"
                    >
                      {t("viewToken")} →
                    </button>
                  )}
                </div>
              </article>
            ) : (
              /* Clean Initial State Banner: No fake doctor assignment before intake / QR scan */
              <article className="relative overflow-hidden p-6 sm:p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#347355] bg-[#c9fdd7] px-2.5 py-0.5 rounded-full border border-[#003d29]/10">
                    {t("readyToStart")}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#003d29]">
                    {t("noActiveConsultation")}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#587366] max-w-lg leading-relaxed">
                    {t("noActiveConsultationDesc")}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDoctorForNewCase(null);
                      setIsCaseIntakeOpen(true);
                    }}
                    className="px-4 py-2.5 bg-[#003d29] hover:bg-[#347355] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4 text-[#c9fdd7]" />
                    <span>{t("startNewCase")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenScanner}
                    className="px-4 py-2.5 bg-[#f0fff4] hover:bg-[#c9fdd7] border border-[#003d29]/20 text-[#003d29] rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <QrCode className="w-4 h-4 text-[#347355]" />
                    <span>{t("scanRoomQr")}</span>
                  </button>
                </div>
              </article>
            )}

            {/* 4 Core Quick Action Cards: Visible ONLY on Overview tab */}
            <section
              aria-label="Core Patient Fields"
              className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
            >
              {/* Card 1: The Single Official Doctor Scanner Box */}
              <button
                type="button"
                onClick={handleOpenScanner}
                className="flex flex-col items-start justify-between p-4 sm:p-5 rounded-2xl bg-white border border-[#003d29]/15 hover:border-[#347355] hover:shadow-md transition-all text-left cursor-pointer group hover:-translate-y-0.5"
              >
                <div className="grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#003d29] text-[#c9fdd7] mb-3 group-hover:scale-105 transition-transform">
                  <QrCode className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="block text-xs sm:text-sm font-bold text-[#003d29] leading-snug">
                    {t("doctorScannerTitle")}
                  </span>
                  <span className="block text-[10px] sm:text-[11px] text-[#587366] mt-0.5">
                    {t("doctorScannerDesc")}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-[#347355] group-hover:text-[#003d29]">
                  <span>{t("open")}</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Card 2: Timeline Option */}
              <button
                type="button"
                onClick={() => setActiveTab("timeline")}
                className="flex flex-col items-start justify-between p-4 sm:p-5 rounded-2xl border border-[#003d29]/15 bg-white hover:border-[#347355] hover:shadow-md transition-all text-left cursor-pointer group hover:-translate-y-0.5"
              >
                <div className="grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-3 transition-transform group-hover:scale-105 bg-[#c9fdd7]/70 text-[#003d29]">
                  <Clock className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="block text-xs sm:text-sm font-bold leading-snug text-[#003d29]">
                    {t("healthTimelineTitle")}
                  </span>
                  <span className="block text-[10px] sm:text-[11px] mt-0.5 text-[#587366]">
                    {timelineRecords.length} {t("healthTimelineDesc")}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-[#347355]">
                  <span>{t("view")}</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Card 3: Add History Option */}
              <button
                type="button"
                onClick={() => setActiveTab("add-history")}
                className="flex flex-col items-start justify-between p-4 sm:p-5 rounded-2xl border border-[#003d29]/15 bg-white hover:border-[#347355] hover:shadow-md transition-all text-left cursor-pointer group hover:-translate-y-0.5"
              >
                <div className="grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-3 transition-transform group-hover:scale-105 bg-[#c9fdd7]/70 text-[#003d29]">
                  <PlusCircle className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="block text-xs sm:text-sm font-bold leading-snug text-[#003d29]">
                    {t("addHistoryTitle")}
                  </span>
                  <span className="block text-[10px] sm:text-[11px] mt-0.5 text-[#587366]">
                    {t("addHistoryDesc")}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-[#347355]">
                  <span>+ Record</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Card 4: Family Tree Option */}
              <button
                type="button"
                onClick={() => setActiveTab("family-tree")}
                className="flex flex-col items-start justify-between p-4 sm:p-5 rounded-2xl border border-[#003d29]/15 bg-white hover:border-[#347355] hover:shadow-md transition-all text-left cursor-pointer group hover:-translate-y-0.5"
              >
                <div className="grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-3 transition-transform group-hover:scale-105 bg-[#c9fdd7]/70 text-[#003d29]">
                  <Users className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <span className="block text-xs sm:text-sm font-bold leading-snug text-[#003d29]">
                    {t("familyTreeTitle")}
                  </span>
                  <span className="block text-[10px] sm:text-[11px] mt-0.5 text-[#587366]">
                    {familyMembers.length} {t("familyTreeDesc")}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-[#347355]">
                  <span>{t("explore")}</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>
            </section>

            {/* 📍 Nearby Doctors & OPD Interactive Map (Patient Side) */}
            <section
              aria-label="Nearby Doctors Map"
              className="p-5 sm:p-6 bg-white border border-[#003d29]/15 rounded-2xl space-y-5 shadow-xs animate-fade-in"
            >
              {/* Header Bar with Location & GPS Button */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#003d29]/10">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#347355]" />
                    <h2 className="text-base sm:text-lg font-bold text-[#003d29]">
                      Nearby Doctors & OPD Clinics Map
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#c9fdd7] text-[#003d29] border border-[#003d29]/15">
                      Live Queue GPS
                    </span>
                  </div>
                  <p className="text-xs text-[#587366] mt-1 flex items-center gap-1.5 flex-wrap">
                    <span>{gpsAddress}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateGpsLocate}
                    disabled={isGpsLocating}
                    className="px-3.5 py-2 rounded-xl bg-[#f0fff4] hover:bg-[#c9fdd7] border border-[#003d29]/20 text-[#003d29] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isGpsLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#347355]" />
                        <span>Locating...</span>
                      </>
                    ) : (
                      <>
                        <Navigation className="w-3.5 h-3.5 text-[#347355]" />
                        <span>📍 Use GPS Location</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Specialty Filter Buttons */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-xs font-bold text-[#587366] flex items-center gap-1 shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Specialty Filter:
                </span>
                {[
                  { id: "All", label: `All Doctors (${KNOWN_DOCTORS.length})` },
                  { id: "general", label: "General Medicine" },
                  { id: "cardiology", label: "Cardiology" },
                  { id: "ayush", label: "AYUSH & Integrative" },
                  { id: "pediatrics", label: "Pediatrics" },
                  { id: "orthopedics", label: "Orthopedics" },
                ].map((spec) => (
                  <button
                    key={spec.id}
                    type="button"
                    onClick={() => setSelectedMapSpecialty(spec.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      selectedMapSpecialty === spec.id
                        ? "bg-[#003d29] text-white shadow-xs"
                        : "bg-[#f0fff4] text-[#003d29] border border-[#003d29]/15 hover:bg-[#c9fdd7]"
                    }`}
                  >
                    {spec.label}
                  </button>
                ))}
              </div>

              {/* Interactive Visual Map Canvas Grid & Side Drawer */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
                {/* Visual Map Box (2 columns on LG) */}
                <div className="lg:col-span-2 relative min-h-[360px] sm:min-h-[420px] rounded-2xl bg-[#e5f5ea] border border-[#003d29]/20 overflow-hidden shadow-inner flex flex-col justify-between p-4 select-none">
                  {/* Map Graphic Overlay Background (Stylized roads & radius rings) */}
                  <div className="absolute inset-0 pointer-events-none opacity-40">
                    <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#347355" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.3" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      {/* Radius Circles around center patient */}
                      <circle cx="50%" cy="50%" r="22%" fill="none" stroke="#003d29" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.25" />
                      <circle cx="50%" cy="50%" r="40%" fill="none" stroke="#003d29" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.15" />
                      {/* Stylized road paths */}
                      <path d="M 0 200 Q 250 150 500 250 T 1000 200" fill="none" stroke="#ffffff" strokeWidth="12" />
                      <path d="M 250 0 Q 300 250 250 500" fill="none" stroke="#ffffff" strokeWidth="10" />
                      <path d="M 0 200 Q 250 150 500 250 T 1000 200" fill="none" stroke="#a3e635" strokeWidth="4" opacity="0.7" />
                    </svg>
                  </div>

                  {/* 🛣️ Interactive Navigation Route Overlay Line (Connects Patient -> Selected Doctor) */}
                  {selectedMapDoctor && (() => {
                    const docIdx = KNOWN_DOCTORS.findIndex((d) => d.id === selectedMapDoctor.id);
                    const mapPositions = [
                      { top: 28, left: 32 }, // Dr. Ananya (1.2 km)
                      { top: 22, left: 72 }, // Dr. Rajesh (2.4 km)
                      { top: 70, left: 26 }, // Dr. Meera (3.8 km)
                      { top: 65, left: 75 }, // Dr. Vikram (1.9 km)
                      { top: 78, left: 48 }, // Dr. Sunita (2.1 km)
                      { top: 18, left: 48 }, // Dr. Amit (4.5 km)
                    ];
                    const pos = mapPositions[(docIdx >= 0 ? docIdx : 0) % mapPositions.length];
                    const startX = 50;
                    const startY = 50;
                    const endX = pos.left;
                    const endY = pos.top;
                    // Compute bezier control point to curve around center roads
                    const ctrlX = (startX + endX) / 2 + (endX > 50 ? 6 : -6);
                    const ctrlY = (startY + endY) / 2 + (endY > 50 ? -6 : 6);
                    const pathD = `M ${startX} ${startY} Q ${ctrlX} ${ctrlY} ${endX} ${endY}`;
                    const midX = (startX + endX) / 2;
                    const midY = (startY + endY) / 2;

                    return (
                      <>
                        <svg
                          className="absolute inset-0 w-full h-full pointer-events-none z-10"
                          viewBox="0 0 100 100"
                          preserveAspectRatio="none"
                        >
                          {/* Route Outer Track / Glow */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#003d29"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeDasharray="2 2"
                            className="opacity-50"
                          />
                          {/* Route Inner Pulse Path */}
                          <path
                            d={pathD}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeDasharray="1.5 1.5"
                            className="animate-pulse"
                          />
                        </svg>

                        {/* Midpoint Navigation Info Badge */}
                        <div
                          style={{ left: `${midX}%`, top: `${midY}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                        >
                          <div className="px-2.5 py-1 rounded-full bg-[#003d29] text-[#c9fdd7] text-[10px] font-extrabold shadow-lg border border-[#c9fdd7]/40 flex items-center gap-1.5 animate-bounce">
                            <Navigation className="w-3 h-3 text-amber-300 fill-amber-300" />
                            <span>
                              Route: {selectedMapDoctor.distanceKm} · ~
                              {Math.max(
                                3,
                                Math.round(parseFloat(selectedMapDoctor.distanceKm || "1.2") * 2.5)
                              )}{" "}
                              mins
                            </span>
                          </div>
                        </div>
                      </>
                    );
                  })()}

                  {/* Radius Legend Badge top left */}
                  <div className="relative z-10 flex items-center justify-between w-full pointer-events-none">
                    <div className="px-3 py-1 rounded-xl bg-white/90 backdrop-blur-xs border border-[#003d29]/15 text-[11px] font-semibold text-[#003d29] shadow-xs">
                      📍 Pune Health Zone Map · 5km Radius
                    </div>
                    <div className="px-2.5 py-1 rounded-xl bg-emerald-900/80 text-white text-[10px] font-bold">
                      {KNOWN_DOCTORS.filter(d => selectedMapSpecialty === "All" || d.category === selectedMapSpecialty).length} Doctors Pinpointed
                    </div>
                  </div>

                  {/* Center Patient Location Pin */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
                    <div className="relative flex items-center justify-center">
                      <span className="absolute w-10 h-10 rounded-full bg-[#347355]/30 animate-ping" />
                      <div className="w-8 h-8 rounded-full bg-[#003d29] border-2 border-white text-white flex items-center justify-center shadow-lg font-bold text-xs">
                        You
                      </div>
                    </div>
                    <span className="mt-1 px-2 py-0.5 rounded-md bg-[#003d29] text-[#c9fdd7] text-[10px] font-bold shadow-xs whitespace-nowrap">
                      📍 Shriram (Patient)
                    </span>
                  </div>

                  {/* Doctor Profile Pins mapped around canvas */}
                  {KNOWN_DOCTORS.map((doc, idx) => {
                    const isFilteredOut = selectedMapSpecialty !== "All" && doc.category !== selectedMapSpecialty;
                    if (isFilteredOut) return null;

                    const isSelected = selectedMapDoctor?.id === doc.id;

                    const mapPositions = [
                      { top: '28%', left: '32%' }, // Dr. Ananya (1.2 km)
                      { top: '22%', left: '72%' }, // Dr. Rajesh (2.4 km)
                      { top: '70%', left: '26%' }, // Dr. Meera (3.8 km)
                      { top: '65%', left: '75%' }, // Dr. Vikram (1.9 km)
                      { top: '78%', left: '48%' }, // Dr. Sunita (2.1 km)
                      { top: '18%', left: '48%' }, // Dr. Amit (4.5 km)
                    ];
                    const pos = mapPositions[idx % mapPositions.length];

                    return (
                      <div
                        key={doc.id}
                        onClick={() => setSelectedMapDoctor(doc)}
                        style={{ top: pos.top, left: pos.left }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group transition-all duration-300 ${
                          isSelected ? "scale-110 z-30" : "hover:scale-105"
                        }`}
                      >
                        {/* Circular Doctor Avatar Pin */}
                        <div className="relative flex flex-col items-center">
                          {/* Selected Glow Ring */}
                          {isSelected && (
                            <span className="absolute -inset-2 rounded-full bg-[#347355]/40 animate-pulse ring-2 ring-[#003d29]" />
                          )}

                          {/* Avatar Circle Container */}
                          <div className="relative flex items-center justify-center">
                            <div
                              style={{ backgroundColor: doc.avatarColor || '#003d29' }}
                              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full border-2 ${
                                isSelected ? 'border-amber-400 ring-4 ring-[#003d29]/40 scale-105' : 'border-white'
                              } text-white font-bold flex items-center justify-center text-xs shadow-md transition-all group-hover:shadow-xl`}
                            >
                              {doc.name.split(" ").slice(-1)[0][0]}
                            </div>

                          {/* Rating Badge (Top Left) */}
                          <span className="absolute -top-2 -left-2 px-1.5 py-0.5 rounded-full bg-white text-[#003d29] text-[9px] font-bold border border-[#003d29]/20 shadow-sm flex items-center gap-0.5 z-10">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                            {doc.rating || 4.9}
                          </span>

                          {/* Live Queue Badge (Top Right) */}
                          <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full bg-amber-400 text-[#003d29] text-[9px] font-extrabold border border-white shadow-sm z-10 whitespace-nowrap">
                            {doc.currentPatientCount || 2} Wait
                          </span>
                        </div>

                        {/* Clear Unobstructed Bottom Label Pill */}
                        <div className={`mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md whitespace-nowrap transition-all flex items-center gap-1.5 border z-10 ${
                          isSelected
                            ? "bg-[#003d29] text-white border-amber-400 ring-2 ring-[#003d29]/20"
                            : "bg-white text-[#003d29] border-[#003d29]/20 group-hover:bg-[#f0fff4]"
                        }`}>
                          <span className="truncate max-w-[85px]">{doc.name.split(" ")[1]}</span>
                          <span className="w-1 h-1 rounded-full bg-amber-400" />
                          <span className="text-[#347355] font-extrabold text-[10px]">{doc.distanceKm}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Map Controls Bottom Right */}
                <div className="relative z-10 self-end flex items-center gap-1.5 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-lg bg-white/90 text-[#003d29] text-[10px] font-bold border border-[#003d29]/15 shadow-xs">
                    Click doctor pin to view navigation route
                  </span>
                </div>
              </div>
            </div>

                {/* Selected Doctor Drawer / Card (1 column on LG) */}
                {selectedMapDoctor && (
                  <div className="p-5 rounded-2xl bg-[#f0fff4] border border-[#003d29]/20 shadow-xs flex flex-col justify-between space-y-4 animate-fade-in">
                    <div>
                      <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#003d29]/15">
                        <div className="flex items-center gap-3">
                          <div
                            style={{ backgroundColor: selectedMapDoctor.avatarColor || '#003d29' }}
                            className="w-12 h-12 rounded-2xl text-white font-bold text-base flex items-center justify-center shadow-sm"
                          >
                            {selectedMapDoctor.name.split(" ").slice(-1)[0][0]}
                          </div>
                          <div>
                            <h3 className="text-sm sm:text-base font-bold text-[#003d29]">
                              {selectedMapDoctor.name}
                            </h3>
                            <span className="text-xs text-[#347355] font-semibold block">
                              {selectedMapDoctor.specialty}
                            </span>
                            <span className="text-[11px] text-[#587366] block">
                              {selectedMapDoctor.experience} · {selectedMapDoctor.qualifications}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="px-2 py-0.5 rounded-lg bg-amber-400/30 text-[#003d29] text-xs font-bold flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                            {selectedMapDoctor.rating || 4.9}
                          </span>
                          <span className="text-[10px] text-[#587366] mt-0.5">
                            ({selectedMapDoctor.reviewCount || 100} reviews)
                          </span>
                        </div>
                      </div>

                      {/* Details List */}
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#003d29]/10">
                          <span className="text-[#587366] font-medium flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-[#347355]" /> Distance from you:
                          </span>
                          <strong className="text-[#003d29] font-bold">{selectedMapDoctor.distanceKm || "1.2 km"} away</strong>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#003d29]/10">
                          <span className="text-[#587366] font-medium flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#347355]" /> Live Patient Queue:
                          </span>
                          <strong className="text-[#003d29] font-bold">
                            {selectedMapDoctor.currentPatientCount || 3} Patients Waiting
                          </strong>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-[#003d29]/10">
                          <span className="text-[#587366] font-medium flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5 text-[#347355]" /> Room / Clinic:
                          </span>
                          <strong className="text-[#003d29] font-bold truncate max-w-[150px]">
                            {selectedMapDoctor.roomNumber} ({selectedMapDoctor.hospital})
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-[#003d29]/15 space-y-2">
                      <button
                        type="button"
                        onClick={() => handleStartNewCaseForScannedDoctor(selectedMapDoctor)}
                        className="w-full py-2.5 px-4 bg-[#003d29] hover:bg-[#347355] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-[#c9fdd7]" />
                        <span>Start Consultation with {selectedMapDoctor.name.split(" ")[1]}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenScanner}
                        className="w-full py-2 px-4 bg-white hover:bg-[#c9fdd7] border border-[#003d29]/20 text-[#003d29] text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                      >
                        <QrCode className="w-3.5 h-3.5 text-[#347355]" />
                        <span>Scan Desk QR Code Check-in</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* My Consultation Cases Section */}
            {consultations.length > 0 && (
              <section
                aria-label="My Consultation Cases"
                className="p-5 sm:p-6 bg-white border border-[#003d29]/15 rounded-2xl space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#347355]" />
                    <h2 className="text-sm sm:text-base font-bold text-[#003d29]">
                      {t("myConsultationCases")} ({consultations.length})
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDoctorForNewCase(null);
                      setIsCaseIntakeOpen(true);
                    }}
                    className="text-xs font-bold text-[#347355] hover:text-[#003d29] underline underline-offset-4 cursor-pointer"
                  >
                    {t("makeNewCase")}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {consultations.map((cons) => (
                    <article
                      key={cons.id}
                      className="p-4 rounded-xl border border-[#003d29]/10 bg-[#f0fff4]/50 hover:bg-[#f0fff4] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-[#003d29] text-[#c9fdd7] px-2.5 py-0.5 rounded-md">
                            {cons.tokenNumber}
                          </span>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#347355] border border-[#003d29]/15">
                            {cons.pathway === "ayush" ? t("ayushHolistic") : t("generalMedicine")}
                          </span>
                          {cons.status === "Completed" ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ✓ {t("completed")}
                            </span>
                          ) : cons.checkInStatus === "pending_qr" || !cons.doctorId ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              ⚠️ {t("awaitingRoomQr")}
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              <span>{t("checkedIn")} · {cons.doctorRoom || "OPD Room 3"}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#003d29] font-semibold truncate">
                          &ldquo;{cons.chiefComplaint}&rdquo;
                        </p>

                        <div className="text-[11px] text-[#587366] flex flex-wrap items-center gap-3">
                          <span>
                            {t("physician")}: <strong>{cons.doctorName || "Pending Desk QR"}</strong>
                          </span>
                          <span>{t("created")}: {cons.createdAt}</span>
                          {cons.diagnosis && (
                            <span className="text-[#003d29] font-medium">
                              Dx: {cons.diagnosis}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {cons.checkInStatus === "pending_qr" || !cons.doctorId ? (
                          <button
                            type="button"
                            onClick={handleOpenScanner}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>{t("scanQr")}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={onViewSummaryClick}
                            className="px-3 py-1.5 bg-[#003d29] hover:bg-[#347355] text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            {t("viewToken")}
                          </button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tab View 2: Health Timeline */}
        {activeTab === "timeline" && (
          <section
            aria-label="Health Timeline"
            className="p-5 sm:p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-sm animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#003d29]/10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#347355]">
                  {t("chronologicalRecord")}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#003d29] tracking-tight mt-0.5">
                  {t("digitalHealthTimeline")}
                </h2>
                <p className="text-xs text-[#587366] mt-1">
                  {t("timelineSubtitle")}
                </p>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 bg-[#f0fff4] p-1 rounded-xl border border-[#003d29]/10">
                {(["all", "consultation", "lab", "medication"] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setTimelineFilter(filter)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                      timelineFilter === filter
                        ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                        : "text-[#347355] hover:bg-[#c9fdd7]/50"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="mt-6 space-y-4">
              {filteredTimeline.length === 0 ? (
                <div className="py-12 text-center text-[#587366] space-y-2">
                  <Clock className="w-8 h-8 text-[#347355] mx-auto opacity-50" />
                  <p className="text-xs font-bold text-[#003d29]">{t("noRecordsFound")}</p>
                  <p className="text-[11px]">
                    {t("noRecordsDesc")}
                  </p>
                </div>
              ) : (
                filteredTimeline.map((item) => (
                  <article
                    key={item.id}
                    className="p-4 sm:p-5 rounded-xl border border-[#003d29]/15 bg-[#f0fff4]/50 hover:bg-[#f0fff4] transition-all space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#347355] bg-[#c9fdd7] px-2 py-0.5 rounded">
                          {item.tag}
                        </span>
                        <h3 className="text-sm font-bold text-[#003d29] mt-1.5">{item.title}</h3>
                        <p className="text-[11px] text-[#587366]">
                          {item.doctor} · {item.facility}
                        </p>
                      </div>
                      <span className="text-xs text-[#587366] font-semibold">{item.date}</span>
                    </div>

                    <p className="text-xs text-[#092c20] leading-relaxed bg-white/70 p-2.5 rounded-lg border border-[#003d29]/10">
                      {item.notes}
                    </p>

                    {item.prescriptions && item.prescriptions.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] font-bold text-[#347355] uppercase block mb-1">
                          Prescribed Medications:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                          {item.prescriptions.map((rx, idx) => (
                            <div
                              key={idx}
                              className="p-2 bg-white rounded border border-[#003d29]/10 text-[#003d29]"
                            >
                              <strong>{rx.name}</strong> · {rx.frequency} ({rx.duration})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached Documents & Reports */}
                    {item.attachments && item.attachments.length > 0 && (
                      <div className="pt-2 border-t border-[#003d29]/10">
                        <span className="text-[10px] font-bold text-[#347355] uppercase block mb-1.5 flex items-center gap-1">
                          <FileCheck className="w-3.5 h-3.5 text-[#347355]" />
                          <span>Attached Clinical Documents ({item.attachments.length}):</span>
                        </span>
                        <div className="space-y-1.5">
                          {item.attachments.map((doc) => (
                            <div
                              key={doc.id}
                              className="p-2.5 bg-white rounded-lg border border-[#003d29]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-[#347355] shrink-0" />
                                <div className="min-w-0">
                                  <strong className="block text-[#003d29] truncate">{doc.name}</strong>
                                  <span className="text-[10px] text-[#587366]">
                                    {doc.type.replace("_", " ")} · {doc.date}
                                  </span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => setActiveDocPreview(doc)}
                                className="px-2.5 py-1 bg-[#f0fff4] hover:bg-[#c9fdd7] text-[#003d29] border border-[#003d29]/15 rounded text-[11px] font-bold transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                              >
                                View / OCR Text
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        )}

        {/* Tab View 3: Add Medical History */}
        {activeTab === "add-history" && (
          <section
            aria-label="Add Medical History"
            className="p-5 sm:p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-sm animate-fade-in max-w-2xl mx-auto"
          >
            <div className="pb-5 border-b border-[#003d29]/10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#347355]">
                {t("selfReportedRecords")}
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#003d29] tracking-tight mt-0.5">
                {t("addPastMedicalRecord")}
              </h2>
              <p className="text-xs text-[#587366] mt-1">
                {t("addPastMedicalRecordDesc")}
              </p>
            </div>

            {addSuccessMessage && (
              <div className="my-4 p-3 bg-[#c9fdd7] border border-[#347355]/30 rounded-xl text-xs font-bold text-[#003d29] flex items-center gap-2">
                <Check className="w-4 h-4 text-[#347355]" />
                <span>{addSuccessMessage}</span>
              </div>
            )}

            {/* Document Attachment & OCR Auto-Detection Card */}
            <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-[#f0fff4] border-2 border-dashed border-[#347355]/40 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#003d29] text-[#c9fdd7] flex items-center justify-center shrink-0">
                    <ScanLine className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#003d29]">
                      Attach Document & Auto-Detect via OCR
                    </h3>
                    <p className="text-[11px] text-[#587366]">
                      Upload prescription or lab report to auto-fill title, doctor, facility & clinical details.
                    </p>
                  </div>
                </div>

                {attachedDoc && (
                  <span className="px-2.5 py-1 rounded-full bg-[#c9fdd7] text-[#003d29] text-[10px] font-bold self-start sm:self-auto flex items-center gap-1">
                    <Check className="w-3 h-3 text-[#347355]" />
                    <span>OCR Scanned</span>
                  </span>
                )}
              </div>

              {/* Upload & Camera Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  ref={historyFileInputRef}
                  onChange={handleHistoryFileUpload}
                  accept="image/*,application/pdf"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => historyFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-[#003d29] hover:bg-[#347355] text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5 text-[#c9fdd7]" />
                  <span>Upload File / Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => historyFileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-xl bg-white border border-[#003d29]/20 hover:border-[#347355] text-[#003d29] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-[#347355]" />
                  <span>Scan via Camera</span>
                </button>
              </div>

              {/* Quick 1-Click Test Samples */}
              <div className="pt-2 border-t border-[#003d29]/10">
                <span className="text-[10px] uppercase font-bold text-[#587366] block mb-1.5">
                  Or test with 1-click sample document:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAttachHistorySample("sample-rx-1")}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-[#003d29]/15 hover:border-[#347355] hover:bg-[#c9fdd7]/40 text-[11px] font-bold text-[#003d29] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#347355]" />
                    <span>Dr_Sharma_Prescription.png</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAttachHistorySample("sample-lab-1")}
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-[#003d29]/15 hover:border-[#347355] hover:bg-[#c9fdd7]/40 text-[11px] font-bold text-[#003d29] flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <FileCheck className="w-3.5 h-3.5 text-[#347355]" />
                    <span>Apex_CBC_Lab_Report.pdf</span>
                  </button>
                </div>
              </div>

              {/* OCR Scanning Progress */}
              {ocrLoading && (
                <div className="p-3 bg-white rounded-xl border border-[#003d29]/15 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#003d29] flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#347355]" />
                      <span>{ocrProgress.status || "Scanning document pixels & extracting text..."}</span>
                    </span>
                    <span className="font-bold text-[#347355]">{ocrProgress.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f0fff4] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#003d29] transition-all duration-300"
                      style={{ width: `${Math.max(10, ocrProgress.progress)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Attached Document Card */}
              {attachedDoc && !ocrLoading && (
                <div className="p-3 bg-white rounded-xl border border-[#003d29]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#c9fdd7] text-[#003d29] flex items-center justify-center shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-[#003d29] truncate">
                        {attachedDoc.name}
                      </strong>
                      <span className="block text-[10px] text-[#587366]">
                        {attachedDoc.fileSize || "245 KB"} · Type: {attachedDoc.type.replace("_", " ")} · {attachedDoc.date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveDocPreview(attachedDoc)}
                      className="px-2.5 py-1 bg-[#f0fff4] hover:bg-[#c9fdd7] text-[#003d29] border border-[#003d29]/15 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      Inspect OCR Text
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedDoc(null);
                        setUploadedFileName("");
                      }}
                      className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                      title="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* OCR Auto-Detected Confirmation Banner */}
            {ocrAutoDetectedMsg && (
              <div className="my-3 p-3 bg-[#c9fdd7] border border-[#347355]/30 rounded-xl text-xs font-bold text-[#003d29] flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-[#347355] shrink-0" />
                <span>{ocrAutoDetectedMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddHistorySubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#003d29] mb-1">
                  Title of Record *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Chest X-Ray Report, Blood Test CBC, Previous Rx"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#347355]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#003d29] mb-1">
                    Record Category
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3.5 py-2 text-xs bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option value="consultation">OPD Consultation</option>
                    <option value="lab">Lab / Diagnostic Report</option>
                    <option value="medication">Prescription</option>
                    <option value="allergy">Allergy / Condition</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#003d29] mb-1">Date</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#003d29] mb-1">
                    Doctor / Clinic Name
                  </label>
                  <input
                    type="text"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    placeholder="e.g. Dr. Rajesh Sharma"
                    className="w-full px-3.5 py-2 text-xs bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#003d29] mb-1">
                    Hospital / Diagnostic Lab
                  </label>
                  <input
                    type="text"
                    value={newFacility}
                    onChange={(e) => setNewFacility(e.target.value)}
                    placeholder="e.g. Apex Diagnostics"
                    className="w-full px-3.5 py-2 text-xs bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#003d29] mb-1">Clinical Notes</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Summary of findings, normal readings, or doctor advice..."
                  className="w-full px-3.5 py-2 text-xs bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-[#003d29] hover:bg-[#347355] text-white rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Save Record to Timeline
              </button>
            </form>
          </section>
        )}

        {/* Tab View 4: Connected Family Medical Tree with Pedigree Hierarchy & Add Member Option */}
        {activeTab === "family-tree" && (
          <section
            aria-label="Family Medical Tree"
            className="p-5 sm:p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-sm animate-fade-in space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#003d29]/10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#347355]">
                  {t("familyHealthNetwork")}
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#003d29] tracking-tight mt-0.5">
                  {t("familyMedicalTree")}
                </h2>
                <p className="text-xs text-[#587366] mt-1">
                  {t("familyTreeSubtitle")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9fdd7] text-[#003d29] text-xs font-bold border border-[#347355]/20">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#347355]" />
                  <span>{t("consentLinkedAbdm")}</span>
                </span>

                {/* + Add Family Member Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsAddMemberModalOpen(true);
                    setConsentState("form");
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#003d29] hover:bg-[#347355] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#c9fdd7]" />
                  <span>{t("addFamilyMember")}</span>
                </button>
              </div>
            </div>

            {/* Hereditary Health Alert Banner for Shriram Vaidya */}
            <div className="p-4 bg-[#f0fff4] border border-[#347355]/25 rounded-xl flex items-start gap-3">
              <HeartPulse className="w-5 h-5 text-[#347355] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#092c20]">
                <strong className="font-bold text-[#003d29] block">
                  {t("hereditaryInsight")}
                </strong>
                <span>{t("hereditaryDesc")}</span>
              </div>
            </div>

            {/* CONNECTED PEDIGREE TREE VIEW */}
            <div className="p-6 bg-[#f0fff4]/50 border border-[#003d29]/15 rounded-2xl space-y-8 overflow-x-auto">
              {/* Level 1: Generation 1 (Parents) */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#587366] bg-white px-3 py-0.5 rounded-full border border-[#003d29]/15 mb-4">
                  Generation I · Parents
                </span>

                <div className="flex flex-wrap items-center justify-center gap-6 relative">
                  {parents.map((p) => (
                    <div
                      key={p.id}
                      className="w-64 p-4 rounded-xl bg-white border border-[#003d29]/20 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#347355] bg-[#c9fdd7] px-2 py-0.5 rounded">
                          {p.relation}
                        </span>
                        <span className="text-[10px] text-[#587366]">Blood: {p.bloodGroup}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#003d29]">{p.name}</h4>
                      <p className="text-[11px] text-[#587366]">{p.age} years · {p.abhaId}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.conditions.map((c, i) => (
                          <span key={i} className="text-[9px] font-bold bg-[#f0fff4] border border-[#003d29]/15 text-[#003d29] px-1.5 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Connecting Line Down to Generation 2 */}
                <div className="w-0.5 h-8 bg-[#347355] my-2" />
              </div>

              {/* Level 2: Generation 2 (Self: Shriram Vaidya + Spouse / Siblings) */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#587366] bg-white px-3 py-0.5 rounded-full border border-[#003d29]/15 mb-4">
                  Generation II · Current Lineage
                </span>

                <div className="flex flex-wrap items-center justify-center gap-6">
                  {/* Highlighted Self Card (Shriram Vaidya) */}
                  <div className="w-72 p-5 rounded-2xl bg-[#003d29] text-[#f0fff4] border-2 border-[#c9fdd7] shadow-lg relative transform hover:scale-[1.02] transition-transform">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#003d29] bg-[#c9fdd7] px-2.5 py-0.5 rounded-md">
                        {t("selfPatient")}
                      </span>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#48bb78] ring-2 ring-white/30" />
                    </div>

                    <h4 className="text-base font-bold text-white">{fullName}</h4>
                    <p className="text-xs text-[#c9fdd7]/80">29y · Male · Blood: B+</p>
                    <p className="text-[10px] text-[#f0fff4]/60 font-mono mt-0.5">
                      ABHA: 12-3456-7890-1234
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-xs text-[#c9fdd7]">
                      <span>Active Token: <strong>{tokenNumber}</strong></span>
                      <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded">Linked</span>
                    </div>
                  </div>

                  {/* Siblings / Spouse */}
                  {siblingsAndSpouse.map((s) => (
                    <div
                      key={s.id}
                      className="w-64 p-4 rounded-xl bg-white border border-[#003d29]/20 shadow-xs flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-[#347355] bg-[#c9fdd7] px-2 py-0.5 rounded">
                          {s.relation}
                        </span>
                        <span className="text-[10px] text-[#587366]">Blood: {s.bloodGroup}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#003d29]">{s.name}</h4>
                      <p className="text-[11px] text-[#587366]">{s.age} years · {s.abhaId}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {s.conditions.map((c, i) => (
                          <span key={i} className="text-[9px] font-bold bg-[#f0fff4] border border-[#003d29]/15 text-[#003d29] px-1.5 py-0.5 rounded">
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Connecting Line Down to Generation 3 */}
                {children.length > 0 && <div className="w-0.5 h-8 bg-[#347355] my-2" />}
              </div>

              {/* Level 3: Generation 3 (Children) */}
              {children.length > 0 && (
                <div className="flex flex-col items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#587366] bg-white px-3 py-0.5 rounded-full border border-[#003d29]/15 mb-4">
                    Generation III · Children
                  </span>

                  <div className="flex flex-wrap items-center justify-center gap-6">
                    {children.map((c) => (
                      <div
                        key={c.id}
                        className="w-64 p-4 rounded-xl bg-white border border-[#003d29]/20 shadow-xs flex flex-col justify-between"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-[#347355] bg-[#c9fdd7] px-2 py-0.5 rounded">
                            {c.relation}
                          </span>
                          <span className="text-[10px] text-[#587366]">Blood: {c.bloodGroup}</span>
                        </div>
                        <h4 className="text-sm font-bold text-[#003d29]">{c.name}</h4>
                        <p className="text-[11px] text-[#587366]">{c.age} years · {c.abhaId}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.conditions.map((cond, i) => (
                            <span key={i} className="text-[9px] font-bold bg-[#f0fff4] border border-[#003d29]/15 text-[#003d29] px-1.5 py-0.5 rounded">
                              {cond}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* Interactive Modal: Add Family Member with ABDM Consent Flow */}
      {isAddMemberModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md bg-[#f0fff4] rounded-2xl p-6 border border-[#003d29]/20 shadow-2xl relative font-mono text-[#092c20]">
            <button
              type="button"
              onClick={() => setIsAddMemberModalOpen(false)}
              className="absolute top-4 right-4 text-[#587366] hover:text-[#003d29] p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#347355] bg-[#c9fdd7] px-2.5 py-0.5 rounded-full border border-[#003d29]/15">
                ABDM Family Link
              </span>
              <h3 className="text-base font-bold text-[#003d29] mt-1.5">
                {t("addFamilyMember")}
              </h3>
              <p className="text-xs text-[#587366] mt-0.5">
                Link relative&apos;s ABHA profile with consent to share health history.
              </p>
            </div>

            {consentState === "form" && (
              <form onSubmit={handleSendConsentRequest} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-[#003d29] mb-1">Relative&apos;s Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    placeholder="e.g. Ramesh Vaidya / Ananya Vaidya"
                    className="w-full px-3 py-2 bg-white border border-[#003d29]/20 rounded-xl outline-none focus:border-[#003d29]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-[#003d29] mb-1">Relationship *</label>
                    <select
                      value={newMemberRelation}
                      onChange={(e) => setNewMemberRelation(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#003d29]/20 rounded-xl outline-none"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#003d29] mb-1">Age</label>
                    <input
                      type="number"
                      value={newMemberAge}
                      onChange={(e) => setNewMemberAge(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-[#003d29]/20 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-[#003d29] mb-1">Relative&apos;s ABHA ID *</label>
                  <input
                    type="text"
                    required
                    value={newMemberAbha}
                    onChange={(e) => setNewMemberAbha(e.target.value)}
                    placeholder="e.g. 12-8832-1920-4412"
                    className="w-full px-3 py-2 bg-white border border-[#003d29]/20 rounded-xl outline-none focus:border-[#003d29] font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-[#003d29] mb-1">Blood Group</label>
                    <select
                      value={newMemberBlood}
                      onChange={(e) => setNewMemberBlood(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#003d29]/20 rounded-xl outline-none"
                    >
                      {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#003d29] mb-1">Known Conditions</label>
                    <input
                      type="text"
                      value={newMemberConditions}
                      onChange={(e) => setNewMemberConditions(e.target.value)}
                      placeholder="e.g. Hypertension, None"
                      className="w-full px-3 py-2 bg-white border border-[#003d29]/20 rounded-xl outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-2.5 bg-[#003d29] hover:bg-[#347355] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5 text-[#c9fdd7]" />
                  <span>{t("sendConsentRequest")}</span>
                </button>
              </form>
            )}

            {consentState === "sending" && (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-8 h-8 text-[#347355] animate-spin mx-auto" />
                <p className="text-xs font-bold text-[#003d29]">Transmitting consent request via ABDM gateway...</p>
              </div>
            )}

            {consentState === "request_sent" && (
              <div className="py-5 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-[#003d29]">Consent Request Pending</h4>
                  <p className="text-xs text-[#587366] max-w-xs mx-auto">
                    {t("requestSent")}
                  </p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-[#003d29]/15 text-[11px] text-[#003d29] space-y-1 text-left">
                  <div><strong>Member:</strong> {newMemberName} ({newMemberRelation})</div>
                  <div><strong>ABHA:</strong> {newMemberAbha}</div>
                  <div><strong>Scope:</strong> Hereditary medical profile & emergency consent</div>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateRelativeAccept}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{t("simulateAccept")}</span>
                </button>
              </div>
            )}

            {consentState === "accepted" && (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6 animate-bounce" />
                </div>
                <p className="text-sm font-bold text-[#003d29]">{memberSuccessMsg}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REAL WORKING DOCTOR DESK QR SCANNER MODAL (No OCR here - 100% focused on Doctor QR) */}
      {isScannerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="w-full max-w-md bg-[#f0fff4] rounded-2xl p-6 border border-[#003d29]/20 shadow-2xl relative font-mono text-[#092c20]">
            <button
              type="button"
              onClick={() => {
                handleStopCamera();
                setIsScannerModalOpen(false);
              }}
              className="absolute top-4 right-4 text-[#587366] hover:text-[#003d29] p-1 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-4">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#347355] bg-[#c9fdd7] px-2.5 py-0.5 rounded-full border border-[#003d29]/15">
                Carelink OPD Room Scanner
              </span>
              <h3 className="text-base font-bold text-[#003d29] mt-1.5">
                {t("scannerTitle")}
              </h3>
              <p className="text-xs text-[#587366] mt-0.5">
                {t("scannerSubtitle")}
              </p>
            </div>

            <div className="space-y-3">
              {scannedDoctor ? (
                /* Verified Doctor Card & Case Routing Options */
                <div className="space-y-3 animate-fade-in">
                  <div className="p-4 bg-white rounded-xl border-2 border-[#347355] shadow-sm space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 mb-1">
                          <Check className="w-3 h-3 text-emerald-700" />
                          <span>{t("verifiedDoctorDesk")}</span>
                        </span>
                        <h4 className="text-sm font-bold text-[#003d29]">
                          {scannedDoctor.name}
                        </h4>
                        <p className="text-[11px] text-[#587366]">
                          {scannedDoctor.department} · {scannedDoctor.hospital}
                        </p>
                        <p className="text-[11px] font-bold text-[#347355] mt-0.5">
                          Location: {scannedDoctor.roomNumber}
                        </p>
                      </div>
                      <span className="font-mono text-[10px] font-bold bg-[#003d29] text-[#c9fdd7] px-2 py-0.5 rounded">
                        {scannedDoctor.qrCodeToken}
                      </span>
                    </div>
                  </div>

                  {/* Active/Pending Case Check */}
                  {(() => {
                    const activeCase =
                      consultations.find((c) => c.status === "Waiting") || latestConsultation;
                    if (activeCase && activeCase.status !== "Completed") {
                      return (
                        <div className="p-3 bg-white/80 rounded-xl border border-[#003d29]/15 space-y-2">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#003d29]">
                              Existing Case: Token {activeCase.tokenNumber}
                            </span>
                            <span className="text-[10px] text-[#587366]">
                              {activeCase.pathway === "ayush" ? "AYUSH" : "General Medicine"}
                            </span>
                          </div>
                          <p className="text-xs text-[#587366] italic truncate">
                            &ldquo;{activeCase.chiefComplaint}&rdquo;
                          </p>

                          {/* Option A: Link & Check-in Existing Case */}
                          <button
                            type="button"
                            onClick={() => handleCheckInExistingCase(activeCase.id, scannedDoctor)}
                            className="w-full py-2.5 px-3 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                          >
                            <Check className="w-4 h-4 text-[#c9fdd7]" />
                            <span>{t("checkInExistingCase")} (Token {activeCase.tokenNumber})</span>
                          </button>

                          {/* Option B: Create New Case for this Doctor */}
                          <button
                            type="button"
                            onClick={() => handleStartNewCaseForScannedDoctor(scannedDoctor)}
                            className="w-full py-2 px-3 bg-white hover:bg-[#c9fdd7]/40 text-[#003d29] border border-[#003d29]/20 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{t("startNewCaseForDoctor")}</span>
                          </button>
                        </div>
                      );
                    } else {
                      return (
                        <div className="p-3 bg-white/80 rounded-xl border border-[#003d29]/15 space-y-2.5 text-center">
                          <p className="text-xs text-[#587366]">
                            No pending case found. Start a new consultation for <strong>{scannedDoctor.name}</strong>.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleStartNewCaseForScannedDoctor(scannedDoctor)}
                            className="w-full py-2.5 px-3 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                          >
                            <Stethoscope className="w-4 h-4 text-[#c9fdd7]" />
                            <span>Start Case for {scannedDoctor.name}</span>
                          </button>
                        </div>
                      );
                    }
                  })()}

                  <button
                    type="button"
                    onClick={() => {
                      setScannedDoctor(null);
                      setIsScanSuccess(false);
                      setQrScanStatusMsg("");
                    }}
                    className="w-full py-1.5 text-center text-[11px] text-[#587366] hover:text-[#003d29] underline underline-offset-2 cursor-pointer"
                  >
                    {t("scanDifferentDoctor")}
                  </button>
                </div>
              ) : (
                /* Viewfinder & Doctor Demonstration Presets */
                <div className="space-y-3">
                  {/* Camera Viewfinder with Scan Laser */}
                  <div className="relative aspect-video w-full bg-[#003d29] rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-[#6bbf8c]">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`absolute inset-0 w-full h-full object-cover ${
                        isCameraActive ? "block" : "hidden"
                      }`}
                    />

                    {/* Animated Scanning Laser Line */}
                    <div className="pointer-events-none absolute inset-x-0 h-0.5 bg-[#48bb78] shadow-[0_0_12px_#48bb78] animate-pulse z-10" />

                    <div className="w-40 h-32 border-2 border-[#c9fdd7] rounded-lg relative flex flex-col items-center justify-center animate-pulse text-[#c9fdd7]/70 z-10 bg-black/20">
                      <Camera className="w-8 h-8 text-[#6bbf8c]" />
                      <span className="text-[10px] text-[#c9fdd7] font-semibold mt-2 text-center px-1">
                        {t("alignDoctorQr")}
                      </span>
                    </div>

                    {!isCameraActive && (
                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="absolute bottom-2 right-2 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-[10px] font-bold backdrop-blur-xs flex items-center gap-1 z-20 cursor-pointer"
                      >
                        <Video className="w-3 h-3 text-[#c9fdd7]" />
                        <span>Live Camera</span>
                      </button>
                    )}
                  </div>

                  {/* Manual Code Input Form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (qrCodeInput.trim()) {
                        handleScanDoctorCode(qrCodeInput.trim());
                      }
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={qrCodeInput}
                      onChange={(e) => setQrCodeInput(e.target.value)}
                      placeholder={t("enterRoomCode")}
                      className="flex-1 px-3 py-2 text-xs bg-white border border-[#003d29]/20 rounded-xl outline-none focus:border-[#003d29] text-[#003d29] placeholder-[#587366]/60 font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3.5 py-2 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                    >
                      {t("verifyQr")}
                    </button>
                  </form>

                  {/* Quick 1-Click Doctor Presets (Demonstration Target) */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#587366] block">
                      {t("quickTestPresets")}
                    </span>

                    {/* Dr. Ananya Kulkarni Room 3 */}
                    <button
                      type="button"
                      onClick={() => handleScanDoctorCode("OPD-DEMOCARE-3")}
                      className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-[#c9fdd7]/50 border-2 border-[#347355]/30 text-xs font-bold text-[#003d29] transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                    >
                      <div>
                        <span className="block text-[#003d29] group-hover:text-[#347355]">
                          ⚡ Dr. Ananya Kulkarni (General Medicine)
                        </span>
                        <span className="block text-[10px] text-[#587366] font-normal">
                          OPD Room 3 · DemoCare Hospital
                        </span>
                      </div>
                      <span className="font-mono text-[10px] bg-[#003d29] text-[#c9fdd7] px-2 py-0.5 rounded">
                        OPD-DEMOCARE-3
                      </span>
                    </button>

                    {/* Dr. Rajesh Rao Room 4 */}
                    <button
                      type="button"
                      onClick={() => handleScanDoctorCode("DOC-OPD4-RR-4821")}
                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-[#c9fdd7]/40 border border-[#003d29]/15 text-xs font-bold text-[#003d29] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="block">Dr. Rajesh Rao (Pulmonology)</span>
                        <span className="block text-[10px] text-[#587366] font-normal">
                          OPD Room 4 · Carelink Central OPD
                        </span>
                      </div>
                      <span className="font-mono text-[10px] bg-[#c9fdd7] text-[#003d29] px-2 py-0.5 rounded">
                        DOC-OPD4-RR-4821
                      </span>
                    </button>

                    {/* Dr. Meera Nambiar Room 1 */}
                    <button
                      type="button"
                      onClick={() => handleScanDoctorCode("AYUSH-HOLISTIC-1")}
                      className="w-full text-left p-2 rounded-xl bg-white hover:bg-[#c9fdd7]/40 border border-[#003d29]/15 text-xs font-bold text-[#003d29] transition-all cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <span className="block">Dr. Meera Nambiar (AYUSH Holistic)</span>
                        <span className="block text-[10px] text-[#587366] font-normal">
                          OPD Room 1 · Carelink Holistic Center
                        </span>
                      </div>
                      <span className="font-mono text-[10px] bg-[#c9fdd7] text-[#003d29] px-2 py-0.5 rounded">
                        AYUSH-HOLISTIC-1
                      </span>
                    </button>
                  </div>

                  {qrScanStatusMsg && (
                    <p className="text-center text-[11px] font-bold text-[#347355] bg-[#c9fdd7]/70 p-2 rounded-lg animate-fade-in">
                      {qrScanStatusMsg}
                    </p>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                handleStopCamera();
                setIsScannerModalOpen(false);
              }}
              className="mt-3 w-full py-2 text-[#587366] hover:text-[#003d29] text-xs font-bold cursor-pointer text-center"
            >
              {t("close")}
            </button>
          </div>
        </div>
      )}

      {/* Case Intake Modal Flow */}
      {isCaseIntakeOpen && (
        <CaseIntake
          patientName={fullName}
          assignedDoctor={selectedDoctorForNewCase}
          onClose={() => {
            setIsCaseIntakeOpen(false);
            setSelectedDoctorForNewCase(null);
          }}
          onComplete={(cons) => {
            setIsCaseIntakeOpen(false);
            setSelectedDoctorForNewCase(null);
            setPatientData(demoStore.getPatient());
            setConsultations(demoStore.getConsultations());
            if (onViewSummaryClick) {
              onViewSummaryClick();
            }
          }}
        />
      )}

      {/* Attached Document & OCR Text Modal */}
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
                  ABDM Verified Health Record · Linked to ABHA locker
                </span>
              </div>

              {/* OCR Extracted Text Section */}
              <div className="rounded-xl border border-[#003d29]/15 bg-[#f8faf8] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#003d29] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#347355]" />
                    <span>Extracted OCR Transcript</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#347355] bg-[#c9fdd7] px-2 py-0.5 rounded">
                    Tesseract Engine
                  </span>
                </div>
                {activeDocPreview.ocrText ? (
                  <pre className="text-xs font-mono text-[#092c20] bg-white p-3 rounded-lg border border-[#003d29]/10 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {activeDocPreview.ocrText}
                  </pre>
                ) : (
                  <p className="text-xs text-[#587366] italic bg-white p-3 rounded-lg border border-[#003d29]/10">
                    No OCR transcript text extracted for this record.
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
                {t("close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation Bar - Fixed on Mobile */}
      <nav
        aria-label="Patient Bottom Navigation"
        className="fixed-bottom-nav bg-[#003d29] border-t border-[#002619] shadow-[0_-8px_24px_rgba(0,61,41,0.22)] py-2 px-3 sm:px-6"
      >
        <div className="max-w-md sm:max-w-lg md:max-w-xl mx-auto flex items-center justify-between">
          {/* Bottom Nav Item 1: Overview */}
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "overview"
                ? "text-[#c9fdd7] font-bold"
                : "text-[#f0fff4]/65 hover:text-[#f0fff4]"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight">{t("overview")}</span>
            {activeTab === "overview" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9fdd7] mt-0.5" />
            )}
          </button>

          {/* Bottom Nav Item 2: Timeline */}
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "timeline"
                ? "text-[#c9fdd7] font-bold"
                : "text-[#f0fff4]/65 hover:text-[#f0fff4]"
            }`}
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight">{t("timeline")}</span>
            {activeTab === "timeline" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9fdd7] mt-0.5" />
            )}
          </button>

          {/* Bottom Nav Center Floating Item: Scanner */}
          <button
            type="button"
            onClick={handleOpenScanner}
            className="flex flex-col items-center justify-center -mt-5 cursor-pointer group"
            aria-label="Scan Doctor QR"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#c9fdd7] text-[#003d29] shadow-lg shadow-black/30 flex items-center justify-center border-4 border-[#003d29] group-hover:scale-105 transition-transform">
              <QrCode className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.4]" />
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold text-[#c9fdd7] mt-0.5">
              {t("scanner")}
            </span>
          </button>

          {/* Bottom Nav Item 4: Add History */}
          <button
            type="button"
            onClick={() => setActiveTab("add-history")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "add-history"
                ? "text-[#c9fdd7] font-bold"
                : "text-[#f0fff4]/65 hover:text-[#f0fff4]"
            }`}
          >
            <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight">{t("addHistory")}</span>
            {activeTab === "add-history" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9fdd7] mt-0.5" />
            )}
          </button>

          {/* Bottom Nav Item 5: Family Tree */}
          <button
            type="button"
            onClick={() => setActiveTab("family-tree")}
            className={`flex flex-col items-center justify-center gap-1 py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
              activeTab === "family-tree"
                ? "text-[#c9fdd7] font-bold"
                : "text-[#f0fff4]/65 hover:text-[#f0fff4]"
            }`}
          >
            <Users className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-[11px] leading-tight">{t("familyTree")}</span>
            {activeTab === "family-tree" && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9fdd7] mt-0.5" />
            )}
          </button>
        </div>
      </nav>
    </div>
  );
};

export default PatientDashboard;
