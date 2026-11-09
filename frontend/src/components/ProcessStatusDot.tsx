import React from 'react';
import { ProcessStatus } from '../types/genome';

export interface ProcessStatusDotProps {
  status?: ProcessStatus | 'queued' | 'cooling_down' | 'cancelled' | string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  sublabel?: string;
  showTooltip?: boolean;
  tooltipText?: string;
  className?: string;
  onClick?: () => void;
  outputFilesVerified?: boolean;
}

export const ProcessStatusDot: React.FC<ProcessStatusDotProps> = ({
  status = 'idle',
  size = 'md',
  label,
  sublabel,
  showTooltip = true,
  tooltipText,
  className = '',
  onClick,
  outputFilesVerified = true,
}) => {
  // Normalize status into running / completed / failed / idle
  let normalizedStatus: ProcessStatus = 'idle';
  if (status === 'running' || status === 'cooling_down') {
    normalizedStatus = 'running';
  } else if (status === 'completed') {
    // If completed but output files were explicitly not verified, treat as error/failed
    normalizedStatus = outputFilesVerified ? 'completed' : 'failed';
  } else if (status === 'failed' || status === 'cancelled') {
    normalizedStatus = 'failed';
  } else {
    normalizedStatus = 'idle';
  }

  // Size styling
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  }[size];

  // Traffic-light status styling (Yellow running, Green completed & verified, Red error/failed, Gray idle)
  const statusConfig = {
    running: {
      dot: 'bg-[#D29922] animate-pulse ring-2 ring-[#D29922]/40',
      badge: 'text-[#9A6700] bg-[#FFF8C5] border-[#D4A72C]/40',
      defaultTitle: 'Processing / Executing code... (WSL2 active)',
      labelColor: 'text-[#9A6700]',
    },
    completed: {
      dot: 'bg-[#2DA44E] ring-2 ring-[#2DA44E]/30',
      badge: 'text-[#1A7F37] bg-[#DAFBE1] border-[#4AC26B]/40',
      defaultTitle: 'Completed smoothly: All output files generated and verified on disk',
      labelColor: 'text-[#1A7F37]',
    },
    failed: {
      dot: 'bg-[#CF222E] ring-2 ring-[#CF222E]/40',
      badge: 'text-[#CF222E] bg-[#FFEBE9] border-[#FF8182]/40',
      defaultTitle: 'Process Error: Non-zero exit code or missing output files',
      labelColor: 'text-[#CF222E]',
    },
    idle: {
      dot: 'bg-[#8C959F]',
      badge: 'text-[#656D76] bg-[#EFF1F3] border-[#D0D7DE]',
      defaultTitle: 'Ready / Idle',
      labelColor: 'text-[#656D76]',
    },
  }[normalizedStatus];

  const title = tooltipText || statusConfig.defaultTitle;

  return (
    <div
      onClick={onClick}
      title={showTooltip ? title : undefined}
      className={`inline-flex items-center gap-1.5 select-none ${
        onClick ? 'cursor-pointer hover:opacity-85' : ''
      } ${className}`}
    >
      <span className={`rounded-full shrink-0 transition-all ${sizeClasses} ${statusConfig.dot}`} />
      {label && (
        <span className={`text-xs font-semibold truncate ${statusConfig.labelColor}`}>
          {label}
        </span>
      )}
      {sublabel && (
        <span className="text-[10px] text-[#656D76] font-normal truncate">
          {sublabel}
        </span>
      )}
    </div>
  );
};

export default ProcessStatusDot;
