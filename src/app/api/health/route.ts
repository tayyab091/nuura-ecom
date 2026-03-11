import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    brand: 'Nuura',
    timestamp: new Date().toISOString(),
  })
}
