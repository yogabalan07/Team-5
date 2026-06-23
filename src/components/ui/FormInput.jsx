// Reusable form input component for auth and inventory forms.
function FormInput({ label, name, type = 'text', value = '', onChange, placeholder = '', disabled = false }) {
  return (
    <label className="form-input">
      <span>{label}</span>
      <input 
        name={name} 
        type={type} 
        value={value} 
        onChange={onChange} 
        placeholder={placeholder}
        disabled={disabled}
      />
    </label>
  );
}

export default FormInput;
