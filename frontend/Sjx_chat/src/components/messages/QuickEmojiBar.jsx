import React, { useState } from 'react';
import { popularEmojis } from '../../utils/emojis';

const QuickEmojiBar = ({ onEmojiSelect, isVisible }) => {
  const [clickedEmoji, setClickedEmoji] = useState(null);

  if (!isVisible) return null;

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
    setClickedEmoji(emoji);
    // Clear the animation after a short delay
    setTimeout(() => setClickedEmoji(null), 200);
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 bg-gray-700 bg-opacity-50 rounded-lg mb-2 animate-fadeIn">
      <span className="text-xs text-gray-400 mr-2 self-center">Quick:</span>
      {popularEmojis.slice(0, 10).map((emoji, index) => (
        <button
          key={index}
          onClick={() => handleEmojiClick(emoji)}
          className={`text-lg hover:bg-gray-600 rounded p-1 transition-all duration-150 hover:scale-110 transform ${
            clickedEmoji === emoji ? 'bg-blue-600 animate-pulse' : ''
          }`}
          title={`Add ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default QuickEmojiBar;
