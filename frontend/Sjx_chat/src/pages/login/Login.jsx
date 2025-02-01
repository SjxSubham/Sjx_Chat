import { Link } from 'react-router-dom';
import { useState } from 'react';
import useLogin from "../../hooks/useLogin";

const Login = () => {

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const {loading, login} = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(username, password);
  };

  const handleUsernameKeyDown = (e) => {
    if (e.key === ' ') {
      e.preventDefault();
    }
  };

  return (
  <div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
    <div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
      <h1 className='text-3xl font-semibold text-center text-gray-300'>
        Login 
        <span className="font-semibold text-transparent text-3xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">  Sjx_ChatApp</span>

        </h1>
        <form onSubmit={handleSubmit}>
					<div>
						<label className='label p-2'>
							<span className='text-base label-text'>Username</span>
						</label>
						<input
							type='text'
							placeholder='Enter username'
							className='w-full input input-bordered h-10'
							value={username}
							onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleUsernameKeyDown}
						/>
					</div>

					<div>
						<label className='label'>
							<span className='text-base label-text'>Password</span>
						</label>
						<input
							type='password'
							placeholder='Enter Password'
							className='w-full input input-bordered h-10'
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
					</div>
                        
            <div className="label">
            <span className="label-text-alt"></span>
            <a href='#' className="text-xs label-text-alt link link-hover hover:text-gray-300 hover:underline hover:text-xs">Forgot Password?</a>
          </div>
          
        <div>
        <button className="btn btn-block btn-outline glass btn-opacity-2 btn-sm mt-0 max-w-xs"
          disabled={loading}
        >
          {loading ? <span className='loading loading-spinner'></span> : "Login"}
        </button>
        </div>
        <div className="divider divider-neutral text-xs">OR</div>
        <div>
        <Link to='/signup'><button className='btn btn-sm btn-block mt-2 max-w-xs'>Signup</button></Link>
        </div>
       
        </form>
  </div>
    </div>
    );
  
};

export default Login;

//STARTER CODE
// import React from 'react'

// const Login = () => {
//   return <div className='flex flex-col items-center justify-center min-w-96 mx-auto'>
//     <div className='w-full p-6 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
//       <h1 className='text-3xl font-semibold text-center text-gray-300'>
//         Login 
//         <span class="font-semibold text-transparent text-3xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">  Sjx_ChatApp</span>
//         </h1>
//         <form >
//           <div>
//             <label className='label p-2' >
//             <span className='text-base label-text'>Username</span>
//             </label>
//             <input type="text" placeholder="Enter @username" className="input input-bordered w-full h-10" />
//           </div>

//           <div>
//             <label className='label' >
//             <span className='text-base label-text'>Password</span>
//             </label>
//             <input type="password" placeholder="Enter password" className="input input-bordered w-full h-10" />
//             {/* <div className="form-control">
//             <label className="label cursor-pointer">
//               <span className="label-text">Remember me</span> 
//               <input type="checkbox" checked="unchecked" className="checkbox checkbox-sm" />
//             </label>
//           </div> */}
//             <div className="label">
//             <span className="label-text-alt"></span>
//             <a href='#' className="text-xs label-text-alt link link-hover hover:text-gray-300 hover:underline hover:text-xs">Forgot Password?</a>
//           </div>
//           </div>
//         <div>
//         <button className="btn btn-block btn-outline glass btn-opacity-2 btn-sm mt-0 max-w-xs">Login</button>
//         <div className="divider divider-neutral text-xs">OR</div>
//         <button className='btn btn-sm btn-block mt-2 max-w-xs'>Signup</button>
//         </div>
       
//         </form>
//   </div>
//     </div>
  
// }

// export default Login;