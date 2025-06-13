document.addEventListener('DOMContentLoaded', function() {
    // Handle PDF loading
    const pdfViewer = document.getElementById('pdfViewer');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const pdfFallback = document.getElementById('pdfFallback');
    
    if (pdfViewer && loadingIndicator && pdfFallback) {
        // Show PDF viewer after loading
        pdfViewer.onload = function() {
            loadingIndicator.style.display = 'none';
            pdfViewer.style.display = 'block';
        };
        
        // Handle PDF loading errors
        pdfViewer.onerror = function() {
            loadingIndicator.style.display = 'none';
            pdfFallback.style.display = 'block';
        };
        
        // Fallback timeout in case onload doesn't fire
        setTimeout(function() {
            if (pdfViewer.style.display === 'none') {
                loadingIndicator.style.display = 'none';
                
                // Try to detect if PDF loaded by checking if iframe has content
                try {
                    if (pdfViewer.contentDocument || pdfViewer.contentWindow) {
                        pdfViewer.style.display = 'block';
                    } else {
                        pdfFallback.style.display = 'block';
                    }
                } catch (e) {
                    // Cross-origin or other access issues - show fallback
                    pdfFallback.style.display = 'block';
                }
            }
        }, 5000);
    }

    // Mobile menu functionality
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileMenuToggle && navLinks) {
        mobileMenuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('mobile-open');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('nav') && navLinks) {
            navLinks.classList.remove('mobile-open');
        }
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && navLinks) {
            navLinks.classList.remove('mobile-open');
        }
    });
});
