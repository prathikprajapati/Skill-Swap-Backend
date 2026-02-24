"use client";

import React from "react";
import { 
  Code, 
  Database, 
  Globe, 
  Smartphone, 
  Server, 
  Cloud,
} from "lucide-react";

// Map of programming languages/technologies to their representative icons
const languageIconMap: Record<string, React.ReactNode> = {
  javascript: <Code className="w-8 h-8" />,
  typescript: <Code className="w-8 h-8" />,
  html: <Globe className="w-8 h-8" />,
  css: <Globe className="w-8 h-8" />,
  python: <Code className="w-8 h-8" />,
  nodejs: <Server className="w-8 h-8" />,
  database: <Database className="w-8 h-8" />,
  android: <Smartphone className="w-8 h-8" />,
  azure: <Cloud className="w-8 h-8" />,
  docker: <Cloud className="w-8 h-8" />,
};

// Language to color mapping
const languageColorMap: Record<string, string> = {
  javascript: "#F7DF1E",
  typescript: "#317AC6",
  python: "#3776AB",
  java: "#007396",
  react: "#61DAFB",
  vue: "#4FC08D",
  angular: "#DD0031",
  nodejs: "#339933",
  database: "#4479A1",
  html: "#E34F26",
  css: "#1572B6",
};

// Get icon for a language
export function getLanguageIcon(language: string): React.ReactNode {
  const normalizedLang = language.toLowerCase().trim();
  return languageIconMap[normalizedLang] || <Code className="w-8 h-8" />;
}

// Get color for a language
export function getLanguageColor(language: string): string {
  const normalizedLang = language.toLowerCase().trim();
  return languageColorMap[normalizedLang] || "#6366F1";
}

// Get gradient colors from multiple languages
export function getGradientColors(languages: string[]): string[] {
  if (!languages || languages.length === 0) return ["#6366F1", "#4F46E5"];
  if (languages.length === 1) return [getLanguageColor(languages[0])];
  return languages.slice(0, 3).map(getLanguageColor);
}

// Get CSS gradient string
export function getLanguageGradient(languages: string[]): string {
  const colors = getGradientColors(languages);
  if (colors.length === 1) return colors[0];
  return `linear-gradient(135deg, ${colors.join(", ")})`;
}
