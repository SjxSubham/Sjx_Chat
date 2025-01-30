import React from 'react'
import { BsSend } from 'react-icons/bs';

const MessageInput = () => {
  return (
    <form className='px-4 my-3'>
        <div className='w-full relative'>
            <input type='text' className='border text-sm rounded-lg block w-full p-2.5 bg-gray-900 border-gray-600 text-gray-300 bg-opacity-40' placeholder = 'Send A Message' />
        <button type='submit' className='absolute inset-y-0 end-0 flex items-center pe-3'>
        <BsSend />
        </button>
        </div>
    </form>
   
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