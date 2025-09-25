// Neumorphism Login Form JavaScript
class NeumorphismLoginForm {
    constructor() {
        this.form = document.getElementById('loginForm');
        this.registerForm = document.getElementById('registerForm');
        this.emailInput = document.getElementById('email');
        this.passwordInput = document.getElementById('password');
        this.passwordToggle = document.getElementById('passwordToggle');
        this.submitButton = this.form.querySelector('.login-btn');
        this.registerButton = this.registerForm.querySelector('.register-btn');
        this.successMessage = document.getElementById('successMessage');
        this.socialButtons = [];
        
        // API Configuration
        this.API_BASE_URL = 'https://sanguivia-backend.onrender.com/api';
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.setupPasswordToggle();
        this.setupRegisterPasswordToggle();
        this.setupNeumorphicEffects();
    }
    
    bindEvents() {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        this.emailInput.addEventListener('blur', () => this.validateEmail());
        this.passwordInput.addEventListener('blur', () => this.validatePassword());
        this.emailInput.addEventListener('input', () => this.clearError('email'));
        this.passwordInput.addEventListener('input', () => this.clearError('password'));
        
        // Add soft press effects to inputs
        [this.emailInput, this.passwordInput].forEach(input => {
            input.addEventListener('focus', (e) => this.addSoftPress(e));
            input.addEventListener('blur', (e) => this.removeSoftPress(e));
        });
    }
    
    setupPasswordToggle() {
        this.passwordToggle.addEventListener('click', () => {
            const type = this.passwordInput.type === 'password' ? 'text' : 'password';
            this.passwordInput.type = type;
            
            this.passwordToggle.classList.toggle('show-password', type === 'text');
            
            // Add soft click animation
            this.animateSoftPress(this.passwordToggle);
        });
    }
    
    setupRegisterPasswordToggle() {
        const regPasswordToggle = document.getElementById('regPasswordToggle');
        const regPasswordInput = document.getElementById('regPassword');
        
        if (regPasswordToggle && regPasswordInput) {
            regPasswordToggle.addEventListener('click', () => {
                const type = regPasswordInput.type === 'password' ? 'text' : 'password';
                regPasswordInput.type = type;
                
                regPasswordToggle.classList.toggle('show-password', type === 'text');
                
                // Add soft click animation
                this.animateSoftPress(regPasswordToggle);
            });
        }
    }
    
    
    setupNeumorphicEffects() {
        // Add hover effects to all neumorphic elements
        const neuElements = document.querySelectorAll('.neu-icon, .neu-checkbox');
        neuElements.forEach(element => {
            element.addEventListener('mouseenter', () => {
                element.style.transform = 'scale(1.05)';
            });
            
            element.addEventListener('mouseleave', () => {
                element.style.transform = 'scale(1)';
            });
        });
        
        // Add ambient light effect on mouse move
        document.addEventListener('mousemove', (e) => {
            this.updateAmbientLight(e);
        });
    }
    
    updateAmbientLight(e) {
        const card = document.querySelector('.login-card');
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const angleX = (x - centerX) / centerX;
        const angleY = (y - centerY) / centerY;
        
        const shadowX = angleX * 30;
        const shadowY = angleY * 30;
        
        card.style.boxShadow = `
            ${shadowX}px ${shadowY}px 60px #bec3cf,
            ${-shadowX}px ${-shadowY}px 60px #ffffff
        `;
    }
    
    addSoftPress(e) {
        const inputGroup = e.target.closest('.neu-input');
        inputGroup.style.transform = 'scale(0.98)';
    }
    
    removeSoftPress(e) {
        const inputGroup = e.target.closest('.neu-input');
        inputGroup.style.transform = 'scale(1)';
    }
    
    animateSoftPress(element) {
        element.style.transform = 'scale(0.95)';
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
    
    validateEmail() {
        const email = this.emailInput.value.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (!email) {
            this.showError('email', 'Email jest wymagany');
            return false;
        }
        
        if (!emailRegex.test(email)) {
            this.showError('email', 'Wprowadź prawidłowy adres email');
            return false;
        }
        
        this.clearError('email');
        return true;
    }
    
    validatePassword() {
        const password = this.passwordInput.value;
        
        if (!password) {
            this.showError('password', 'Hasło jest wymagane');
            return false;
        }
        
        if (password.length < 6) {
            this.showError('password', 'Hasło musi mieć co najmniej 6 znaków');
            return false;
        }
        
        this.clearError('password');
        return true;
    }
    
    showError(field, message) {
        const formGroup = document.getElementById(field).closest('.form-group');
        const errorElement = document.getElementById(`${field}Error`);
        
        formGroup.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Add gentle shake animation
        const input = document.getElementById(field);
        input.style.animation = 'gentleShake 0.5s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }
    
    clearError(field) {
        const formGroup = document.getElementById(field).closest('.form-group');
        const errorElement = document.getElementById(`${field}Error`);
        
        formGroup.classList.remove('error');
        errorElement.classList.remove('show');
        setTimeout(() => {
            errorElement.textContent = '';
        }, 300);
    }
    
    async handleSubmit(e) {
        e.preventDefault();
        
        const isEmailValid = this.validateEmail();
        const isPasswordValid = this.validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            this.animateSoftPress(this.submitButton);
            return;
        }
        
        this.setLoading(true);
        
        try {
            const email = this.emailInput.value.trim();
            const password = this.passwordInput.value;
            
            const response = await fetch(`${this.API_BASE_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store token and user data
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('userData', JSON.stringify(data.user));
                
                // Show neumorphic success
                this.showNeumorphicSuccess();
            } else {
                this.showError('password', data.error || 'Logowanie nie powiodło się');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('password', 'Błąd połączenia z serwerem');
        } finally {
            this.setLoading(false);
        }
    }
    
    async handleRegister(e) {
        e.preventDefault();
        
        const firstname = document.getElementById('regFirstname').value.trim();
        const lastname = document.getElementById('regLastname').value.trim();
        const login = document.getElementById('regLogin').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const password = document.getElementById('regPassword').value;
        
        // Validate all fields
        let isValid = true;
        
        if (!firstname) {
            this.showRegisterError('regFirstname', 'Imię jest wymagane');
            isValid = false;
        }
        
        if (!lastname) {
            this.showRegisterError('regLastname', 'Nazwisko jest wymagane');
            isValid = false;
        }
        
        if (!login) {
            this.showRegisterError('regLogin', 'Login jest wymagany');
            isValid = false;
        }
        
        if (!email) {
            this.showRegisterError('regEmail', 'Email jest wymagany');
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this.showRegisterError('regEmail', 'Wprowadź prawidłowy adres email');
            isValid = false;
        }
        
        if (!password) {
            this.showRegisterError('regPassword', 'Hasło jest wymagane');
            isValid = false;
        } else if (password.length < 6) {
            this.showRegisterError('regPassword', 'Hasło musi mieć co najmniej 6 znaków');
            isValid = false;
        }
        
        if (!isValid) {
            this.animateSoftPress(this.registerButton);
            return;
        }
        
        this.setRegisterLoading(true);
        
        try {
            const response = await fetch(`${this.API_BASE_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ firstname, lastname, login, email, password })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Show success message
                this.showRegisterSuccess();
            } else {
                this.showRegisterError('regEmail', data.error || 'Rejestracja nie powiodła się');
            }
        } catch (error) {
            console.error('Register error:', error);
            this.showRegisterError('regEmail', 'Błąd połączenia z serwerem');
        } finally {
            this.setRegisterLoading(false);
        }
    }
    
    showRegisterError(field, message) {
        const formGroup = document.getElementById(field).closest('.form-group');
        const errorElement = document.getElementById(`${field}Error`);
        
        formGroup.classList.add('error');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Add gentle shake animation
        const input = document.getElementById(field);
        input.style.animation = 'gentleShake 0.5s ease-in-out';
        setTimeout(() => {
            input.style.animation = '';
        }, 500);
    }
    
    showRegisterSuccess() {
        // Hide registration form
        this.registerForm.style.display = 'none';
        
        // Show success message
        this.successMessage.innerHTML = `
            <div class="success-icon neu-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <h3>Rejestracja pomyślna!</h3>
            <p>Sprawdź email, aby aktywować konto.</p>
            <p><a href="#" onclick="showLoginForm()" style="color: #6c7293;">Przejdź do logowania</a></p>
        `;
        this.successMessage.classList.add('show');
    }
    
    setRegisterLoading(loading) {
        this.registerButton.classList.toggle('loading', loading);
        this.registerButton.disabled = loading;
    }
    
    
    setLoading(loading) {
        this.submitButton.classList.toggle('loading', loading);
        this.submitButton.disabled = loading;
        
    }
    
    showNeumorphicSuccess() {
        // Soft fade out form
        this.form.style.transform = 'scale(0.95)';
        this.form.style.opacity = '0';
        
        setTimeout(() => {
            this.form.style.display = 'none';
            document.querySelector('.signup-link').style.display = 'none';
            
            // Show success with soft animation
            this.successMessage.classList.add('show');
            
            // Animate success icon
            const successIcon = this.successMessage.querySelector('.neu-icon');
            successIcon.style.animation = 'successPulse 0.6s ease-out';
            
        }, 300);
        
        // Simulate redirect
        setTimeout(() => {
            console.log('Redirecting to dashboard...');
            // window.location.href = '/dashboard';
        }, 2500);
    }
}

// Add custom animations
if (!document.querySelector('#neu-keyframes')) {
    const style = document.createElement('style');
    style.id = 'neu-keyframes';
    style.textContent = `
        @keyframes gentleShake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-3px); }
            75% { transform: translateX(3px); }
        }
        
        @keyframes successPulse {
            0% { transform: scale(0.8); opacity: 0; }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
}

// Funkcje rejestracji i zapomnianego hasła
function showRegisterForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    document.querySelector('.signup-link').style.display = 'none';
    document.getElementById('successMessage').classList.remove('show');
}

function showLoginForm() {
    document.getElementById('registerForm').style.display = 'none';
    document.getElementById('loginForm').style.display = 'block';
    document.querySelector('.signup-link').style.display = 'block';
    document.getElementById('successMessage').classList.remove('show');
}

async function showForgotPassword() {
    const email = prompt('Wprowadź swój adres email, aby zresetować hasło:');
    if (!email) return;
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Wprowadź prawidłowy adres email');
        return;
    }
    
    try {
        const response = await fetch('https://sanguivia-backend.onrender.com/api/forgot-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Link do resetu hasła został wysłany na email');
        } else {
            alert(data.error || 'Błąd podczas wysyłania linku resetu');
        }
    } catch (error) {
        console.error('Forgot password error:', error);
        alert('Błąd połączenia z serwerem');
    }
}

// Dodaj event listener dla linku "Zapomniałeś hasła?"
document.addEventListener('DOMContentLoaded', () => {
    new NeumorphismLoginForm();
    
    // Dodaj funkcję do linku "Zapomniałeś hasła?"
    const forgotLink = document.querySelector('.forgot-link');
    if (forgotLink) {
        forgotLink.addEventListener('click', (e) => {
            e.preventDefault();
            showForgotPassword();
        });
    }
});
