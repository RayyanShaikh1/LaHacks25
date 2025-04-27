import { useState } from "react";
import { showError, showSuccess } from "../utils/errorHandler";
import { useChatStore } from "../store/useChatStore";
import { X, Users, Plus, Check } from "lucide-react";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { users, createGroup } = useChatStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      showError("Please enter a group name");
      return;
    }
    if (selectedUsers.length < 2) {
      showError("Please select at least 2 users");
      return;
    }

    try {
      await createGroup({
        name: groupName,
        members: selectedUsers,
      });
      showSuccess("Group created successfully");
      onClose();
    } catch (error) {
      showError("Failed to create group");
    }
  };

  const toggleUser = (userId) => {
    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-lg w-full max-w-md p-6 border border-white/10 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Create a Group</h2>
          <button
            onClick={onClose}
            className="text-[#c8c8ff]/70 hover:text-[#7142dd] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[#7142dd] mb-2">
              Group Name
            </label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-white/10 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#c8c8ff] border border-white/20"
              placeholder="Enter group name"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-[#7142dd] mb-2">
              Select Members
            </label>
            <div className="max-h-48 overflow-y-auto bg-white/5 rounded-md p-2 border border-white/10">
              {users.length === 0 ? (
                <div className="text-center py-4 text-[#c8c8ff]/50">No users available</div>
              ) : (
                users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center gap-2 p-2 hover:bg-white/10 rounded-md cursor-pointer"
                    onClick={() => toggleUser(user._id)}
                  >
                    <div className="relative">
                      <img
                        src={user.profilePic || "/avatar.png"}
                        alt={user.name}
                        className="w-8 h-8 rounded-full border border-white/20"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#070738] ${
                          user.isOnline ? "bg-green-500" : "bg-gray-500"
                        }`}
                      />
                    </div>
                    <span className="text-white">{user.name}</span>
                    {selectedUsers.includes(user._id) ? (
                      <Check className="ml-auto text-[#7142dd]" size={16} />
                    ) : (
                      <Plus className="ml-auto text-[#c8c8ff]/50" size={16} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-white hover:text-[#7142dd] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-900 hover:bg-[#7142dd] text-white rounded-md transition-colors border border-white/20"
            >
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;