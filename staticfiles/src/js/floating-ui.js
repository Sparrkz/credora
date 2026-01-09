import {
    computePosition,
    offset,
    flip,
    shift,
    arrow
} from 'https://cdn.jsdelivr.net/npm/@floating-ui/dom@1.6.10/+esm';

$(document).ready(function () {
    // Loop through each dropdown container
    $('.nav-dropdown-container').each(function () {
        const reference = $(this).find('.nav-dropdown-toggle'); // The button in this dropdown
        const dropdown = $(this).find('.nav-dropdown-content'); // The dropdown content for this button
        const arrowEl = $(this).find('.nav-dropdown-arrow')[0]; // The dropdown arrow

        // Function to update position using Floating UI
        function update() {
            computePosition(reference[0], dropdown[0], {
                placement: 'bottom',
                middleware: [offset(6), flip(), shift({padding: 16}),  arrow({ element: arrowEl, padding: 3 })],
            }).then(({x, y, middlewareData}) => {
                dropdown.css({
                    left: `${x}px`,
                    top: `${y}px`,
                });

                // Adding small arrow to the top
                if (middlewareData.arrow) {
                    const {x, y} = middlewareData.arrow;
                    Object.assign(arrowEl.style, {
                        left: x != null ? `${x}px` : '',
                        top: y != null ? `${y}px` : '',
                    });
                }
            });
        }


        // Toggle dropdown when the reference button is clicked
        reference.on('click', function (event) {
            event.stopPropagation(); // Prevent event bubbling
            let dropdown_icon = $(this).find(".nav-dropdown-icon")

            if (dropdown.hasClass('hidden')) {
                dropdown.removeClass('hidden').addClass('flex');
                dropdown_icon.html('<i class="ph ph-caret-up"></i>');
                update(); // Update the position using Floating UI
            } else {
                dropdown.removeClass('flex').addClass('hidden');
                dropdown_icon.html('<i class="ph ph-caret-down"></i>')
            }
        });

        // Hide dropdown if clicking outside
        $(document).on('click', function (event) {
            if (!reference.is(event.target) && !dropdown.is(event.target) && dropdown.has(event.target).length === 0) {
                if (!dropdown.hasClass('hidden')) {
                    dropdown.removeClass('flex').addClass('hidden');
                    reference.find(".nav-dropdown-icon").html('<i class="ph ph-caret-down"></i>');
                }
            }
        });


    });
});