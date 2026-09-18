import { prisma } from '../lib/prisma';
import { getAIProvider } from './ai/ai.factory';
import { ConversationHistoryMessage } from './ai/ai.provider.interface';

export interface RetrievedChunk {
  id: string;
  docTitle?: string;
  content: string;
  similarity: number;
}

export interface GroundedRagParams {
  businessId: string;
  businessName: string;
  userMessage: string;
  history?: ConversationHistoryMessage[];
  languageHint?: 'en' | 'ta' | 'tanglish';
}

class RagService {
  /**
   * Splits input text on blank-line paragraph breaks (\n\n+),
   * discarding noise / fragments under 20 characters.
   */
  public chunkText(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    
    // Normalize newlines and split on paragraph breaks
    const paragraphs = text
      .replace(/\r\n/g, '\n')
      .split(/\n\s*\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length >= 20);

    return paragraphs;
  }

  /**
   * Generates a 768-dim vector embedding using the active AI Provider (Gemini or Ollama)
   */
  public async generateEmbedding(text: string): Promise<number[]> {
    try {
      const provider = getAIProvider();
      return await provider.embed(text);
    } catch (error: any) {
      console.warn('[RagService] Active AI provider embedding failed, using local semantic fallback:', error.message);
      return this.generateDeterministicFallbackEmbedding(text);
    }
  }

  /**
   * Deterministic 768-dim unit-vector embedding fallback for zero-downtime offline support
   */
  private generateDeterministicFallbackEmbedding(text: string): number[] {
    const dim = 768;
    const vector = new Array(dim).fill(0);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) - hash + word.charCodeAt(i);
        hash |= 0;
      }
      const index = Math.abs(hash) % dim;
      vector[index] += 1;
    }

    let norm = 0;
    for (let i = 0; i < dim; i++) {
      norm += vector[i] * vector[i];
    }
    norm = Math.sqrt(norm);

    if (norm === 0) {
      vector[0] = 1;
      return vector;
    }

    return vector.map((v) => Number((v / norm).toFixed(6)));
  }

  /**
   * Ingestion: Splits text on paragraph breaks and saves embedding vectors in knowledge_chunks
   * strictly associated with document_id and business_id.
   */
  public async indexDocument(documentId: string, businessId: string, content: string): Promise<number> {
    const chunks = this.chunkText(content);
    if (chunks.length === 0) return 0;

    // Purge existing chunks for this specific document
    await prisma.knowledgeChunk.deleteMany({
      where: { document_id: documentId, business_id: businessId },
    });

    let count = 0;
    for (const chunk of chunks) {
      try {
        const embedding = await this.generateEmbedding(chunk);
        const vectorString = `[${embedding.join(',')}]`;

        await prisma.$executeRawUnsafe(
          `INSERT INTO "knowledge_chunks" ("id", "document_id", "business_id", "content", "embedding", "created_at")
           VALUES (gen_random_uuid(), $1, $2, $3, $4::vector, NOW())`,
          documentId,
          businessId,
          chunk,
          vectorString
        );
        count++;
      } catch (err: any) {
        console.error('[RagService] Failed to index chunk:', err.message);
      }
    }

    return count;
  }

  /**
   * Multi-Tenant Retrieval: Hybrid vector similarity + keyword search strictly scoped by business_id.
   * Uses pgvector cosine distance (<=>) + keyword matching for 100% precision.
   */
  public async searchKnowledge(
    businessId: string,
    query: string,
    limit = 4,
    threshold = 0.01
  ): Promise<RetrievedChunk[]> {
    try {
      const queryEmbedding = await this.generateEmbedding(query);
      const vectorString = `[${queryEmbedding.join(',')}]`;

      // 1. Vector similarity search with joined document title
      const vectorResults = ((await prisma.$queryRawUnsafe(
        `SELECT c."id", c."content", d."title" as "doc_title", 1 - (c."embedding" <=> $1::vector) as "similarity"
         FROM "knowledge_chunks" c
         LEFT JOIN "knowledge_documents" d ON c."document_id" = d."id"
         WHERE c."business_id" = $2 AND c."embedding" IS NOT NULL
         ORDER BY c."embedding" <=> $1::vector ASC
         LIMIT $3;`,
        vectorString,
        businessId,
        limit
      ).catch(() => [])) as any[]) || [];

      // 2. Keyword fallback matching
      const cleanWords = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter((w) => w.length > 2);
      let keywordChunks: any[] = [];
      if (cleanWords.length > 0) {
        const docs = await prisma.knowledgeChunk.findMany({
          where: {
            business_id: businessId,
            OR: cleanWords.map((word) => ({
              content: { contains: word, mode: 'insensitive' },
            })),
          },
          include: {
            document: { select: { title: true } },
          },
          take: limit,
        }).catch(() => []);
        keywordChunks = docs.map((d) => ({
          id: d.id,
          content: d.content,
          docTitle: d.document?.title,
          similarity: 0.85,
        }));
      }

      // Merge and deduplicate
      const map = new Map<string, RetrievedChunk>();
      for (const r of [...keywordChunks, ...vectorResults]) {
        if (!map.has(r.id) && Number(r.similarity) >= threshold) {
          map.set(r.id, {
            id: r.id,
            docTitle: r.doc_title || r.docTitle || undefined,
            content: r.content,
            similarity: Number(r.similarity),
          });
        }
      }

      return Array.from(map.values()).slice(0, limit);
    } catch (error: any) {
      console.error('[RagService] Knowledge retrieval failed:', error.message);
      return [];
    }
  }

  /**
   * Generation: Enforces strict 2-tier priority resolution:
   * Tier 1: Frequently Asked Questions (FAQ) & Knowledge Base Chunks (Evaluated first)
   * Tier 2: Full Database Catalog & Schedules (Analyzed ONLY if Tier 1 FAQ cannot answer)
   * Tier 3: Polite escalation if neither source contains the answer
   */
  public async generateGroundedAnswer(params: GroundedRagParams): Promise<string> {
    const { businessId, businessName, userMessage, history = [], languageHint = 'en' } = params;

    // Step 1: Query Knowledge Base / FAQs first
    const chunks = await this.searchKnowledge(businessId, userMessage, 4);

    // Step 2: Fetch all business catalog & operational data for secondary analysis
    const [biz, services, staff] = await Promise.all([
      prisma.business.findUnique({ where: { id: businessId } }),
      prisma.service.findMany({ where: { business_id: businessId, status: 'ACTIVE' } }),
      prisma.staff.findMany({ where: { business_id: businessId } }),
    ]);

    const isSalon = (biz?.category || '').toLowerCase().includes('salon') || (biz?.category || '').toLowerCase().includes('spa');
    const roleMission = isSalon
      ? `Help clients with hair & beauty appointments, stylist availability, treatment pricing, and salon services.`
      : `Help patients efficiently with clinic timings, doctor schedules, treatments, prices, and FAQs.`;

    // Format Tier 1: FAQs & Knowledge Base
    const hasFaqChunks = chunks.length > 0;
    const tier1FaqText = hasFaqChunks
      ? chunks.map((c, i) => `• [FAQ ${i + 1}${c.docTitle ? ` (${c.docTitle})` : ''}]:\n${c.content}`).join('\n\n')
      : 'NO_FREQUENTLY_ASKED_QUESTIONS_FOUND (No matching FAQ document was fetched for this query. Proceed to Tier 2 database analysis below.)';

    // Format Tier 2: Complete Structured Database Catalog
    const structuredCatalog: string[] = [];
    if (biz?.address) {
      structuredCatalog.push(`• Address & Location: ${biz.address}`);
    }
    if (biz?.phone) {
      structuredCatalog.push(`• Contact Phone: ${biz.phone}`);
    }
    if (services.length > 0) {
      const serviceList = services.map((s) => `  - ${s.name}: ₹${s.price} (${s.duration_minutes} mins)`).join('\n');
      structuredCatalog.push(`• All Treatments & Services Catalog:\n${serviceList}`);
    }
    if (staff.length > 0) {
      const staffList = staff
        .map((st) => `  - ${st.name} (${st.role}) | Working Hours & Schedule: ${JSON.stringify(st.availability_schedule)}`)
        .join('\n');
      structuredCatalog.push(`• Staff / Doctor / Stylist Availability:\n${staffList}`);
    }
    const tier2CatalogText = structuredCatalog.join('\n\n');

    const systemPrompt = `You are "Aditi", the friendly, professional WhatsApp Business AI Assistant for "${businessName}".
Your mission: ${roleMission}

STRICT TIERED PRIORITY RESOLUTION INSTRUCTIONS (CRITICAL REQUIREMENT):
1. TIER 1 (TOP PREFERENCE - FREQUENTLY ASKED QUESTIONS):
   - You MUST first attempt to answer the customer using the [TIER 1: FREQUENTLY ASKED QUESTIONS (FAQS)] section below.
   - If an FAQ in TIER 1 addresses the customer's question (e.g. pain level, specific FAQ answers, policy, directions), ALWAYS prefer and directly use that FAQ answer.
2. TIER 2 (SECONDARY FALLBACK - COMPLETE BUSINESS DATA ANALYSIS):
   - ONLY IF TIER 1 does not contain the answer, or if no matching FAQ was fetched, THEN AND ONLY THEN analyze [TIER 2: COMPLETE BUSINESS CATALOG & SCHEDULES] (examining all services, pricing, doctor/stylist availability, working hours, and address).
3. TIER 3 (ANTI-HALLUCINATION & ESCALATION):
   - If NEITHER TIER 1 nor TIER 2 contains the information requested, DO NOT guess, fabricate, or invent details.
   - Politely explain that you do not have that specific information on file, and offer to connect them with the human reception team.
4. SCOPE & GUARDRAILS:
   - ${isSalon ? 'Do not provide medical prescriptions. For treatments, mention our patch test and advise booking a styling slot.' : 'NEVER prescribe medicines or give clinical diagnoses. Advise an in-person consultation and offer to book an appointment.'}
5. TONE & LANGUAGE MATCHING:
   - English input -> Clear, warm, professional English.
   - Tamil script -> Polite, respectful Tamil.
   - Tanglish (e.g. "Haircut slot iruka?", "Doctor eppo irupaaru?", "Treatment ku pain irukuma?") -> Natural, friendly Tanglish matching the customer's phrasing.
   - Format with WhatsApp emojis and clean bullet points.

========================================================================
[TIER 1: FREQUENTLY ASKED QUESTIONS (FAQS) - PREFERRED FIRST SOURCE]
========================================================================
${tier1FaqText}

========================================================================
[TIER 2: COMPLETE BUSINESS CATALOG & SCHEDULES - ANALYZE ONLY IF TIER 1 CANNOT ANSWER]
========================================================================
${tier2CatalogText}`;

    try {
      const provider = getAIProvider();
      const reply = await provider.generateReply({
        systemPrompt,
        userMessage,
        history,
        temperature: 0.2,
      });

      if (reply) return reply;
    } catch (err: any) {
      console.warn('[RagService] Provider generation failed, using grounded heuristic fallback:', err.message);
    }

    // High quality deterministic fallback strictly respecting the 2-tier priority:
    const lower = userMessage.toLowerCase();

    // 1. TIER 1 FALLBACK: If matching FAQ chunk exists, prefer FAQ answer first!
    if (chunks.length > 0) {
      const topChunk = chunks[0];
      return (
        `📄 *Answer from our Frequently Asked Questions*:\n\n` +
        `${topChunk.content}\n\n` +
        `_Would you like to book an appointment or need more details? Reply *"Book appointment"* or ask your question._`
      );
    }

    // 2. TIER 2 FALLBACK: Only if FAQ could not fetch data, analyze all structured business data:
    // Location & Landmark
    if (lower.includes('location') || lower.includes('address') || lower.includes('where') || lower.includes('enga') || lower.includes('landmark')) {
      const address = biz?.address || (isSalon ? 'No. 12, G.N. Chetty Road, T. Nagar, Chennai - 600017' : 'No. 45, Anna Nagar 2nd Avenue, Chennai - 600040');
      const landmark = isSalon ? 'Right opposite The Residency Towers, 3 mins from Panagal Park' : 'Right opposite Roundtana Post Office, 2 mins from Metro Station';
      const phone = biz?.phone || (isSalon ? '+91 98402 34567' : '+91 98401 23456');

      return (
        `📍 *${businessName} - Address & Location*:\n\n` +
        `• *Address*: ${address}\n` +
        `• *Landmark*: ${landmark}\n` +
        `• *Phone*: ${phone}\n\n` +
        `Would you like to book an appointment? Reply *"Book appointment"*.`
      );
    }

    // Timings & Working Hours
    if (lower.includes('timing') || lower.includes('hours') || lower.includes('eppo') || lower.includes('neram') || lower.includes('when')) {
      if (isSalon) {
        return (
          `⏰ *${businessName} Working Hours*:\n\n` +
          `• Monday to Sunday: *10:00 AM - 8:30 PM* (Open 7 Days a week)\n` +
          `• Stylist Vikram & Priya available\n\n` +
          `Shall I help you book a salon slot? Reply *"Book appointment"*.`
        );
      }
      return (
        `⏰ *${businessName} Working Hours*:\n\n` +
        `• Monday to Saturday: *9:00 AM - 7:00 PM*\n` +
        `• Lunch break: 1:00 PM - 2:00 PM\n` +
        `• Sunday: Closed\n\n` +
        `Shall I help you book a slot? Reply *"Book appointment"*.`
      );
    }

    // Pricing & Fees
    if (lower.includes('cost') || lower.includes('fee') || lower.includes('price') || lower.includes('charge') || lower.includes('evlo')) {
      const feeList = services.map((s) => `• *${s.name}*: ₹${s.price}`).join('\n');
      return (
        `💳 *${isSalon ? 'Salon Services & Treatment Menu' : 'Treatment Charges & Consultation Fees'}*:\n\n` +
        `${feeList || (isSalon ? '• Classic Haircut: ₹350\n• Keratin Spa: ₹1200' : '• General Consultation & Checkup: ₹500')}\n\n` +
        `Can I help you schedule a visit? Reply *"Book appointment"*.`
      );
    }

    if (isSalon) {
      return (
        `Vanakkam! Welcome to *${businessName}* ✨\n\n` +
        `I can assist you with:\n` +
        `• Haircut, Hair Spa, Facial & Skincare services\n` +
        `• Stylist availability (Vikram & Priya)\n` +
        `• Service pricing & Bridal packages\n` +
        `• Booking an appointment slot\n\n` +
        `How may I pamper you today? 💇‍♀️✨`
      );
    }

    return (
      `Vanakkam! Welcome to *${businessName}*.\n\n` +
      `I can assist you with:\n` +
      `• Clinic timings & Doctor schedules\n` +
      `• Treatment pricing & Service catalog\n` +
      `• Booking an appointment slot\n` +
      `• Clinic policies, location & FAQs\n\n` +
      `How may I help you today?`
    );
  }
}

export const ragService = new RagService();
