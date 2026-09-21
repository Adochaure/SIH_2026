"use client";

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string; // e.g. "1-0-1", "Once daily", "SOS"
  duration: string;  // e.g. "5 days"
  instructions?: string;
}

export interface AttachedDocument {
  id: string;
  name: string;
  type: "prescription" | "lab_report" | "discharge_summary" | "other";
  date: string;
  ocrText?: string;
  previewUrl?: string;
  fileSize?: string;
}

export interface ConsultationRecord {
  id: string;
  tokenNumber: string;
  queuePosition: number;
  patientId: string;
  patientName: string;
  abhaId: string;
  age: number;
  gender: string;
  contact: string;
  status: "Waiting" | "In-Progress" | "Completed";
  createdAt: string;
  pathway: "allopathy" | "ayush";
  chiefComplaint: string;
  answers: { question: string; answer: string }[];
  aiSummary: {
    chiefComplaint: string;
    hpi: string;
    duration: string;
    severity: string;
    associatedSymptoms: string[];
    redFlags: string[];
    pathwayNotes: string;
    disclaimer: string;
  };
  attachedDocuments: AttachedDocument[];
  // Doctor consultation outputs
  // Doctor consultation & QR check-in outputs
  doctorId?: string;
  doctorQrCode?: string;
  checkInStatus?: "pending_qr" | "checked_in" | "in_consultation" | "completed";
  qrScannedAt?: string;
  doctorName?: string;
  doctorHospital?: string;
  doctorDepartment?: string;
  doctorRoom?: string;
  diagnosis?: string;
  clinicalNotes?: string;
  prescriptions?: PrescriptionItem[];
  completedAt?: string;
  isEmergency?: boolean;
  emergencyDetails?: {
    title: string;
    reason: string;
    severity?: string;
    actionRecommended?: string;
  };
}

export interface DoctorNotification {
  id: string;
  doctorId?: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  consultationId?: string;
}

export interface TimelineRecord {
  id: string;
  date: string;
  type: "consultation" | "lab" | "medication" | "allergy";
  title: string;
  doctor: string;
  facility: string;
  notes: string;
  tag: string;
  attachments?: AttachedDocument[];
  prescriptions?: PrescriptionItem[];
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  abhaId: string;
  abhaAddress: string;
  mobile: string;
  bloodGroup: string;
  allergies: string[];
  medicalHistory: string[];
  timeline: TimelineRecord[];
}

export interface DoctorProfile {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  department: string;
  roomNumber: string;
  qrCodeToken: string;
  experience: string;
  qualifications: string;
}

const STORAGE_KEY_PATIENT = "carelink_demo_patient_v2";
const STORAGE_KEY_DOCTOR = "carelink_demo_doctor_v2";
const STORAGE_KEY_CONSULTATIONS = "carelink_demo_consultations_v2";

export const DEFAULT_PATIENT: PatientProfile = {
  id: "PT-SHRIRAM-01",
  name: "Shriram Vaidya",
  age: 29,
  gender: "Male",
  abhaId: "12-3456-7890-1234",
  abhaAddress: "shriram.vaidya@abdm",
  mobile: "9876543210",
  bloodGroup: "B+",
  allergies: [],
  medicalHistory: [],
  timeline: [], // Initially empty as required
};

export const DEFAULT_DOCTOR: DoctorProfile = {
  id: "DOC-ANANYA-AK",
  name: "Dr. Ananya Kulkarni",
  specialty: "General Physician",
  hospital: "DemoCare Hospital",
  department: "General Medicine & Primary Care",
  roomNumber: "OPD Room 3",
  qrCodeToken: "OPD-DEMOCARE-3",
  experience: "12 Years",
  qualifications: "MBBS, MD (Internal Medicine)",
};

export const KNOWN_DOCTORS: DoctorProfile[] = [
  DEFAULT_DOCTOR,
  {
    id: "DOC-RAJESH-RR",
    name: "Dr. Rajesh Rao",
    specialty: "Senior Consultant Physician",
    hospital: "Carelink Central OPD",
    department: "Pulmonology & Internal Medicine",
    roomNumber: "OPD Room 4",
    qrCodeToken: "DOC-OPD4-RR-4821",
    experience: "16 Years",
    qualifications: "MBBS, MD, FCCP",
  },
  {
    id: "DOC-MEERA-MN",
    name: "Dr. Meera Nambiar",
    specialty: "Holistic Health Specialist",
    hospital: "Carelink Holistic Center",
    department: "AYUSH & Integrative Wellness",
    roomNumber: "OPD Room 1",
    qrCodeToken: "AYUSH-HOLISTIC-1",
    experience: "10 Years",
    qualifications: "BAMS, MD (Ayurveda)",
  },
];

const STORAGE_KEY_NOTIFICATIONS = "carelink_demo_doctor_notifications_v2";

class DemoStore {
  private listeners: Set<() => void> = new Set();
  private memoryPatient: PatientProfile = JSON.parse(JSON.stringify(DEFAULT_PATIENT));
  private memoryConsultations: ConsultationRecord[] = [];
  private memoryNotifications: DoctorNotification[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("storage", () => {
        this.notify();
      });
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error("DemoStore notify error:", e);
      }
    });
  }

  getPatient(): PatientProfile {
    if (typeof window === "undefined") return this.memoryPatient;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PATIENT);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading patient from storage:", e);
    }
    return DEFAULT_PATIENT;
  }

  savePatient(patient: PatientProfile) {
    if (typeof window === "undefined") {
      this.memoryPatient = patient;
      this.notify();
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_PATIENT, JSON.stringify(patient));
      this.notify();
    } catch (e) {
      console.error("Error saving patient:", e);
    }
  }

  getDoctor(): DoctorProfile {
    if (typeof window === "undefined") return DEFAULT_DOCTOR;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DOCTOR);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading doctor from storage:", e);
    }
    return DEFAULT_DOCTOR;
  }

  getConsultations(): ConsultationRecord[] {
    if (typeof window === "undefined") return this.memoryConsultations;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONSULTATIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading consultations:", e);
    }
    return [];
  }

  saveConsultations(consultations: ConsultationRecord[]) {
    if (typeof window === "undefined") {
      this.memoryConsultations = consultations;
      this.notify();
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY_CONSULTATIONS, JSON.stringify(consultations));
      this.notify();
    } catch (e) {
      console.error("Error saving consultations:", e);
    }
  }

  createConsultation(data: Omit<ConsultationRecord, "id" | "tokenNumber" | "queuePosition" | "createdAt" | "status">): ConsultationRecord {
    const consultations = this.getConsultations();
    const tokenSeq = 104 + consultations.length;
    const tokenNumber = `A-${tokenSeq}`;
    
    const newConsultation: ConsultationRecord = {
      ...data,
      id: `cons-${Date.now()}`,
      tokenNumber,
      queuePosition: consultations.filter(c => c.status === "Waiting").length + 1,
      status: "Waiting",
      checkInStatus: data.checkInStatus || (data.doctorId || data.doctorQrCode ? "checked_in" : "pending_qr"),
      createdAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };

    const updated = [newConsultation, ...consultations];
    this.saveConsultations(updated);

    // If doctor assigned and already checked in, notify them
    if (newConsultation.checkInStatus === "checked_in" && (newConsultation.doctorId || newConsultation.doctorQrCode)) {
      this.addDoctorNotification({
        id: `notif-${Date.now()}`,
        doctorId: newConsultation.doctorId,
        title: newConsultation.isEmergency
          ? `🚨 EMERGENCY CASE (Token ${tokenNumber})`
          : `New Case Check-in (Token ${tokenNumber})`,
        message: `${newConsultation.patientName} submitted case [${newConsultation.chiefComplaint.slice(0, 45)}] to your queue.`,
        time: "Just now",
        read: false,
        consultationId: newConsultation.id,
      });
    }

    return newConsultation;
  }

  getDoctorByQr(code: string): DoctorProfile | null {
    if (!code) return null;
    const clean = code.trim().toLowerCase();

    // Check in known doctors by exact token or ID
    const directMatch = KNOWN_DOCTORS.find(
      (d) =>
        d.qrCodeToken.toLowerCase() === clean ||
        d.id.toLowerCase() === clean ||
        clean.includes(d.qrCodeToken.toLowerCase())
    );
    if (directMatch) return directMatch;

    // Current store doctor
    const current = this.getDoctor();
    if (
      current.qrCodeToken.toLowerCase() === clean ||
      current.id.toLowerCase() === clean ||
      clean.includes(current.qrCodeToken.toLowerCase())
    ) {
      return current;
    }

    // Fuzzy matching for room or doctor name
    if (clean.includes("ananya") || clean.includes("3") || clean.includes("democare")) {
      return DEFAULT_DOCTOR;
    }
    if (clean.includes("rajesh") || clean.includes("4") || clean.includes("rao")) {
      return KNOWN_DOCTORS[1];
    }
    if (clean.includes("meera") || clean.includes("ayush") || clean.includes("1")) {
      return KNOWN_DOCTORS[2];
    }

    // Default fallback to Dr. Ananya Kulkarni
    return DEFAULT_DOCTOR;
  }

  assignDoctorToConsultation(
    consultationId: string,
    doctor: DoctorProfile
  ): ConsultationRecord | null {
    const consultations = this.getConsultations();
    const index = consultations.findIndex((c) => c.id === consultationId);
    if (index === -1) return null;

    const consultation = consultations[index];
    const nowTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const updated: ConsultationRecord = {
      ...consultation,
      doctorId: doctor.id,
      doctorQrCode: doctor.qrCodeToken,
      doctorName: doctor.name,
      doctorHospital: doctor.hospital,
      doctorDepartment: doctor.department,
      checkInStatus: "checked_in",
      qrScannedAt: nowTime,
      status: "Waiting",
    };

    consultations[index] = updated;
    this.saveConsultations(consultations);

    // Add alert notification for doctor
    this.addDoctorNotification({
      id: `notif-${Date.now()}`,
      doctorId: doctor.id,
      title: updated.isEmergency
        ? `🚨 EMERGENCY CHECK-IN (Token ${updated.tokenNumber})`
        : `Patient Check-in (Token ${updated.tokenNumber})`,
      message: `${updated.patientName} scanned your ${doctor.roomNumber} QR (${doctor.qrCodeToken}) and joined your queue.`,
      time: "Just now",
      read: false,
      consultationId: updated.id,
    });

    return updated;
  }

  getDoctorNotifications(): DoctorNotification[] {
    if (typeof window === "undefined") {
      if (this.memoryNotifications.length === 0) {
        this.memoryNotifications = [
          {
            id: "n-1",
            doctorId: "doc-1",
            title: "Live Desk Ready",
            message: "Doctor workstation initialized for OPD Room 3.",
            time: "Now",
            read: false,
          },
          {
            id: "n-2",
            doctorId: "DOC-ANANYA-AK",
            title: "New Lab Result Synced",
            message: "CBC and Lipid Profile report attached to Case #CL-1024 (Rahul Sharma).",
            time: "15 mins ago",
            read: false,
          },
        ];
      }
      return this.memoryNotifications;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error("Error reading notifications:", e);
    }
    return [
      {
        id: "n-1",
        doctorId: "DOC-ANANYA-AK",
        title: "Patient Check-in (Token C-214)",
        message: "Priya Sharma has checked in with your Room 3 QR code and is waiting in the queue.",
        time: "2 mins ago",
        read: false,
      },
      {
        id: "n-2",
        doctorId: "DOC-ANANYA-AK",
        title: "New Lab Result Synced",
        message: "CBC and Lipid Profile report attached to Case #CL-1024 (Rahul Sharma).",
        time: "15 mins ago",
        read: false,
      },
    ];
  }

  addDoctorNotification(notif: DoctorNotification) {
    if (typeof window === "undefined") {
      this.memoryNotifications = [notif, ...this.getDoctorNotifications()];
      this.notify();
      return;
    }
    const current = this.getDoctorNotifications();
    const updated = [notif, ...current];
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
      this.notify();
    } catch (e) {
      console.error("Error saving notification:", e);
    }
  }

  markAllNotificationsRead() {
    if (typeof window === "undefined") {
      this.memoryNotifications = this.memoryNotifications.map((n) => ({ ...n, read: true }));
      this.notify();
      return;
    }
    const current = this.getDoctorNotifications().map((n) => ({ ...n, read: true }));
    try {
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(current));
      this.notify();
    } catch (e) {
      console.error("Error updating notifications:", e);
    }
  }

  completeConsultation(
    consultationId: string,
    doctorDetails: {
      doctorName: string;
      doctorHospital: string;
      doctorDepartment: string;
      diagnosis: string;
      clinicalNotes: string;
      prescriptions: PrescriptionItem[];
      attachedDocuments?: AttachedDocument[];
    }
  ): ConsultationRecord | null {
    const consultations = this.getConsultations();
    const index = consultations.findIndex((c) => c.id === consultationId);
    if (index === -1) return null;

    const consultation = consultations[index];
    const completedAtDate = new Date();
    const dateStr = completedAtDate.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const updatedConsultation: ConsultationRecord = {
      ...consultation,
      status: "Completed",
      checkInStatus: "completed",
      doctorName: doctorDetails.doctorName,
      doctorHospital: doctorDetails.doctorHospital,
      doctorDepartment: doctorDetails.doctorDepartment,
      diagnosis: doctorDetails.diagnosis,
      clinicalNotes: doctorDetails.clinicalNotes,
      prescriptions: doctorDetails.prescriptions,
      completedAt: completedAtDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      attachedDocuments: [
        ...consultation.attachedDocuments,
        ...(doctorDetails.attachedDocuments || []),
      ],
    };

    consultations[index] = updatedConsultation;
    this.saveConsultations(consultations);

    // Sync directly into patient timeline
    const patient = this.getPatient();
    const timelineEntry = {
      id: `tl-${Date.now()}`,
      date: dateStr,
      type: "consultation" as const,
      title: `${doctorDetails.diagnosis || "Consultation Completed"} (${consultation.pathway === "ayush" ? "AYUSH" : "General Medicine"})`,
      doctor: `${doctorDetails.doctorName} (${doctorDetails.doctorDepartment})`,
      facility: doctorDetails.doctorHospital,
      notes: `${doctorDetails.clinicalNotes || "Consultation notes recorded."} [Chief Complaint: ${consultation.chiefComplaint}]`,
      tag: doctorDetails.prescriptions.length > 0 ? "Prescription Issued" : "Clinical Record",
      attachments: updatedConsultation.attachedDocuments,
      prescriptions: doctorDetails.prescriptions,
    };

    patient.timeline = [timelineEntry, ...patient.timeline];
    this.savePatient(patient);

    return updatedConsultation;
  }

  addDocumentToPatientTimeline(doc: AttachedDocument) {
    const patient = this.getPatient();
    const newEntry = {
      id: `tl-doc-${Date.now()}`,
      date: doc.date || new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
      type: doc.type === "lab_report" ? ("lab" as const) : ("medication" as const),
      title: `Uploaded ${doc.name}`,
      doctor: "Verified Digital Health Record",
      facility: "ABDM Health Locker",
      notes: doc.ocrText ? `OCR Extracted Content: ${doc.ocrText.slice(0, 200)}...` : "Digital document uploaded and linked.",
      tag: "OCR Scanned & Verified",
      attachments: [doc],
    };

    patient.timeline = [newEntry, ...patient.timeline];
    this.savePatient(patient);
  }

  updateConsultation(id: string, updates: Partial<ConsultationRecord>): ConsultationRecord | null {
    const consultations = this.getConsultations();
    const index = consultations.findIndex((c) => c.id === id);
    if (index === -1) return null;
    const updated = { ...consultations[index], ...updates };
    consultations[index] = updated;
    this.saveConsultations(consultations);
    return updated;
  }

  resetDemo() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_KEY_PATIENT);
    localStorage.removeItem(STORAGE_KEY_DOCTOR);
    localStorage.removeItem(STORAGE_KEY_CONSULTATIONS);
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
    this.savePatient(DEFAULT_PATIENT);
    this.saveConsultations([]);
    this.notify();
  }
}

export const demoStore = new DemoStore();
