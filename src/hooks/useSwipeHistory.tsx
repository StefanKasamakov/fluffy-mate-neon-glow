import { useState } from 'react';

interface SwipeAction {
  petId: string;
  action: 'like' | 'dislike';
  timestamp: number;
}

export const useSwipeHistory = () => {
  const [swipeHistory, setSwipeHistory] = useState<SwipeAction[]>([]);

  const addSwipeAction = (petId: string, action: 'like' | 'dislike') => {
    const newAction: SwipeAction = {
      petId,
      action,
      timestamp: Date.now()
    };
    
    setSwipeHistory(prev => [...prev, newAction]);
  };

  const undoLastSwipe = () => {
    if (swipeHistory.length === 0) return null;
    
    const lastAction = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory(prev => prev.slice(0, -1));
    
    return lastAction;
  };

  const canUndo = swipeHistory.length > 0;

  return {
    addSwipeAction,
    undoLastSwipe,
    canUndo,
    lastAction: swipeHistory[swipeHistory.length - 1] || null
  };
};