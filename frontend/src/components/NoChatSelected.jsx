import { useState, useEffect } from "react";

// Dots overlay background component
const DotsOverlay = () => {
  useEffect(() => {
    const canvas = document.getElementById("dots-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    const drawDots = () => {
      const gridSize = 60; // Size of each grid cell
      const dotRadius = 1.5; // Fixed radius for all dots
      const dotOpacity = 0.15; // Fixed opacity for all dots
      
      // Calculate number of dots needed to cover the canvas
      const cols = Math.ceil(canvas.width / gridSize);
      const rows = Math.ceil(canvas.height / gridSize);
      
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw dots in a grid pattern
      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x = col * gridSize;
          const y = row * gridSize;
          
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(200, 200, 255, ${dotOpacity})`;
          ctx.fill();
        }
      }
    };

    const animate = () => {
      drawDots();
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return <canvas id="dots-canvas" className="absolute inset-0 z-0" />;
};

const AnimatedLetter = ({ letter, index }) => (
  <span
    className={`inline-block ${letter === ' ' ? 'mx-0.1' : ''} animate-letter`}
    style={{
      animationDelay: `${index * 0.1}s`,
    }}
  >
    {letter === ' ' ? '\u00A0' : letter}
  </span>
);

const NoChatSelected = () => {
  const welcomeText = "Welcome to nexus";

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-900 z-0" />
      
      {/* Dots overlay */}
      <DotsOverlay />
      
      <div className="relative z-10 text-center">
        {/* Welcome Text */}
        <style>
  {`
    @keyframes letter-wave {
      0%, 40%, 60%, 100% {
        transform: translateY(0);
        color: white;
      }
      50% {
        transform: translateY(-8px);
        color: #9b70ff52;
      }
    }
    .animate-letter {
      animation: letter-wave 6s ease infinite;
    }
  `}
</style>

        <h2 className="text-2xl font-bold text-neutral-200">
          {welcomeText.split('').map((letter, index) => (
            <AnimatedLetter key={index} letter={letter} index={index} />
          ))}
        </h2>
        <p className="text-neutral-400 mt-2">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
