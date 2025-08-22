import { NextResponse } from 'next/server'
import { validateMuxCredentials } from '@/lib/mux'

export async function GET() {
  try {
    // FIXED: Use the returned validation result object instead of treating it as boolean
    const validation = validateMuxCredentials()
    
    return NextResponse.json({
      isValid: validation.isValid,
      error: validation.error || null
    })
  } catch (error) {
    console.error('Error validating MUX credentials:', error)
    return NextResponse.json({
      isValid: false,
      error: 'Failed to validate MUX credentials'
    }, { status: 500 })
  }
}