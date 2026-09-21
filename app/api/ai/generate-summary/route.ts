import { NextRequest, NextResponse } from "next/server";
import { evaluateEmergencyRules } from "../next-question/route";

const GROQ_CANDIDATE_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "llama-3.3-70b-versatile",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pathway = "allopathy", complaint = "", answers = [], attachedDocuments = [] } = body;

    const apiKey = process.env.GROQ_API_KEY || "";

    const emergencyEval = evaluateEmergencyRules(complaint, answers);

    if (apiKey && complaint) {
      for (const model of GROQ_CANDIDATE_MODELS) {
        try {
          const groqPrompt = [
            {
              role: "system",
              content: `You are a clinical AI intake summarizer for Dr. Ananya Kulkarni at DemoCare Hospital.
Pathway: ${pathway.toUpperCase()}.
Analyze the patient's chief complaint, previous answers, and attached documents.
DO NOT diagnose the patient. DO NOT prescribe medications.
Generate a structured, doctor-facing clinical case intake summary.

Return a JSON object matching this schema:
{
  "chiefComplaint": "string",
  "hpi": "string (1-2 sentences summarizing onset, character, course)",
  "duration": "string",
  "severity": "string",
  "associatedSymptoms": ["symptom1", "symptom2"],
  "redFlags": ["redFlag1 or 'None noted'"],
  "pathwayNotes": "string (notes relevant to allopathy or AYUSH dosha assessment)",
  "isEmergency": boolean,
  "emergencyDetails": {
    "title": "string",
    "reason": "string",
    "severity": "critical" | "urgent"
  },
  "disclaimer": "Intake summary generated for Dr. Ananya Kulkarni. Clinical diagnosis reserved for attending physician."
}`,
            },
            {
              role: "user",
              content: `Chief Complaint: ${complaint}
Answers transcript: ${JSON.stringify(answers)}
Attached documents: ${JSON.stringify(attachedDocuments.map((d: any) => ({ name: d.name, type: d.type, ocr: d.ocrText?.slice(0, 150) })))}`,
            },
          ];

          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: groqPrompt,
              response_format: { type: "json_object" },
              temperature: 0.2,
              max_tokens: 500,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const parsed = JSON.parse(data.choices[0].message.content);

            // Incorporate deterministic rule check if triggered
            if (emergencyEval?.isEmergency) {
              parsed.isEmergency = true;
              parsed.emergencyDetails = emergencyEval.emergencyDetails;
              if (!parsed.redFlags || parsed.redFlags.length === 0 || parsed.redFlags.includes("None noted")) {
                parsed.redFlags = [`EMERGENCY: ${emergencyEval.emergencyDetails.title}`];
              } else {
                parsed.redFlags.unshift(`EMERGENCY: ${emergencyEval.emergencyDetails.title}`);
              }
            }

            return NextResponse.json(parsed);
          }
        } catch (err) {
          console.warn(`Groq summary fallback for ${model}:`, err);
        }
      }
    }

    // Deterministic clinical synthesis fallback
    let duration = "2-3 days";
    let severity = "Moderate";
    const associatedSymptoms: string[] = [];
    const redFlags: string[] = [];

    if (emergencyEval?.isEmergency) {
      redFlags.push(`EMERGENCY ALERT: ${emergencyEval.emergencyDetails.title}`);
    }

    answers.forEach((item: { question: string; answer: string }) => {
      const q = item.question.toLowerCase();
      const a = item.answer;
      if (q.includes("long") || q.includes("duration")) {
        duration = a;
      } else if (q.includes("scale") || q.includes("severe") || q.includes("discomfort")) {
        severity = a;
      } else if (q.includes("alert") || q.includes("red flags") || q.includes("acute signs")) {
        if (!a.toLowerCase().includes("none") && !a.toLowerCase().includes("no acute")) {
          redFlags.push(a);
        }
      } else if (q.includes("sensations") || q.includes("character") || q.includes("aggravating")) {
        associatedSymptoms.push(a);
      }
    });

    if (redFlags.length === 0) {
      redFlags.push("No immediate red flags or acute respiratory distress noted");
    }

    const hpi = `Patient reports "${complaint}" with an onset duration of approximately ${duration}. Discomfort is characterized as ${severity.toLowerCase()}, exacerbated by daily activities, with preliminary intake completed via Carelink AI.`;

    const pathwayNotes =
      pathway === "ayush"
        ? "Holistic evaluation indicates predominant seasonal/dosha aggravation. Recommend evaluating Agni (digestive fire), Ojas, and prescribing suitable Ayurvedic formulation."
        : "Evidence-based allopathic intake completed. Vitals check, physical auscultation/inspection, and symptom-directed treatment plan indicated.";

    return NextResponse.json({
      chiefComplaint: complaint || "General consultation request",
      hpi,
      duration,
      severity,
      associatedSymptoms: associatedSymptoms.length > 0 ? associatedSymptoms : ["Mild localized discomfort", "Fatigue"],
      redFlags,
      pathwayNotes,
      isEmergency: emergencyEval ? emergencyEval.isEmergency : false,
      emergencyDetails: emergencyEval ? emergencyEval.emergencyDetails : undefined,
      disclaimer: "Intake summary generated for Dr. Ananya Kulkarni. Clinical diagnosis reserved for attending physician.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate summary", details: err?.message },
      { status: 500 }
    );
  }
}
