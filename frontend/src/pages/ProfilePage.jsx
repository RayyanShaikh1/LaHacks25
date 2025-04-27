import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, BookOpen, PenTool, ArrowLeft, Upload, Save, X, Plus, Trash2 } from "lucide-react";

const CoursesEditor = ({ courses, onUpdate, isLoading }) => {
  const [newCourse, setNewCourse] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleAddCourse = async () => {
    if (newCourse.trim() !== '') {
      const updatedCourses = [...courses, newCourse.trim()];
      await onUpdate(updatedCourses);
      setNewCourse('');
    }
  };

  const handleRemoveCourse = async (index) => {
    const updatedCourses = courses.filter((_, i) => i !== index);
    await onUpdate(updatedCourses);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={newCourse}
          onChange={(e) => setNewCourse(e.target.value)}
          placeholder="Add a new course"
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-white"
          disabled={isLoading}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddCourse}
          disabled={isLoading || !newCourse.trim()}
          className="p-1 rounded-lg bg-[#30336b] hover:bg-[#0a0a45] border border-white/10 disabled:opacity-50"
        >
          <Plus size={16} className="text-white" />
        </motion.button>
      </div>
      
      <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
        {courses.map((course, index) => (
          <div
            key={index}
            className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/10"
          >
            <span className="text-white break-words flex-1 min-w-0 pr-2">{course}</span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleRemoveCourse(index)}
              disabled={isLoading}
              className="p-1 rounded-lg bg-[#070738] hover:bg-[#0a0a45] border border-white/10 flex-shrink-0"
            >
              <Trash2 size={16} className="text-white" />
            </motion.button>
          </div>
        ))}
        {courses.length === 0 && (
          <div className="text-center text-white/70 py-2">
            No courses added yet
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileInfoItem = ({ icon, label, value, isEditable = false, onSave, isLoading }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedValue, setEditedValue] = useState(value);
  const [error, setError] = useState('');
  const textareaRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing && label === 'Biography') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [editedValue, isEditing, label]);

  const handleSave = async () => {
    if (isEditable) {
      // For biography, allow empty strings
      if (editedValue.trim() === '' && label === 'Biography') {
        await onSave('');
        setIsEditing(false);
        setError('');
      } else if (editedValue.trim() !== '') {
        await onSave(editedValue);
        setIsEditing(false);
        setError('');
      } else {
        setError('Please enter a value');
      }
    }
  };

  const handleCancel = () => {
    setEditedValue(value);
    setIsEditing(false);
    setError('');
  };

  return (
    <div className="flex items-start gap-3 mb-4 background bg-white/5 p-4 rounded-xl border border-white/10">
      <div className="text-white pt-1">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white/70">{label}</div>
        {isEditable && isEditing ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-2">
              {label === 'Biography' ? (
                <textarea
                  ref={textareaRef}
                  value={editedValue}
                  onChange={(e) => {
                    setEditedValue(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-white resize-none overflow-y-auto"
                  disabled={isLoading}
                  rows={1}
                />
              ) : (
                <input
                  type="text"
                  value={editedValue}
                  onChange={(e) => {
                    setEditedValue(e.target.value);
                    setError('');
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-white focus:outline-none focus:border-white"
                  disabled={isLoading}
                />
              )}
              <div className="flex gap-2 justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={isLoading}
                  className="p-1 rounded-lg bg-[#070738] hover:bg-[#0a0a45] border border-white/10"
                >
                  <Save size={16} className="text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="p-1 rounded-lg bg-[#070738] hover:bg-[#0a0a45] border border-white/10"
                >
                  <X size={16} className="text-white" />
                </motion.button>
              </div>
            </div>
            {error && <div className="text-red-400 text-sm">{error}</div>}
          </div>
        ) : (
          <div 
            className="text-white font-medium cursor-pointer hover:text-white transition-colors break-words whitespace-pre-wrap"
            onClick={() => isEditable && setIsEditing(true)}
          >
            {value || (label === 'Biography' ? 'Tell us about yourself...' : value)}
          </div>
        )}
      </div>
    </div>
  );
};

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
      className="relative backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-xl overflow-hidden w-full max-w-2xl"
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
      setSelectedImg(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleBiographySave = async (newBiography) => {
    await updateProfile({ biography: newBiography });
  };

  const handleCoursesUpdate = async (newCourses) => {
    await updateProfile({ courses: newCourses });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#070738] via-[#0a0a4d] to-[#0a0a45] z-0" />
      
      {/* Animated stars */}
      <ParticleBackground />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl px-4 py-10">
        <GlassCard>
          <div className="flex justify-between items-center mb-8">
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#c8c8ff] to-white"
            >
              Profile
            </motion.h1>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white transition-all"
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
                
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#30336b] hover:bg-[#0a0a45] rounded-full flex items-center justify-center cursor-pointer border-2 border-white/20 shadow-lg transition-all">
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
                <p className="text-[#c8c8ff] text-sm">
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
                isEditable={false}
                onSave={() => {}}
                isLoading={false}
              />
              
              <ProfileInfoItem 
                icon={<Mail size={20} />} 
                label="Email" 
                value={authUser?.email}
                isEditable={false}
                onSave={() => {}}
                isLoading={false}
              />
              
              <div className="flex items-center gap-3 mb-4 bg-white/10 p-4 rounded-xl border border-white/20">
                <div className="text-[#c8c8ff]"><BookOpen size={20} /></div>
                <div className="flex-1">
                  <div className="text-sm text-[#c8c8ff]">Courses</div>
                  <CoursesEditor 
                    courses={authUser?.courses || []}
                    onUpdate={handleCoursesUpdate}
                    isLoading={isUpdatingProfile}
                  />
                </div>
              </div>
              
              <ProfileInfoItem 
                icon={<PenTool size={20} />} 
                label="Biography" 
                value={authUser?.biography || "Tell us about yourself..."}
                isEditable={true}
                onSave={handleBiographySave}
                isLoading={isUpdatingProfile}
              />
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ProfilePage;