import { ImageResponse } from 'next/og';

export const alt = 'Bootcamp-Academy by Novenetech';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#070f1d',
          padding: 60,
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 24,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: '#0e9d6c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 44,
              fontWeight: 800,
            }}
          >
            N
          </div>
          <div style={{ color: '#ffffff', fontSize: 40, fontWeight: 700 }}>
            Bootcamp-Academy
          </div>
        </div>
        <div style={{ color: '#58e4a8', fontSize: 56, fontWeight: 800, textAlign: 'center' }}>
          De 0 à ton premier client digital
        </div>
      </div>
    ),
    size,
  );
}