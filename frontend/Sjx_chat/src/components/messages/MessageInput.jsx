import React from 'react'
import { BsSend } from 'react-icons/bs';
import { HiOutlineEmojiHappy } from 'react-icons/hi';
import useSendMessage from '../../hooks/useSendMessage';
import { useState } from 'react';
import EmojiPicker from './EmojiPicker';
import QuickEmojiBar from './QuickEmojiBar';

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const {loading, sendMessage}= useSendMessage();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if(!message.trim())return;
    await sendMessage(message);
    setMessage("");
  }

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
  }
  return (
    <div className='px-4 my-3'>
      {/* Quick Emoji Bar */}
      <QuickEmojiBar 
        isVisible={showEmojiPicker}
        onEmojiSelect={handleEmojiSelect}
      />
      
      <form onSubmit={handleSubmit}>
        <div className='w-full relative'>
            <input 
              type='text' 
              className='border text-sm rounded-lg block w-full p-2.5 pr-20 bg-gray-900 border-gray-600 text-gray-300 bg-opacity-40 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200'
              placeholder='Send A Message' 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            
            {/* Emoji Picker */}
            <div className="absolute bottom-0 left-2">
              <EmojiPicker 
                isOpen={showEmojiPicker}
                onEmojiSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            </div>
            
            {/* Emoji Button */}
            <button 
              type='button' 
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`absolute inset-y-0 right-12 flex items-center px-2 transition-colors duration-150 ${
                showEmojiPicker 
                  ? 'text-yellow-400' 
                  : 'text-gray-400 hover:text-yellow-400'
              }`}
              title="Add emoji"
            >
              <HiOutlineEmojiHappy className='w-5 h-5' />
            </button>
            
            {/* Send Button */}
            <button 
              type='submit' 
              disabled={!message.trim() || loading}
              className={`absolute inset-y-0 right-0 flex items-center pe-3 transition-colors duration-150 ${
                message.trim() && !loading 
                  ? 'text-blue-400 hover:text-blue-300' 
                  : 'text-gray-500'
              }`}
              title="Send message"
            >
              {loading ? (
                <div className='loading loading-spinner loading-sm'></div>
              ) : (
                <BsSend className='w-4 h-4' />
              )}
            </button>
        </div>
      </form>
    </div>
  )
}

export default MessageInput;

//STARTER CODE
// import React from 'react'
// import { BeSend } from 'react-icons/bs';

// const MessageInput = () => {
//   return (
//     <form className='px-4 my-3'>
//         <div className='w-full'>
//             <input type="text" placeholder = 'Send A Message' classname='border text-sm rounded-lg block w-full p-2.5 bg-gray-700 border-gray-600 text-white' />
//         <button type='submit' className='absolute inset-y-0 end-0 flex items-center pe-3'>
//         <BeSend />
//         </button>
//         </div>
//             </form>
   
//   )
// }

// export default MessageInput