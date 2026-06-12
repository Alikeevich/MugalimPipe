import { useRef, useEffect } from 'react';

export default function DarkVeil({
  noiseIntensity = 0.15,
  scanlineIntensity = 0.1,
  scanlineFrequency = 0.3,
  speed = 0.3,
  warpAmount = 0.02
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
      if (!ctx || !canvas) return;

      timeRef.current += speed * 0.016;
      const time = timeRef.current;
      const width = canvas.width;
      const height = canvas.height;

      // Dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a0a0a');
      gradient.addColorStop(0.5, '#1a1a2e');
      gradient.addColorStop(1, '#0f0f1a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Subtle animated glow
      const glowGradient = ctx.createRadialGradient(
        width * 0.3, height * 0.4, 0,
        width * 0.3, height * 0.4, width * 0.5
      );
      glowGradient.addColorStop(0, 'rgba(255, 45, 85, 0.08)');
      glowGradient.addColorStop(1, 'rgba(255, 45, 85, 0)');
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);

      // Noise
      if (noiseIntensity > 0) {
        const imageData = ctx.createImageData(width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * noiseIntensity * 50;
          data[i] = noise;
          data[i + 1] = noise;
          data[i + 2] = noise;
          data[i + 3] = 25;
        }
        ctx.putImageData(imageData, 0, 0);
      }

      // Scanlines
      if (scanlineIntensity > 0) {
        ctx.fillStyle = `rgba(0, 0, 0, ${scanlineIntensity})`;
        for (let y = 0; y < height; y += Math.floor(scanlineFrequency * 10)) {
          const offset = Math.sin(time * 2 + y * 0.01) * 2;
          ctx.fillRect(0, y + offset, width, 1);
        }
      }

      // Subtle wave effect
      if (warpAmount > 0) {
        ctx.globalAlpha = warpAmount * 0.5;
        for (let i = 0; i < 5; i++) {
          const y = Math.sin(time * 0.3 + i * 0.8) * height * 0.15 + height * (0.3 + i * 0.15);
          const waveGradient = ctx.createLinearGradient(0, y - 30, 0, y + 30);
          waveGradient.addColorStop(0, 'rgba(255, 45, 85, 0)');
          waveGradient.addColorStop(0.5, `rgba(255, 45, 85, ${warpAmount * 0.2})`);
          waveGradient.addColorStop(1, 'rgba(255, 45, 85, 0)');
          ctx.fillStyle = waveGradient;
          ctx.fillRect(0, y - 30, width, 60);
        }
        ctx.globalAlpha = 1;
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [noiseIntensity, scanlineIntensity, scanlineFrequency, speed, warpAmount]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ mixBlendMode: 'normal' }}
    />
  );
}
