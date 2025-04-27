import { useState, useEffect } from "react";

const AnimatedLetter = ({ letter, index }) => (
  <span
    className={`inline-block ${letter === ' ' ? 'mx-0.1' : ''} animate-letter`}
    style={{
      animationDelay: `${index * 0.1}s`,
    }}
  >
    {letter === ' ' ? '\u00A0' : letter}
  </span>
);

const NoChatSelected = () => {
  const welcomeText = "Welcome to nexus";

  return (
    <div className="w-full flex flex-1 flex-col items-center justify-center p-16 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-neutral-900 z-0" />
      
      <div className="relative z-10 text-center">
        {/* Welcome Text */}
        <style>
  {`
    @keyframes letter-wave {
      0%, 40%, 60%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-8px);
      }
    }
    .animate-letter {
      animation: letter-wave 6s ease infinite;
    }
  `}
</style>

        <h2 className="text-2xl font-bold text-neutral-200">
          {welcomeText.split('').map((letter, index) => (
            <AnimatedLetter key={index} letter={letter} index={index} />
          ))}
        </h2>
        <p className="text-neutral-400 mt-2">
          Select a conversation from the sidebar to start chatting
        </p>
      </div>
    </div>
  );
};

export default NoChatSelected;
