import React from 'react'

const GenderCheckbox = ({onCheckboxChange, selectedGender}) => {
  return (
    <div className='flex p-0'>
<div className='form-control'>
    <label className={'label gap-1 cursor-pointer ${selectedGender === "male" ? "selected" : ""}'}>
        <span className='label-text text-xs'>Male </span>
        <input type='checkbox' className='checkbox border-spacing-0 border-slate-900' 
          checked={selectedGender === "male"}
          onChange={() => onCheckboxChange("male")}
        />
    </label>
    </div>
    <div className='form-control'>
    <label className={'label gap-1 cursor-pointer ${selectedGender === "female" ? "selected" : ""}'}>
        <span className='label-text text-xs'>Female </span>
        <input type='checkbox' className='checkbox border-spacing-0 border-slate-900' 
        checked={selectedGender === "female"}
        onChange={() => onCheckboxChange("female")}
        />
    </label>
    </div>
</div>
    
  );
};

export default GenderCheckbox;