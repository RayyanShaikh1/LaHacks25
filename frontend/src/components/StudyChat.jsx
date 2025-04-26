import { useState, useEffect } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { X } from "lucide-react";

const StudyChat = ({ topic, groupId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const { authUser } = useAuthStore();

  // Fetch chat history on open
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axiosInstance.get(`/study-session/chat/history?groupId=${groupId}&topic=${encodeURIComponent(topic)}`);
        setMessages(res.data.messages);
      } catch (error) {
        setMessages([]);
      }
    };
    if (groupId && topic) fetchHistory();
  }, [groupId, topic]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const message = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      // Add user message immediately
      setMessages(prev => [...prev, { role: "user", content: message }]);

      // Send to backend
      const response = await axiosInstance.post("/study-session/chat", {
        topic,
        message,
        history: messages,
        groupId
      });

      // Add assistant response
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: response.data.message 
      }]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      setMessages(prev => [...prev, { 
        role: "system", 
        content: "Sorry, there was an error processing your message." 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-800 border-l border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-700">
        <h3 className="text-lg font-semibold text-neutral-200">{topic}</h3>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <X size={18} />
        </button>
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
              {msg.content}
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
    </div>
  );
};

export default StudyChat; 