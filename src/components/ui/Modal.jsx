// Reusable modal wrapper for future forms and confirmation dialogs.
function Modal({ title = 'Modal', children, isOpen = false }) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__content">
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

export default Modal;
