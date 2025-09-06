import Conversation from './Conversation'
import useGetConversations from '../../hooks/useGetConversation';
import { getRandomEmoji } from '../../utils/emojis';
import PropTypes from 'prop-types';

const Conversations = () => {
  const { loading, conversations, error } = useGetConversations();

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error loading conversations</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!conversations.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className='py-2 flex flex-col overflow-auto'>
      {conversations.map((conversation, idx) => (
        <Conversation 
          key={conversation._id} 
          conversation={conversation} 
          emoji={getRandomEmoji()}
          lastIdx={idx === conversations.length - 1}
        />
      ))}
    </div>
  );
};

export default Conversations;

// STARTER CODE SNIPPET

// import React from 'react'
// import Conversation from './Conversation'

// const Conversations = () => {
//   return (
//     <div className='py-2 flex flex-col overflow-auto'>
//     <Conversation />
//     <Conversation />
//     <Conversation />
//     <Conversation />
//     <Conversation />
//     <Conversation />
//     </div>
//   )
// }

// export default Conversations