import { NextResponse } from 'next/server'
import { validateMuxCredentials } from '@/lib/mux'

export async function GET() {
  try {
    // FIXED: Await the Promise to get the actual MuxValidationResult
    const validationResult = await validateMuxCredentials()
    
    // FIXED: Access properties directly from the result object, not from Promise
    return NextResponse.json({
      isValid: validationResult.isValid,
      error: validationResult.error || null,
      message: validationResult.isValid ? 'MUX credentials are valid' : 'MUX credentials are invalid'
    })
  } catch (error: any) {
    console.error('Error validating MUX credentials:', error)
    
    return NextResponse.json({
      isValid: false,
      error: error.message || 'Failed to validate MUX credentials'
    }, { status: 500 })
  }
}