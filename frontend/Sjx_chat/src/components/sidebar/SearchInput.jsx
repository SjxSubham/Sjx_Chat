import { IoIosSearch } from "react-icons/io";
const SearchInput = () => {
  return (
    <form className='flex items-center gap-2'>
        <input type='text' placeholder='Search_' className='flex input input-boarded-sm bg-gray-300 bg-opacity-1 rounded-full mt-0 h-10' />
        <button type='submit' className='btn btn-circle glass h-8 max-w-xs btn-opacity-2 btn-outline' >
        <IoIosSearch className='w-6 h-6 outline-none '/>
        </button>
    </form>
  
  );
};

export default SearchInput;

//STARTER CODE SNIPPET

// import { IoIosSearch } from "react-icons/io";
// const SearchInput = () => {
//   return (
//     <form className='flex items-center gap-2'>
//         <input type='text' placeholder='Search_' className='flex input input-boarded-sm bg-gray-300 bg-opacity-1 rounded-full mt-0 h-10' />
//         <button type='submit' className='btn btn-circle glass h-8 max-w-xs btn-opacity-2 btn-outline' >
//         <IoIosSearch className='w-6 h-6 outline-none '/>
//         </button>
//     </form>
  
//   );
// };
// I will use it later whwenver i will need it
// export default SearchInput;