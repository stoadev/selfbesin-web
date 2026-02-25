import { useState } from "react";
import { Utensils } from "lucide-react";

interface FoodImageProps {
  src?: string;
  alt: string;
  className?: string;
  iconClassName?: string;
}

export default function FoodImage({
  src,
  alt,
  className = "",
  iconClassName = "w-8 h-8",
}: FoodImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 ${className}`}
      >
        <Utensils
          className={`${iconClassName} text-gray-300 dark:text-gray-600`}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-900/50 animate-pulse">
          <Utensils
            className={`${iconClassName} text-gray-200 dark:text-gray-800`}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
      />
    </div>
  );
}
