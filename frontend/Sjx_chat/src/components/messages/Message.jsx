import { useEffect } from "react";
import { useAuthContext } from "../../context/AuthContext"
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
 

const Message = ({ message }) => {
  const { authUser } = useAuthContext();
  const { selectedConversation } = useConversation();
  const fromMe = message.senderId === authUser._id;
  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
  const bubbleBgColor = fromMe ? 'bg-blue-500' : "";
  const shakeClass = message.shouldShake ? "shake" : "";

  const handleImageError = (e) => {
    e.target.src = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png';     // some error [in backend]
  };

  // useEffect(() => {
  //   // Side effect logic related to the authUser prop
  //   if (authUser) {
  //     console.log(`Authenticated user: ${authUser.fullname}`);
  //   }
  // }, [authUser]);


  return (
        <div className={`chat ${chatClassName}`}>
        <div className='chat-image avatar'>
          <div className='w-10 rounded-full'>
                <img alt="Pic..." src={profilePic} onError={handleImageError} />
          </div>
        </div>

        <div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}>{message.message}</div>


        {/* <div className={`chat-bubble text-md text-gray-200 ${bubbleBgColor} ${shakeClass} pb-2`}>{message.message}</div> */}

  


        <div className='chat-footer opacity-50 text-xs flex gap-1 items-center'>{formattedTime}</div>
    </div>
  );
};


export default Message;