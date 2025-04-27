import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { Upload, Loader2 } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import LessonTree from "./LessonTree";
import StudyChat from "./StudyChat";

const StudySession = () => {
  const { isOverlayOpen, selectedGroup } = useChatStore();
  const [isUploading, setIsUploading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loadingLesson, setLoadingLesson] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  // Fetch the lesson plan when the overlay opens or group changes
  useEffect(() => {
    const fetchLesson = async () => {
      if (isOverlayOpen && selectedGroup) {
        setLoadingLesson(true);
        setError(null);
        try {
          const res = await axiosInstance.get(`/study-session/${selectedGroup._id}/lesson`);
          setLessonPlan(res.data.lessonPlan);
        } catch (err) {
          setError("Failed to load study session lesson plan.");
        } finally {
          setLoadingLesson(false);
        }
      } else {
        setLessonPlan(null);
        setActiveChat(null);
      }
    };
    fetchLesson();
  }, [isOverlayOpen, selectedGroup]);

  if (!isOverlayOpen) return null;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    // Check if all files are PDFs
    const nonPdfFiles = files.filter(file => file.type !== "application/pdf");
    if (nonPdfFiles.length > 0) {
      setError("Please upload only PDF files");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      files.forEach(file => {
        formData.append("files", file);
      });

      const response = await axiosInstance.post(
        `/study-session/${selectedGroup._id}/process`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setLessonPlan(response.data.lessonPlan);
    } catch (error) {
      setError(error.response?.data?.error || "Failed to process files");
    } finally {
      setIsUploading(false);
    }
  };

  const handleNodeClick = (node) => {
    setActiveChat({
      topic: node.data.label,
      type: node.data.type
    });
  };

  return (
    <div className="absolute inset-0 bg-[#171717] z-50">
      {/* Main container with responsive layout */}
      <div className="relative h-full flex flex-col md:flex-row">
        {/* Left panel - Lesson Tree */}
        <div className={`flex-1 flex flex-col border-r border-neutral-700 ${activeChat ? 'md:w-1/2 md:flex-1' : 'w-full'}`}>
          {/* Header */}
          <div className="p-4 border-b border-neutral-700">
            <h2 className="text-lg font-semibold text-neutral-200 py-0.5">Study Session</h2>
          </div>
          
          {/* Content */}
          <div className="p-4 flex-1">
            {!lessonPlan ? (
              <div className="mt-4">
                <label className="flex items-center gap-2 p-3 rounded-lg bg-neutral-700/30 text-neutral-200 hover:bg-neutral-700/50 hover:text-white transition-colors cursor-pointer border border-neutral-600">
                  {isUploading ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Upload size={18} />
                  )}
                  <span>{isUploading ? "Processing..." : "Upload PDF"}</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf"
                    multiple
                    disabled={isUploading}
                  />
                </label>
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <LessonTree 
                  lessonJson={lessonPlan} 
                  onNodeClick={handleNodeClick}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Study Chat */}
        {activeChat && (
          <div className="absolute md:relative inset-0 md:inset-auto md:flex-1 bg-[#171717] z-20">
            <StudyChat 
              topic={activeChat.topic}
              groupId={selectedGroup?._id}
              onClose={() => setActiveChat(null)}
            />
          </div>
        )}

        {/* Welcome message when no chat is active */}
        {!activeChat && (
          <div className="hidden md:flex md:w-1/2 items-center justify-center text-neutral-400">
            Select a topic to start studying
          </div>
        )}

        {/* Subtle glass highlights */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
};

export default StudySession; 