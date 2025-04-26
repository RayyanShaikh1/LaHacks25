import { create } from "zustand";
import toast from "react-hot-toast";
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

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/message/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
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
      toast.error(error.response.data.message);
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
        res = await axiosInstance.post(`/group/${selectedGroup._id}/messages`, {
          ...messageData,
          groupId: selectedGroup._id,
        });
        const enrichedMessage = {
          ...res.data,
          senderId: {
            _id: authUser._id,
            name: authUser.name,
            profilePic: authUser.profilePic,
          },
        };
        set({ messages: [...messages, enrichedMessage] });
      } else {
        res = await axiosInstance.post(
          `/message/send/${selectedUser._id}`,
          messageData
        );
        set({ messages: [...messages, res.data] });
      }
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/group/create", groupData);
      set((state) => ({ groups: [...state.groups, res.data] }));
      toast.success("Group created successfully");
      return res.data;
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  addGroupMembers: async (groupId, newMembers) => {
    try {
      const res = await axiosInstance.post(`/group/${groupId}/members/add`, {
        newMembers,
      });
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
      }));
      toast.success("Members added successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  removeGroupMembers: async (groupId, membersToRemove) => {
    try {
      const res = await axiosInstance.post(`/group/${groupId}/members/remove`, {
        membersToRemove,
      });
      set((state) => ({
        groups: state.groups.map((group) =>
          group._id === groupId ? res.data : group
        ),
      }));
      toast.success("Members removed successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const { selectedUser, selectedGroup } = get();
    if (!selectedUser && !selectedGroup) return;

    const socket = useAuthStore.getState().socket;

    socket.on("newMessage", (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        set({
          messages: [...get().messages, newMessage],
        });
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
        set({
          messages: [...get().messages, messageWithSender],
        });
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
      toast.success("Message deleted successfully");
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser, selectedGroup: null }),
  setSelectedGroup: (selectedGroup) =>
    set({ selectedGroup, selectedUser: null }),

  getGroupedMessages: () => {
    const { messages, selectedUser, selectedGroup } = get();
    const { authUser } = useAuthStore.getState();

    if (!messages.length) return [];

    const getMessageSender = (message) => {
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
}));
