// Reusable function to initialize a Swiper instance
function initializeSwiper(selector, options) {
    const swiperEl = document.querySelector(selector);
    if (swiperEl) {
        Object.assign(swiperEl, options);
        swiperEl.initialize();
    }
}


// Service Swiper options
const serviceSwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 10,
    loop: true,
    navigation: {
        nextEl: '.service-swiper-button-next', // Unique class for service swiper next button
        prevEl: '.service-swiper-button-prev', // Unique class for service swiper prev button
    },
    pagination: {
        clickable: true,
        el: '.service-swiper-pagination',
    },
    grid: {
        rows: 2,
        fill: "row",
    },
    breakpoints: {
        320: {
            slidesPerView: 1,
            spaceBetween: 16,
            grid: {rows: 4, fill: "row"},
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 20,
            grid: {rows: 1, fill: "row"},
        },
        1024: {
            slidesPerView: 3.4,
            spaceBetween: 20,
            grid: {rows: 1, fill: "row"},
        },
        1280: {
            slidesPerView: 4,
            spaceBetween: 20,
            grid: {rows: 1, fill: "row"},
        },
    },
};



// Review Swiper options
const reviewSwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 10,
    loop: true,
    autoplay: {
        delay: 5000, // Autoplay delay
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
        pauseOnMouseLeave: true,
    },
    navigation: {
        nextEl: '.review-swiper-button-next', // Unique class for review swiper next button
        prevEl: '.review-swiper-button-prev', // Unique class for review swiper prev button
    },
    pagination: {
        clickable: true,
        el: '.review-swiper-pagination',
    },
    grid: {
        rows: 2,
        fill: "row",
    },
    breakpoints: {
        320: {
            slidesPerView: 1,
            spaceBetween: 16,
            grid: {rows: 4, fill: "row"},
        },
        768: {
            slidesPerView: 1.5,
            spaceBetween: 20,
            grid: {rows: 2, fill: "row"},
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 20,
            grid: {rows: 1, fill: "row"},
        },
        1280: {
            slidesPerView: 3,
            spaceBetween: 20,
            grid: {rows: 1, fill: "row"},
        },
    },
};


// Main Service Swiper options
const mainServiceSwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 10,
    loop: true,
    navigation: {
        nextEl: '.mainService-swiper-button-next', // Unique class for mainService swiper next button
        prevEl: '.mainService-swiper-button-prev', // Unique class for mainService swiper prev button
    },
    pagination: {
        clickable: true,
        el: '.mainService-swiper-pagination',
    },
    grid: {
        rows: 2,
        fill: "row",
    },
    breakpoints: {
        320: {
            slidesPerView: 1,
            spaceBetween: 14,
            grid: {rows: 6, fill: "row"},
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 20,
            grid: {rows: 3, fill: "row"},
        },
        1024: {
            slidesPerView: 3,
            spaceBetween: 20,
            grid: {rows: 2, fill: "row"},
        },
        1280: {
            slidesPerView: 3,
            spaceBetween: 40,
            grid: {rows: 2, fill: "row"},
        },
    },
};


// Initialize Swipers when the document is ready
document.addEventListener('DOMContentLoaded', function () {
    initializeSwiper('.service-swiper', serviceSwiperOptions);
    initializeSwiper('.review-swiper', reviewSwiperOptions);
    initializeSwiper('.mainService-swiper', mainServiceSwiperOptions);
});


AOS.init({
    offset: 20, // Adjust this value to control when animations trigger globally
    duration: 1000, // Duration of the animation
    easing: 'ease-in-out', // Easing function for the animation
    once: true, // Whether animation should happen only once or every time you scroll up and down
});