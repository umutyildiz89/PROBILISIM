// using native fetch

async function addImages() {
    const images = [
        { image_url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1920&h=1080&fit=crop' }, // Cyber Tech
        { image_url: 'https://images.unsplash.com/photo-1558494949-efc025793ad1?q=80&w=1920&h=1080&fit=crop' }  // Server/Data
    ];

    try {
        for (const img of images) {
            const response = await fetch('http://localhost:3000/api/slider', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(img)
            });
            const data = await response.json();
            console.log('Added:', data);
        }
    } catch (err) {
        console.error('Error adding images:', err);
    }
}

addImages();
