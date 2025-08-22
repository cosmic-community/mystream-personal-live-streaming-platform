import { NextResponse } from 'next/server'
import { validateMuxConfig } from '@/lib/mux' // FIXED: Proper import

export async function GET() {
  try {
    const validation = validateMuxConfig()
    
    return NextResponse.json({
      isValid: validation.isValid,
      error: validation.error
    })
  } catch (error) {
    console.error('Error validating MUX config:', error)
    return NextResponse.json(
      { 
        isValid: false, 
        error: 'Failed to validate MUX configuration' 
      },
      { status: 500 }
    )
  }
}