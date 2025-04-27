import { useState } from "react";
import { showError, showSuccess } from "../utils/errorHandler";
import { useChatStore } from "../store/useChatStore";
import { X, UserPlus } from "lucide-react";

const StartConversationModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const { startConversation } = useChatStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      showError("Please enter an email address");
      return;
    }

    try {
      await startConversation(email);
      showSuccess("Conversation started successfully");
      onClose();
    } catch (error) {
      showError(error.response?.data?.message || "Failed to start conversation");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg w-full max-w-md p-6 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Start a Conversation
          </h2>
          <button
            onClick={onClose}
            className="text-[#c8c8ff]/70 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#c8c8ff] mb-2">
              Enter User's Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8c8ff] border border-white/20"
              placeholder="user@example.com"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#c8c8ff] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-[#0a0a45] text-white rounded-md transition-colors border border-white/20"
            >
              Start Conversation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartConversationModal;
