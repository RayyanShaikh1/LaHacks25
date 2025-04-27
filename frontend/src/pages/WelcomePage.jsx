import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import nexusLogo from '../assets/nexus_logo.png';

// Animated background particles component
const ParticleBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById("stars-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    
    const ctx = canvas.getContext("2d");
    let particles = [];
    let animationFrameId;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
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
      
      particles.forEach(particle => {
        particle.y -= particle.speed;
        if (particle.y < -5) particle.y = canvas.height + 5;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });
      
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    createParticles();
    animate();
    
    // Cleanup function
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);
  
  return <canvas id="stars-canvas" className="absolute inset-0 z-0" />;
};

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070738] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#340738] via-[#470952] to-[#0a0a45] z-0" />
      
      {/* Animated stars */}
      <ParticleBackground />

      {/* Content wrapper */}
      <div className="relative z-10 w-full max-w-7xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side with text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          <h1 className="text-7xl md:text-8xl font-bold text-white tracking-tight">
            nexus
            <span className="text-[#c8c8ff]">.</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-lg leading-relaxed">
            Your AI-powered study companion. Transform the way you learn with 
            intelligent note-taking, collaborative study sessions, and 
            personalized learning paths.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/login")}
            className="bg-[#c8c8ff] hover:bg-[#a0a0ff] text-[#070738] px-8 py-4 
                     rounded-full font-semibold text-lg transition-colors 
                     shadow-lg shadow-[#c8c8ff]/20"
          >
            Get Started
          </motion.button>
        </motion.div>

        {/* Right side with logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hidden md:block"
        >
          <motion.img
            src={nexusLogo}
            alt="Nexus Logo"
            className="w-full h-[calc(100vh-8rem)] object-contain"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;