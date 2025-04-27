import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { Trash2, Loader2, PenLine, Lightbulb, BarChart2, Eye } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MarkdownMessage from "./MarkdownMessage";
import GroupSidebar from "./GroupSidebar";
import StudySession from "./StudySession";

const ActionButton = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 px-6 py-4 rounded-xl bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 transition-all hover:scale-[1.02] active:scale-[0.98]"
  >
    <div className="p-2 rounded-lg bg-neutral-800">
      {icon}
    </div>
    <span className="text-lg font-medium text-neutral-200">{label}</span>
  </button>
);

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    getGroupMessages,
    selectedUser,
    selectedGroup,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage,
    getGroupedMessages,
    isMessagesLoading,
    isNexusThinking
  } = useChatStore();

  const { authUser, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
    } else if (selectedUser) {
      getMessages(selectedUser._id);
    }

    subscribeToMessages();

    // Listen for message deletion events
    const handleMessageDeleted = (messageId) => {
      useChatStore.setState((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
    };

    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      unsubscribeFromMessages();
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [
    selectedUser?._id,
    selectedGroup?._id,
    getMessages,
    getGroupMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    socket,
  ]);

  useEffect(() => {
    if (messageEndRef.current && messages) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Get grouped messages from the store
  const groupedMessages = getGroupedMessages();

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-neutral-850">
      <ChatHeader />
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto space-y-4 py-4">
            {isMessagesLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-2 text-neutral-400">
                  <Loader2 className="animate-spin" size={24} />
                  <p>Loading messages...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-neutral-400">
                {selectedGroup ? (
                  <>
                    <h2 className="text-2xl font-bold text-neutral-200 mb-8">Get Started</h2>
                    
                    {/* Action Buttons Grid */}
                    <div className="grid grid-cols-2 gap-4 max-w-2xl">
                      <ActionButton
                        icon={<PenLine className="w-5 h-5 text-purple-400" />}
                        label="How can I improve?"
                        onClick={() => {}}
                      />
                      <ActionButton
                        icon={<Lightbulb className="w-5 h-5 text-yellow-400" />}
                        label="What should I study?"
                        onClick={() => {}}
                      />
                      <ActionButton
                        icon={<BarChart2 className="w-5 h-5 text-blue-400" />}
                        label="Analyze my weaknesses"
                        onClick={() => {}}
                      />
                      <ActionButton
                        icon={<Eye className="w-5 h-5 text-green-400" />}
                        label="Analyze images or notes"
                        onClick={() => {}}
                      />
                    </div>
                    
                    <p className="text-sm mt-8">
                      Click the Layout icon in the top right to open the Study Session Overlay
                    </p>
                  </>
                ) : (
                  <p className="text-lg text-neutral-200">
                    Try @nexus to start a conversation
                  </p>
                )}
              </div>
            ) : (
              groupedMessages.map((group, groupIndex) => {
                const isLastGroup = groupIndex === groupedMessages.length - 1;

                return (
                  <div
                    key={group.messages[0]._id}
                    className="hover:bg-neutral-800/50 px-4 py-2"
                  >
                    {/* Discord-style layout with horizontal alignment of avatar, name and first message */}
                    <div className="flex items-start gap-3 w-full">
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 mt-0.5 border border-neutral-600">
                        <img
                          src={group.sender.profilePic || "/avatar.png"}
                          alt="profile pic"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Messages */}
                      <div className="flex-1 min-w-0">
                        {/* Sender name and timestamp */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-neutral-200">
                            {group.sender.name}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {formatMessageTime(group.date)}
                          </span>
                        </div>

                        {/* Message content */}
                        <div className="space-y-1">
                          {group.messages.map((message, messageIndex) => (
                            <div
                              key={message._id}
                              className="group relative"
                            >
                              {message.text && (
                                <div className="text-neutral-200 pr-8">
                                  <MarkdownMessage content={message.text} />
                                  {group.isCurrentUser && (
                                    <button
                                      onClick={() =>
                                        deleteMessage(message._id)
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded text-red-500 hover:text-red-400 flex items-center gap-1"
                                      title="Delete"
                                    >
                                      <span className="text-xs font-medium">
                                        Delete
                                      </span>
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                              {message.image && (
                                <div className="mt-2 pr-8">
                                  <img
                                    src={message.image}
                                    alt="Message attachment"
                                    className="max-w-[300px] rounded-lg border border-neutral-600"
                                  />
                                  {group.isCurrentUser && (
                                    <button
                                      onClick={() =>
                                        deleteMessage(message._id)
                                      }
                                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1 bg-red-500/10 hover:bg-red-500/20 rounded text-red-500 hover:text-red-400 flex items-center gap-1"
                                      title="Delete"
                                    >
                                      <span className="text-xs font-medium">
                                        Delete
                                      </span>
                                      <Trash2 size={14} />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            {isNexusThinking && (
              <div className="flex items-start gap-3 px-4 py-2">
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
            )}
          </div>
          <MessageInput />
        </div>
        <GroupSidebar />
        <StudySession />
      </div>
    </div>
  );
};

export default ChatContainer;
