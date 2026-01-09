// Registration form handling with image upload
document.addEventListener('DOMContentLoaded', function() {
    // Modal close handlers
    const errorConfirmBtn = document.getElementById('error-confirm-btn');
    const successConfirmBtn = document.getElementById('success-confirm-btn');
    const warningConfirmBtn = document.getElementById('warning-confirm-btn');
    
    if (errorConfirmBtn) {
        errorConfirmBtn.addEventListener('click', function() {
            const errorModal = document.getElementById('error-modal');
            if (errorModal) {
                errorModal.classList.add('hidden');
            }
        });
    }
    
    if (successConfirmBtn) {
        successConfirmBtn.addEventListener('click', function() {
            const successModal = document.getElementById('success-modal');
            if (successModal) {
                successModal.classList.add('hidden');
            }
            window.location.href = '/login/';
        });
    }
    
    if (warningConfirmBtn) {
        warningConfirmBtn.addEventListener('click', function() {
            const warningModal = document.getElementById('warning-modal');
            if (warningModal) {
                warningModal.classList.add('hidden');
            }
        });
    }
    
    // Profile picture preview
    const profilePictureInput = document.getElementById('profilePicture');
    const profilePreview = document.getElementById('profilePreview');
    
    if (profilePictureInput && profilePreview) {
        profilePictureInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                // Validate file type
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    alert('Please select a valid image file (JPEG, PNG, GIF, or WEBP)');
                    e.target.value = '';
                    return;
                }
                
                // Validate file size (max 5MB)
                const maxSize = 5 * 1024 * 1024; // 5MB in bytes
                if (file.size > maxSize) {
                    alert('File size must be less than 5MB');
                    e.target.value = '';
                    return;
                }
                
                // Preview the image
                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    
    // Handle form submission
    const registerForm = document.getElementById('register');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Create FormData to handle file upload
            const formData = new FormData(this);
            
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
            if (csrfToken) {
                formData.append('csrfmiddlewaretoken', csrfToken);
            }
            
            // Show loading state
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Registering...';
            
            // Send AJAX request
            fetch('/register/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken || ''
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Show success modal
                    const successModal = document.getElementById('success-modal');
                    const successContent = document.getElementById('success-modal-content');
                    if (successModal && successContent) {
                        successContent.textContent = data.message;
                        successModal.classList.remove('hidden');
                        
                        // Redirect to login after 3 seconds
                        setTimeout(() => {
                            window.location.href = '/login/';
                        }, 3000);
                    } else {
                        alert(data.message);
                        window.location.href = '/login/';
                    }
                } else {
                    // Show error modal
                    const errorModal = document.getElementById('error-modal');
                    const errorContent = document.getElementById('error-modal-content');
                    if (errorModal && errorContent) {
                        errorContent.textContent = data.message;
                        errorModal.classList.remove('hidden');
                    } else {
                        alert(data.message);
                    }
                    
                    // Reset button
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred during registration. Please try again.');
                
                // Reset button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            });
        });
    }
});
