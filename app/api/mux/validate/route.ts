import { NextResponse } from 'next/server'
import { validateMuxConfiguration } from '@/lib/mux'

export async function GET() {
  try {
    const validation = validateMuxConfiguration()
    
    return NextResponse.json({
      configured: validation.isConfigured,
      missing: validation.missingVariables,
      message: validation.isConfigured 
        ? 'MUX is properly configured' 
        : `Missing environment variables: ${validation.missingVariables.join(', ')}`
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to validate MUX configuration' },
      { status: 500 }
    )
  }
}