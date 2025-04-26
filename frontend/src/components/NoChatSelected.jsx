import { useState, useEffect } from "react";

// Animated background particles component
const ParticleBackground = () => {
  useEffect(() => {
    // Simple stars animation
    const canvas = document.getElementById("stars-canvas");
    // Make sure we have a canvas element
    if (!(canvas instanceof HTMLCanvasElement)) return;
    
    const ctx = canvas.getContext("2d");
    let particles = [];
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    
    // Create particles
    const createParticles = () => {
      particles = [];
      const particleCount = 100;
      
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          speed: 0.05 + Math.random() * 0.1,
          opacity: 0.1 + Math.random() * 0.5,
        });
      }
    };
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(p => {
        p.y -= p.speed;
        if (p.y < -5) p.y = canvas.height + 5;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        ctx.fill();
      });
      
      requestAnimationFrame(animate);
    };
    
    createParticles();
    animate();
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);
  
  return <canvas id="stars-canvas" className="absolute inset-0 z-0" />;
};

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070738] via-[#090952] to-[#0a0a45] z-0" />
      
      {/* Animated stars */}
      <ParticleBackground />
      
      <div className="relative z-10 text-center">
        {/* Welcome Text */}
        <h2 className="text-2xl font-bold text-white">Welcome to Nexus!</h2>
        <p className="text-[#c8c8ff] mt-2">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;