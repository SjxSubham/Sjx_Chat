import React from 'react'
import Conversations from './Conversations'
import LogoutButton from './LogoutButton'
import SearchInput from './SearchInput'

const Sidebar = () => {
  return <div className='border-r border-slate-500 p-4 flex flex-col'>

    <SearchInput />
    <div className='divider divider-nutral bg-opacity-1 text-left text-wrap text-sm px-3'></div>
    <Conversations />
    
    <LogoutButton />

    </div>

}

export default Sidebar


//STARTER CODE

// import React from 'react'
// import Conversations from './Conversations'
// import LogoutButton from './LogoutButton'
// import SearchInput from './SearchInput'

// const Sidebar = () => {
//   return <div className='border-r border-slate-500 p-4 flex flex-col'>

//     <SearchInput />
//     <div className='divider divider-nutral bg-opacity-1 text-left text-wrap text-sm px-3'></div>
//     <Conversations />
    
//     <LogoutButton />

//     </div>

// }

// export default Sidebar