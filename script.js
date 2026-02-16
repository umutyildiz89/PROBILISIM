document.addEventListener('DOMContentLoaded', async () => {

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

    // --- Mobile Dropdown Toggle ---
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const toggleBtn = dropdown.querySelector('.dropdown-toggle');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                // Only prevent default on mobile/tablet widths where hover isn't primary
                if (window.innerWidth <= 768) {
                    e.preventDefault(); // Stop link navigation
                    dropdown.classList.toggle('active');
                }
            });
        }
    });

    // --- Dynamic Content Fetching ---

    // 1. Fetch & Render Partners
    async function initPartners() {
        try {
            const res = await fetch('/api/partners');
            const partners = await res.json();
            const container = document.getElementById('partners-wrapper');

            if (container && partners.length > 0) {
                container.innerHTML = '';
                partners.forEach(partner => {
                    const img = document.createElement('img');
                    img.src = partner.logo_url;
                    img.alt = partner.name;
                    img.className = 'partner-logo';
                    img.onerror = () => { img.style.display = 'none'; }; // Hide broken images
                    container.appendChild(img);
                });
            }
        } catch (err) {
            console.error('Failed to load partners:', err);
        }
    }

    // 2. Fetch & Render Slider + Init 3D Logic
    async function initSlider() {
        try {
            const res = await fetch('/api/slider');
            const itemsData = await res.json();
            const wheel = document.getElementById('wheel-wrapper');

            if (wheel && itemsData.length > 0) {
                wheel.innerHTML = '';
                itemsData.forEach(item => {
                    const div = document.createElement('div');
                    div.className = 'wheel-item';
                    div.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${item.image_url}')`;

                    // Optional: You can make content dynamic too if you extend the DB schema
                    div.innerHTML = `
                        <div class="wheel-content">
                            <h1>Poli Bilişim</h1>
                            <p>Kurumsal Teknoloji Çözümleri</p>
                        </div>
                    `;
                    wheel.appendChild(div);
                });

                // Start 3D Logic *after* content is ready
                start3DSlider();
            }
        } catch (err) {
            console.error('Failed to load slider:', err);
        }
    }

    // Execute Fetches
    await initPartners();
    await initSlider();


    // --- 3D Wheel Slider Logic (Wrapped in function) ---
    function start3DSlider() {
        const wheel = document.querySelector('.wheel');
        const items = document.querySelectorAll('.wheel-item');
        const btnUp = document.querySelector('.btn-up');
        const btnDown = document.querySelector('.btn-down');

        if (wheel && items.length > 0) {
            let currentAngle = 0;
            let targetAngle = 0;
            const radius = window.innerHeight * 0.8;
            const theta = 360 / items.length;

            items.forEach((item, index) => {
                const angle = theta * index;
                item.style.transform = `rotateX(${angle}deg) translateZ(${radius}px)`;
                item.dataset.index = index;
            });

            function updateWheel() {
                currentAngle += (targetAngle - currentAngle) * 0.1;
                wheel.style.transform = `translateZ(-${radius}px) rotateX(${-currentAngle}deg)`;

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

            if (btnUp && btnDown) {
                // Remove old listeners if any (cloning is a quick hack, but better to just add once)
                // Since this runs once after fetch, simple addEventListener is fine.
                btnUp.onclick = () => {
                    targetAngle -= theta;
                    resetAutoRotate();
                };

                btnDown.onclick = () => {
                    targetAngle += theta;
                    resetAutoRotate();
                };
            }

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
    const contactForm = document.querySelector('form');
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
                    headers: { 'Content-Type': 'application/json' },
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
                alert('Sunucuyla bağlantı kurulamadı.');
            } finally {
                submitBtn.textContent = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

});
