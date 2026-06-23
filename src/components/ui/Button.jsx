// Reusable button component for consistent actions across the frontend.
function Button({ children, type = 'button', onClick, variant = 'primary', disabled = false }) {
  return (
    <button 
      className={`button button--${variant}`} 
      type={type} 
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

export default Button;
