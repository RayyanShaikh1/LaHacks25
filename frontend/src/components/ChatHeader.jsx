import { X, Users, Hash, Sidebar, Layout } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";

const ChatHeader = () => {
  const { selectedUser, selectedGroup, setSelectedUser, setSelectedGroup, toggleSidebar, toggleOverlay, isSidebarOpen, isOverlayOpen } = useChatStore();
  const { onlineUsers } = useAuthStore();

  const handleClose = () => {
    if (selectedUser) {
      setSelectedUser(null);
    } else if (selectedGroup) {
      setSelectedGroup(null);
    }
  };

  if (!selectedUser && !selectedGroup) return null;

  return (
    <div className="px-4 py-3 flex items-center justify-between border-b border-neutral-700">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border border-neutral-600">
          {selectedGroup && !selectedGroup.groupImage ? (
            <div className="w-full h-full bg-neutral-700 flex items-center justify-center">
              <Hash size={16} className="text-neutral-200" />
            </div>
          ) : (
            <img
              src={
                selectedGroup
                  ? selectedGroup.groupImage || "/group-avatar.png"
                  : selectedUser.profilePic || "/avatar.png"
              }
              alt={selectedGroup ? selectedGroup.name : selectedUser.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Name and Status */}
        <div>
          <h3 className="font-medium text-neutral-200">
            {selectedGroup ? selectedGroup.name : selectedUser.name}
          </h3>
          <p className="text-xs text-neutral-400">
            {selectedGroup ? (
              <span className="flex items-center gap-1">
                <Users className="size-3" />
                {selectedGroup.members.length} {selectedGroup.members.length === 1 ? 'member' : 'members'}
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${onlineUsers.includes(selectedUser._id) ? 'bg-green-500' : 'bg-neutral-500'}`}></span>
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {selectedGroup && (
          <>
            <button 
              onClick={toggleSidebar}
              className={`p-2 rounded-full ${isSidebarOpen ? 'bg-neutral-700 text-neutral-200' : 'hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200'} transition-colors`}
              title="Toggle Sidebar"
            >
              <Sidebar size={18} />
            </button>
            <button 
              onClick={toggleOverlay}
              className={`p-2 rounded-full ${isOverlayOpen ? 'bg-neutral-700 text-neutral-200' : 'hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200'} transition-colors`}
              title="Toggle Overlay"
            >
              <Layout size={18} />
            </button>
          </>
        )}
        <button 
          onClick={handleClose}
          className="p-2 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;