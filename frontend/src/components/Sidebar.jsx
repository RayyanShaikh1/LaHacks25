import { useEffect, useState, useRef } from "react";
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
  X,
  ChevronLeft,
  ChevronRight,
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
    sendMessage,
    isSidebarCollapsed,
    toggleSidebarCollapse,
  } = useChatStore();
  const { onlineUsers, authUser, logout } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showStartConversationModal, setShowStartConversationModal] =
    useState(false);
  const [activeTab, setActiveTab] = useState("groups");
  const [searchTerm, setSearchTerm] = useState("");
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

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
    <div className={`relative flex flex-col h-full shadow-lg border-r border-neutral-700 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-80'} bg-neutral-900/95`}>
      {/* Logo and App Name */}
      <div className={`px-4 ${isSidebarCollapsed ? 'py-8' : 'py-4.5'} flex items-center justify-center border-b border-neutral-700/50 relative bg-[#6f066f]/5`}>
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleSidebarCollapse}
          className="absolute right-4 p-1 rounded-full hover:bg-[#6f066f]/20 text-neutral-400 hover:text-neutral-200 transition-colors"
          style={{ top: "50%", transform: "translateY(-50%)" }}
        >
          {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
        <h1 className={`text-lg font-semibold text-neutral-200 ${isSidebarCollapsed ? 'hidden' : 'block'}`}>nexus</h1>
      </div>

      {/* Tabs */}
      <div className={`flex ${isSidebarCollapsed ? 'px-2 pt-4 pb-2 flex-col gap-2' : 'px-4 pt-4 pb-2 gap-2'}`}>
        <button
          className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${
            activeTab === "groups"
              ? "bg-[#6f066f]/20 text-neutral-200 font-medium"
              : "text-neutral-400 hover:bg-neutral-700/50"
          } ${isSidebarCollapsed ? 'w-full h-10' : ''}`}
          onClick={() => setActiveTab("groups")}
        >
          <div className={`flex items-center justify-center ${isSidebarCollapsed ? 'w-full' : ''}`}>
            <Hash size={isSidebarCollapsed ? 18 : 16} />
            {!isSidebarCollapsed && <span className="ml-2">Groups</span>}
          </div>
        </button>
        <button
          className={`flex-1 py-2 rounded-lg flex items-center justify-center transition-all ${
            activeTab === "direct"
              ? "bg-[#6f066f]/20 text-neutral-200 font-medium"
              : "text-neutral-400 hover:bg-neutral-700/50"
          } ${isSidebarCollapsed ? 'w-full h-10' : ''}`}
          onClick={() => setActiveTab("direct")}
        >
          <div className={`flex items-center justify-center ${isSidebarCollapsed ? 'w-full' : ''}`}>
            <MessageSquare size={isSidebarCollapsed ? 18 : 16} />
            {!isSidebarCollapsed && <span className="ml-2">Messages</span>}
          </div>
        </button>
      </div>

      {/* Search Bar */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-2 relative">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-700/50 text-neutral-200 rounded-lg px-3 py-2 pl-9 focus:outline-none focus:ring-2 focus:ring-[#6f066f]/30 text-sm border border-neutral-600"
              placeholder="Search..."
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 hover:text-neutral-200"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Online Toggle and Add Buttons */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            {activeTab === "direct" && (
              <label className="flex items-center gap-2 text-sm text-neutral-400 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={showOnlineOnly}
                    onChange={() => setShowOnlineOnly(!showOnlineOnly)}
                    className="sr-only"
                  />
                  <div
                    className={`w-8 h-4 rounded-full transition-colors ${
                      showOnlineOnly ? "bg-[#6f066f]/20" : "bg-neutral-600"
                    }`}
                  ></div>
                  <div
                    className={`absolute top-0 left-0 w-4 h-4 rounded-full transition-transform transform ${
                      showOnlineOnly ? "translate-x-4 bg-neutral-200" : "bg-neutral-200"
                    }`}
                  ></div>
                </div>
                <span>Online only</span>
              </label>
            )}
            <div className="ml-auto">
              {activeTab === "direct" && (
                <button
                  className="p-2 rounded-lg bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 transition-colors"
                  onClick={() => setShowStartConversationModal(true)}
                >
                  <UserPlus size={16} />
                </button>
              )}
              {activeTab === "groups" && (
                <button
                  className="p-2 rounded-lg bg-neutral-700/50 text-neutral-400 hover:text-neutral-200 transition-colors"
                  onClick={() => setShowCreateGroupModal(true)}
                >
                  <Plus size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section Header */}
      {!isSidebarCollapsed && (
        <div className="px-4 pt-2 pb-1 flex items-center justify-between">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-neutral-500">
            {activeTab === "direct" ? "Conversations" : "Your Groups"}
          </h3>
        </div>
      )}

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3">
        {activeTab === "direct" ? (
          <div className="py-2 space-y-1">
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-3 text-neutral-400 text-sm bg-neutral-700/30 rounded-lg text-center">
                {searchTerm
                  ? "No matching conversations found"
                  : "No conversations yet"}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-lg cursor-pointer ${
                    selectedUser?._id === user._id
                      ? "bg-[#6f066f]/20 text-neutral-200"
                      : "hover:bg-neutral-700/40"
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className={`${isSidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0 border border-neutral-600`}>
                    {user.profilePic ? (
                      <img
                        src={user.profilePic}
                        alt={user.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={isSidebarCollapsed ? 16 : 20} className="text-neutral-200" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-200 truncate">
                        {user.name}
                      </h3>
                      <p className="text-xs text-neutral-400 truncate">
                        {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="py-2 space-y-1">
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-3 text-neutral-400 text-sm bg-neutral-700/30 rounded-lg text-center">
                {searchTerm ? "No matching groups found" : "No groups yet"}
              </div>
            ) : (
              filteredGroups.map((group) => (
                <div
                  key={group._id}
                  className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-lg cursor-pointer ${
                    selectedGroup?._id === group._id
                      ? "bg-[#6f066f]/20"
                      : "hover:bg-neutral-700/40"
                  }`}
                  onClick={() => setSelectedGroup(group)}
                >
                  <div className={`${isSidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-lg overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0 border border-neutral-600`}>
                    {group.groupImage ? (
                      <img
                        src={group.groupImage}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Hash size={isSidebarCollapsed ? 16 : 20} className="text-neutral-200" />
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-neutral-200 truncate">
                        {group.name}
                      </h3>
                      <p className="text-xs text-neutral-400 truncate">
                        {group.members.length} members
                      </p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Profile Section */}
      <div className={`p-4 border-t border-neutral-700 mt-auto ${isSidebarCollapsed ? 'flex justify-center' : ''}`}>
        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : ''}`}>
          {/* Profile button */}
          <button
            className={`flex items-center ${isSidebarCollapsed ? '' : 'gap-3 flex-grow'} rounded-lg ${isSidebarCollapsed ? 'p-0' : 'px-3 py-2'} transition-colors text-neutral-400 hover:bg-neutral-700/50`}
            onClick={() => (window.location.href = "/profile")}
          >
            <div className="relative">
              <img
                src={authUser?.profilePic || "/avatar.png"}
                alt={authUser?.name}
                className={`${isSidebarCollapsed ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover border border-neutral-600`}
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-neutral-800 bg-green-500" />
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <h3 className="font-medium text-neutral-200 truncate text-left">
                  {authUser?.name}
                </h3>
                <p className="text-xs text-neutral-400 text-left">Online</p>
              </div>
            )}
          </button>

          {/* Logout button */}
          {!isSidebarCollapsed && (
            <button
              className="ml-2 px-3 py-2 h-14 rounded-lg text-neutral-400 hover:bg-neutral-700/50 transition-colors flex items-center justify-center"
              onClick={logout}
              aria-label="Logout"
            >
              <LogOut size={18} />
            </button>
          )}
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