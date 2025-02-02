import { useAuthContext } from "../../context/AuthContext"
import { extractTime } from "../../utils/extractTime";
import useConversation from "../../zustand/useConversation";
<<<<<<< HEAD

const Message = ({message}) => {
  const { authUser } = useAuthContext();
  const {selectedConversation}= useConversation();
  const fromMe = message.senderId === authUser._id;
  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
  const bubbleBgColor = fromMe ? 'bg-blue-500' : "";
  const shakeClass = message.shouldShake ? "shake" : "";


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
                <img alt="Tailwind CSS chat bubble component" src={profilePic} />
          </div>
        </div>
        <div className={`chat-bubble text-md text-gray-100 ${bubbleBgColor} ${shakeClass} pb-2`}>{message.message}</div>
=======

const Message = ({message}) => {
  const { authUser } = useAuthContext();
  const {selectedConversation}= useConversation();
  const fromMe = message.senderId === authUser._id;
  const formattedTime = extractTime(message.createdAt);
  const chatClassName = fromMe ? "chat-end" : "chat-start";
  const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
  const bubbleBgColor = fromMe ? 'bg-blue-500' : "";
  const shakeClass = message.shouldShake ? "shake" : "";


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
                <img alt="Tailwind CSS chat bubble component" src={profilePic} />
          </div>
        </div>
<<<<<<< HEAD
        <div className={`chat-bubble text-white ${bubbleBgColor} ${shakeClass} pb-2`}>{message.message}</div>
>>>>>>> 3a4d2c8 (okay now it's ready for deployment)
=======
        <div className={`chat-bubble text-md text-gray-200 ${bubbleBgColor} ${shakeClass} pb-2`}>{message.message}</div>
>>>>>>> 36c9183 (design)
        <div className='chat-footer opacity-50 text-xs flex gap-1 items-center'>{formattedTime}</div>
    </div>
  );
};

export default Message;