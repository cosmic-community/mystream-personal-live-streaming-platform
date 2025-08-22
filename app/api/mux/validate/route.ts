import { NextResponse } from 'next/server'
import { validateMuxCredentials } from '@/lib/mux' // FIXED: Updated import name

export async function GET() {
  try {
    const validation = await validateMuxCredentials()
    
    if (validation.isValid) {
      return NextResponse.json({
        success: true,
        message: 'MUX credentials are valid',
        data: validation.data
      })
    } else {
      return NextResponse.json({
        success: false,
        error: validation.error || 'Invalid MUX credentials'
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Error validating MUX credentials:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to validate MUX credentials'
    }, { status: 500 })
  }
}