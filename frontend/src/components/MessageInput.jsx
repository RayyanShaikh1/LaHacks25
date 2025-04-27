import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Send, Paperclip } from "lucide-react";
import { showError } from "../utils/errorHandler";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;
  
    // Store the message content before clearing
    const messageText = text.trim();
    const messageImage = imagePreview;
  
    // Clear form immediately
    setText("");
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  
    try {
      await sendMessage({
        text: messageText,
        image: messageImage,
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      // Optionally show error message
      showError("Failed to send message");
    }
  };

  return (
    <div className="px-4 py-3 bg-neutral-800 border-t border-neutral-700">
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-20 h-20 object-cover rounded-md border border-neutral-600"
            />
            <button
              onClick={removeImage}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-neutral-800 
              flex items-center justify-center text-neutral-200 hover:bg-neutral-700 border border-neutral-600"
              type="button"
            >
              <Send className="size-3 rotate-45" />
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-neutral-700/50 rounded-lg px-3 py-2 border border-neutral-600">
          <button
            type="button"
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip size={20} />
          </button>
          <input
            type="text"
            className="flex-1 bg-transparent text-neutral-200 placeholder-neutral-400 focus:outline-none"
            placeholder="Message"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleImageChange}
          />
        </div>
        <button
          type="submit"
          className="p-2 rounded-full bg-[#7142dd52] text-neutral-200 hover:bg-[#7142dd] transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-neutral-600"
          disabled={!text.trim() && !imagePreview}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
