import React from 'react'
import GenderCheckbox from './GenderCheckbox';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import useSignup from "../../hooks/useSignup";

const SignUp = () => {

  const [inputs, setInputs] = useState({
    fullname: "",
    username: "",
    password: "",
    confirmPassword: "",
    gender: "",
  });
  
  const { loading, signup} = useSignup();

  const handleCheckboxChange = (gender) => {
    setInputs({...inputs, gender});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(inputs);
  };
  return (
   <div className='flex flex-col items-center justify-center min-w-96 mx-auto'>      
    <div className='w-full p-5 rounded-lg shadow-md bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
      <h1 className='text-3xl font-semibold text-center text-gray-300'>
        Sign Up 
        <span className="font-semibold text-transparent text-3xl bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">  Sjx_ChatApp</span>
      <form onSubmit={handleSubmit}>
        <div>
          <label className='label p-2'>
          <span className='text-base label-text'>Fullname</span>
          {/* <label className="cursor-pointer grid place-items-center form-control">
            <input type="checkbox" value="synthwave" className="toggle theme-controller bg-base-content row-start-1 col-start-1 col-span-2"/>
            <svg className="col-start-1 row-start-1 stroke-base-100 fill-base-100" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>
            <svg className="col-start-2 row-start-1 stroke-base-100 fill-base-100" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
          </label> */}
         </label>
          <input type="text" placeholder="Enter Fullname" className="input input-bordered w-full max-w-xs h-10 text-gray-200" 
            value={inputs.fullname}
            onChange={(e) => setInputs({...inputs, fullname: e.target.value})}
          />
        </div>
        <div>
        <label className='label p-2' >
            <span className='text-base label-text'>Username</span>
            </label>
            <input type="username" placeholder="e.g:- @iamsrk " className="input input-bordered w-full max-w-xs h-10 text-gray-200" 
            value={inputs.username}
            onChange={(e) => setInputs({...inputs, username: e.target.value})}
            />
        </div>
        <div>
        <label className='label p-0' >
            <span className='text-base label-text textarea-sm'>Password</span>
            </label>
            <input type="password" placeholder="Enter password" className="input input-bordered w-full max-w-xs h-10 text-gray-200" 
            value={inputs.password}
            onChange={(e) => setInputs({...inputs, password: e.target.value})}
            />
        </div>
        <div>
        <label className='label p-0' >
            <span className='text-base label-text textarea-sm'>Confirm Password</span>
            </label>
            <input type="password" placeholder="Re-Enter password" className="input input-bordered w-full max-w-xs h-10 text-gray-200" 
              value={inputs.confirmPassword}
              onChange={(e) => setInputs({...inputs, confirmPassword: e.target.value})}
            />
        </div>
        <div className="label">
        <GenderCheckbox onCheckboxChange = {handleCheckboxChange} selectGender={inputs.gender} />
            {/* <span className="label-text-alt"></span> */}
            <Link to='/login' className="text-xs label-text link link-hover hover:text-gray-300 hover:underline hover:text-xs">Already have an account? Login.</Link>
            
            </div>
        <div>
        <button className='btn btn-sm btn-warning btn-block mt-2 border border-slate-700 max-w-xs'
        disabled={loading}
        >
          {loading ? <span className='loading loading-spinner'></span> : "Sign Up"}
        </button>
        </div>

      </form>
      </h1>
    </div>
  </div>
  );
};
export default SignUp;