import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { BookOpen, Trophy, Users } from "lucide-react";

const GroupSidebar = () => {
  const { isSidebarOpen, selectedGroup } = useChatStore();
  const { authUser, socket } = useAuthStore();
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

  // Listen for real-time quiz completion updates
  useEffect(() => {
    if (!socket || !selectedGroup) return;

    console.log('Joining group room:', selectedGroup._id);
    // Join the group's room for real-time updates
    socket.emit('joinGroup', selectedGroup._id);

    // Listen for quiz completion events
    const handleQuizCompleted = (data) => {
      console.log('Received quizCompleted event:', data);
      setSkills(prevSkills => {
        const updatedSkills = prevSkills.map(skill => {
          if (skill.topic === data.topic) {
            console.log('Updating skill:', skill.topic);
            // Update or add the user's score for this topic
            const updatedUserScores = [...(skill.userScores || [])];
            const existingUserIndex = updatedUserScores.findIndex(
              userScore => userScore.user._id === data.user._id
            );

            if (existingUserIndex >= 0) {
              // Update existing user's score
              updatedUserScores[existingUserIndex] = {
                ...updatedUserScores[existingUserIndex],
                score: data.score
              };
            } else {
              // Add new user's score
              updatedUserScores.push({
                user: data.user,
                score: data.score
              });
            }

            return {
              ...skill,
              userScores: updatedUserScores
            };
          }
          return skill;
        });
        console.log('Updated skills:', updatedSkills);
        return updatedSkills;
      });
    };

    socket.on('quizCompleted', handleQuizCompleted);

    return () => {
      console.log('Leaving group room:', selectedGroup._id);
      socket.emit('leaveGroup', selectedGroup._id);
      socket.off('quizCompleted', handleQuizCompleted);
    };
  }, [socket, selectedGroup]);

  if (!isSidebarOpen) return null;

  return (
    <div className="w-80 bg-neutral-800 h-full border-l border-neutral-700 shadow-lg flex flex-col">
      <div className="p-4 border-b border-neutral-700">
        <h2 className="text-lg font-semibold text-neutral-200">Skills Progress</h2>
      </div>
      
      {/* Skills Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {skills.length === 0 ? (
            <p className="text-sm text-neutral-400">No quiz data available yet</p>
          ) : (
            <div className="space-y-6">
              {skills.map((skill) => (
                <div key={skill.topic} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-200">{skill.topic}</span>
                  </div>
                  
                  {/* Members' Progress */}
                  <div className="space-y-2">
                    {skill.userScores && skill.userScores.length > 0 ? (
                      skill.userScores.map((userScore) => (
                        <div key={userScore.user._id} className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full overflow-hidden">
                              <img
                                src={userScore.user.profilePic || "/avatar.png"}
                                alt={userScore.user.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs text-neutral-400">{userScore.user.name}</span>
                            <span className="text-xs text-neutral-400 ml-auto">{userScore.score}%</span>
                          </div>
                          <div className="pt-1">
                            <div className="w-full bg-neutral-700 rounded-full h-1.5">
                              <div 
                                className="bg-[#4e27a9fb] h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${userScore.score}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-neutral-400">No quiz responses yet</p>
                    )}
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