import { NextRequest, NextResponse } from "next/server";

export interface AdaptiveQuestionResponse {
  questionIndex: number;
  totalEstimated: number;
  isComplete: boolean;
  question: string;
  subtext?: string;
  type: "single" | "multiple" | "yes-no" | "duration" | "scale" | "text";
  options?: string[];
  placeholder?: string;
  category: "onset" | "character" | "severity" | "aggravating" | "relieving" | "red_flags" | "lifestyle" | "systemic";
  isEmergency?: boolean;
  emergencyDetails?: {
    title: string;
    reason: string;
    severity: "critical" | "urgent";
    actionRecommended: string;
  };
}

// Resilient clinical decision tree for Allopathy & AYUSH pathways
const ALLOPATHY_TREE = [
  {
    category: "onset" as const,
    question: "How long have you been experiencing these symptoms?",
    subtext: "Helps determine whether this is an acute or persistent condition.",
    type: "duration" as const,
    options: ["Less than 24 hours", "2 to 3 days", "4 to 7 days", "1 to 2 weeks", "More than a month"],
  },
  {
    category: "severity" as const,
    question: "On a scale of 1 to 10, how severe is your discomfort right now?",
    subtext: "1 indicates very mild discomfort, 10 indicates severe pain.",
    type: "scale" as const,
    options: ["1 - Very Mild", "3 - Noticeable", "5 - Moderate", "7 - Severe", "9 - Very Severe / Debilitating"],
  },
  {
    category: "character" as const,
    question: "Which of the following best describes your primary sensation?",
    subtext: "Select the most accurate description.",
    type: "single" as const,
    options: ["Sharp or throbbing pain", "Dull ache or continuous heaviness", "Burning sensation / irritation", "Congestion or tightness", "Fatigue / generalized weakness"],
  },
  {
    category: "aggravating" as const,
    question: "Are there specific factors that seem to make it worse?",
    subtext: "Select any that apply.",
    type: "multiple" as const,
    options: ["Physical movement / exertion", "Cold air or cold drinks", "After meals or lying down", "Stress or lack of sleep", "None / constant regardless"],
  },
  {
    category: "relieving" as const,
    question: "Have you taken any home remedies, rest, or OTC medications that provided relief?",
    subtext: "Doctor needs to know existing medication attempts.",
    type: "single" as const,
    options: ["Rest and warm fluids helped mildly", "Paracetamol or painkiller provided temporary relief", "Antacid or steam inhalation helped", "Tried nothing yet", "Medication had no effect"],
  },
  {
    category: "red_flags" as const,
    question: "Are you experiencing any of these alert symptoms?",
    subtext: "Important clinical safety check for the doctor.",
    type: "multiple" as const,
    options: ["High-grade fever (>101°F)", "Shortness of breath / chest tightness", "Dizziness or fainting episodes", "Persistent vomiting", "None of these"],
  },
  {
    category: "systemic" as const,
    question: "Do you have any existing chronic conditions or known drug allergies?",
    subtext: "e.g. Hypertension, Diabetes, Penicillin allergy.",
    type: "text" as const,
    placeholder: "Type any existing conditions or type 'None'",
  },
  {
    category: "lifestyle" as const,
    question: "Has this condition affected your sleep or daily work routine?",
    subtext: "Assessing functional impact on daily life.",
    type: "yes-no" as const,
    options: ["Yes, significantly disrupted", "No, manageable"],
  },
];

const AYUSH_TREE = [
  {
    category: "onset" as const,
    question: "How long has this imbalance or discomfort been present?",
    subtext: "Assessing acute vs chronic dosha aggravation (Ritu/Kala).",
    type: "duration" as const,
    options: ["Less than 3 days", "1 to 2 weeks", "Several weeks", "Longstanding chronic issue"],
  },
  {
    category: "character" as const,
    question: "Which bodily sensations predominate in your experience?",
    subtext: "Assessing Vata (dryness/pain), Pitta (heat/burning), or Kapha (heaviness/mucus).",
    type: "single" as const,
    options: [
      "Dryness, radiating pain, restlessness (Vata indicator)",
      "Internal heat, acidity, redness, irritability (Pitta indicator)",
      "Heaviness, lethargy, congestion, excessive mucus (Kapha indicator)",
      "Combination of temperature changes and fatigue",
    ],
  },
  {
    category: "severity" as const,
    question: "How is your appetite (Agni) and digestive fire currently?",
    subtext: "Digestion and metabolism assessment is central to AYUSH care.",
    type: "single" as const,
    options: ["Strong appetite / excessive thirst", "Irregular / variable appetite", "Poor appetite / feelings of indigestion", "Normal and balanced"],
  },
  {
    category: "lifestyle" as const,
    question: "How would you describe your current sleep pattern and energy upon waking?",
    subtext: "Nidra (sleep quality) evaluation.",
    type: "single" as const,
    options: ["Sound, restful sleep", "Disturbed, waking frequently through the night", "Difficulty falling asleep due to racing thoughts", "Heavy sleep but waking up tired"],
  },
  {
    category: "aggravating" as const,
    question: "Do weather, cold temperatures, or certain foods noticeably alter your symptoms?",
    subtext: "External factors influence doshic equilibrium.",
    type: "multiple" as const,
    options: ["Worse in cold or damp conditions", "Worse in hot weather or spicy foods", "Worse in early morning or late evening", "No noticeable environmental trigger"],
  },
  {
    category: "relieving" as const,
    question: "Have any traditional or herbal practices brought comfort?",
    subtext: "e.g. Warm decoctions (Kadha), turmeric milk, ginger, yoga/pranayama.",
    type: "text" as const,
    placeholder: "Mention any herbal teas, warm compresses, or Ayurvedic remedies tried...",
  },
  {
    category: "red_flags" as const,
    question: "Do you have any severe acute signs such as high fever, severe breathlessness, or chest discomfort?",
    subtext: "Critical triage check for urgent allopathic intervention if required.",
    type: "yes-no" as const,
    options: ["Yes, experiencing severe symptoms", "No acute emergencies"],
  },
  {
    category: "systemic" as const,
    question: "What is your primary stress level and mental outlook currently?",
    subtext: "Manas (Mental constitution) holistic intake.",
    type: "single" as const,
    options: ["Calm and relaxed", "Mild everyday stress", "High workplace or personal stress", "Anxious or restless"],
  },
];

// Clinical Emergency Rules Engine (Guaranteed Zero-Latency Triage)
export function evaluateEmergencyRules(complaint: string, answers: { question: string; answer: string }[]) {
  const allText = (complaint + " " + answers.map((a) => `${a.question} ${a.answer}`).join(" ")).toLowerCase();

  // Cardiac Emergency: Chest pain + (Difficulty breathing OR Sweating OR Radiating Pain)
  const hasChestPain =
    allText.includes("chest pain") ||
    allText.includes("chest pressure") ||
    allText.includes("chest tightness") ||
    allText.includes("heaviness in chest") ||
    allText.includes("angina");

  const hasDyspnea =
    allText.includes("difficulty breathing") ||
    allText.includes("shortness of breath") ||
    allText.includes("breathless") ||
    allText.includes("gasping");

  const hasSweating =
    allText.includes("heavy sweating") ||
    allText.includes("sweat") ||
    allText.includes("cold sweat") ||
    allText.includes("profuse sweating") ||
    allText.includes("diaphoresis");

  const hasRadiation =
    allText.includes("left arm") ||
    allText.includes("jaw") ||
    allText.includes("shoulder") ||
    allText.includes("radiat");

  if (hasChestPain && (hasDyspnea || hasSweating || hasRadiation)) {
    return {
      isEmergency: true,
      emergencyDetails: {
        title: "Potential Acute Coronary Syndrome (Cardiac Red-Flag)",
        reason: "Chest discomfort combined with shortness of breath and/or diaphoresis.",
        severity: "critical" as const,
        actionRecommended: "Immediate Emergency Department presentation / Call 108. Fast-track to OPD Triage Room 1.",
      },
    };
  }

  // Stroke / CVA signs
  const hasStroke =
    allText.includes("slurred speech") ||
    allText.includes("facial droop") ||
    allText.includes("one-sided weakness") ||
    allText.includes("numbness in face") ||
    allText.includes("cannot move arm");

  if (hasStroke) {
    return {
      isEmergency: true,
      emergencyDetails: {
        title: "Suspected Acute Cerebrovascular Event (Stroke Warning)",
        reason: "Sudden focal neurological deficits (speech, facial, or motor weakness).",
        severity: "critical" as const,
        actionRecommended: "Immediate Emergency Department transfer for CT scan & stroke team alert.",
      },
    };
  }

  // Severe Anaphylaxis
  const hasAllergyExposure =
    allText.includes("allergy") ||
    allText.includes("allergic") ||
    allText.includes("sting") ||
    allText.includes("penicillin") ||
    allText.includes("nuts");

  const hasAirwayCompromise =
    allText.includes("throat swelling") ||
    allText.includes("lip swelling") ||
    allText.includes("wheez") ||
    allText.includes("choking");

  if (hasAllergyExposure && hasAirwayCompromise) {
    return {
      isEmergency: true,
      emergencyDetails: {
        title: "Potential Severe Anaphylactic Reaction",
        reason: "Rapid-onset systemic allergic reaction with upper airway or respiratory compromise.",
        severity: "critical" as const,
        actionRecommended: "Immediate IM Epinephrine administration & emergency ER resuscitation.",
      },
    };
  }

  return null;
}

const GROQ_CANDIDATE_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b",
  "groq/compound-mini",
  "llama-3.3-70b-versatile",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pathway = "allopathy", complaint = "", previousAnswers = [], questionIndex = 0 } = body;

    const currentPathwayTree = pathway === "ayush" ? AYUSH_TREE : ALLOPATHY_TREE;
    const totalEstimated = currentPathwayTree.length;

    // First evaluate clinical emergency rules directly on previous answers
    const emergencyCheck = evaluateEmergencyRules(complaint, previousAnswers);

    // Check if we reached the end of the question set
    if (questionIndex >= totalEstimated) {
      return NextResponse.json({
        questionIndex,
        totalEstimated,
        isComplete: true,
        question: "All initial clinical information collected.",
        type: "single",
        category: "lifestyle",
        isEmergency: emergencyCheck ? emergencyCheck.isEmergency : false,
        emergencyDetails: emergencyCheck ? emergencyCheck.emergencyDetails : undefined,
      });
    }

    const apiKey = process.env.GROQ_API_KEY || "";

    // If API key is available, generate dynamic adaptive question via Groq
    if (apiKey && complaint) {
      for (const model of GROQ_CANDIDATE_MODELS) {
        try {
          const groqPrompt = [
            {
              role: "system",
              content: `You are an AI Clinical Triage and Case-Taking Assistant for Carelink Hospital.
Pathway: ${pathway.toUpperCase()} (${pathway === "ayush" ? "Ayurveda/AYUSH holistic evaluation" : "General Medicine/Allopathy evidence-based intake"}).
You are taking the intake history for attending physician Dr. Ananya Kulkarni.
Current question number: ${questionIndex + 1} of ${totalEstimated}.
DO NOT diagnose the patient. DO NOT prescribe medicine.

Formulate exactly ONE highly tailored, empathetic follow-up clinical question specific to the patient's chief complaint and previous responses.
For example, if the complaint mentions chest pain, ask about breathing, sweating, or radiation. If complaint mentions cough, ask about sputum or fever.
Choose the best question type: "single", "multiple", "yes-no", "duration", "scale", or "text".
If "single" or "multiple", provide 3 to 5 realistic clinical options.

Continuous Emergency Triage Check:
Analyze the chief complaint and all previous answers. If there are signs of an acute cardiac event (e.g. chest pain with dyspnea/sweating), stroke (slurred speech, weakness), or severe respiratory failure, set "isEmergency": true and provide "emergencyDetails". Otherwise set "isEmergency": false.

Return ONLY a valid JSON object matching this schema:
{
  "question": "string",
  "subtext": "string (why doctor needs this)",
  "type": "single" | "multiple" | "yes-no" | "duration" | "scale" | "text",
  "options": ["opt1", "opt2", ...],
  "placeholder": "string (if type is text)",
  "category": "onset" | "character" | "severity" | "aggravating" | "relieving" | "red_flags" | "lifestyle" | "systemic",
  "isEmergency": boolean,
  "emergencyDetails": {
    "title": "string",
    "reason": "string",
    "severity": "critical" | "urgent",
    "actionRecommended": "string"
  }
}`,
            },
            {
              role: "user",
              content: `Chief Complaint: "${complaint}"
Previous Questions & Answers: ${JSON.stringify(previousAnswers)}
Generate Question ${questionIndex + 1}:`,
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
              max_tokens: 400,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            const parsed = JSON.parse(data.choices[0].message.content);
            const isEmerg = emergencyCheck?.isEmergency || Boolean(parsed.isEmergency);
            const emergDetails = emergencyCheck?.emergencyDetails || parsed.emergencyDetails;

            return NextResponse.json({
              questionIndex,
              totalEstimated,
              isComplete: false,
              ...parsed,
              isEmergency: isEmerg,
              emergencyDetails: emergDetails,
            });
          }
        } catch (groqErr) {
          console.warn(`Groq candidate ${model} failed, trying next:`, groqErr);
        }
      }
    }

    // High quality clinical tree fallback
    const treeItem = currentPathwayTree[questionIndex];
    return NextResponse.json({
      questionIndex,
      totalEstimated,
      isComplete: false,
      ...treeItem,
      isEmergency: emergencyCheck ? emergencyCheck.isEmergency : false,
      emergencyDetails: emergencyCheck ? emergencyCheck.emergencyDetails : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to generate next question", details: err?.message },
      { status: 500 }
    );
  }
}
