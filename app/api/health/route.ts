import { NextResponse } from 'next/server';
import { qaSystem } from '../../../src/core/qa';

export async function GET() {
  try {
    const status = qaSystem.getSystemStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({ error: 'Health check failed' }, { status: 500 });
  }
}
