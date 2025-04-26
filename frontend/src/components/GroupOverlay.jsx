import { useChatStore } from "../store/useChatStore";

const GroupOverlay = () => {
  const { isOverlayOpen } = useChatStore();

  if (!isOverlayOpen) return null;

  return (
    <div className="absolute inset-0 bg-neutral-800 z-10 flex flex-col">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-neutral-200">Group Overlay</h2>
        {/* Overlay content will be added here */}
      </div>
    </div>
  );
};

export default GroupOverlay; 