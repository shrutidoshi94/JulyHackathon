import { NextRequest, NextResponse } from 'next/server';
import { fetchDestinationImage } from '@/lib/unsplash-client';

export async function GET(req: NextRequest) {
  const destination = req.nextUrl.searchParams.get('q') || 'travel';
  const image = await fetchDestinationImage(destination);
  return NextResponse.json(image);
}
