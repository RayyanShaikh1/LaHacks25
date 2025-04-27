import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { X, BookOpen, Eye } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import QuizModal from "./QuizModal";

const StudyChat = ({ topic, groupId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState(null);
  const { authUser, socket } = useAuthStore();

  // Fetch chat history on open, or initialize Gemini agent if no messages
  useEffect(() => {
    const fetchOrInit = async () => {
      try {
        const res = await axiosInstance.get(`/study-session/chat/history?groupId=${groupId}&topic=${encodeURIComponent(topic)}`);
        if (res.data.messages && res.data.messages.length > 0) {
          setMessages(res.data.messages);
          setQuiz(res.data.quiz);
        } else {
          // No messages, initialize Gemini agent and get lesson
          setIsLoading(true);
          const initRes = await axiosInstance.post(`/study-session/chat/init`, { groupId, topic });
          setMessages(initRes.data.messages);
          setQuiz(initRes.data.quiz);
          setIsLoading(false);
        }
      } catch (error) {
        setMessages([]);
        setIsLoading(false);
      }
    };
    if (groupId && topic) fetchOrInit();
  }, [groupId, topic]);

  // Real-time updates: join/leave room and listen for new messages
  useEffect(() => {
    if (socket && groupId && topic) {
      socket.emit("joinStudyChat", { groupId, topic });
      socket.on("newStudyChatMessages", (newMessages) => {
        setMessages((prev) => [...prev, ...newMessages]);
      });
    }
    return () => {
      if (socket && groupId && topic) {
        socket.emit("leaveStudyChat", { groupId, topic });
        socket.off("newStudyChatMessages");
      }
    };
  }, [socket, groupId, topic]);

  // Determine if the current user has completed the quiz
  const userQuizResponse = quiz?.responses?.find(
    (resp) => resp.user === authUser._id || resp.user?._id === authUser._id
  );
  const hasCompletedQuiz = !!userQuizResponse;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      await axiosInstance.post("/study-session/chat", {
        topic,
        message,
        history: messages,
        groupId
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, { 
        role: "system", 
        content: "Sorry, there was an error processing your message." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle opening the quiz modal for review
  const handleReviewQuiz = () => {
    setReviewAnswers(userQuizResponse?.answers || []);
    setShowQuiz(true);
  };

  // Handle opening the quiz modal for taking the quiz
  const handleTakeQuiz = () => {
    setReviewAnswers(null);
    setShowQuiz(true);
  };

  // Handle quiz completion in real time
  const handleQuizCompleted = (answers) => {
    if (!quiz) return;
    const userId = authUser._id;
    // Remove any previous response from this user
    const updatedResponses = (quiz.responses || []).filter(r => (r.user === userId || r.user?._id === userId) === false);
    // Add new response
    updatedResponses.push({ user: userId, answers, completed: true });
    setQuiz({ ...quiz, responses: updatedResponses });
  };

  return (
    <div className="flex flex-col h-full bg-neutral-800 border-l border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-200">{topic}</h3>
        <div className="flex items-center gap-2">
          {quiz && !hasCompletedQuiz && (
            <button
              onClick={handleTakeQuiz}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white 
                       hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <BookOpen size={16} />
              Take Quiz
            </button>
          )}
          {quiz && hasCompletedQuiz && (
            <button
              onClick={handleReviewQuiz}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 text-white 
                       hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Eye size={16} />
              Review Quiz
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white" 
                  : msg.role === "system"
                  ? "bg-red-600 text-white"
                  : "bg-neutral-700 text-neutral-200"
              }`}
            >
              {/* Show sender name if available and not assistant/system */}
              {msg.role === "user" && msg.sender && msg.sender.name && (
                <div className="text-xs font-semibold mb-1 text-blue-200">{msg.sender.name}</div>
              )}
              {msg.role === "assistant" && (
                <div className="text-xs font-semibold mb-1 text-green-200">Nexus AI</div>
              )}
              {/* Render markdown for all messages */}
              <MarkdownMessage content={msg.content} />
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-700 text-neutral-200 rounded-lg p-3">
              Thinking...
            </div>
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-neutral-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-neutral-700 text-neutral-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      {/* Quiz Modal */}
      {showQuiz && (
        <QuizModal 
          quiz={quiz}
          onClose={() => setShowQuiz(false)}
          groupId={groupId}
          topic={topic}
          initialAnswers={reviewAnswers}
          onQuizCompleted={handleQuizCompleted}
        />
      )}
    </div>
  );
};

export default StudyChat; 