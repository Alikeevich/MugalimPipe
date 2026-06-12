import { useEffect, useRef } from 'react';

interface SilkProps {
  speed?: number;
  scale?: number;
  color?: string;
  noiseIntensity?: number;
  rotation?: number;
}

export default function Silk({
  speed = 5,
  scale = 1,
  color = '#a83e3e',
  noiseIntensity = 1.5,
  rotation = 0,
}: SilkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      time += 0.01 * speed;
      
      if (!ctx || !canvas) return;
      
      const width = canvas.width;
      const height = canvas.height;
      
      ctx.clearRect(0, 0, width, height);
      
      // Parse color
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // Draw silk waves
      const waves = 5;
      for (let i = 0; i < waves; i++) {
        ctx.beginPath();
        
        const alpha = 0.1 + (i / waves) * 0.15;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 2;
        
        for (let x = 0; x < width; x += 5) {
          const y = height / 2 +
            Math.sin(x * 0.01 + time + i) * 50 * scale +
            Math.sin(x * 0.02 - time * 0.5 + i * 0.5) * 30 * scale +
            Math.sin(x * 0.005 + time * 0.3) * 100 * scale;
          
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }

      // Draw vertical waves
      for (let i = 0; i < waves; i++) {
        ctx.beginPath();
        
        const alpha = 0.08 + (i / waves) * 0.12;
        ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.lineWidth = 2;
        
        for (let y = 0; y < height; y += 5) {
          const x = width / 2 +
            Math.sin(y * 0.01 + time + i) * 50 * scale +
            Math.sin(y * 0.02 - time * 0.5 + i * 0.5) * 30 * scale;
          
          if (y === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [speed, scale, color, noiseIntensity, rotation]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
