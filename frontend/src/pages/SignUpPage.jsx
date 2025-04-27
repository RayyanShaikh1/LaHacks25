import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Key, User, Mail, UserPlus } from "lucide-react";

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

// Main signup page component
const SignUpPage = () => {
  // Local state to store form input values
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Access signup function and loading state from auth store
  const { signup, isSigningUp } = useAuthStore();

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    signup(formData); // Call the signup function with form data
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#340738] via-[#470952] to-[#0a0a45] z-0" />
      
      {/* Animated stars */}
      <ParticleBackground />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        <GlassCard>
          {/* Header */}
          <div className="mb-6 text-center">
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl h-11 font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#c8c8ff] to-white"
            >
              Sign Up
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[#c8c8ff] mt-2"
            >
              Create your account to get started
            </motion.p>
          </div>
          
          {/* Signup form */}
          <motion.form 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {/* Name field */}
            <FormField 
              type="text"
              name="name"
              icon={<User size={20} />}
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
            />
            
            {/* Email field */}
            <FormField 
              type="email"
              name="email"
              icon={<Mail size={20} />}
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
            />
            
            {/* Password field */}
            <FormField 
              type="password"
              name="password"
              icon={<Key size={20} />}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            
            {/* Submit button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSigningUp}
              type="submit"
              className="w-full py-4 mt-2 bg-gradient-to-r from-[#070738] to-[#110a5e] hover:from-[#0a0a45] hover:to-[#150c70] rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-70"
            >
              {isSigningUp ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  <span>Create Account</span>
                </>
              )}
            </motion.button>
          </motion.form>
          
          {/* Sign in link */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <p className="text-[#c8c8ff]">
              Already have an account?{" "}
              <Link to="/login" className="text-white hover:text-[#a0a0ff] font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </motion.div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SignUpPage;