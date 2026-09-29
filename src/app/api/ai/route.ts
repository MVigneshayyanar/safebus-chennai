import { NextRequest, NextResponse } from 'next/server';
import { explainVerdict, chatAssistant, analyzePageContent, triageReport } from '@/lib/ai';
import { z } from 'zod';

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const body = await req.json();
    const action = body._action || 'explain';

    switch (action) {
      case 'explain': {
        const schema = z.object({
          type: z.enum(['ticket', 'domain']),
          verdict: z.string(),
          reasons: z.array(z.object({ signal: z.string(), description: z.string() })),
          locale: z.enum(['en', 'ta']).default('en'),
        });
        const data = schema.parse(body);
        const explanation = await explainVerdict(data);
        return NextResponse.json({ data: { explanation } });
      }

      case 'analyze-page': {
        const schema = z.object({
          url: z.string(),
          text: z.string(),
          forms: z.array(z.string()).optional(),
          paymentFields: z.array(z.string()).optional(),
        });
        const data = schema.parse(body);
        const result = await analyzePageContent(data);
        return NextResponse.json({ data: result });
      }

      case 'triage-report': {
        const schema = z.object({
          description: z.string(),
          ocrText: z.string().optional(),
          type: z.string(),
        });
        const data = schema.parse(body);
        const result = await triageReport(data);
        return NextResponse.json({ data: result });
      }

      case 'chat': {
        const schema = z.object({
          message: z.string(),
          locale: z.enum(['en', 'ta']).default('en'),
          context: z.string().optional(),
        });
        const data = schema.parse(body);
        const response = await chatAssistant(data);
        return NextResponse.json({ data: { response } });
      }

      default:
        return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: `Unknown action: ${action}` } }, { status: 400 });
    }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: error.issues } }, { status: 400 });
    }
    return NextResponse.json({ error: { code: 'INTERNAL_ERROR', message: error.message } }, { status: 500 });
  }
}
