// Reusable button component for consistent actions across the frontend.
function Button({ children, type = 'button', onClick, variant = 'primary' }) {
  return (
    <button className={`button button--${variant}`} type={type} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
