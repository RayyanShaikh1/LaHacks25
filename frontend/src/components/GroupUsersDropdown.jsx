import { useAuthStore } from "../store/useAuthStore";
import { Users, X } from "lucide-react";

const GroupUsersDropdown = ({ isOpen, onClose, group }) => {
  const { onlineUsers } = useAuthStore();

  if (!isOpen || !group) return null;

  return (
    <div className="absolute top-full left-0 mt-2 w-64 bg-neutral-800 rounded-lg shadow-lg border border-neutral-700 z-50">
      <div className="p-3 border-b border-neutral-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} className="text-neutral-400" />
          <span className="text-sm font-medium text-neutral-200">Group Members</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
      <div className="max-h-64 overflow-y-auto">
        {group.members.map((member) => (
          <div
            key={member._id}
            className="flex items-center gap-3 p-3 hover:bg-neutral-700/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-neutral-600">
              <img
                src={member.profilePic || "/avatar.png"}
                alt={member.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-neutral-200 truncate">
                {member.name}
              </h4>
              <p className="text-xs text-neutral-400">
                <span className={`w-2 h-2 rounded-full inline-block mr-1 ${
                  onlineUsers.includes(member._id) ? "bg-green-500" : "bg-neutral-500"
                }`}></span>
                {onlineUsers.includes(member._id) ? "Online" : "Offline"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupUsersDropdown; 