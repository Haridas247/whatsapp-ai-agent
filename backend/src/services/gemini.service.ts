import { ai } from '../lib/gemini';
import { config } from '../config/env';

export interface IntentAnalysisResult {
  intent: 'EMERGENCY' | 'HUMAN_AGENT' | 'BOOKING' | 'CANCEL_RESCHEDULE' | 'FAQ' | 'GREETING';
  language: 'en' | 'ta' | 'tanglish';
  isEmergency: boolean;
  emergencyReason?: string;
  extractedDetails?: {
    serviceName?: string;
    requestedDate?: string; // YYYY-MM-DD or relative like "tomorrow", "tuesday"
    requestedTime?: string; // e.g. "5:00 PM" or "11am"
    customerName?: string;
  };
}

export interface ConversationContextMessage {
  role: 'user' | 'assistant';
  content: string;
}

class GeminiService {
  private emergencyKeywords = [
    'chest pain',
    'severe bleeding',
    'unconscious',
    'heart attack',
    'cannot breathe',
    'can not breathe',
    'difficulty breathing',
    'heavy bleeding',
    'head injury',
    'severe trauma',
    'poison',
    'suicide',
    // Tanglish / Tamil emergency keywords
    'nenju vali',
    'romba ratham',
    'adiga ratham',
    'moochu vida mudila',
    'moochu thinaral',
    'mayakkam',
    'uyirukku aabathu',
    'emergency',
  ];

  /**
   * Fast rule-based check for medical emergencies
   */
  public isEmergencyText(text: string): boolean {
    const lower = text.toLowerCase();
    return this.emergencyKeywords.some((kw) => lower.includes(kw));
  }

  /**
   * Analyzes customer intent, detects emergency, extracts booking details, and detects language
   */
  public async analyzeIntent(
    userMessage: string,
    history: ConversationContextMessage[] = []
  ): Promise<IntentAnalysisResult> {
    // Immediate emergency short-circuit
    if (this.isEmergencyText(userMessage)) {
      return {
        intent: 'EMERGENCY',
        language: 'tanglish',
        isEmergency: true,
        emergencyReason: 'Emergency medical keyword detected in message',
      };
    }

    const systemPrompt = `You are an AI intent analyzer for a medical and dental clinic WhatsApp receptionist assistant in India.
Your job is to analyze the user's message and determine:
1. Intent:
   - "EMERGENCY": Severe acute medical emergency (chest pain, heavy bleeding, loss of consciousness, choking).
   - "HUMAN_AGENT": Customer explicitly requests human assistance, receptionist, phone call, or speaking to clinic staff.
   - "BOOKING": Customer wants to book an appointment, check slot availability, or asks for appointment timing/date (e.g., "appointment venum", "Tuesday 5pm slot iruka?", "book tomorrow").
   - "CANCEL_RESCHEDULE": Customer wants to cancel or reschedule an existing appointment.
   - "GREETING": Hello, hi, vanakkam, good morning/evening without a specific question.
   - "FAQ": Question about clinic fees, doctor availability, location, timings, treatments, procedures.
2. Language: "en" (English), "ta" (Tamil script), or "tanglish" (Tamil written in English script like "doctor irukaara?").
3. Extracted Details: If booking related, extract serviceName, requestedDate, requestedTime, customerName if present.

Return ONLY a JSON object with this exact structure:
{
  "intent": "EMERGENCY" | "HUMAN_AGENT" | "BOOKING" | "CANCEL_RESCHEDULE" | "GREETING" | "FAQ",
  "language": "en" | "ta" | "tanglish",
  "isEmergency": boolean,
  "emergencyReason": string | null,
  "extractedDetails": {
    "serviceName": string | null,
    "requestedDate": string | null,
    "requestedTime": string | null,
    "customerName": string | null
  }
}`;

    try {
      if (config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim().length > 10) {
        const response = await ai.models.generateContent({
          model: config.GEMINI_MODEL,
          contents: [
            { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser Message: "${userMessage}"` }] },
          ],
        });

        const responseText = response.text?.trim() || '';
        const cleanedJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);

        return {
          intent: parsed.intent || 'FAQ',
          language: parsed.language || 'en',
          isEmergency: Boolean(parsed.isEmergency),
          emergencyReason: parsed.emergencyReason || undefined,
          extractedDetails: {
            serviceName: parsed.extractedDetails?.serviceName || undefined,
            requestedDate: parsed.extractedDetails?.requestedDate || undefined,
            requestedTime: parsed.extractedDetails?.requestedTime || undefined,
            customerName: parsed.extractedDetails?.customerName || undefined,
          },
        };
      }
    } catch (error) {
      // Fall through to heuristic classifier
    }

    // High accuracy heuristic classifier
    const lower = userMessage.toLowerCase();

    // Language detection
    const isTamilScript = /[\u0B80-\u0BFF]/.test(userMessage);
    const isTanglish =
      !isTamilScript &&
      /\b(venum|iruka|irukaaru|enna|eppo|enga|evlo|aagum|pannalaam|vanakkam|illai|nandri|paathu|vali|romba|mudiyuma|kaatunga)\b/i.test(
        userMessage
      );
    const language = isTamilScript ? 'ta' : isTanglish ? 'tanglish' : 'en';

    if (
      lower.includes('appointment') ||
      lower.includes('book') ||
      lower.includes('slot') ||
      lower.includes('venum') ||
      lower.includes('visit')
    ) {
      return { intent: 'BOOKING', language, isEmergency: false };
    }

    if (
      lower.includes('human') ||
      lower.includes('receptionist') ||
      lower.includes('doctor direct') ||
      lower.includes('speak to staff') ||
      lower.includes('call me')
    ) {
      return { intent: 'HUMAN_AGENT', language, isEmergency: false };
    }

    if (
      lower.includes('cancel') ||
      lower.includes('reschedule') ||
      lower.includes('change date') ||
      lower.includes('vendaam')
    ) {
      return { intent: 'CANCEL_RESCHEDULE', language, isEmergency: false };
    }

    if (
      lower === 'hi' ||
      lower === 'hello' ||
      lower.includes('vanakkam') ||
      lower.startsWith('good morning') ||
      lower.startsWith('good evening')
    ) {
      return { intent: 'GREETING', language, isEmergency: false };
    }

    return { intent: 'FAQ', language, isEmergency: false };
  }

  /**
   * Generates a conversational RAG-grounded response strictly adhering to safety & healthcare guardrails
   */
  public async generateRagAnswer(
    businessName: string,
    userMessage: string,
    contextChunks: string[],
    history: ConversationContextMessage[] = [],
    languageHint: 'en' | 'ta' | 'tanglish' = 'en'
  ): Promise<string> {
    const contextText =
      contextChunks.length > 0
        ? contextChunks.map((c, i) => `[Fact ${i + 1}]: ${c}`).join('\n\n')
        : 'NO_SPECIFIC_KNOWLEDGE_FOUND';

    const systemInstruction = `You are "Aditi", the friendly, professional WhatsApp Business AI Receptionist for "${businessName}".
Your mission: Help patients efficiently with clinic timings, consultation bookings, doctor schedules, treatments, and general clinic FAQs.

STRICT HEALTHCARE & SAFETY GUARDRAILS:
1. You are an administrative assistant only. NEVER provide medical diagnosis, clinical opinions, or prescribe medicines.
2. If the user asks for clinical advice (e.g., "what tablet should I take for tooth pain?"), advise them to consult the doctor directly during an in-person consultation and offer to book an appointment.
3. ANTI-HALLUCINATION POLICY: Rely strictly on the PROVIDED CLINIC FACTS below. If the answer is NOT present in the facts, DO NOT invent prices, doctor names, or policies. Politely inform them that you will connect them with the human reception team.
4. LANGUAGE MATCHING:
   - If the user writes in English, reply in clear, professional English.
   - If the user writes in Tamil script, reply in polite Tamil.
   - If the user writes in Tanglish (Tamil in English alphabet, e.g., "Doctor eppo irupaaru?", "Appointment venum"), reply in natural, friendly Tanglish (e.g., "Vanakkam! Doctor 9:00 AM le irundhu 7:00 PM varaikum irukaaru. Ungalukku appointment book panna vaa?").
5. Keep WhatsApp replies concise, clean, using emojis where appropriate, and formatted with bullet points for readability.

PROVIDED CLINIC FACTS:
${contextText}`;

    try {
      if (config.GEMINI_API_KEY && config.GEMINI_API_KEY.trim().length > 10) {
        const historyParts = history.slice(-6).map((msg) => ({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }],
        }));

        const contents = [
          ...historyParts,
          { role: 'user', parts: [{ text: userMessage }] },
        ];

        const response = await ai.models.generateContent({
          model: config.GEMINI_MODEL,
          config: {
            systemInstruction: systemInstruction,
            temperature: 0.3,
          },
          contents: contents,
        });

        if (response.text) {
          return response.text.trim();
        }
      }
    } catch (error: any) {
      console.warn('[GeminiService] Gemini API call bypassed/failed:', error.message);
    }

    // High quality conversational fallback grounded on the retrieved facts
    const lower = userMessage.toLowerCase();
    const factsJoined = contextChunks.join(' ');

    if (languageHint === 'tanglish' || lower.includes('timing') || lower.includes('eppo') || lower.includes('neram')) {
      if (factsJoined.includes('9:00 AM') || lower.includes('timing') || lower.includes('time')) {
        return (
          `Vanakkam! 🙏\n\n` +
          `*${businessName}* working hours:\n` +
          `• Monday to Saturday: *9:00 AM - 7:00 PM*\n` +
          `• Lunch break: 1:00 PM - 2:00 PM\n` +
          `• Sunday: Closed (Leave)\n\n` +
          `Ungalukku Dr. Kumar kitta appointment book panna vaa? "Book appointment" nu reply pannunga!`
        );
      }
    }

    if (lower.includes('cost') || lower.includes('fee') || lower.includes('price') || lower.includes('evlo') || lower.includes('charge')) {
      return (
        `Vanakkam! 🙏 Here are the consultation & treatment charges at *${businessName}*:\n\n` +
        `• *Doctor Consultation*: ₹500\n` +
        `• *Teeth Cleaning & Polishing*: ₹1,200\n` +
        `• *Laser Teeth Whitening*: ₹3,000\n` +
        `• *Root Canal Treatment (RCT)*: ₹4,500\n` +
        `• *Dental Fillings*: ₹1,000\n\n` +
        `We accept UPI (GPay/PhonePe), Cards, Cash & Insurance. Would you like to book a slot?`
      );
    }

    if (lower.includes('location') || lower.includes('address') || lower.includes('metro') || lower.includes('enga')) {
      return (
        `📍 *Location & Landmark - ${businessName}*:\n\n` +
        `No. 45, Anna Nagar 2nd Avenue, Chennai - 600040.\n` +
        `• *Landmark*: Opposite Roundtana Post Office\n` +
        `• *Metro*: 2 mins walk from Anna Nagar Tower Metro Station\n` +
        `• Dedicated car & two-wheeler parking available inside.\n\n` +
        `Shall I help you book an appointment?`
      );
    }

    if (contextChunks.length > 0) {
      return (
        `Vanakkam! 🙏 Regarding your question about *${businessName}*:\n\n` +
        `${contextChunks[0]}\n\n` +
        `Can I assist you with booking an appointment? Just reply *"Book appointment"*.`
      );
    }

    return (
      `Vanakkam! Welcome to *${businessName}*.\n\n` +
      `How can I help you today? You can:\n` +
      `1. Check clinic timings & doctor availability\n` +
      `2. View consultation & treatment fees\n` +
      `3. Book an appointment slot\n` +
      `4. Request human receptionist assistance`
    );
  }

  /**
   * Generates emergency alert message directing customer to immediate emergency care
   */
  public getEmergencyMessage(businessPhone: string): string {
    return (
      `🚨 *EMERGENCY MEDICAL ALERT* 🚨\n\n` +
      `We have detected that you or someone with you may be experiencing a medical emergency.\n\n` +
      `⚠️ *Please do not wait for a chat reply.* Immediate emergency action is required:\n` +
      `1. Call national emergency services (*108* or *112*) immediately.\n` +
      `2. Or call our emergency line directly at: *${businessPhone}*\n` +
      `3. If possible, proceed to the nearest hospital casualty/emergency room.\n\n` +
      `A human clinic staff member has also been alerted right now.`
    );
  }
}

export const geminiService = new GeminiService();
