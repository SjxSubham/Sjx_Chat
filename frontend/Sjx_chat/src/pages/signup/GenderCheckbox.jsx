const GenderCheckbox = ({ onCheckboxChange, selectedGender }) => {
  return (
    <div className='flex'>
      <div className='form-control'>
        <label className={`label cursor-pointer gap-1 ${selectedGender === "male" ? "selected" : ""}`}>
          <span className='label-text text-xs'>Male </span>
          <input type='checkbox'
            className='checkbox'
            checked={selectedGender === "male"}
            onChange={() => onCheckboxChange("male")}
          />
        </label>
      </div>
      <div className='form-control'>
        <label className={`label cursor-pointer gap-1  ${selectedGender === "female" ? "selected" : ""}`}>
          <span className='label-text text-xs'>Female </span>
          <input type='checkbox'
            className='checkbox'
            checked={selectedGender === "female"}
            onChange={() => onCheckboxChange("female")}
          />
        </label>
      </div>
    </div>

  );
};

export default GenderCheckbox;