// import {BiLogOut} from 'react-icons/bi';
// import { Power } from 'lucide-react';
import useLogout from '../../hooks/useLogout';
import { BsPower } from 'react-icons/bs';
const LogoutButton = () => {

  const {loading, logout} = useLogout();
  return (
    <div className='mt-auto'>
        
         {!loading ? (
            <BsPower className='w-6 h-6 text-white cursor-pointer' 
            onClick={logout}
            />
         ) : (
            <span className='loading loading-spinner'></span>
         )}
    </div>
  ); 
};

export default LogoutButton;