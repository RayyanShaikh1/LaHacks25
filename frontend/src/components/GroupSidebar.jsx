import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { BookOpen, Trophy } from "lucide-react";

const GroupSidebar = () => {
  const { isSidebarOpen, selectedGroup } = useChatStore();
  const { authUser } = useAuthStore();
  const [skills, setSkills] = useState([]);

  useEffect(() => {
    const fetchSkills = async () => {
      if (!selectedGroup) return;
      try {
        const res = await axiosInstance.get(`/study-session/skills/${selectedGroup._id}`);
        setSkills(res.data);
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };
    fetchSkills();
  }, [selectedGroup]);

  if (!isSidebarOpen) return null;

  return (
    <div className="w-80 bg-neutral-800 h-full border-l border-neutral-700 shadow-lg">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-neutral-200">Skills Progress</h2>
        
        {/* Skills Section */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-yellow-500" />
            <h3 className="text-md font-medium text-neutral-200">Topics</h3>
          </div>
          
          {skills.length === 0 ? (
            <p className="text-sm text-neutral-400">No quiz data available yet</p>
          ) : (
            <div className="space-y-4">
              {skills.map((skill) => (
                <div key={skill.topic} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-neutral-200">{skill.topic}</span>
                    <span className="text-sm text-neutral-400">{skill.score}%</span>
                  </div>
                  <div className="w-full bg-neutral-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupSidebar; 