import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import Sidebar from "../components/Sidebar";
import { useChatStore } from "../store/useChatStore";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

function HomePage() {
  const { authUser } = useAuthStore();
  const { selectedUser, selectedGroup } = useChatStore();
  
  return (
    <div className="h-screen flex bg-[#36393f] text-white">
      <Sidebar />
      <div className="flex-1 flex">
        {!selectedUser && !selectedGroup ? <NoChatSelected /> : <ChatContainer />}
      </div>
    </div>
  );
}

export default HomePage;
