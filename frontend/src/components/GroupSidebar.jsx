import { useChatStore } from "../store/useChatStore";

const GroupSidebar = () => {
  const { isSidebarOpen } = useChatStore();

  if (!isSidebarOpen) return null;

  return (
    <div className="w-80 bg-neutral-800 h-full border-l border-neutral-700 shadow-lg">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-neutral-200">Group Info</h2>
        {/* Sidebar content will be added here */}
      </div>
    </div>
  );
};

export default GroupSidebar; 