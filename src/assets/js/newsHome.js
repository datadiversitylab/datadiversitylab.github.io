const container = document.getElementById('dropdown-cards');
let isDragging = false;
let startX;
let scrollLeft;
let velocity;
let frame;
let timestamp;
let ticker;

const track = () => {
    // Compare the current timestamp with the last timestamp
    const now = Date.now();
    const elapsed = now - timestamp;
    timestamp = now;

    // How far have we moved since the last frame?
    const delta = container.scrollLeft - frame;
    frame = container.scrollLeft;

    // Velocity is the movement per frame times the number of frames per second
    // This gives a smooth approximation of speed at the last moment of drag
    velocity = (delta / elapsed) * (1000 / 60);

    // Call track again next frame
    ticker = requestAnimationFrame(track);
};

const autoScroll = () => {
    if (!isDragging) {
    // Slow down the scrolling speed
    velocity *= 0.95;

    // If the velocity is below a small threshold, stop the auto-scroll
    if (Math.abs(velocity) < 0.5) {
        cancelAnimationFrame(ticker);
    } else {
        container.scrollLeft += velocity;
        // Keep the momentum going
        requestAnimationFrame(autoScroll);
    }
    }
};

container.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX - container.offsetLeft;
    scrollLeft = container.scrollLeft;
    container.classList.add('active');

    // Kick off the tracking of the drag velocity
    frame = container.scrollLeft;
    timestamp = Date.now();
    clearInterval(ticker);
    ticker = requestAnimationFrame(track);
});

container.addEventListener('mouseleave', () => {
    isDragging = false;
    container.classList.remove('active');
});

container.addEventListener('mouseup', () => {
    isDragging = false;
    container.classList.remove('active');

    // Stop tracking the velocity and start the momentum scroll
    cancelAnimationFrame(ticker);
    requestAnimationFrame(autoScroll);
});

container.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startX);
    container.scrollLeft = scrollLeft - walk;
});