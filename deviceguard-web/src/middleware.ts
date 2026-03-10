import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// CORS para permitir conexiones desde la app mobile
const ALLOWED_ORIGINS = [
  'http://localhost:3003',
  'http://82.29.62.125:3003',
  '*', // Permitir todas las origenes para la app mobile
];

export function middleware(request: NextRequest) {
  // Obtener el origen de la request
  const origin = request.headers.get('origin') ?? '*';
  
  // Crear respuesta CORS
  const response = NextResponse.next();
  
  // Setear headers CORS
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }
  
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
