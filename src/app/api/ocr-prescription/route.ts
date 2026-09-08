import { NextRequest } from 'next/server';
import { parseBody } from '@/lib/api/parse';
import { handleError } from '@/lib/middlewares/errorHandler';
import { requireRole } from '@/lib/api/auth';
import { BadRequestError } from '@/lib/errors';
import { ok } from '@/lib/api/response';
import { ocrPrescriptionSchema } from './ocr-prescription.schema';

export async function POST(req: NextRequest) {
  try {
    requireRole(['admin', 'shop', 'atelier'])(req);
    const { imageData } = await parseBody(req, ocrPrescriptionSchema);
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL;

    if (!apiKey) {
      throw new BadRequestError('Missing GROQ_API_KEY environment variable');
    }

    const requestBody = {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are a precise OCR extraction engine. You output ONLY valid JSON with no preamble, no explanation, no markdown, no backticks. Your entire response must be parseable by JSON.parse().'
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract the prescription numbers from this image. Return ONLY a raw JSON object (no markdown, no backticks, no other text) using this exact schema with null for missing values. Use dots not commas for decimals:
{"od_sph": null,"od_cyl": null,"od_axis": null,"os_sph": null,"os_cyl": null,"os_axis": null,"add": null,"pd": null}`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageData}`
              }
            }
          ]
        }
      ],
      temperature: 0,
      max_tokens: 600
    };

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);

      if (errorData?.error?.code === 'model_decommissioned') {
        throw new BadRequestError(`The model "${model}" has been decommissioned by Groq. Update GROQ_MODEL in your .env file.`);
      }

      throw new BadRequestError(errorData?.error?.message || 'Failed to fetch from Groq');
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content;

    if (!textResponse) {
      throw new BadRequestError('No text returned from Groq');
    }

    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new BadRequestError('Response did not contain valid JSON');
    }

    return ok(JSON.parse(jsonMatch[0]));

  } catch (error) {
    return handleError(error);
  }
}