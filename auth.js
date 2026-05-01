// Wait for page to load
document.addEventListener('DOMContentLoaded', function() {
    
    // Get elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const showSignupLink = document.getElementById('showSignupLink');
    const showLoginLink = document.getElementById('showLoginLink');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const forgotPassword = document.getElementById('forgotPassword');
    
    // Form switching
    if (showSignupLink) {
        showSignupLink.onclick = function(e) {
            e.preventDefault();
            loginForm.style.display = 'none';
            signupForm.style.display = 'block';
        };
    }
    
    if (showLoginLink) {
        showLoginLink.onclick = function(e) {
            e.preventDefault();
            signupForm.style.display = 'none';
            loginForm.style.display = 'block';
        };
    }
    
    // Signup
    if (signupBtn) {
        signupBtn.onclick = async function() {
            const name = document.getElementById('signupName').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;
            
            if (!name || !email || !password) {
                alert('Please fill all fields');
                return;
            }
            
            if (password.length < 6) {
                alert('Password must be at least 6 characters');
                return;
            }
            
            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await db.collection('users').doc(userCredential.user.uid).set({
                    name: name,
                    email: email,
                    createdAt: new Date()
                });
                
                alert('Account created successfully! Please login.');
                loginForm.style.display = 'block';
                signupForm.style.display = 'none';
                
                document.getElementById('signupName').value = '';
                document.getElementById('signupEmail').value = '';
                document.getElementById('signupPassword').value = '';
                
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };
    }
    
    // LOGIN
    if (loginBtn) {
        loginBtn.onclick = async function() {
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                alert('Please enter email and password');
                return;
            }
            
            try {
                await auth.signInWithEmailAndPassword(email, password);
                alert('Login successful!');
                window.location.href = 'dashboard.html';
            } catch (error) {
                alert('Error: ' + error.message);
            }
        };
    }
    
    // Forgot Password
    if (forgotPassword) {
        forgotPassword.onclick = async function(e) {
            e.preventDefault();
            const email = prompt('Enter your email address:');
            
            if (email) {
                try {
                    await auth.sendPasswordResetEmail(email);
                    alert('Password reset email sent! Check your inbox.');
                } catch (error) {
                    alert('Error: ' + error.message);
                }
            }
        };
    }
    
});