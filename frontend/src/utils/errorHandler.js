export const showError = (message) => {
  // Create error message element
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #ff4444;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add message text
  errorDiv.textContent = message;
  
  // Add to document
  document.body.appendChild(errorDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    errorDiv.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(errorDiv);
    }, 300);
  }, 5000);
};

export const showSuccess = (message) => {
  // Create success message element
  const successDiv = document.createElement('div');
  successDiv.className = 'success-message';
  successDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #00C851;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    animation: slideIn 0.3s ease-out;
  `;
  
  // Add message text
  successDiv.textContent = message;
  
  // Add to document
  document.body.appendChild(successDiv);
  
  // Remove after 5 seconds
  setTimeout(() => {
    successDiv.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => {
      document.body.removeChild(successDiv);
    }, 300);
  }, 5000);
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style); 