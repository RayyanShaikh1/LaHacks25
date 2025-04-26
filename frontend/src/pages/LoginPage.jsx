import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Key, LogIn } from "lucide-react";

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
  // Local state to store form input values
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Access login function and loading state from auth store
  const { login, isLoggingIn } = useAuthStore();

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    login(formData); // Call the login function with form data
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070738] via-[#090952] to-[#0a0a45] z-0" />
      
      {/* Animated stars */}
      <ParticleBackground />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <GlassCard>
          {/* Logo/App branding could go here */}
          <div className="mb-6 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#c8c8ff] to-white"
            >
              Login
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[#c8c8ff] mt-2"
            >
              Enter your email below to log in to your account
            </motion.p>
          </div>
          
          {/* Login form */}
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
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
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoggingIn}
              type="submit"
              className="w-full py-4 mt-2 bg-gradient-to-r from-[#070738] to-[#110a5e] hover:from-[#0a0a45] hover:to-[#150c70] rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70"
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
            </motion.button>
          </motion.form>
          
          {/* Divider */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center my-6"
          >
            <div className="flex-grow border-t border-white/10"></div>
            <span className="mx-4 text-[#c8c8ff] text-sm">or continue with</span>
            <div className="flex-grow border-t border-white/10"></div>
          </motion.div>
          
          {/* Alternative login options */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-2 gap-4"
          >
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
          </motion.div>
          
          {/* Sign up link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 text-center"
          >
            <p className="text-[#c8c8ff]">
              Don't have an account?{" "}
              <Link to="/signup" className="text-white hover:text-[#a0a0ff] font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </motion.div>
        </GlassCard>
      </div>
    </div>
  );
};

export default LoginPage;