import { create } from "zustand";
import { showError, showSuccess } from "../utils/errorHandler";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  groups: [],
  selectedUser: null,
  selectedGroup: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isGroupsLoading: false,
  isSidebarOpen: false,
  isOverlayOpen: false,
  isSidebarCollapsed: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/conversations");
      // Filter out Nexus AI from both new and existing conversations
      const filteredUsers = res.data.filter((user) => user._id !== "nexusai");
      set((state) => {
        // Also filter out any existing Nexus AI conversations in the state
        const existingUsers = state.users.filter(
          (user) => user._id !== "nexusai"
        );
        return { users: filteredUsers };
      });
    } catch (error) {
      showError(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/group");
      set({ groups: res.data });
    } catch (error) {
      showError(error.response.data.message);
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/message/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      showError(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/group/${groupId}/messages`);
      set({ messages: res.data });
    } catch (error) {
      showError(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, selectedGroup, messages } = get();
    const { authUser } = useAuthStore.getState();
    try {
      let res;
      if (selectedGroup) {
        // First add the user's message to the state
        const userMessage = {
          ...messageData,
          senderId: {
            _id: authUser._id,
            name: authUser.name,
            profilePic: authUser.profilePic,
          },
          senderName: authUser.name,
          senderProfilePic: authUser.profilePic,
          groupId: selectedGroup._id,
          createdAt: new Date(),
          isAI: false,
        };
        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        // Then send the message to the server
        res = await axiosInstance.post(`/group/${selectedGroup._id}/messages`, {
          ...messageData,
          groupId: selectedGroup._id,
        });

        // Update the message with the server response data
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.senderId._id === authUser._id && !msg._id
              ? {
                  ...msg,
                  ...res.data,
                  senderId: {
                    _id: authUser._id,
                    name: authUser.name,
                    profilePic: authUser.profilePic,
                  },
                  senderName: authUser.name,
                  senderProfilePic: authUser.profilePic,
                }
              : msg
          ),
        }));
      } else {
        // First add the user's message to the state
        const userMessage = {
          ...messageData,
          senderId: authUser._id,
          receiverId: selectedUser._id,
          createdAt: new Date(),
          isAI: false,
        };
        set((state) => ({
          messages: [...state.messages, userMessage],
        }));

        // Then send the message to the server
        res = await axiosInstance.post(
          `/message/send/${selectedUser._id}`,
          messageData
        );

        // Update the message with the server response data
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.senderId === authUser._id && !msg._id
              ? { ...msg, ...res.data }
              : msg
          ),
        }));
      }
    } catch (error) {
      showError(error.response.data.message);
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/group/create", groupData);
      set((state) => ({ groups: [...state.groups, res.data] }));
      showSuccess("Group created successfully");
      return res.data;
    } catch (error) {
      showError(error.response.data.message);
      throw error;
    }
  },

  addGroupMembers: async (groupId, members) => {
    try {
      await axiosInstance.post(`/group/${groupId}/members`, { members });
      showSuccess("Members added successfully");
    } catch (error) {
      showError(error.response.data.message);
      throw error;
    }
  },

  removeGroupMembers: async (groupId, members) => {
    try {
      await axiosInstance.delete(`/group/${groupId}/members`, { data: { members } });
      showSuccess("Members removed successfully");
    } catch (error) {
      showError(error.response.data.message);
      throw error;
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, selectedGroup } = get();
    if (!selectedUser && !selectedGroup) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser) {
        // Handle both direct messages and AI responses
        const isAIMessage =
          newMessage.senderId === "nexusai" || newMessage.isAI;
        const isRelevantMessage =
          (newMessage.senderId === selectedUser._id ||
            newMessage.receiverId === selectedUser._id ||
            isAIMessage) &&
          (newMessage.senderId === selectedUser._id ||
            newMessage.receiverId === selectedUser._id ||
            selectedUser._id === "nexusai" ||
            newMessage.receiverId === useAuthStore.getState().authUser._id);

        if (isRelevantMessage) {
          const enrichedMessage = {
            ...newMessage,
            isAI: isAIMessage,
          };
          set((state) => ({
            messages: [...state.messages, enrichedMessage],
          }));
        }
      }
    });

    socket.on("newGroupMessage", (newMessage) => {
      if (selectedGroup && newMessage.groupId === selectedGroup._id) {
        const messageWithSender = {
          ...newMessage,
          senderId: {
            _id: newMessage.senderId,
            name: newMessage.senderName,
            profilePic: newMessage.senderProfilePic,
          },
        };
        set((state) => ({
          messages: [...state.messages, messageWithSender],
        }));
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    socket.off("newMessage");
    socket.off("newGroupMessage");
    socket.off("messageDeleted");
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/message/${messageId}`);
      set((state) => ({
        messages: state.messages.filter((msg) => msg._id !== messageId),
      }));
      showSuccess("Message deleted successfully");
    } catch (error) {
      showError(error.response.data.message);
      throw error;
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, selectedGroup: null }),
  setSelectedGroup: (selectedGroup) =>
    set({ selectedGroup, selectedUser: null }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleOverlay: () => set((state) => ({ isOverlayOpen: !state.isOverlayOpen })),
  toggleSidebarCollapse: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  getGroupedMessages: () => {
    const { messages, selectedUser, selectedGroup } = get();
    const { authUser } = useAuthStore.getState();

    if (!messages.length) return [];

    const getMessageSender = (message) => {
      if (message.isAI) {
        return {
          _id: "nexusai",
          name: "Nexus AI",
          profilePic: "https://www.gravatar.com/avatar/?d=mp",
        };
      }
      if (selectedGroup) {
        return message.senderId;
      }
      return message.senderId === authUser._id ? authUser : selectedUser;
    };

    const groupedMessages = [];

    messages.forEach((message, index) => {
      const sender = getMessageSender(message);
      const isCurrentUser = selectedGroup
        ? message.senderId._id === authUser._id
        : message.senderId === authUser._id;

      const previousMessage = messages[index - 1];
      const messageDate = new Date(message.createdAt).getTime();
      const previousMessageDate = previousMessage
        ? new Date(previousMessage.createdAt).getTime()
        : 0;
      const timeDiff = messageDate - previousMessageDate;

      const currentSenderId = selectedGroup
        ? message.senderId._id
        : message.senderId;
      const previousSenderId = previousMessage
        ? selectedGroup
          ? previousMessage.senderId._id
          : previousMessage.senderId
        : null;

      const shouldGroup =
        previousMessage &&
        previousSenderId === currentSenderId &&
        timeDiff < 5 * 60 * 1000;

      if (shouldGroup) {
        groupedMessages[groupedMessages.length - 1].messages.push(message);
      } else {
        groupedMessages.push({
          sender,
          isCurrentUser,
          messages: [message],
          date: new Date(message.createdAt),
        });
      }
    });

    return groupedMessages;
  },

  startConversation: async (email) => {
    try {
      const res = await axiosInstance.post("/message/start-conversation", {
        email,
      });
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  subscribeToConversations: () => {
    const socket = useAuthStore.getState().socket;

    socket.on("newConversation", ({ user, message }) => {
      set((state) => {
        // Check if user already exists in conversations and is not Nexus AI
        const userExists = state.users.some((u) => u._id === user._id);
        if (!userExists && user._id !== "nexusai") {
          return { users: [...state.users, user] };
        }
        return state;
      });
    });

    return () => {
      socket.off("newConversation");
    };
  },
}));
