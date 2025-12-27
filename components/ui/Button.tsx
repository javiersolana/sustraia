import React from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "../../lib/utils";
import { ArrowRight } from "lucide-react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "outline" | "link";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  icon?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  className,
  variant = "primary",
  size = "md",
  children,
  icon = false,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-display font-medium transition-all duration-300 rounded-full focus:outline-none disabled:opacity-50";
  
  const variants = {
    primary: "bg-sustraia-accent text-white hover:bg-sustraia-accentHover shadow-[0_4px_14px_rgba(255,62,0,0.3)] hover:shadow-[0_6px_20px_rgba(255,62,0,0.4)] hover:-translate-y-0.5",
    secondary: "bg-sustraia-text text-white hover:bg-gray-800 hover:-translate-y-0.5 shadow-lg",
    outline: "border border-sustraia-text text-sustraia-text hover:bg-sustraia-text hover:text-white bg-transparent",
    link: "text-sustraia-text hover:text-sustraia-accent underline-offset-4 hover:underline p-0 h-auto"
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-12 px-8 text-base",
    lg: "h-14 px-10 text-lg"
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], variant !== 'link' && sizes[size], className)}
      {...props}
    >
      {children}
      {icon && <ArrowRight className="ml-2 w-4 h-4" />}
    </motion.button>
  );
};