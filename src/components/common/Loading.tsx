import React from "react";

interface LoadingProps {
  fullScreen?: boolean;
  className?: string;
  backdrop?: boolean;
}

const Loading: React.FC<LoadingProps> = ({
  fullScreen = true,
  className = "",
  backdrop = true,
}) => {
  const spinner = (
    <div className="relative">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-600"></div>
      <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-2 border-emerald-400/10"></div>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-[9999] flex items-center justify-center ${backdrop ? "bg-white/70 dark:bg-gray-950/70 backdrop-blur-md" : ""} ${className}`}
      >
        {spinner}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-12 ${className}`}>
      {spinner}
    </div>
  );
};

export default Loading;
