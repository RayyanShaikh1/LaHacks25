import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef } from "react";
import { Trash2, Loader2 } from "lucide-react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import MarkdownMessage from "./MarkdownMessage";
import GroupSidebar from "./GroupSidebar";
import StudySession from "./StudySession";

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
    isMessagesLoading
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
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
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

                      {/* Content container */}
                      <div className="flex-1">
                        {/* Username and timestamp */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-neutral-200">
                            {group.sender.name}
                          </span>
                          <span className="text-xs text-neutral-400">
                            {formatMessageTime(group.messages[0].createdAt)}
                          </span>
                        </div>

                        {/* First message */}
                        <div className="ml-0 relative">
                          {group.messages[0].image && (
                            <div className="mb-1 max-w-lg rounded-md overflow-hidden border border-neutral-600">
                              <img
                                src={group.messages[0].image}
                                alt="Attachment"
                                className="max-w-full"
                              />
                            </div>
                          )}
                          {group.messages[0].text && (
                            <div
                              ref={
                                isLastGroup && group.messages.length === 1
                                  ? messageEndRef
                                  : null
                              }
                              className="text-neutral-200 group relative pr-8"
                            >
                              <MarkdownMessage content={group.messages[0].text} />
                              {group.isCurrentUser && (
                                <button
                                  onClick={() =>
                                    deleteMessage(group.messages[0]._id)
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

                        {/* Subsequent messages */}
                        {group.messages.length > 1 && (
                          <div className="space-y-1 mt-1">
                            {group.messages
                              .slice(1)
                              .map((message, messageIndex) => {
                                const isLastMessage =
                                  isLastGroup &&
                                  messageIndex === group.messages.length - 2;

                                return (
                                  <div
                                    key={message._id}
                                    ref={isLastMessage ? messageEndRef : null}
                                    className="ml-0 group relative"
                                  >
                                    {message.image && (
                                      <div className="mb-1 max-w-lg rounded-md overflow-hidden border border-neutral-600">
                                        <img
                                          src={message.image}
                                          alt="Attachment"
                                          className="max-w-full"
                                        />
                                      </div>
                                    )}
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
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
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
