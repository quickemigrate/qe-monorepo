import { useEffect, useRef, useCallback } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import createGlobe from 'cobe';

interface PulseMarker {
  id: string;
  location: [number, number];
  delay: number;
}

interface GlobePulseProps {
  markers?: PulseMarker[];
  className?: string;
  speed?: number;
}

const defaultMarkers: PulseMarker[] = [
  { id: 'pulse-madrid', location: [40.42, -3.7], delay: 0 },
  { id: 'pulse-mexico', location: [19.43, -99.13], delay: 0.3 },
  { id: 'pulse-bogota', location: [4.71, -74.07], delay: 0.6 },
  { id: 'pulse-lima', location: [-12.05, -77.04], delay: 0.9 },
  { id: 'pulse-buenosaires', location: [-34.61, -58.38], delay: 1.2 },
  { id: 'pulse-caracas', location: [10.48, -66.9], delay: 1.5 },
];

export function GlobePulse({
  markers = defaultMarkers,
  className = '',
  speed = 0.003,
}: GlobePulseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);

  const handlePointerDown = useCallback((e: ReactPointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    isPausedRef.current = true;
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi: (e.clientX - pointerInteracting.current.x) / 300,
          theta: (e.clientY - pointerInteracting.current.y) / 1000,
        };
      }
    };
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId: number;
    let phi = 0;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 2),
        width,
        height: width,
        phi: 0,
        theta: 0.25,
        dark: 1,
        diffuse: 1.4,
        mapSamples: 16000,
        mapBrightness: 8,
        baseColor: [0.35, 0.4, 0.38],
        markerColor: [0.145, 0.827, 0.4],
        glowColor: [0.05, 0.12, 0.08],
        markerElevation: 0,
        markers: markers.map((m) => ({ location: m.location, size: 0.03, id: m.id })),
        arcs: [],
        arcColor: [0.145, 0.827, 0.4],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.85,
      });

      function animate() {
        if (!isPausedRef.current) phi += speed;
        globe!.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.25 + thetaOffsetRef.current + dragOffset.current.theta,
        });
        animationId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => canvas && (canvas.style.opacity = '1'));
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (globe) globe.destroy();
    };
  }, [markers, speed]);

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <style>{`
        @keyframes pulse-expand {
          0% { transform: scaleX(0.3) scaleY(0.3); opacity: 0.8; }
          100% { transform: scaleX(1.5) scaleY(1.5); opacity: 0; }
        }
      `}</style>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          opacity: 0,
          transition: 'opacity 1.2s ease',
          borderRadius: '50%',
          touchAction: 'none',
        }}
      />
      {markers.map((m) => (
        <div
          key={m.id}
          style={{
            position: 'absolute',
            positionAnchor: `--cobe-${m.id}`,
            bottom: 'anchor(center)',
            left: 'anchor(center)',
            translate: '-50% 50%',
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none' as const,
            opacity: `var(--cobe-visible-${m.id}, 0)`,
            filter: `blur(calc((1 - var(--cobe-visible-${m.id}, 0)) * 8px))`,
            transition: 'opacity 0.4s, filter 0.4s',
          }}
        >
          <span
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid #25D366',
              borderRadius: '50%',
              opacity: 0,
              animation: `pulse-expand 2s ease-out infinite ${m.delay}s`,
            }}
          />
          <span
            style={{
              position: 'absolute',
              inset: 0,
              border: '2px solid #25D366',
              borderRadius: '50%',
              opacity: 0,
              animation: `pulse-expand 2s ease-out infinite ${m.delay + 0.5}s`,
            }}
          />
          <span
            style={{
              width: 10,
              height: 10,
              background: '#25D366',
              borderRadius: '50%',
              boxShadow: '0 0 0 3px #0b2014, 0 0 0 5px #25D366',
            }}
          />
        </div>
      ))}
    </div>
  );
}

export default GlobePulse;
