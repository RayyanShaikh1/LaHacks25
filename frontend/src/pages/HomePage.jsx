import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import Sidebar from "../components/Sidebar";
import { useChatStore } from "../store/useChatStore";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

function HomePage() {
  const { authUser } = useAuthStore();
  const { selectedUser, selectedGroup, isSidebarCollapsed } = useChatStore();
  
  return (
    <div className="h-screen flex bg-neutral-900 text-neutral-200">
      <Sidebar />
      <div className={`flex-1 flex transition-all duration-300 ${isSidebarCollapsed ? 'ml-0' : 'ml-0'}`}>
        {!selectedUser && !selectedGroup ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
  );
}

export default HomePage;
