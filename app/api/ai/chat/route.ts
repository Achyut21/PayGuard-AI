import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client on the server side
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { messages, systemPrompt } = await request.json();

    // Check if API key is configured
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === '') {
      console.error('OpenAI API key is not configured in environment variables');
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please check your .env.local file.' },
        { status: 500 }
      );
    }

    // Log the first few characters of the API key for debugging (never log the full key!)
    console.log('API key exists, starting with:', apiKey.substring(0, 7) + '...');

    // Check for JSON response format request
    const isJsonResponse = systemPrompt.includes('JSON object') || systemPrompt.includes('Return a JSON');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
      ...(isJsonResponse && { response_format: { type: 'json_object' } })
    });

    return NextResponse.json({
      content: completion.choices[0]?.message?.content || 'No response generated',
    });
  } catch (error: any) {
    console.error('OpenAI API error:', error);
    
    // Check for authentication errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid OpenAI API key. Please check your API key in .env.local file.' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
