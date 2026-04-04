import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getMoodEmoji(mood: number): string {
  const emojis: Record<number, string> = {
    1: '😢',
    2: '😔',
    3: '😐',
    4: '😊',
    5: '😄',
  };
  return emojis[mood] || '😐';
}

export function getMoodLabel(mood: number): string {
  const labels: Record<number, string> = {
    1: 'Very Low',
    2: 'Low',
    3: 'Neutral',
    4: 'Good',
    5: 'Great',
  };
  return labels[mood] || 'Unknown';
}

export function getMoodColor(mood: number): string {
  const colors: Record<number, string> = {
    1: 'text-red-500',
    2: 'text-orange-500',
    3: 'text-yellow-500',
    4: 'text-green-500',
    5: 'text-emerald-500',
  };
  return colors[mood] || 'text-slate-500';
}
