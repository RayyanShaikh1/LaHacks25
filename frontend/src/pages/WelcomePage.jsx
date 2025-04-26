import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import nexusLogo from '../assets/nexus_logo.png'; // Add this import

const WelcomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#070738] flex items-center justify-center p-4">
      <div className="w-full max-w-7xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side with logo and description */}
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
          {/* <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-[#c8c8ff]/20 
                          via-[#a0a0ff]/10 to-transparent rounded-2xl 
                          filter blur-3xl"></div>
            <div className="relative bg-white/10 border border-white/20 
                          backdrop-blur-xl rounded-2xl p-8 flex items-center justify-center"> */}
              <motion.img
                src={nexusLogo}
                alt="Nexus Logo"
                className="w-full h-full object-contain"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              />
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomePage;