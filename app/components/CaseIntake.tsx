"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Stethoscope,
  Sparkles,
  Mic,
  MicOff,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  Upload,
  Clock,
  AlertCircle,
  X,
  FileCheck,
  ShieldCheck,
  Loader2,
  Info,
} from "lucide-react";
import { demoStore, AttachedDocument, ConsultationRecord, DoctorProfile } from "../lib/demoStore";
import { runOcrOnFile, SAMPLE_DOCUMENTS } from "../lib/ocrService";
import { AdaptiveQuestionResponse } from "../api/ai/next-question/route";

export interface CaseIntakeProps {
  patientName?: string;
  assignedDoctor?: DoctorProfile | null;
  onClose: () => void;
  onComplete: (consultation: ConsultationRecord) => void;
}

export const CaseIntake: React.FC<CaseIntakeProps> = ({
  patientName = "Shriram Vaidya",
  assignedDoctor = null,
  onClose,
  onComplete,
}) => {
  // Step in Intake flow: 1: Pathway, 2: Complaint, 3: Adaptive Questions, 4: Summary Confirmation
  const [step, setStep] = useState<"pathway" | "complaint" | "questions" | "summary">("pathway");
  const [pathway, setPathway] = useState<"allopathy" | "ayush">("allopathy");

  // Complaint & Speech-to-text
  const [complaint, setComplaint] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Document Attachment & OCR
  const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ progress: 0, status: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Adaptive Questions State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(8);
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestionResponse | null>(null);
  const [questionLoading, setQuestionLoading] = useState(false);
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState<string>("");
  const [selectedMulti, setSelectedMulti] = useState<string[]>([]);

  // Final Summary State
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<any>(null);

  // Emergency Triage State
  const [emergencyAlert, setEmergencyAlert] = useState<{
    title: string;
    reason: string;
    severity?: string;
    actionRecommended?: string;
  } | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [isEmergencyConfirmed, setIsEmergencyConfirmed] = useState(false);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-IN";

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setComplaint((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsRecording(false);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      } else {
        setSpeechSupported(false);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Mic start error:", err);
      }
    }
  };

  // OCR Document Attachment Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
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
      setAttachedDocs((prev) => [...prev, newDoc]);
    } catch (err) {
      console.error("Upload OCR error:", err);
    } finally {
      setOcrLoading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleAttachSample = async (sampleId: string) => {
    const sample = SAMPLE_DOCUMENTS.find((s) => s.id === sampleId);
    if (!sample) return;

    setOcrLoading(true);
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
      setAttachedDocs((prev) => [...prev, newDoc]);
    } catch (err) {
      console.error("Sample OCR error:", err);
    } finally {
      setOcrLoading(false);
    }
  };

  const removeDoc = (id: string) => {
    setAttachedDocs((prev) => prev.filter((d) => d.id !== id));
  };

  // Fetch Next Adaptive Question
  const fetchQuestion = async (index: number, currentAnsList = answers) => {
    setQuestionLoading(true);
    try {
      const res = await fetch("/api/ai/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathway,
          complaint,
          previousAnswers: currentAnsList,
          questionIndex: index,
        }),
      });

      if (res.ok) {
        const data = await res.json();

        // Check for Emergency Red-Flags
        if (data.isEmergency && !isEmergencyConfirmed) {
          setEmergencyAlert(
            data.emergencyDetails || {
              title: "Potential Acute Emergency Red-Flag",
              reason: "Reported symptom combination requires urgent medical evaluation.",
              actionRecommended: "Immediate Emergency Department evaluation or Call 108.",
            }
          );
          setShowEmergencyModal(true);
          setIsEmergencyConfirmed(true);
        }

        if (data.isComplete) {
          generateSummary(currentAnsList);
          return;
        }
        setCurrentQuestion(data);
        setTotalQuestions(data.totalEstimated || 8);
        setCurrentQuestionIndex(index);
        setCurrentAnswer("");
        setSelectedMulti([]);
      }
    } catch (err) {
      console.error("Fetch question error:", err);
    } finally {
      setQuestionLoading(false);
    }
  };

  const handleStartQuestions = () => {
    if (!complaint.trim()) return;
    setStep("questions");
    fetchQuestion(0, []);
  };

  const handleAnswerSubmit = (givenAnswer?: string) => {
    const ans =
      givenAnswer ??
      (currentQuestion?.type === "multiple" ? selectedMulti.join(", ") : currentAnswer);

    if (!ans.trim()) return;

    const updatedAnswers = [
      ...answers,
      {
        question: currentQuestion?.question || `Question ${currentQuestionIndex + 1}`,
        answer: ans.trim(),
      },
    ];
    setAnswers(updatedAnswers);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex >= totalQuestions) {
      generateSummary(updatedAnswers);
    } else {
      fetchQuestion(nextIndex, updatedAnswers);
    }
  };

  const handleFastTrackEmergency = () => {
    setShowEmergencyModal(false);
    const patient = demoStore.getPatient();
    const emergencySummary = {
      chiefComplaint: complaint,
      hpi: `EMERGENCY ALERT: Patient reports acute symptom combination: "${complaint}". Red-flag safety protocol triggered immediate triage escalation.`,
      duration: "Acute",
      severity: "CRITICAL / EMERGENCY",
      associatedSymptoms: answers.map((a) => `${a.question}: ${a.answer}`),
      redFlags: [`EMERGENCY: ${emergencyAlert?.title || "Critical red-flag symptom pattern"}`],
      pathwayNotes: "Priority emergency fast-track triage. Immediate clinical evaluation required.",
      disclaimer: "Emergency triage escalation triggered by Carelink AI red-flag safety protocol.",
    };

    const newConsultation = demoStore.createConsultation({
      patientId: patient.id,
      patientName: patient.name,
      abhaId: patient.abhaId,
      age: patient.age,
      gender: patient.gender,
      contact: patient.mobile,
      pathway,
      chiefComplaint: `🚨 [EMERGENCY] ${complaint}`,
      answers,
      aiSummary: emergencySummary,
      attachedDocuments: attachedDocs,
      doctorId: assignedDoctor?.id,
      doctorQrCode: assignedDoctor?.qrCodeToken,
      doctorName: assignedDoctor?.name,
      doctorHospital: assignedDoctor?.hospital,
      doctorDepartment: assignedDoctor?.department,
      checkInStatus: assignedDoctor ? "checked_in" : "pending_qr",
      qrScannedAt: assignedDoctor
        ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        : undefined,
      isEmergency: true,
      emergencyDetails: emergencyAlert || undefined,
    });

    attachedDocs.forEach((doc) => {
      demoStore.addDocumentToPatientTimeline(doc);
    });

    onComplete(newConsultation);
  };

  const generateSummary = async (finalAnswers: { question: string; answer: string }[]) => {
    setStep("summary");
    setSummaryLoading(true);
    try {
      const res = await fetch("/api/ai/generate-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pathway,
          complaint,
          answers: finalAnswers,
          attachedDocuments: attachedDocs,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSummary(data);
        if (data.isEmergency && !isEmergencyConfirmed) {
          setIsEmergencyConfirmed(true);
          setEmergencyAlert(data.emergencyDetails);
        }
      }
    } catch (err) {
      console.error("Summary error:", err);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleConfirmAndGetToken = () => {
    const patient = demoStore.getPatient();
    const isEmerg = isEmergencyConfirmed || Boolean(aiSummary?.isEmergency);
    const newConsultation = demoStore.createConsultation({
      patientId: patient.id,
      patientName: patient.name,
      abhaId: patient.abhaId,
      age: patient.age,
      gender: patient.gender,
      contact: patient.mobile,
      pathway,
      chiefComplaint: isEmerg ? `🚨 [EMERGENCY] ${complaint}` : complaint,
      answers,
      aiSummary: aiSummary || {
        chiefComplaint: complaint,
        hpi: `Patient presents with ${complaint}.`,
        duration: "2-3 days",
        severity: "Moderate",
        associatedSymptoms: [],
        redFlags: ["None noted"],
        pathwayNotes: `${pathway === "ayush" ? "AYUSH Holistic" : "Allopathic General Medicine"} intake complete.`,
        disclaimer: `Intake summary generated for ${assignedDoctor?.name || "attending physician"}.`,
      },
      attachedDocuments: attachedDocs,
      doctorId: assignedDoctor?.id,
      doctorQrCode: assignedDoctor?.qrCodeToken,
      doctorName: assignedDoctor?.name,
      doctorHospital: assignedDoctor?.hospital,
      doctorDepartment: assignedDoctor?.department,
      checkInStatus: assignedDoctor ? "checked_in" : "pending_qr",
      qrScannedAt: assignedDoctor ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : undefined,
      isEmergency: isEmerg,
      emergencyDetails: emergencyAlert || aiSummary?.emergencyDetails || undefined,
    });

    // Also link any attached documents to patient's medical records
    attachedDocs.forEach((doc) => {
      demoStore.addDocumentToPatientTimeline(doc);
    });

    onComplete(newConsultation);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#003d29]/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-[#f0fff4] border border-[#003d29]/20 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="bg-[#003d29] text-[#f0fff4] px-5 py-4 flex items-center justify-between border-b border-[#c9fdd7]/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c9fdd7]/20 flex items-center justify-center text-[#c9fdd7]">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                New Consultation Intake
              </h2>
              <p className="text-[11px] text-[#c9fdd7]/80">
                Patient: <strong>{patientName}</strong> · ABDM Verified
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#c9fdd7]/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Assigned Doctor Banner if QR was scanned beforehand */}
        {assignedDoctor && (
          <div className="bg-[#c9fdd7] px-5 py-2.5 border-b border-[#003d29]/15 flex items-center justify-between text-xs font-bold text-[#003d29]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#347355] animate-pulse" />
              <span>Desk QR Linked: <strong>{assignedDoctor.name}</strong> ({assignedDoctor.roomNumber} · {assignedDoctor.department})</span>
            </div>
            <span className="font-mono text-[10px] font-bold bg-[#003d29] text-[#c9fdd7] px-2 py-0.5 rounded-md">
              {assignedDoctor.qrCodeToken}
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 p-5 sm:p-8 overflow-y-auto font-mono text-[#092c20]">
          {/* STEP 1: PATHWAY SELECTION */}
          {step === "pathway" && (
            <div className="space-y-6">
              <div className="text-center max-w-md mx-auto">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#347355] bg-[#c9fdd7] px-2.5 py-0.5 rounded-full border border-[#003d29]/15">
                  Step 1 of 4
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#003d29] mt-2">
                  Select Consultation Pathway
                </h3>
                <p className="text-xs sm:text-sm text-[#587366] mt-1">
                  Choose the medical care philosophy you would like for today's consultation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                {/* Pathway 1: Allopathy */}
                <div
                  onClick={() => setPathway("allopathy")}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    pathway === "allopathy"
                      ? "border-[#003d29] bg-white shadow-md shadow-[#003d29]/10"
                      : "border-[#003d29]/15 bg-white/60 hover:border-[#003d29]/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#c9fdd7] flex items-center justify-center text-[#003d29]">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                      {pathway === "allopathy" && (
                        <div className="w-6 h-6 rounded-full bg-[#003d29] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-[#003d29]">
                      General Medicine (Allopathy)
                    </h4>
                    <p className="text-xs text-[#587366] mt-1.5 leading-relaxed">
                      Evidence-based symptom evaluation, diagnostics, and modern primary medical care.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#003d29]/10 flex items-center gap-1.5 text-[11px] text-[#347355] font-semibold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Dr. Ananya Kulkarni (MBBS, MD)</span>
                  </div>
                </div>

                {/* Pathway 2: AYUSH */}
                <div
                  onClick={() => setPathway("ayush")}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    pathway === "ayush"
                      ? "border-[#003d29] bg-white shadow-md shadow-[#003d29]/10"
                      : "border-[#003d29]/15 bg-white/60 hover:border-[#003d29]/40"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#c9fdd7] flex items-center justify-center text-[#003d29]">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      {pathway === "ayush" && (
                        <div className="w-6 h-6 rounded-full bg-[#003d29] text-white flex items-center justify-center">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-[#003d29]">
                      AYUSH & Holistic Health
                    </h4>
                    <p className="text-xs text-[#587366] mt-1.5 leading-relaxed">
                      Dosha equilibrium (Vata/Pitta/Kapha), digestion (Agni), dietary & natural herbal balance.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#003d29]/10 flex items-center gap-1.5 text-[11px] text-[#347355] font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Holistic & Integrative Care</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setStep("complaint")}
                  className="px-6 py-2.5 rounded-xl bg-[#003d29] text-[#f0fff4] text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-[#002b1d] transition-all cursor-pointer shadow-md shadow-[#003d29]/20"
                >
                  <span>Continue to Symptoms</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: CHIEF COMPLAINT + VOICE INPUT + ATTACHMENTS */}
          {step === "complaint" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider font-bold text-[#347355] bg-[#c9fdd7] px-2.5 py-0.5 rounded-full border border-[#003d29]/15">
                    Step 2 of 4 · {pathway === "ayush" ? "AYUSH" : "General Medicine"}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-[#003d29] mt-2">
                    What brings you in today?
                  </h3>
                  <p className="text-xs text-[#587366] mt-0.5">
                    Describe your main discomfort or symptom in your own words.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep("pathway")}
                  className="text-xs text-[#587366] hover:text-[#003d29] flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Change pathway</span>
                </button>
              </div>

              {/* Text Area & Voice Recognition Button */}
              <div className="relative">
                <textarea
                  value={complaint}
                  onChange={(e) => setComplaint(e.target.value)}
                  placeholder="e.g. I have had a severe sore throat, dry cough, and mild fever since yesterday evening..."
                  rows={4}
                  className="w-full p-4 rounded-xl border border-[#003d29]/20 bg-white text-xs sm:text-sm text-[#092c20] placeholder-[#587366]/60 focus:outline-none focus:ring-2 focus:ring-[#003d29] transition-all shadow-inner"
                />

                {/* Voice Input Toolbar */}
                <div className="flex items-center justify-between mt-2 px-1">
                  <div className="flex items-center gap-2">
                    {speechSupported ? (
                      <button
                        type="button"
                        onClick={toggleRecording}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isRecording
                            ? "bg-red-500 text-white animate-pulse shadow-md shadow-red-500/30"
                            : "bg-[#c9fdd7] text-[#003d29] hover:bg-[#b2f0c3]"
                        }`}
                      >
                        {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                        <span>{isRecording ? "Listening... (Click to stop)" : "Speak Complaint (Voice-to-Text)"}</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#587366]">Microphone available via text</span>
                    )}
                  </div>
                  <span className="text-[11px] text-[#587366]">
                    {complaint.length} characters
                  </span>
                </div>
              </div>

              {/* Quick Preset Complaint Suggestions */}
              <div>
                <span className="text-[11px] font-semibold text-[#587366] block mb-2">
                  Common sample complaints for quick test:
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Severe sore throat, dry cough and mild fever for 2 days",
                    "Persistent throbbing frontal headache and neck stiffness",
                    "Acidity, bloating, and burning chest sensation after meals",
                    "Lower back stiffness and mild knee joint pain on walking",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setComplaint(preset)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-[#003d29]/15 text-[#003d29] hover:bg-[#c9fdd7]/50 transition-colors text-left cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document Attachment & OCR Section */}
              <div className="p-4 rounded-xl bg-white border border-[#003d29]/15 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#347355]" />
                    <span className="text-xs font-bold text-[#003d29]">
                      Attach Medical Document / Report (OCR Enabled)
                    </span>
                  </div>
                  <span className="text-[10px] text-[#347355] font-semibold bg-[#c9fdd7] px-2 py-0.5 rounded-full">
                    Free Client-Side OCR
                  </span>
                </div>
                <p className="text-[11px] text-[#587366] mb-3">
                  Upload an existing prescription or lab test. Tesseract.js will scan and extract findings for the doctor.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={ocrLoading}
                    className="px-3 py-1.5 rounded-lg border border-[#003d29]/20 bg-[#f0fff4] hover:bg-[#c9fdd7]/50 text-xs font-bold text-[#003d29] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Document File</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAttachSample("sample-rx-1")}
                    disabled={ocrLoading}
                    className="px-3 py-1.5 rounded-lg border border-[#003d29]/20 bg-white hover:bg-[#c9fdd7]/30 text-[11px] font-medium text-[#347355] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Try Sample Prescription</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAttachSample("sample-lab-1")}
                    disabled={ocrLoading}
                    className="px-3 py-1.5 rounded-lg border border-[#003d29]/20 bg-white hover:bg-[#c9fdd7]/30 text-[11px] font-medium text-[#347355] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Try Sample CBC Blood Report</span>
                  </button>
                </div>

                {/* OCR Progress Indicator */}
                {ocrLoading && (
                  <div className="mt-3 p-3 rounded-lg bg-[#c9fdd7]/30 border border-[#003d29]/10">
                    <div className="flex items-center justify-between text-[11px] text-[#003d29] font-bold mb-1">
                      <span>{ocrProgress.status || "Scanning document pixels..."}</span>
                      <span>{ocrProgress.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#003d29]/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#347355] transition-all duration-300"
                        style={{ width: `${ocrProgress.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Attached Documents List */}
                {attachedDocs.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-2.5 rounded-lg bg-[#f0fff4] border border-[#003d29]/15 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-7 h-7 rounded bg-[#c9fdd7] flex items-center justify-center text-[#003d29] shrink-0 mt-0.5">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <strong className="text-[#003d29] font-bold block">{doc.name}</strong>
                            <span className="text-[10px] text-[#587366] block">
                              Type: {doc.type.replace("_", " ").toUpperCase()} · {doc.fileSize} · Date: {doc.date}
                            </span>
                            {doc.ocrText && (
                              <p className="text-[11px] text-[#347355] mt-1 bg-white/80 p-1.5 rounded border border-[#003d29]/10 max-h-16 overflow-y-auto">
                                <span className="font-bold">OCR Content:</span> {doc.ocrText.slice(0, 140)}...
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDoc(doc.id)}
                          className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-[#003d29]/10">
                <button
                  type="button"
                  onClick={() => setStep("pathway")}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#587366] hover:text-[#003d29] cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStartQuestions}
                  disabled={!complaint.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#003d29] text-[#f0fff4] text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-[#002b1d] transition-all cursor-pointer shadow-md shadow-[#003d29]/20 disabled:opacity-50"
                >
                  <span>Begin Adaptive Questions</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: ADAPTIVE QUESTIONING */}
          {step === "questions" && (
            <div className="space-y-6">
              {/* Progress Header */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#003d29] uppercase tracking-wider text-[11px]">
                    Adaptive Clinical Intake
                  </span>
                  <span className="text-[#587366] font-semibold text-[11px]">
                    Question {currentQuestionIndex + 1} of {totalQuestions}
                  </span>
                </div>
                <div className="w-full h-2 bg-[#003d29]/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#003d29] transition-all duration-300"
                    style={{
                      width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {questionLoading ? (
                <div className="py-16 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#347355]" />
                  <p className="text-xs font-semibold text-[#587366]">
                    Analyzing symptoms & preparing clinical inquiry...
                  </p>
                </div>
              ) : currentQuestion ? (
                <div className="space-y-5 animate-in fade-in duration-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#347355] bg-[#c9fdd7] px-2 py-0.5 rounded-full border border-[#003d29]/15">
                      {currentQuestion.category.toUpperCase().replace("_", " ")}
                    </span>
                    <h3 className="text-lg sm:text-xl font-bold text-[#003d29] mt-2 leading-snug">
                      {currentQuestion.question}
                    </h3>
                    {currentQuestion.subtext && (
                      <p className="text-xs text-[#587366] mt-1">{currentQuestion.subtext}</p>
                    )}
                  </div>

                  {/* QUESTION TYPE: SINGLE CHOICE OR DURATION */}
                  {(currentQuestion.type === "single" || currentQuestion.type === "duration") &&
                    currentQuestion.options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentQuestion.options.map((opt, idx) => {
                          const isSelected = currentAnswer === opt;
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setCurrentAnswer(opt);
                                handleAnswerSubmit(opt);
                              }}
                              className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? "border-[#003d29] bg-[#003d29] text-white shadow-sm"
                                  : "border-[#003d29]/15 bg-white text-[#092c20] hover:bg-[#c9fdd7]/30 hover:border-[#003d29]/30"
                              }`}
                            >
                              <span>{opt}</span>
                              <div
                                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  isSelected ? "border-white bg-white" : "border-[#003d29]/30"
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-[#003d29]" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                  {/* QUESTION TYPE: MULTIPLE CHOICE */}
                  {currentQuestion.type === "multiple" && currentQuestion.options && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {currentQuestion.options.map((opt, idx) => {
                          const isChecked = selectedMulti.includes(opt);
                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedMulti((prev) => prev.filter((o) => o !== opt));
                                } else {
                                  setSelectedMulti((prev) => [...prev, opt]);
                                }
                              }}
                              className={`p-3.5 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${
                                isChecked
                                  ? "border-[#003d29] bg-[#c9fdd7] text-[#003d29] font-bold"
                                  : "border-[#003d29]/15 bg-white text-[#092c20] hover:bg-white/90"
                              }`}
                            >
                              <span>{opt}</span>
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center ${
                                  isChecked ? "bg-[#003d29] border-[#003d29] text-white" : "border-[#003d29]/30"
                                }`}
                              >
                                {isChecked && <Check className="w-3 h-3" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleAnswerSubmit()}
                          disabled={selectedMulti.length === 0}
                          className="px-5 py-2 rounded-xl bg-[#003d29] text-[#f0fff4] text-xs font-bold flex items-center gap-2 hover:bg-[#002b1d] cursor-pointer disabled:opacity-50"
                        >
                          <span>Confirm Selection</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QUESTION TYPE: YES / NO */}
                  {currentQuestion.type === "yes-no" && (
                    <div className="grid grid-cols-2 gap-4">
                      {["Yes", "No"].map((choice) => (
                        <button
                          key={choice}
                          type="button"
                          onClick={() => {
                            setCurrentAnswer(choice);
                            handleAnswerSubmit(choice);
                          }}
                          className="p-5 rounded-xl border-2 border-[#003d29]/20 bg-white hover:border-[#003d29] hover:bg-[#c9fdd7]/40 text-center font-bold text-sm text-[#003d29] transition-all cursor-pointer"
                        >
                          {choice}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* QUESTION TYPE: SEVERITY SCALE (1 to 10) */}
                  {currentQuestion.type === "scale" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => {
                          const isSelected = currentAnswer === `${num} / 10`;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => {
                                const val = `${num} / 10`;
                                setCurrentAnswer(val);
                                handleAnswerSubmit(val);
                              }}
                              className={`py-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? "bg-[#003d29] text-white border-[#003d29]"
                                  : num >= 7
                                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                                  : num >= 4
                                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex justify-between text-[11px] text-[#587366] font-semibold px-1">
                        <span>1 (Very Mild)</span>
                        <span>5 (Moderate)</span>
                        <span>10 (Debilitating / Emergency)</span>
                      </div>
                    </div>
                  )}

                  {/* QUESTION TYPE: TEXT INPUT */}
                  {currentQuestion.type === "text" && (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        placeholder={currentQuestion.placeholder || "Type your response here..."}
                        className="w-full p-3.5 rounded-xl border border-[#003d29]/20 bg-white text-xs sm:text-sm text-[#092c20] focus:outline-none focus:ring-2 focus:ring-[#003d29]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && currentAnswer.trim()) {
                            handleAnswerSubmit();
                          }
                        }}
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleAnswerSubmit()}
                          disabled={!currentAnswer.trim()}
                          className="px-5 py-2 rounded-xl bg-[#003d29] text-[#f0fff4] text-xs font-bold flex items-center gap-2 hover:bg-[#002b1d] cursor-pointer disabled:opacity-50"
                        >
                          <span>Submit Answer</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* STEP 4: SUMMARY GENERATION & TOKEN CONFIRMATION */}
          {step === "summary" && (
            <div className="space-y-5">
              <div className="text-center max-w-md mx-auto">
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#347355] bg-[#c9fdd7] px-2.5 py-0.5 rounded-full border border-[#003d29]/15">
                  Step 4 of 4 · Ready for Doctor
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-[#003d29] mt-2">
                  Clinical Intake Summary
                </h3>
                <p className="text-xs text-[#587366] mt-0.5">
                  Structured record for Dr. Ananya Kulkarni before consultation.
                </p>
              </div>

              {summaryLoading ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#347355]" />
                  <p className="text-xs font-semibold text-[#587366]">
                    Synthesizing doctor-facing clinical brief...
                  </p>
                </div>
              ) : aiSummary ? (
                <div className="space-y-4">
                  {/* Doctor-Facing Structured Summary Card */}
                  <div className="p-4 sm:p-5 rounded-xl bg-white border border-[#003d29]/15 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-[#003d29]/10 pb-2.5">
                      <div>
                        <span className="text-[10px] text-[#587366] uppercase font-bold block">
                          Chief Complaint
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-[#003d29]">
                          {aiSummary.chiefComplaint}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#347355] bg-[#c9fdd7] px-2.5 py-1 rounded-full">
                        {pathway === "ayush" ? "AYUSH Intake" : "General Medicine"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 py-1">
                      <div>
                        <span className="text-[10px] text-[#587366] uppercase font-semibold block">
                          Duration
                        </span>
                        <strong className="text-xs text-[#003d29]">{aiSummary.duration}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#587366] uppercase font-semibold block">
                          Reported Severity
                        </span>
                        <strong className="text-xs text-[#003d29]">{aiSummary.severity}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#587366] uppercase font-semibold block">
                          Red Flags Status
                        </span>
                        <span className="text-xs font-bold text-emerald-700">
                          {aiSummary.redFlags?.[0] || "None noted"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#587366] uppercase font-semibold block mb-1">
                        History of Present Illness (HPI)
                      </span>
                      <p className="text-xs text-[#092c20] leading-relaxed bg-[#f0fff4] p-3 rounded-lg border border-[#003d29]/10">
                        {aiSummary.hpi}
                      </p>
                    </div>

                    {/* Attached Documents Banner in Summary */}
                    {attachedDocs.length > 0 && (
                      <div>
                        <span className="text-[10px] text-[#587366] uppercase font-semibold block mb-1">
                          Attached Records & OCR Findings ({attachedDocs.length})
                        </span>
                        <div className="space-y-1.5">
                          {attachedDocs.map((doc) => (
                            <div
                              key={doc.id}
                              className="p-2 rounded bg-[#f0fff4] border border-[#003d29]/10 flex items-center justify-between text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <FileCheck className="w-3.5 h-3.5 text-[#347355]" />
                                <strong className="text-[#003d29]">{doc.name}</strong>
                                <span className="text-[10px] text-[#587366]">({doc.type})</span>
                              </div>
                              <span className="text-[10px] text-[#347355] font-semibold bg-[#c9fdd7] px-2 py-0.5 rounded">
                                OCR Synced
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Safety Disclaimer */}
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                      <Info className="w-4 h-4 shrink-0 text-amber-700" />
                      <span>
                        <strong>AI Intake Protocol:</strong> No automatic diagnosis or prescriptions generated. Case details queued for Dr. Ananya Kulkarni's review.
                      </span>
                    </div>
                  </div>

                  {/* Final CTA */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStep("complaint")}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#587366] hover:text-[#003d29] cursor-pointer"
                    >
                      Edit Complaint
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmAndGetToken}
                      className="px-6 py-3 rounded-xl bg-[#003d29] text-[#f0fff4] text-xs sm:text-sm font-bold flex items-center gap-2 hover:bg-[#002b1d] transition-all cursor-pointer shadow-lg shadow-[#003d29]/25"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#c9fdd7]" />
                      <span>Confirm & Generate Patient Token</span>
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Real-Time Emergency Red-Flag Modal */}
      {showEmergencyModal && emergencyAlert && (
        <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border-2 border-red-500 overflow-hidden">
            <div className="bg-red-600 text-white p-5 flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 animate-pulse">
                <AlertCircle className="w-6 h-6 text-white stroke-[2.5]" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest bg-red-800 px-2 py-0.5 rounded">
                  🚨 Clinical Emergency Detected
                </span>
                <h3 className="text-sm sm:text-base font-bold leading-tight mt-1">
                  {emergencyAlert.title}
                </h3>
              </div>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 leading-relaxed">
                <strong className="block font-bold mb-1 text-red-950">Reason for Clinical Escalation:</strong>
                {emergencyAlert.reason}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 leading-snug">
                <strong className="block font-bold text-[11px] mb-0.5 text-amber-950">Recommended Action:</strong>
                <span>{emergencyAlert.actionRecommended}</span>
              </div>

              <div className="pt-2 space-y-2.5">
                <a
                  href="tel:108"
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-center flex items-center justify-center gap-2 shadow-md transition-colors"
                >
                  <span>🚨 Call Emergency 108 Ambulance</span>
                </a>

                <button
                  type="button"
                  onClick={handleFastTrackEmergency}
                  className="w-full py-3 bg-[#003d29] hover:bg-[#347355] text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                >
                  <span>⚡ Fast-Track to Emergency Triage (Priority Token)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="w-full py-2 text-center text-xs text-[#587366] hover:text-[#003d29] font-medium cursor-pointer"
                >
                  I am in a safe setting, continue clinical questionnaire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

