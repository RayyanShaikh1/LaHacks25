import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import {
  Users,
  UserPlus,
  MessageSquare,
  Hash,
  Plus,
  LogOut,
  User,
  Search,
  ChevronDown,
} from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";
import StartConversationModal from "./StartConversationModal";

const Sidebar = () => {
  const {
    getUsers,
    getGroups,
    users,
    groups,
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    subscribeToConversations,
  } = useChatStore();
  const { onlineUsers, authUser, logout } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showStartConversationModal, setShowStartConversationModal] =
    useState(false);
  const [activeTab, setActiveTab] = useState("groups");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    getUsers();
    getGroups();
    const unsubscribe = subscribeToConversations();
    return () => unsubscribe();
  }, [getUsers, getGroups, subscribeToConversations]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      searchTerm === "" ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase());
    return (
      matchesSearch && (showOnlineOnly ? onlineUsers.includes(user._id) : true)
    );
  });

  const filteredGroups = groups.filter(
    (group) =>
      searchTerm === "" ||
      group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-[#080840] flex flex-col h-full shadow-lg border-r border-white/10">
      {/* Logo and App Name */}
      <div className="px-4 py-5 flex items-center border-b border-white/10">
        <h1 className="text-lg font-semibold text-white">Nexus</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 pb-2">
        <button
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === "groups"
              ? "bg-[#070738] text-white font-medium"
              : "text-[#c8c8ff]/70 hover:bg-[#070738]/50"
          }`}
          onClick={() => setActiveTab("groups")}
        >
          <Hash size={16} />
          <span>Groups</span>
        </button>
        <div className="w-3"></div>
        <button
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === "direct"
              ? "bg-[#070738] text-white font-medium"
              : "text-[#c8c8ff]/70 hover:bg-[#070738]/50"
          }`}
          onClick={() => setActiveTab("direct")}
        >
          <MessageSquare size={16} />
          <span>Messages</span>
        </button>
      </div>

      {/* Search and Actions */}
      <div className="px-4 py-3">
        <div className="relative mb-3">
          <Search
            size={16}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#c8c8ff]/50"
          />
          <input
            type="text"
            placeholder="Search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#070738]/50 text-white rounded-lg px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-[#c8c8ff]/30 text-sm border border-white/10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#c8c8ff]/70 hover:text-white"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex items-center justify-between">
          {activeTab === "direct" && (
            <label className="flex items-center gap-2 text-sm text-[#c8c8ff]/70 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={showOnlineOnly}
                  onChange={() => setShowOnlineOnly(!showOnlineOnly)}
                  className="sr-only"
                />
                <div
                  className={`w-8 h-4 rounded-full transition-colors ${
                    showOnlineOnly ? "bg-[#070738]" : "bg-[#c8c8ff]/20"
                  }`}
                ></div>
                <div
                  className={`absolute top-0 left-0 w-4 h-4 rounded-full transition-transform transform ${
                    showOnlineOnly ? "translate-x-4 bg-white" : "bg-white"
                  }`}
                ></div>
              </div>
              <span>Online only</span>
            </label>
          )}
          <div className="ml-auto">
            {activeTab === "direct" && (
              <button
                className="p-2 rounded-lg bg-[#070738]/50 text-[#c8c8ff]/70 hover:text-white transition-colors"
                onClick={() => setShowStartConversationModal(true)}
              >
                <UserPlus size={16} />
              </button>
            )}
            {activeTab === "groups" && (
              <button
                className="p-2 rounded-lg bg-[#070738]/50 text-[#c8c8ff]/70 hover:text-white transition-colors"
                onClick={() => setShowCreateGroupModal(true)}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section Header */}
      <div className="px-4 pt-2 pb-1 flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider font-semibold text-[#c8c8ff]/50">
          {activeTab === "direct" ? "Conversations" : "Your Groups"}
        </h3>
        <ChevronDown size={14} className="text-[#c8c8ff]/50" />
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3">
        {activeTab === "direct" ? (
          <div className="py-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-3 text-[#c8c8ff]/70 text-sm bg-[#070738]/30 rounded-lg text-center">
                {searchTerm
                  ? "No matching conversations found"
                  : "No conversations yet"}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedUser?._id === user._id
                      ? "bg-[#070738]/70"
                      : "hover:bg-[#070738]/40"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-white/20"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#080840] ${
                        onlineUsers.includes(user._id)
                          ? "bg-green-500"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {user.name}
                    </h3>
                    <p className="text-xs text-[#c8c8ff]/70">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="py-2 space-y-1">
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-3 text-[#c8c8ff]/70 text-sm bg-[#070738]/30 rounded-lg text-center">
                {searchTerm
                  ? "No matching groups found"
                  : "No groups available"}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div
                  key={group._id}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedGroup?._id === group._id
                      ? "bg-[#070738]/70"
                      : "hover:bg-[#070738]/40"
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-[#070738] to-[#110a5e] flex items-center justify-center flex-shrink-0 border border-white/20">
                    {group.groupImage ? (
                      <img
                        src={group.groupImage}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Hash size={18} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {group.name}
                    </h3>
                    <p className="text-xs text-[#c8c8ff]/70">
                      {group.members.length}{" "}
                      {group.members.length === 1 ? "member" : "members"}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className="p-4 border-t border-white/10 mt-auto">
        <div className="flex items-center">
          {/* Profile button - 80% width */}
          <button
            className="flex items-center gap-3 flex-grow rounded-lg px-3 py-2 transition-colors text-[#c8c8ff]/70 hover:bg-[#070738]/50"
            onClick={() => (window.location.href = "/profile")}
            style={{ width: "80%" }}
          >
            <div className="relative">
              <img
                src={authUser?.profilePic || "/avatar.png"}
                alt={authUser?.name}
                className="w-10 h-10 rounded-full object-cover border border-white/20"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#080840] bg-green-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-medium text-white truncate text-left">
                {authUser?.name}
              </h3>
              <p className="text-xs text-[#c8c8ff]/70 text-left">Online</p>
            </div>
          </button>

          {/* Logout button - 20% width */}
          <button
            className="ml-2 px-3 py-2 h-14 rounded-lg text-[#c8c8ff]/70 hover:bg-[#070738]/50 transition-colors flex items-center justify-center"
            onClick={logout}
            style={{ width: "20%" }}
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
      <StartConversationModal
        isOpen={showStartConversationModal}
        onClose={() => setShowStartConversationModal(false)}
      />
    </div>
  );
};

export default Sidebar;
