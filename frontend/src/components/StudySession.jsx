import { useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Upload, Loader2 } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import MarkdownMessage from "./MarkdownMessage";

const StudySession = () => {
  const { isOverlayOpen, selectedGroup } = useChatStore();
  const [isUploading, setIsUploading] = useState(false);
  const [lessonPlan, setLessonPlan] = useState(null);
  const [error, setError] = useState(null);

  if (!isOverlayOpen) return null;

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check if file is a PDF
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

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
      setError(error.response?.data?.error || "Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#080840] z-10 flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-white">Study Session</h2>
        
        {!lessonPlan ? (
          <div className="mt-4">
            <label className="flex items-center gap-2 p-2 rounded-lg bg-[#070738] text-[#c8c8ff] hover:bg-[#070738]/80 hover:text-white transition-colors cursor-pointer">
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
                disabled={isUploading}
              />
            </label>
            {error && (
              <p className="mt-2 text-sm text-red-500">{error}</p>
            )}
          </div>
        ) : (
          <div className="mt-4 overflow-y-auto max-h-[calc(100vh-12rem)]">
            <div className="prose prose-invert max-w-none">
              <MarkdownMessage content={lessonPlan} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudySession; 