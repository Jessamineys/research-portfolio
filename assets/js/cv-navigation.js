// Handle cross-page navigation to specific sections
document.querySelectorAll('a[href*="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        
        // Check if it's a cross-page navigation (contains '../')
        if (href.includes('../')) {
            // Let the browser handle the navigation normally
            // The target page will handle the scrolling
            return;
        }
        
        // For same-page navigation, use smooth scrolling
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile menu functionality
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const navLinks = document.querySelector('.nav-links');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', function() {
        navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
    });
}

// Close mobile menu when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('nav')) {
        if (window.innerWidth <= 768) {
            navLinks.style.display = 'none';
        }
    }
});

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        navLinks.style.display = 'flex';
    } else {
        navLinks.style.display = 'none';
    }
});
