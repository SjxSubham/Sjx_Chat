import useConversation from '../../zustand/useConversation';
const Conversation = ({conversation, lastIdx, emoji}) => {
  return <>
    <div className='flex gap-2 items-center hover:bg-sky-300 rounded-end hover:bg-opacity-5 p-2 py-1 cursor-pointer'>
        <div className='avatar online'>
            <div className='w-10 rounded-full'>
                <img src={conversation.profilePic} alt='user avatar' />
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
  
};

export default Conversation;
