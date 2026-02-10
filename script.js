document.addEventListener('DOMContentLoaded', () => {

    // --- Mobile Menu Toggle ---
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.main-nav');

    if (mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            const icon = mobileBtn.querySelector('i');
            if (nav.classList.contains('active')) {
                icon.classList.replace('ri-menu-line', 'ri-close-line');
            } else {
                icon.classList.replace('ri-close-line', 'ri-menu-line');
            }
        });
    }

    // --- 3D Wheel Slider Logic ---
    const wheel = document.querySelector('.wheel');
    const items = document.querySelectorAll('.wheel-item');
    const btnUp = document.querySelector('.btn-up');
    const btnDown = document.querySelector('.btn-down');

    if (wheel && items.length > 0) {
        let currentAngle = 0;
        let targetAngle = 0;
        // Adjust radius based on window height to keep proportion
        const radius = window.innerHeight * 0.8;
        const theta = 360 / items.length;

        // Initialize positions
        items.forEach((item, index) => {
            const angle = theta * index;
            item.style.transform = `rotateX(${angle}deg) translateZ(${radius}px)`;
            item.dataset.index = index;
        });

        function updateWheel() {
            currentAngle += (targetAngle - currentAngle) * 0.1;
            wheel.style.transform = `translateZ(-${radius}px) rotateX(${-currentAngle}deg)`;

            // Highlight active item
            items.forEach((item, index) => {
                const itemAngle = theta * index;
                let diff = (itemAngle - currentAngle) % 360;
                if (diff < -180) diff += 360;
                if (diff > 180) diff -= 360;

                if (Math.abs(diff) < theta / 2) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });

            requestAnimationFrame(updateWheel);
        }

        updateWheel();

        // Control Buttons
        if (btnUp && btnDown) {
            btnUp.addEventListener('click', () => {
                targetAngle -= theta;
                resetAutoRotate();
            });

            btnDown.addEventListener('click', () => {
                targetAngle += theta;
                resetAutoRotate();
            });
        }

        // Mouse Wheel Control
        let scrollTimeout;
        window.addEventListener('wheel', (e) => {
            if (window.scrollY < 500) {
                targetAngle += e.deltaY * 0.1;
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    const nearestIndex = Math.round(targetAngle / theta);
                    targetAngle = nearestIndex * theta;
                }, 100);
                resetAutoRotate();
            }
        }, { passive: false });

        // Auto Rotate
        let autoRotateTimer;
        function startAutoRotate() {
            autoRotateTimer = setInterval(() => {
                targetAngle += theta;
            }, 5000);
        }

        function resetAutoRotate() {
            clearInterval(autoRotateTimer);
            startAutoRotate();
        }

        startAutoRotate();
    }

    // --- Smooth Scroll for Anchors ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // --- Contact Form Submission ---
    const contactForm = document.querySelector('form'); // Assuming only one form
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = 'Gönderiliyor...';
            submitBtn.disabled = true;

            const formData = new FormData(contactForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.');
                    contactForm.reset();
                } else {
                    alert('Bir hata oluştu: ' + (result.error || 'Bilinmeyen hata'));
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Sunucuyla bağlantı kurulamadı. Lütfen daha sonra tekrar deneyiniz.');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
});
