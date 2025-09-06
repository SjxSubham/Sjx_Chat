import { useSocketContext } from '../../context/SocketContext';
import useConversation from '../../zustand/useConversation';
import PropTypes from 'prop-types';

const Conversation = ({ conversation, lastIdx, emoji }) => {
    const { selectedConversation, setSelectedConversation } = useConversation();
    const { onlineUsers } = useSocketContext() || { onlineUsers: [] };

    const isSelected = selectedConversation?._id === conversation._id;
    const isOnline = onlineUsers.includes(conversation._id);

    const handleImageError = (e) => {
        e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';
    };

    return (
        <>
            <div 
                className={`flex gap-2 items-center hover:bg-sky-300 rounded-end hover:bg-opacity-10 p-2 py-1 cursor-pointer
                    ${isSelected ? 'bg-sky-300 bg-opacity-5' : ""}`}
                onClick={() => setSelectedConversation(conversation)}
            >
                <div className={`avatar ${isOnline ? 'online' : ''}`}>
                    <div className='w-10 rounded-full'>
                        <img 
                            src={conversation.profilePic} 
                            alt={`${conversation.fullname}'s avatar`}
                            onError={handleImageError}
                        />
                    </div>
                </div>
                <div className='flex flex-col flex-1'>
                    <div className='flex gap-3 justify-between'>
                        <p className='font-bold text-gray-200'>{conversation.fullname}</p>
                        <span className='text-sm'>{emoji}</span>
                    </div>
                </div>
            </div>
            {!lastIdx && <div className='divider my-0 py-0 h-1' />}
        </>
    );
};

Conversation.propTypes = {
    conversation: PropTypes.shape({
        _id: PropTypes.string.isRequired,
        fullname: PropTypes.string.isRequired,
        profilePic: PropTypes.string.isRequired
    }).isRequired,
    lastIdx: PropTypes.bool.isRequired,
    emoji: PropTypes.string.isRequired
};

export default Conversation;
