import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Calendar, Shield, ArrowLeft, Upload } from "lucide-react";

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

const ProfileInfoItem = ({ icon, label, value }) => {
  return (
    <div className="flex items-center gap-3 mb-4 bg-white/5 p-4 rounded-xl border border-white/10">
      <div className="text-[#c8c8ff]">{icon}</div>
      <div>
        <div className="text-sm text-[#c8c8ff]/70">{label}</div>
        <div className="text-white font-medium">{value}</div>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile } = useAuthStore();
  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();

  // Handle image selection and conversion to base64, then update profile
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImg(base64Image); // Preview selected image
      await updateProfile({ profilePic: base64Image }); // Update profile picture
    };
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070738] via-[#090952] to-[#0a0a45] z-0" />
      
      {/* Animated stars */}
      <ParticleBackground />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Gradient accent */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#070738]/30 via-[#0a0a4d]/20 to-[#110a5e]/20 opacity-70 pointer-events-none" />
          
          {/* Content */}
          <div className="relative z-10 p-8">
            <div className="flex justify-between items-center mb-8">
              <motion.h1 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#c8c8ff] to-white"
              >
                Profile
              </motion.h1>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/")}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 text-white transition-all"
              >
                <ArrowLeft size={16} />
                <span>Back</span>
              </motion.button>
            </div>
            
            <div className="grid md:grid-cols-[250px_1fr] gap-8">
              {/* Profile Image Section */}
              <div className="flex flex-col items-center">
                <div className="relative mb-4 group">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white/20 shadow-lg">
                    <img
                      src={selectedImg || authUser.profilePic || "/avatar.png"}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#070738] hover:bg-[#0a0a45] rounded-full flex items-center justify-center cursor-pointer border-2 border-white/20 shadow-lg transition-all">
                    <Upload size={16} className="text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUpdatingProfile}
                      className="hidden"
                    />
                  </label>
                </div>
                
                <div className="text-center">
                  <p className="text-[#c8c8ff]/80 text-sm">
                    {isUpdatingProfile ? "Uploading..." : "Upload a new photo"}
                  </p>
                </div>
              </div>
              
              {/* User Information Section */}
              <div className="space-y-4">
                <ProfileInfoItem 
                  icon={<User size={20} />} 
                  label="Name" 
                  value={authUser?.name || "Not provided"} 
                />
                
                <ProfileInfoItem 
                  icon={<Mail size={20} />} 
                  label="Email" 
                  value={authUser?.email} 
                />
                
                <ProfileInfoItem 
                  icon={<Calendar size={20} />} 
                  label="Member Since" 
                  value={authUser.createdAt?.split("T")[0] || "Not available"} 
                />
                
                <ProfileInfoItem 
                  icon={<Shield size={20} />} 
                  label="Account Status" 
                  value="Active" 
                />
              </div>
            </div>
          </div>
          
          {/* Subtle glass highlights */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;