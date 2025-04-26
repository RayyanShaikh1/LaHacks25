import React from "react";
import { useAuthStore } from "../store/useAuthStore";
import { LogOut, User } from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useChatStore } from "../store/useChatStore";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";

function HomePage() {
  const { logout } = useAuthStore();
  const { selectedUser } = useChatStore();
  return (
    <>
      <button className="flex gap-2 items-center" onClick={logout}>
        <span className="hidden sm:inline">Logout</span>
      </button>
      <Link to={"/profile"} className={`btn btn-sm gap-2`}>
        <span className="hidden sm:inline">Profile</span>
      </Link>
      <div className="h-screen bg-base-200">
        <div className="flex items-center justify-center pt-20 px-4">
          <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
            <div className="flex h-full rounded-lg overflow-hidden">
              <Sidebar />
              {!selectedUser ? <NoChatSelected /> : <ChatContainer />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
