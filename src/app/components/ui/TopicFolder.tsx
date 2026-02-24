"use client";

import React from "react";
import GlassFolder from "@/app/components/lightswind/glass-folder";
import { getLanguageIcon } from "./LanguageIcons";

interface TopicFolderProps {
  language: string;
  folderName?: string;
  onClick?: () => void;
  className?: string;
}

export function TopicFolder({ 
  language, 
  folderName, 
  onClick,
  className = "" 
}: TopicFolderProps) {
  const icon = getLanguageIcon(language);
  const displayName = folderName || language.charAt(0).toUpperCase() + language.slice(1);

  return (
    <div 
      className={`flex flex-col items-center gap-2 cursor-pointer ${className}`}
      onClick={onClick}
    >
      <GlassFolder icon={icon} />
      <span className="text-sm font-medium text-center" style={{ color: 'var(--text-primary)' }}>
        {displayName}
      </span>
    </div>
  );
}

export const defaultTopics = [
  "javascript",
  "python",
  "react",
  "nodejs",
  "html",
  "css",
];

interface TopicFoldersRowProps {
  topics?: string[];
  onTopicClick?: (topic: string) => void;
}

export function TopicFoldersRow({ 
  topics = defaultTopics, 
  onTopicClick 
}: TopicFoldersRowProps) {
  return (
    <div className="flex flex-wrap justify-center gap-6 py-4">
      {topics.map((topic) => (
        <TopicFolder
          key={topic}
          language={topic}
          onClick={() => onTopicClick && onTopicClick(topic)}
        />
      ))}
    </div>
  );
}
