import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { X, BookOpen, Eye, Loader2, AlertCircle } from "lucide-react";
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
  const [isSending, setIsSending] = useState(false);
  const [isNexusThinking, setIsNexusThinking] = useState(false);
  const [lastMessageWasForNexus, setLastMessageWasForNexus] = useState(false);
  const [error, setError] = useState(null);
  const errorTimeoutRef = useRef(null);

  // Clear error after a short time
  useEffect(() => {
    if (error) {
      // Clear any existing timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
      
      // Set a new timeout to clear the error after 3 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, 3000);
    }
    
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [error]);

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
        // Filter out any temporary messages that might be duplicates
        const filteredNewMessages = newMessages.filter(newMsg => 
          !messages.some(existingMsg => 
            existingMsg._id === newMsg._id || 
            (existingMsg._id && existingMsg._id.startsWith('temp-') && existingMsg.content === newMsg.content)
          )
        );
        
        if (filteredNewMessages.length > 0) {
          setMessages((prev) => [...prev, ...filteredNewMessages]);
          scrollToBottom();
          
          // Only hide Nexus thinking if the last message was for Nexus
          if (lastMessageWasForNexus) {
            setIsNexusThinking(false);
          }
        }
      });
    }
    return () => {
      if (socket && groupId && topic) {
        socket.emit("leaveStudyChat", { groupId, topic });
        socket.off("newStudyChatMessages");
      }
    };
  }, [socket, groupId, topic, messages, lastMessageWasForNexus]);


  // Determine if the current user has completed the quiz
  const userQuizResponse = quiz?.responses?.find(
    (resp) => resp.user === authUser._id || resp.user?._id === authUser._id
  );
  const hasCompletedQuiz = !!userQuizResponse;

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isSending) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);
    
    // Check if the message is for Nexus
    const isForNexus = message.toLowerCase().includes('@nexus');
    setLastMessageWasForNexus(isForNexus);
    
    // Only show Nexus thinking if the message is for Nexus
    if (isForNexus) {
      setIsNexusThinking(true);
    }
    
    // Create a temporary message object
    const tempMessage = {
      role: "user",
      content: message,
      sender: {
        name: authUser.name,
        _id: authUser._id
      },
      _id: `temp-${Date.now()}` // Temporary ID
    };
    
    // Add the message to the UI immediately
    setMessages(prev => [...prev, tempMessage]);
    
    // Scroll to the new message
    setTimeout(() => {
      scrollToBottom();
    }, 100);

    try {
      await axiosInstance.post("/study-session/chat", {
        topic,
        message,
        history: messages,
        groupId
      });
      // Server will handle adding the response via socket
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove the temporary message if there was an error
      setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      // Set error message instead of adding to chat
      setError("Sorry, there was an error processing your message.");
    } finally {
      setIsSending(false);
      // We'll set isNexusThinking to false when we receive the response via socket
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

  // Group messages by sender and date
  const getGroupedMessages = () => {
    if (!messages.length) return [];
    
    const grouped = [];
    let currentGroup = null;
    
    messages.forEach((message) => {
      // Skip system messages in grouping
      if (message.role === "system") {
        grouped.push({
          sender: { name: "System", profilePic: null },
          messages: [message],
          date: new Date(),
          isCurrentUser: false
        });
        return;
      }
      
      const isCurrentUser = message.role === "user";
      const senderName = isCurrentUser ? authUser.name : "Nexus AI";
      const senderProfilePic = isCurrentUser ? authUser.profilePic : "https://www.gravatar.com/avatar/?d=mp";
      
      // Create a new group if:
      // 1. No current group exists
      // 2. Current message is from a different sender
      if (!currentGroup || currentGroup.sender.name !== senderName) {
        currentGroup = {
          sender: { name: senderName, profilePic: senderProfilePic },
          messages: [message],
          date: new Date(),
          isCurrentUser
        };
        grouped.push(currentGroup);
      } else {
        // Add to existing group
        currentGroup.messages.push(message);
      }
    });
    
    return grouped;
  };

  return (
    <div className="flex flex-col h-full bg-neutral-850">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-neutral-600">
            <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
              <BookOpen size={16} className="text-neutral-200" />
            </div>
          </div>
          <div>
            <h3 className="font-medium text-neutral-200">{topic}</h3>
            <p className="text-xs text-neutral-400">Study Session</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
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
            className="p-2 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div 
          className="bg-red-900/80 text-white px-4 py-2 flex items-center justify-between cursor-pointer"
          onClick={() => setError(null)}
        >
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}
      
      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto space-y-4 py-4 px-4"
      >
        {getGroupedMessages().map((group, groupIndex) => (
          <div
            key={groupIndex}
            className="hover:bg-neutral-800/50 px-4 py-2 rounded-lg transition-colors"
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
                <div className="text-xs font-semibold mb-1 text-green-200">AI Assistant</div>
              )}
              <div className="text-sm sm:text-base">
                <MarkdownMessage content={msg.content} />
              </div>
            </div>
          </div>
        ))}
        
        {isNexusThinking && (
          <div className="hover:bg-neutral-800/50 px-4 py-2 rounded-lg transition-colors">
            <div className="flex items-start gap-3 w-full">
              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5 border border-neutral-600">
                <img
                  src="https://www.gravatar.com/avatar/?d=mp"
                  alt="Nexus AI"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-neutral-200">Nexus AI</span>
                </div>
                <div className="text-neutral-400 flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  <span>Nexus is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
      <div className="p-4 border-t border-neutral-700">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 min-w-0 bg-neutral-700 text-neutral-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7142dd52]"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !inputMessage.trim()}
            className="px-4 py-2 bg-[#7142dd52] text-neutral-200 rounded-lg hover:bg-[#7142dd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
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