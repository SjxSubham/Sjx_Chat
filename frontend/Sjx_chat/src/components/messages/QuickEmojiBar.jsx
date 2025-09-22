import React from 'react';
import { popularEmojis } from '../../utils/emojis';

const QuickEmojiBar = ({ onEmojiSelect, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-700 bg-opacity-50 rounded-lg mb-2 animate-fadeIn">
      <span className="text-xs text-gray-400 mr-2 self-center">Quick:</span>
      {popularEmojis.slice(0, 10).map((emoji, index) => (
        <button
          key={index}
          onClick={() => onEmojiSelect(emoji)}
          className="text-lg hover:bg-gray-600 rounded p-1 transition-colors duration-150 hover:scale-110 transform"
          title={`Add ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default QuickEmojiBar;
