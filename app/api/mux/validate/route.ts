import { NextResponse } from 'next/server'
import { validateMuxConfig } from '@/lib/mux'

export async function GET() {
  try {
    const validation = await validateMuxConfig()
    
    return NextResponse.json({
      isConfigured: validation.isConfigured,
      missingVariables: validation.missingVariables
    })
  } catch (error) {
    console.error('Error validating MUX configuration:', error)
    return NextResponse.json(
      { 
        error: 'Failed to validate MUX configuration',
        isConfigured: false,
        missingVariables: ['MUX_TOKEN_ID', 'MUX_TOKEN_SECRET']
      },
      { status: 500 }
    )
  }
}