// src/app/api/ocr-prescription/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageData } = await req.json();
    const apiKey = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct';

    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GROQ_API_KEY' }, { status: 500 });
    }

    if (!model) {
      return NextResponse.json({ error: 'Missing GROQ_MODEL' }, { status: 500 });
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
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);

      if (errorData?.error?.code === 'model_decommissioned') {
        return NextResponse.json({
          error: `The model "${model}" has been decommissioned by Groq. Update GROQ_MODEL in your .env file to a supported model. See https://console.groq.com/docs/deprecations for recommendations.`
        }, { status: 410 });
      }

      throw new Error(errorData.error?.message || 'Failed to fetch from Groq');
    }

    const data = await response.json();
    const textResponse = data.choices?.[0]?.message?.content;

    if (!textResponse) {
      throw new Error('No text returned from Groq');
    }

    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in response:', textResponse);
      throw new Error('Response did not contain valid JSON');
    }

    const parsedData = JSON.parse(jsonMatch[0]);

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('OCR Route Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process image' }, { status: 500 });
  }
}
