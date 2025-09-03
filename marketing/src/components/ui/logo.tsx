import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Logo({ size = "md", className = "" }: LogoProps) {
  const sizeClasses = {
    sm: {
      text: "text-lg"
    },
    md: {
      text: "text-xl"
    },
    lg: {
      text: "text-2xl"
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <Link href="/" className={`flex items-center group ${className}`}>
      <div className={`${currentSize.text} font-bold tracking-tight`}>
        <span className="text-slate-800 font-extrabold">Crypt</span>
        <span className="text-blue-600 font-bold">IoMT</span>
      </div>
    </Link>
  );
}