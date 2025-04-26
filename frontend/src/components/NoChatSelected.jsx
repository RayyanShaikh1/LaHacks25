import { useState, useEffect } from "react";

const NoChatSelected = () => {
  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-900 z-0" />
      
      <div className="relative z-10 text-center">
        {/* Welcome Text */}
        <h2 className="text-2xl font-bold text-neutral-200">Welcome to Nexus!</h2>
        <p className="text-neutral-400 mt-2">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;