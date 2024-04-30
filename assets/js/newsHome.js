const container = document.getElementById('dropdown-cards');
let isDragging = false;
let startX;
let scrollLeft;
let velocity;
let frame;
let timestamp;
let ticker;

const track = () => {
    const now = Date.now();
    const elapsed = now - timestamp;
    timestamp = now;
    const delta = container.scrollLeft - frame;
    frame = container.scrollLeft;
    velocity = (delta / elapsed) * (1000 / 60);
    ticker = requestAnimationFrame(track);
};

const autoScroll = () => {
    if (!isDragging) {
        velocity *= 0.95;
        if (Math.abs(velocity) < 0.5) {
            cancelAnimationFrame(ticker);
        } else {
            container.scrollLeft += velocity;
            requestAnimationFrame(autoScroll);
        }
    }
};

// Mouse Event Listeners
container.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.classList.add('active');
    frame = container.scrollLeft;
    timestamp = Date.now();
    clearInterval(ticker);
    ticker = requestAnimationFrame(track);
});

container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX);
    container.scrollLeft = scrollLeft - walk;
});

container.addEventListener('mouseup', () => {
    isDragging = false;
    container.classList.remove('active');
    cancelAnimationFrame(ticker);
    requestAnimationFrame(autoScroll);
});

container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.classList.remove('active');
});

// Touch Event Listeners
container.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    isDragging = true;
    startX = touch.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.classList.add('active');
    frame = container.scrollLeft;
    timestamp = Date.now();
    clearInterval(ticker);
    ticker = requestAnimationFrame(track);
    // e.preventDefault(); // Prevents scrolling the window
});

container.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    e.preventDefault(); // Prevents scrolling the window
    const x = touch.pageX - container.offsetLeft;
    const walk = (x - startX);
    container.scrollLeft = scrollLeft - walk;
});

container.addEventListener('touchend', () => {
    isDragging = false;
    container.classList.remove('active');
    cancelAnimationFrame(ticker);
    requestAnimationFrame(autoScroll);
});
