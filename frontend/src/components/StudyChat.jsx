import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { X, BookOpen, Eye, Loader2 } from "lucide-react";
import MarkdownMessage from "./MarkdownMessage";
import QuizModal from "./QuizModal";

const StudyChat = ({ topic, groupId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [reviewAnswers, setReviewAnswers] = useState(null);
  const { authUser, socket } = useAuthStore();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll to bottom helper function
  const scrollToBottom = (behavior = 'smooth') => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  // Reset state when topic or groupId changes
  useEffect(() => {
    setMessages([]);
    setQuiz(null);
    setIsLoading(true);
  }, [topic, groupId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to bottom when chat is loaded
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom('instant');
    }
  }, [isLoading]);

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
          let retries = 0;
          const maxRetries = 5;
          while (retries < maxRetries) {
            try {
              const initRes = await axiosInstance.post(`/study-session/chat/init`, { groupId, topic });
              if (initRes.data.alreadyInitialized) {
                setMessages(initRes.data.messages);
                setQuiz(initRes.data.quiz);
                break;
              } else {
                setMessages(initRes.data.messages);
                setQuiz(initRes.data.quiz);
                break;
              }
            } catch (error) {
              if (error.response?.status === 409) {
                // Chat initialization in progress, wait and retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                retries++;
                if (retries === maxRetries) {
                  setMessages([{ 
                    role: "system", 
                    content: "Failed to initialize chat after multiple attempts. Please try again." 
                  }]);
                }
              } else {
                throw error;
              }
            }
          }
        }
      } catch (error) {
        setMessages([{ 
          role: "system", 
          content: "Sorry, there was an error loading the chat." 
        }]);
      } finally {
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
        scrollToBottom();
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
      scrollToBottom();
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

  const handleRetakeQuiz = () => {
    setReviewAnswers(null);
    setShowQuiz(true);
  };

  return (
    <div className="flex flex-col h-full min-h-0 w-full bg-neutral-800 border-l border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-neutral-700 shrink-0">
        <div className="min-w-0 flex-1 mr-2">
          <h3 className="text-base sm:text-lg font-semibold text-neutral-200 truncate">{topic}</h3>
          <p className="text-xs sm:text-sm text-neutral-400">Study Session</p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {quiz && !hasCompletedQuiz && (
            <button
              onClick={handleTakeQuiz}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-600 text-white 
                       hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              <BookOpen size={14} className="hidden sm:block" />
              Take Quiz
            </button>
          )}
          {quiz && hasCompletedQuiz && (
            <>
              <button
                onClick={handleReviewQuiz}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-green-600 text-white 
                         hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                <Eye size={14} className="hidden sm:block" />
                Review
              </button>
              <button
                onClick={handleRetakeQuiz}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-blue-600 text-white 
                         hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
              >
                <BookOpen size={14} className="hidden sm:block" />
                Retake
              </button>
            </>
          )}
          <button 
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0"
      >
        {messages.map((msg, i) => (
          <div 
            key={i} 
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div 
              className={`max-w-[85%] sm:max-w-[80%] rounded-lg p-2 sm:p-3 ${
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
                <div className="font-bold mb-1 text-white">Nexus AI</div>
              )}
              <div className="text-sm sm:text-base">
                <MarkdownMessage content={msg.content} />
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-neutral-700 text-neutral-200 rounded-lg p-2 sm:p-3 flex items-center gap-2">
              <Loader2 className="animate-spin" size={14} />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-3 sm:p-4 border-t border-neutral-700 shrink-0">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 bg-neutral-700 text-neutral-200 rounded-lg px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#7142dd52]"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputMessage.trim()}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#7142dd52] text-neutral-200 rounded-lg hover:bg-[#7142dd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm sm:text-base"
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