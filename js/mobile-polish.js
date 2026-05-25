
// Mobile enhancements
document.addEventListener('DOMContentLoaded', function() {
    // Menu toggle for mobile
    const menuButton = document.querySelector('.menu-toggle');
    const navMenu = document.querySelector('nav');
    if(menuButton && navMenu) {
        menuButton.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Lazy loading for images
    const lazyImages = document.querySelectorAll('img[data-src]');
    const lazyLoad = (target) => {
        const io = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if(entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.disconnect();
                }
            });
        });
        io.observe(target);
    };
    lazyImages.forEach(lazyLoad);

    // Simple product search
    const searchInput = document.querySelector('#product-search');
    const products = document.querySelectorAll('.product-item');
    if(searchInput) {
        searchInput.addEventListener('input', (e) => {
            const q = e.target.value.toLowerCase();
            products.forEach(p => {
                const name = p.querySelector('.product-name').textContent.toLowerCase();
                p.style.display = name.includes(q) ? '' : 'none';
            });
        });
    }
});
