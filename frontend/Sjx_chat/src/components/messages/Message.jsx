import React from 'react'

const Message = () => {
  return (
        <div className='chat chat-end'>
        <div className='chat image avatar'>
          <div className='w-10 rounded-full'>
              <img alt = 'Tailwind CSS chat BUbble Component'  
                  src = {
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTJh_YSIh_3ajijnUz5IaJx5U8CVFhPdkYIVg&usqp=CAU"
                  }
                    />
          </div>
        </div>
        <div className='chat-bubble text-white bg-blue-500'>hi, what's up !?</div>
        <div className='chat-footer opacity-50 text-xs flex gap-1 items-center'>12:42</div>
    </div>
  )
}

export default Message