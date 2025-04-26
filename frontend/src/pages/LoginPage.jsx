import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Key, LogIn } from "lucide-react";

// Animated background particles component
const ParticleBackground = () => {
  useEffect(() => {
    const canvas = document.getElementById("stars-canvas");
    if (!(canvas instanceof HTMLCanvasElement)) return;
    
    const ctx = canvas.getContext("2d");
    let stars = [];
    let shootingStars = [];
    let lastShootingStarTime = 0;
    
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    
    // Create stars
    const createStars = () => {
      stars = [];
      const starCount = 200;
      
      for (let i = 0; i < starCount; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          opacity: 0.2 + Math.random() * 0.3,
          twinkleSpeed: 0.02 + Math.random() * 0.03,
          twinkleDirection: Math.random() > 0.5 ? 1 : -1,
        });
      }
    };
    
    // Create a shooting star
    const createShootingStar = () => {
      const now = Date.now();
      if (now - lastShootingStarTime < 3000) return;
      
      lastShootingStarTime = now;
      shootingStars.push({
        x: -10,
        y: Math.random() * canvas.height,
        length: 50 + Math.random() * 100,
        speed: 8 + Math.random() * 4,
        opacity: 1,
        angle: Math.random() * Math.PI / 8 - Math.PI / 16,
      });
    };
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Update and draw stars
      stars.forEach(star => {
        // Twinkle effect
        star.opacity += star.twinkleSpeed * star.twinkleDirection;
        if (star.opacity > 0.5) star.twinkleDirection = -1;
        if (star.opacity < 0.2) star.twinkleDirection = 1;
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });
      
      // Update and draw shooting stars
      shootingStars = shootingStars.filter(star => {
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;
        star.opacity -= 0.02;
        
        if (star.opacity <= 0 || star.x > canvas.width + 10) return false;
        
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(
          star.x - Math.cos(star.angle) * star.length,
          star.y - Math.sin(star.angle) * star.length
        );
        ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        return true;
      });
      
      // Randomly create new shooting stars
      if (Math.random() < 0.01) {
        createShootingStar();
      }
      
      requestAnimationFrame(animate);
    };
    
    createStars();
    animate();
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);
  
  return <canvas id="stars-canvas" className="absolute inset-0 z-0" />;
};

// Glassmorphism card component
const GlassCard = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden w-full max-w-md"
    >
      {/* Gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070738]/30 via-[#0a0a4d]/20 to-[#110a5e]/20 opacity-70 pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 p-8">{children}</div>
      
      {/* Subtle glass highlights */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </motion.div>
  );
};

// Modern form field with animations
const FormField = ({ type, icon, placeholder, value, onChange, name }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const actualType = type === "password" && showPassword ? "text" : type;
  
  return (
    <div className={`flex items-center bg-white/10 rounded-xl border overflow-hidden transition-all duration-200 ${
      isFocused ? "border-[#070738] shadow-sm shadow-[#070738]/20" : "border-white/20"
    }`}>
      <div className="flex items-center justify-center w-12 text-[#c8c8ff]">
        {icon}
      </div>
      <div className="flex-1 relative">
        <motion.input
          whileTap={{ scale: 0.995 }}
          type={actualType}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full px-3 py-4 bg-transparent text-white placeholder-[#c8c8ff]/60 outline-none"
        />
        {type === "password" && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c8c8ff] hover:text-white transition"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

// Social login button
const SocialButton = ({ icon, label, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/15 transition-all"
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
};

// Main login page component
const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const { login, isLoggingIn } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-900">
      <div className="w-full max-w-md px-4">
        <div className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden w-full">
          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-4xl h-11 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#c8c8ff] to-white">
                Login
              </h1>
              <p className="text-neutral-400 mt-2">
                Enter your email below to log in to your account
              </p>
            </div>
            
            {/* Login form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField 
                type="email"
                name="email"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              
              <FormField 
                type="password"
                name="password"
                icon={<Key size={20} />}
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              
              <button
                disabled={isLoggingIn}
                type="submit"
                className="w-full py-4 mt-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70"
              >
                {isLoggingIn ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Logging in...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>Login</span>
                  </>
                )}
              </button>
            </form>
            
            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-grow border-t border-neutral-700"></div>
              <span className="mx-4 text-neutral-400 text-sm">or</span>
              <div className="flex-grow border-t border-neutral-700"></div>
            </div>
            
            {/* Alternative login options */}
            <div className="grid grid-cols-2 gap-4">
              <SocialButton 
                icon={<Key size={18} />}
                label="SSO"
                onClick={() => {/* SSO login logic */}}
              />
              
              <SocialButton 
                icon={
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                }
                label="Google"
                onClick={() => {/* Google login logic */}}
              />
            </div>
            
            {/* Sign up link */}
            <div className="mt-8 text-center">
              <p className="text-neutral-400">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#c8c8ff] hover:text-[#a0a0ff] font-medium transition-colors">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;