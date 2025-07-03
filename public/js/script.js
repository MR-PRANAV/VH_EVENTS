let lastScreenSmall = false;
let hiddenIndexes = [];

function hideRandomDivs() {
    const gridItems = document.querySelectorAll('.grid-container > div');
    const screenWidth = window.innerWidth;

    // Always reset all divs to visible first!
    gridItems.forEach(item => {
        item.style.display = 'block';
    });

    if (screenWidth < 472) {
        // Only pick new random indexes if we just entered small screen
        if (!lastScreenSmall) {
            hiddenIndexes = [];
            while (hiddenIndexes.length < 5 && hiddenIndexes.length < gridItems.length) {
                const randomIndex = Math.floor(Math.random() * gridItems.length);
                if (!hiddenIndexes.includes(randomIndex)) {
                    hiddenIndexes.push(randomIndex);
                }
            }
        }
        // Hide the selected divs
        hiddenIndexes.forEach(index => {
            if (gridItems[index]) gridItems[index].style.display = 'none';
        });
        lastScreenSmall = true;
    } else {
        // On large screens, always show all divs
        lastScreenSmall = false;
        hiddenIndexes = [];
    }
}

// Run the function on page load and on window resize
window.addEventListener('load', hideRandomDivs);
window.addEventListener('resize', hideRandomDivs);

document.addEventListener('DOMContentLoaded', () => {
  const fullscreenModal = document.getElementById('fullscreen-modal');
  const fullscreenContent = document.getElementById('fullscreen-content');
  const closeFullscreen = document.getElementById('close-fullscreen');

  // Add click event to all elements with the class (fullscreen-trigger)
  document.querySelectorAll('.fullscreen-trigger').forEach(element => {

    // Add double-click event for mouse devices
    element.addEventListener('dblclick', () => {
      const type = element.getAttribute('data-type');
      fullscreenContent.innerHTML = ''; // Clear previous content

      if (type === 'image') {
        const img = document.createElement('img');
        img.src = element.src;
        fullscreenContent.appendChild(img);
      } else if (type === 'video') {
        const video = document.createElement('video');
        video.src = element.src;
        video.controls = false;
        video.autoplay = true;
        fullscreenContent.appendChild(video);
      }

      fullscreenModal.classList.add('active');
    });

    // Handle double-tap for touch devices
    let lastTap = 0;
    element.addEventListener('touchend', () => {
      const currentTime = new Date().getTime();
      const tapGap = currentTime - lastTap;

      if (tapGap < 300 && tapGap > 0) { // Double-tap detected (within 300ms)
        const type = element.getAttribute('data-type');
        fullscreenContent.innerHTML = ''; // Clear previous content

        if (type === 'image') {
          const img = document.createElement('img');
          img.src = element.src;
          fullscreenContent.appendChild(img);
        } else if (type === 'video') {
          const video = document.createElement('video');
          video.src = element.src;
          video.controls = false;
          video.autoplay = true;
          fullscreenContent.appendChild(video);
        }

        fullscreenModal.classList.add('active');
      }

      lastTap = currentTime; // Update the last tap time
    });

    element.addEventListener('mouseenter', () => {
      // Create tooltip
      const tooltip = document.createElement('div');
      tooltip.className = 'custom-tooltip';
      tooltip.innerText = 'Double click to view it';
      document.body.appendChild(tooltip);

      // Position tooltip near the mouse
      element.addEventListener('mousemove', (event) => {
        const tooltipWidth = tooltip.offsetWidth;
        tooltip.style.left = `${event.pageX - tooltipWidth - 10}px`; // Position to the left of the mouse
        tooltip.style.top = `${event.pageY}px`; // Align vertically with the mouse
      });
    });

    element.addEventListener('mouseleave', () => {
      // Remove tooltip
      const tooltip = document.querySelector('.custom-tooltip');
      if (tooltip) {
        tooltip.remove();
      }
    });
  });

  // Close 
  closeFullscreen.addEventListener('click', () => {
    fullscreenModal.classList.remove('active');
    fullscreenContent.innerHTML = ''; 
  });
});

// -------------------------------------------------------------------------------

// login-signup switching form javascript Start

const loginText = document.querySelector(".title-text .login");
const loginForm = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector("form .signup-link a");
signupBtn.onclick = () => {
  loginForm.style.marginLeft = "-50%";
  loginText.style.marginLeft = "-50%";
};
loginBtn.onclick = () => {
  loginForm.style.marginLeft = "0%";
  loginText.style.marginLeft = "0%";
};
signupLink.onclick = () => {
  signupBtn.click();
  return false;
};

// login-signup switching form javascript End
// -------------------------------------------------------------------------------


// Form validation for login and signup forms Start
document.addEventListener('DOMContentLoaded', () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  const loginForm = document.querySelector('form.login');
  const signupForm = document.querySelector('form.signup');

  function showError(input, message) {
    const errorDiv = input.parentElement.querySelector('.error-msg');
    errorDiv.textContent = message || '';
  }

  function validateRequired(input, fieldName) {
    if (!input.value.trim()) {
      showError(input, `${fieldName} is required.`);
      return false;
    }
    showError(input, "");
    return true;
  }

  function validateEmail(input) {
    if (!input.value.trim()) {
      showError(input, "Email is required.");
      return false;
    }
    if (!emailRegex.test(input.value.trim())) {
      showError(input, "Invalid email format.");
      return false;
    }
    showError(input, "");
    return true;
  }

  function validatePassword(input) {
    if (!input.value) {
      showError(input, "Password is required.");
      return false;
    }
    if (!strongPasswordRegex.test(input.value)) {
      showError(input, "Password must be 8 characters long and include upper/lowercase, numbers, symbols.");
      return false;
    }
    showError(input, "");
    return true;
  }

  function validateConfirmPassword(passwordInput, confirmInput) {
    if (!confirmInput.value) {
      showError(confirmInput, "Confirm Password is required.");
      return false;
    }
    if (passwordInput.value !== confirmInput.value) {
      showError(confirmInput, "Passwords do not match.");
      return false;
    }
    showError(confirmInput, "");
    return true;
  }

  // Login validation
  loginForm.addEventListener('submit', (e) => {
    const email = loginForm.querySelector('input[name="loginEmail"]');
    const password = loginForm.querySelector('input[name="loginPassword"]');

    const isEmailRequired = validateRequired(email, "Email");
    const isPasswordRequired = validateRequired(password, "Password");
    const isValidEmail = validateEmail(email);
    const isValidPassword = validatePassword(password);

    if (!isEmailRequired || !isPasswordRequired || !isValidEmail || !isValidPassword) {
      e.preventDefault();
    }
  });

  // Signup validation
  signupForm.addEventListener('submit', (e) => {
    const email = signupForm.querySelector('input[name="signupEmail"]');
    const password = signupForm.querySelector('input[name="signupPassword"]');
    const confirmPassword = signupForm.querySelector('input[name="signupConfirm"]');

    const isEmailRequired = validateRequired(email, "Email");
    const isPasswordRequired = validateRequired(password, "Password");
    const isConfirmRequired = validateRequired(confirmPassword, "Confirm Password");
    const isValidEmail = validateEmail(email);
    const isValidPassword = validatePassword(password);
    const isMatch = validateConfirmPassword(password, confirmPassword);

    if (!isEmailRequired || !isPasswordRequired || !isConfirmRequired || !isValidEmail || !isValidPassword || !isMatch) {
      e.preventDefault();
    }
  });
});

// Form validation for login and signup forms End
// -------------------------------------------------------------------------------
// Smooth scrolling for anchor links Start
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});
// Smooth scrolling for anchor links End
// -------------------------------------------------------------------------------




