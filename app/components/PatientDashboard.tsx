"use client";

import React, { useState } from "react";
import {
  ScanLine,
  QrCode,
  ArrowRight,
  FileText,
  X,
  Camera,
  Clock,
  PlusCircle,
  Users,
  Activity,
  Calendar,
  ShieldCheck,
  Check,
  Upload,
  HeartPulse,
  AlertCircle,
  LayoutDashboard,
  Plus,
  ChevronRight,
  Stethoscope,
  Pill,
} from "lucide-react";
import { Navbar } from "./Navbar";

export interface PatientDashboardProps {
  patientName?: string;
  fullName?: string;
  tokenNumber?: string;
  queuePosition?: number | string;
  department?: string;
  onScanClick?: () => void;
  onViewSummaryClick?: () => void;
  onProfileClick?: () => void;
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
}

interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  age: number;
  abhaId: string;
  conditions: string[];
  bloodGroup: string;
  linked: boolean;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patientName = "Priya",
  fullName = "Priya Sharma",
  tokenNumber = "C-214",
  queuePosition = 3,
  department = "General care",
  onScanClick,
  onViewSummaryClick,
  onProfileClick,
}) => {
  // Navigation tabs: overview, timeline, scanner, add-history, family-tree
  const [activeTab, setActiveTab] = useState<
    "overview" | "timeline" | "scanner" | "add-history" | "family-tree"
  >("overview");

  const [statusMessage, setStatusMessage] = useState("");
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isScanSuccess, setIsScanSuccess] = useState(false);

  // Health Timeline State
  const [timelineRecords, setTimelineRecords] = useState<TimelineRecord[]>([
    {
      id: "1",
      date: "14 Sep 2026",
      type: "consultation",
      title: "General Consultation - Acute Bronchitis",
      doctor: "Dr. Rajesh Rao (MBBS, MD)",
      facility: "Carelink Central Clinic, Room 4",
      notes: "Symptoms: Persistent dry cough and mild chest tightness for 4 days. Prescribed Azithromycin 500mg and steam inhalation.",
      tag: "Prescription Attached",
    },
    {
      id: "2",
      date: "02 Aug 2026",
      type: "lab",
      title: "Complete Blood Count (CBC) & HbA1c",
      doctor: "Dr. Anita Desai (Pathologist)",
      facility: "Apex Diagnostic Laboratories",
      notes: "HbA1c: 5.4% (Normal reference < 5.7%). Platelet count: 2.4 Lakh. All parameters within optimal health limits.",
      tag: "ABDM Verified Report",
    },
    {
      id: "3",
      date: "15 Jan 2026",
      type: "consultation",
      title: "Routine Seasonal Health Checkup",
      doctor: "Dr. S. K. Gupta",
      facility: "Wellness Community Center",
      notes: "Blood pressure: 118/76 mmHg. Heart rate: 72 bpm. Recommended routine vitamin D supplementation.",
      tag: "Vitals Recorded",
    },
  ]);

  const [timelineFilter, setTimelineFilter] = useState<
    "all" | "consultation" | "lab" | "medication"
  >("all");

  // Family Tree State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
    {
      id: "fam-1",
      name: "Ramesh Sharma",
      relation: "Father",
      age: 58,
      abhaId: "14-8832-1920-4412",
      conditions: ["Hypertension", "Type 2 Diabetes"],
      bloodGroup: "B+",
      linked: true,
    },
    {
      id: "fam-2",
      name: "Sunita Sharma",
      relation: "Mother",
      age: 54,
      abhaId: "14-7741-9923-1109",
      conditions: ["Asthma", "Mild Thyroid"],
      bloodGroup: "O+",
      linked: true,
    },
    {
      id: "fam-3",
      name: "Aarav Sharma",
      relation: "Son",
      age: 4,
      abhaId: "14-5512-3344-9988",
      conditions: ["No known allergies", "Vaccinations up to date"],
      bloodGroup: "B+",
      linked: true,
    },
  ]);

  // Form State for Add Medical History
  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState<"consultation" | "lab" | "medication" | "allergy">("consultation");
  const [newDoctor, setNewDoctor] = useState("");
  const [newFacility, setNewFacility] = useState("");
  const [newDate, setNewDate] = useState("2026-09-16");
  const [newNotes, setNewNotes] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [addSuccessMessage, setAddSuccessMessage] = useState("");

  const handleOpenScanner = () => {
    setIsScannerModalOpen(true);
    setIsScanSuccess(false);
    setStatusMessage("Scanner activated. Align the doctor's QR code.");
    if (onScanClick) onScanClick();
  };

  const handleSimulateScan = () => {
    setIsScanSuccess(true);
    setStatusMessage("QR verified! Connected to Dr. Rajesh Rao's consultation room.");
    setTimeout(() => {
      setIsScannerModalOpen(false);
    }, 1800);
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
      tag: uploadedFileName ? `Report: ${uploadedFileName}` : "Patient Self-Reported",
    };

    setTimelineRecords([newRecord, ...timelineRecords]);
    setAddSuccessMessage("Health record saved successfully to your ABDM timeline!");
    setNewTitle("");
    setNewDoctor("");
    setNewFacility("");
    setNewNotes("");
    setUploadedFileName("");

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

  return (
    <div className="min-h-screen w-full bg-[#f0fff4] text-[#092c20] font-mono antialiased flex flex-col relative pb-28 sm:pb-32">
      {/* Top Navigation Bar with Profile Icon */}
      <Navbar
        isLoggedIn={true}
        patientName={fullName}
        patientInitials={initials}
        onProfileClick={onProfileClick}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-6 sm:py-10">
        {/* Header Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8 pb-4 border-b border-[#003d29]/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#347355] bg-[#c9fdd7]/70 px-2.5 py-0.5 rounded-full border border-[#003d29]/10">
                Patient Portal
              </span>
              <span className="text-[11px] text-[#587366] font-medium">
                ABHA ID: 14-1234-5678-4821
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#003d29] tracking-tight leading-tight">
              Good morning, {patientName}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#587366]">
              Your active consultation queue and digital medical record are up to date.
            </p>
          </div>

          {/* Quick Tab Pill for Desktop */}
          <div className="hidden md:flex items-center gap-1.5 p-1 bg-[#c9fdd7]/60 rounded-xl border border-[#003d29]/10 self-start">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "overview"
                  ? "bg-[#003d29] text-[#f0fff4] shadow-xs"
                  : "text-[#003d29] hover:bg-white/50"
              }`}
            >
              Overview
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
              Timeline
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
              + Add History
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
              Family Tree
            </button>
          </div>
        </div>

        {/* 4 Quick Action Fields/Cards (Requested: scanner, timeline, add history, family tree) */}
        <section
          aria-label="Core Patient Fields"
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8"
        >
          {/* Field 1: Scanner Option */}
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
                Doctor Scanner
              </span>
              <span className="block text-[10px] sm:text-[11px] text-[#587366] mt-0.5">
                Scan room QR badge
              </span>
            </div>
            <span className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold text-[#347355] group-hover:text-[#003d29]">
              <span>Open</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>

          {/* Field 2: Timeline Option */}
          <button
            type="button"
            onClick={() => setActiveTab("timeline")}
            className={`flex flex-col items-start justify-between p-4 sm:p-5 rounded-2xl border transition-all text-left cursor-pointer group hover:-translate-y-0.5 ${
              activeTab === "timeline"
                ? "bg-[#003d29] text-[#f0fff4] border-[#003d29] shadow-md"
                : "bg-white border-[#003d29]/15 hover:border-[#347355] hover:shadow-md"
            }`}
          >
            <div
              className={`grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-3 transition-transform group-hover:scale-105 ${
                activeTab === "timeline"
                  ? "bg-white/15 text-[#c9fdd7]"
                  : "bg-[#c9fdd7]/70 text-[#003d29]"
              }`}
            >
              <Clock className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span
                className={`block text-xs sm:text-sm font-bold leading-snug ${
                  activeTab === "timeline" ? "text-[#f0fff4]" : "text-[#003d29]"
                }`}
              >
                Health Timeline
              </span>
              <span
                className={`block text-[10px] sm:text-[11px] mt-0.5 ${
                  activeTab === "timeline" ? "text-[#f0fff4]/75" : "text-[#587366]"
                }`}
              >
                {timelineRecords.length} recorded visits & tests
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 mt-3 text-[10px] font-bold ${
                activeTab === "timeline" ? "text-[#c9fdd7]" : "text-[#347355]"
              }`}
            >
              <span>View</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>

          {/* Field 3: Add History Option */}
          <button
            type="button"
            onClick={() => setActiveTab("add-history")}
            className={`flex flex-col items-start justify-between p-4 sm:p-5 rounded-2xl border transition-all text-left cursor-pointer group hover:-translate-y-0.5 ${
              activeTab === "add-history"
                ? "bg-[#003d29] text-[#f0fff4] border-[#003d29] shadow-md"
                : "bg-white border-[#003d29]/15 hover:border-[#347355] hover:shadow-md"
            }`}
          >
            <div
              className={`grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-3 transition-transform group-hover:scale-105 ${
                activeTab === "add-history"
                  ? "bg-white/15 text-[#c9fdd7]"
                  : "bg-[#c9fdd7]/70 text-[#003d29]"
              }`}
            >
              <PlusCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span
                className={`block text-xs sm:text-sm font-bold leading-snug ${
                  activeTab === "add-history" ? "text-[#f0fff4]" : "text-[#003d29]"
                }`}
              >
                Add History
              </span>
              <span
                className={`block text-[10px] sm:text-[11px] mt-0.5 ${
                  activeTab === "add-history" ? "text-[#f0fff4]/75" : "text-[#587366]"
                }`}
              >
                Upload reports & records
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 mt-3 text-[10px] font-bold ${
                activeTab === "add-history" ? "text-[#c9fdd7]" : "text-[#347355]"
              }`}
            >
              <span>+ Record</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>

          {/* Field 4: Family Tree Option */}
          <button
            type="button"
            onClick={() => setActiveTab("family-tree")}
            className={`flex flex-col items-start justify-between p-4 sm:p-5 rounded-2xl border transition-all text-left cursor-pointer group hover:-translate-y-0.5 ${
              activeTab === "family-tree"
                ? "bg-[#003d29] text-[#f0fff4] border-[#003d29] shadow-md"
                : "bg-white border-[#003d29]/15 hover:border-[#347355] hover:shadow-md"
            }`}
          >
            <div
              className={`grid place-items-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl mb-3 transition-transform group-hover:scale-105 ${
                activeTab === "family-tree"
                  ? "bg-white/15 text-[#c9fdd7]"
                  : "bg-[#c9fdd7]/70 text-[#003d29]"
              }`}
            >
              <Users className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span
                className={`block text-xs sm:text-sm font-bold leading-snug ${
                  activeTab === "family-tree" ? "text-[#f0fff4]" : "text-[#003d29]"
                }`}
              >
                Family Tree
              </span>
              <span
                className={`block text-[10px] sm:text-[11px] mt-0.5 ${
                  activeTab === "family-tree" ? "text-[#f0fff4]/75" : "text-[#587366]"
                }`}
              >
                {familyMembers.length} linked health profiles
              </span>
            </div>
            <span
              className={`inline-flex items-center gap-1 mt-3 text-[10px] font-bold ${
                activeTab === "family-tree" ? "text-[#c9fdd7]" : "text-[#347355]"
              }`}
            >
              <span>Explore</span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </section>

        {/* Tab View 1: Overview (Active Token & Live Queue) */}
        {activeTab === "overview" && (
          <div className="space-y-5 animate-fade-in">
            {/* Top Cards Grid */}
            <section
              aria-label="Current consultation status"
              className="grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr] gap-5"
            >
              {/* Active Token Card */}
              <article className="relative overflow-hidden p-6 sm:p-8 bg-[#003d29] text-[#f0fff4] rounded-2xl shadow-xl shadow-[#003d29]/15 flex flex-col justify-between min-h-[260px]">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 w-56 h-56 rounded-full border border-[#c9fdd7]/10"
                  aria-hidden="true"
                />

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-[#f0fff4]/70">
                      Current Token
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#6bbf8c]/20 text-[#c9fdd7] text-[10px] font-bold border border-[#6bbf8c]/30">
                      <span className="w-2 h-2 rounded-full bg-[#6bbf8c] animate-pulse" />
                      Live in queue
                    </span>
                  </div>

                  <div className="my-5 text-5xl sm:text-6xl font-bold text-[#c9fdd7] tracking-tight">
                    {tokenNumber}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-5 border-t border-[#c9fdd7]/20">
                  <div>
                    <span className="block text-[11px] text-[#f0fff4]/65">Queue position</span>
                    <strong className="block mt-1 text-lg sm:text-xl font-bold text-[#f0fff4]">
                      {queuePosition}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-[11px] text-[#f0fff4]/65">Department</span>
                    <strong className="block mt-1 text-lg sm:text-xl font-bold text-[#f0fff4]">
                      {department}
                    </strong>
                  </div>
                </div>
              </article>

              {/* Doctor QR Scanner Card */}
              <article className="flex flex-col justify-between p-6 sm:p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-sm min-h-[260px]">
                <div>
                  <div className="grid place-items-center w-12 h-12 rounded-xl bg-[#c9fdd7]/60 text-[#347355] mb-4">
                    <ScanLine className="w-6 h-6 stroke-[2.2]" />
                  </div>

                  <h2 className="text-lg font-bold text-[#003d29] tracking-tight">
                    Scan Doctor Code
                  </h2>
                  <p className="mt-2 text-xs text-[#587366] leading-relaxed">
                    Scan your doctor&apos;s desk QR code when you are invited into the consultation room.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenScanner}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-[#347355] hover:bg-[#003d29] text-[#f0fff4] rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#347355]/20 hover:shadow-[#347355]/30 transition-all duration-200 cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Open Scanner</span>
                </button>
              </article>
            </section>

            {/* Medical History Banner */}
            <section
              aria-label="Medical history ready"
              className="p-5 sm:p-6 bg-white border border-[#003d29]/15 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-xs hover:border-[#347355]"
            >
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="grid place-items-center w-10 h-10 rounded-xl bg-[#c9fdd7]/60 text-[#003d29] flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#347355]" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-[#003d29]">
                    Prepared Clinical Summary
                  </h2>
                  <p className="text-xs text-[#587366] mt-0.5">
                    Your digital consultation summary is prepared and ready for your doctor to review.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setActiveTab("timeline")}
                  className="px-3 py-2 text-xs font-bold text-[#347355] bg-[#f0fff4] hover:bg-[#c9fdd7]/50 rounded-lg border border-[#003d29]/15 cursor-pointer transition-colors"
                >
                  Timeline ({timelineRecords.length})
                </button>
                <button
                  type="button"
                  onClick={onViewSummaryClick}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#003d29] text-[#f0fff4] rounded-lg text-xs font-bold cursor-pointer hover:bg-[#347355] transition-colors"
                >
                  <span>View Voucher</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Tab View 2: Health Timeline (Chronological History) */}
        {activeTab === "timeline" && (
          <section
            aria-label="Health Timeline"
            className="p-5 sm:p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-sm animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#003d29]/10">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-[#003d29] tracking-tight">
                  Medical Health Timeline
                </h2>
                <p className="text-xs text-[#587366] mt-1">
                  Chronological records synced securely with your ABDM digital health lockers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("add-history")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#003d29] text-[#f0fff4] rounded-lg text-xs font-bold hover:bg-[#347355] transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Record</span>
                </button>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 my-5 overflow-x-auto pb-1 text-xs">
              <span className="text-[11px] font-bold text-[#587366] uppercase">Filter:</span>
              <button
                type="button"
                onClick={() => setTimelineFilter("all")}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  timelineFilter === "all"
                    ? "bg-[#347355] text-white"
                    : "bg-[#f0fff4] text-[#347355] border border-[#003d29]/15"
                }`}
              >
                All Records ({timelineRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter("consultation")}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  timelineFilter === "consultation"
                    ? "bg-[#347355] text-white"
                    : "bg-[#f0fff4] text-[#347355] border border-[#003d29]/15"
                }`}
              >
                Consultations
              </button>
              <button
                type="button"
                onClick={() => setTimelineFilter("lab")}
                className={`px-3 py-1 rounded-full font-semibold transition-all cursor-pointer ${
                  timelineFilter === "lab"
                    ? "bg-[#347355] text-white"
                    : "bg-[#f0fff4] text-[#347355] border border-[#003d29]/15"
                }`}
              >
                Lab Reports
              </button>
            </div>

            {/* Timeline Stream */}
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#003d29]/15">
              {filteredTimeline.map((item) => (
                <div key={item.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#347355] border-3 border-white ring-2 ring-[#c9fdd7] flex items-center justify-center" />

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#f0fff4] border border-[#003d29]/10 group-hover:border-[#347355]/40 group-hover:bg-white transition-all shadow-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-[#347355] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.date}</span>
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#c9fdd7] text-[#003d29]">
                        {item.tag}
                      </span>
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-[#003d29]">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[#587366] mt-0.5">
                      {item.doctor} · {item.facility}
                    </p>

                    <p className="mt-2.5 text-xs text-[#092c20] leading-relaxed bg-white/70 p-2.5 rounded-lg border border-[#003d29]/10">
                      {item.notes}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Tab View 3: Add Medical History (Form / Upload) */}
        {activeTab === "add-history" && (
          <section
            aria-label="Add Medical History"
            className="p-5 sm:p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-sm animate-fade-in max-w-2xl mx-auto"
          >
            <div className="pb-5 border-b border-[#003d29]/10 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#347355]">
                Self-Reported Record
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#003d29] tracking-tight mt-0.5">
                Add to Medical History
              </h2>
              <p className="text-xs text-[#587366] mt-1">
                Record past diagnoses, existing medication, allergies, or upload recent clinical tests.
              </p>
            </div>

            {addSuccessMessage && (
              <div className="mb-6 p-3 bg-[#c9fdd7] border border-[#347355]/30 rounded-xl text-xs font-bold text-[#003d29] flex items-center gap-2 animate-fade-in">
                <Check className="w-4 h-4 text-[#347355]" />
                <span>{addSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleAddHistorySubmit} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#003d29] mb-1.5">
                  Record Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "consultation", label: "Consultation", icon: Stethoscope },
                    { id: "lab", label: "Lab Report", icon: FileText },
                    { id: "medication", label: "Medication", icon: Pill },
                    { id: "allergy", label: "Allergy", icon: AlertCircle },
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewType(cat.id as any)}
                        className={`flex items-center justify-center gap-1.5 p-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          newType === cat.id
                            ? "bg-[#003d29] text-[#f0fff4] border-[#003d29] shadow-xs"
                            : "bg-[#f0fff4] text-[#003d29] border-[#003d29]/15 hover:bg-white"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="history-title" className="block text-xs font-bold text-[#003d29] mb-1">
                  Title / Condition Name *
                </label>
                <input
                  id="history-title"
                  type="text"
                  required
                  placeholder="e.g. Type 2 Diabetes follow-up / Penicillin allergy"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6bbf8c]"
                />
              </div>

              {/* Date & Doctor Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="history-date" className="block text-xs font-bold text-[#003d29] mb-1">
                    Date
                  </label>
                  <input
                    id="history-date"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6bbf8c]"
                  />
                </div>

                <div>
                  <label htmlFor="history-doctor" className="block text-xs font-bold text-[#003d29] mb-1">
                    Doctor / Specialist (Optional)
                  </label>
                  <input
                    id="history-doctor"
                    type="text"
                    placeholder="e.g. Dr. A. K. Verma"
                    value={newDoctor}
                    onChange={(e) => setNewDoctor(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6bbf8c]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="history-notes" className="block text-xs font-bold text-[#003d29] mb-1">
                  Clinical Notes & Symptoms
                </label>
                <textarea
                  id="history-notes"
                  rows={3}
                  placeholder="Mention prescribed medication, severity, advice, or recent readings..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#f0fff4] border border-[#003d29]/20 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6bbf8c] resize-none"
                />
              </div>

              {/* Simulated Document Upload Dropzone */}
              <div>
                <label className="block text-xs font-bold text-[#003d29] mb-1">
                  Attach Medical Document (PDF / JPEG)
                </label>
                <div
                  onClick={() =>
                    setUploadedFileName(
                      uploadedFileName
                        ? ""
                        : `Prescription_Record_${Math.floor(1000 + Math.random() * 9000)}.pdf`
                    )
                  }
                  className="p-4 border-2 border-dashed border-[#003d29]/25 hover:border-[#347355] rounded-xl bg-[#f0fff4] text-center cursor-pointer transition-colors"
                >
                  <Upload className="w-5 h-5 mx-auto text-[#347355] mb-1.5" />
                  {uploadedFileName ? (
                    <p className="text-xs font-bold text-[#003d29]">
                      Attached: <span className="underline">{uploadedFileName}</span> (Click to remove)
                    </p>
                  ) : (
                    <p className="text-xs text-[#587366]">
                      <span className="font-bold text-[#003d29]">Click to attach sample report</span> or drag & drop here
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab("overview")}
                  className="px-4 py-2.5 text-xs font-bold text-[#587366] hover:text-[#003d29] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#003d29] hover:bg-[#347355] text-[#f0fff4] rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-[#003d29]/20 transition-all cursor-pointer"
                >
                  Save to ABHA Record
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Tab View 4: Family Tree (Linked Members & Hereditary Health) */}
        {activeTab === "family-tree" && (
          <section
            aria-label="Family Medical Tree"
            className="p-5 sm:p-8 bg-white border border-[#003d29]/15 rounded-2xl shadow-sm animate-fade-in"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#003d29]/10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#347355]">
                  Family Health Network
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-[#003d29] tracking-tight mt-0.5">
                  Family Medical Tree & Hereditary Profile
                </h2>
                <p className="text-xs text-[#587366] mt-1">
                  Track linked family ABHA accounts to identify hereditary patterns and coordinate care.
                </p>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#c9fdd7] text-[#003d29] text-xs font-bold border border-[#347355]/20 self-start sm:self-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-[#347355]" />
                <span>Consent Linked (ABDM)</span>
              </span>
            </div>

            {/* Hereditary Health Alert Banner */}
            <div className="my-5 p-4 bg-[#f0fff4] border border-[#347355]/25 rounded-xl flex items-start gap-3">
              <HeartPulse className="w-5 h-5 text-[#347355] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#092c20]">
                <strong className="font-bold text-[#003d29] block">
                  Family Health Hereditary Insight
                </strong>
                <span>
                  High blood pressure (Hypertension) and Diabetes are noted in 2 direct relatives (Father, Mother). Regular annual BP and fasting glucose screening is recommended for Priya.
                </span>
              </div>
            </div>

            {/* Family Members Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {/* Primary User Card (Self) */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#003d29] text-[#f0fff4] border border-[#003d29] shadow-sm relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#c9fdd7]">
                      Self (Patient)
                    </span>
                    <span className="w-2.5 h-2.5 rounded-full bg-[#48bb78] ring-2 ring-white/20" />
                  </div>
                  <h3 className="text-base font-bold text-[#f0fff4] mt-2">
                    {fullName}
                  </h3>
                  <p className="text-xs text-[#c9fdd7]/80">28y · Female · B+</p>
                  <p className="text-[11px] text-[#f0fff4]/60 mt-1">
                    ABHA: 14-1234-5678-4821
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/15 text-xs text-[#c9fdd7]">
                  Active Queue Token: <strong>{tokenNumber}</strong>
                </div>
              </div>

              {/* Linked Family Members */}
              {familyMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-4 sm:p-5 rounded-xl bg-[#f0fff4] border border-[#003d29]/15 hover:bg-white hover:border-[#347355] transition-all shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#347355] px-2 py-0.5 bg-white rounded-md border border-[#003d29]/10">
                        {member.relation}
                      </span>
                      <span className="text-[10px] text-[#587366] font-semibold">
                        Blood: {member.bloodGroup}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#003d29] mt-2">
                      {member.name}
                    </h3>
                    <p className="text-xs text-[#587366] mt-0.5">
                      {member.age} years · Linked ABHA
                    </p>
                    <p className="text-[10px] text-[#587366] font-mono mt-0.5">
                      {member.abhaId}
                    </p>

                    {/* Conditions Tags */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {member.conditions.map((cond, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-[#003d29] border border-[#003d29]/10"
                        >
                          {cond}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#003d29]/10 flex items-center justify-between text-xs text-[#347355] font-semibold">
                    <span>ABDM Sync: Active</span>
                    <Check className="w-3.5 h-3.5 text-[#347355]" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Status notification */}
        {statusMessage && (
          <p
            role="status"
            aria-live="polite"
            className="mt-6 text-center text-xs font-semibold text-[#003d29] bg-[#c9fdd7]/70 p-3 rounded-xl border border-[#347355]/20 animate-fade-in max-w-xl mx-auto"
          >
            {statusMessage}
          </p>
        )}
      </main>

      {/* Interactive Scanner Modal */}
      {isScannerModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="w-full max-w-sm bg-[#f0fff4] rounded-2xl p-6 border border-[#003d29]/20 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setIsScannerModalOpen(false)}
              className="absolute top-4 right-4 text-[#587366] hover:text-[#003d29] p-1 rounded-lg cursor-pointer"
              aria-label="Close scanner"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5">
              <h3 className="text-base font-bold text-[#003d29]">Doctor QR Scanner</h3>
              <p className="text-xs text-[#587366] mt-1">
                Point your camera at your doctor&apos;s desk QR badge.
              </p>
            </div>

            {/* Viewfinder simulation */}
            <div className="relative aspect-square w-full bg-[#003d29] rounded-xl overflow-hidden flex items-center justify-center border-2 border-dashed border-[#6bbf8c]">
              <div
                className={`w-44 h-44 border-2 rounded-lg relative flex flex-col items-center justify-center transition-all ${
                  isScanSuccess
                    ? "border-[#48bb78] bg-[#48bb78]/20 text-[#c9fdd7]"
                    : "border-[#c9fdd7] animate-pulse text-[#c9fdd7]/60"
                }`}
              >
                {isScanSuccess ? (
                  <>
                    <Check className="w-14 h-14 text-[#48bb78] mb-2 animate-bounce" />
                    <span className="text-xs font-bold text-white text-center">
                      Verified Room 4!
                    </span>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 text-[#6bbf8c]" />
                    <span className="text-[10px] text-[#c9fdd7] font-semibold mt-2">
                      Align QR inside square
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Test Simulation Button */}
            {!isScanSuccess ? (
              <button
                type="button"
                onClick={handleSimulateScan}
                className="mt-4 w-full py-2.5 bg-[#347355] text-[#f0fff4] rounded-xl text-xs font-bold cursor-pointer hover:bg-[#003d29] transition-colors shadow-xs"
              >
                Simulate Successful Scan
              </button>
            ) : (
              <p className="mt-3 text-center text-xs font-bold text-[#347355]">
                Connecting consultation record...
              </p>
            )}

            <button
              type="button"
              onClick={() => setIsScannerModalOpen(false)}
              className="mt-2 w-full py-2 text-[#587366] hover:text-[#003d29] text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* 🚀 Persistent Bottom Navigation Bar (Requested) */}
      <nav
        aria-label="Patient Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#003d29] border-t border-[#002619] shadow-[0_-8px_24px_rgba(0,61,41,0.22)] py-2 px-3 sm:px-6"
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
            <span className="text-[10px] sm:text-[11px] leading-tight">Overview</span>
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
            <span className="text-[10px] sm:text-[11px] leading-tight">Timeline</span>
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
              Scanner
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
            <span className="text-[10px] sm:text-[11px] leading-tight">Add History</span>
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
            <span className="text-[10px] sm:text-[11px] leading-tight">Family Tree</span>
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
