// Reusable form input component for future auth and inventory forms.
function FormInput({ label, name, type = 'text', value = '', onChange, placeholder = '' }) {
  return (
    <label className="form-input">
      <span>{label}</span>
      <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} />
    </label>
  );
}

export default FormInput;
