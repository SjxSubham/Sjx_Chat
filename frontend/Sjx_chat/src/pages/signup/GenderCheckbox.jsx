import React from 'react'

const GenderCheckbox = () => {
  return (
    <div className='flex p-0'>
<div className='form-control'>
    <label className={'label gap-1 cursor-pointer'}>
        <span className='label-text text-xs'>Male </span>
        <input type='checkbox' className='checkbox border-spacing-0 border-slate-900' />
    </label>
    </div>
    <div className='form-control'>
    <label className={'label gap-1 cursor-pointer'}>
        <span className='label-text text-xs'>Female </span>
        <input type='checkbox' className='checkbox border-spacing-0 border-slate-900' />
    </label>
    </div>

</div>
    
  );
};

export default GenderCheckbox;