$(document).ready(function () {
    function initPaginationAndFiltering({
                                            containerSelector, // Use this to target each container independently
                                            itemSelector,
                                            tabSelector,
                                            filterAttr = 'status',
                                            paginationInfoSelector,
                                            paginationContainerSelector,
                                            lengthSelectSelector,
                                        }) {
        let $container = $(containerSelector); // Target the specific container
        let itemsPerPage = parseInt($container.find(lengthSelectSelector).val()); // Use the container's length select
        let currentPage = 1;
        let items = $container.find(itemSelector); // The items to be paginated
        let totalItems = items.length;
        let filteredItems = items; // Initially, no filter is applied

        // Initial render
        renderItems(currentPage, itemsPerPage);
        createPagination(itemsPerPage);

        // Tab filtering function
        $container.find(tabSelector).on('click', function () {
            let filterValue = $(this).data('filter'); // Get the filter value

            // Update active tab classes
            $container.find(tabSelector).removeClass('bg-shark-950 text-white').addClass('bg-shark-50 text-shark-950');
            $(this).removeClass('bg-shark-50 text-shark-950').addClass('bg-shark-950 text-white');

            // Filter items based on the filter value
            if (filterValue === 'all') {
                filteredItems = items;
            } else {
                filteredItems = items.filter(`[data-${filterAttr}='${filterValue}']`); // Filter by attribute
            }

            totalItems = filteredItems.length;
            currentPage = 1; // Reset to first page after filtering
            renderItems(currentPage, itemsPerPage); // Re-render items
            createPagination(itemsPerPage); // Re-create pagination
        });

        // Function to render items based on current page and items per page
        function renderItems(page, perPage) {
            let start = (page - 1) * perPage;
            let end = start + perPage;

            // Hide all and then show only the ones for the current page
            items.hide();
            filteredItems.slice(start, end).show();

            // Update pagination info
            updatePaginationInfo(page, perPage, filteredItems.length);
        }

        // Function to create pagination buttons with ellipsis
        function createPagination(perPage) {
            let totalPages = Math.ceil(filteredItems.length / perPage);
            let paginationElement = $container.find(paginationContainerSelector);
            paginationElement.empty(); // Clear old pagination buttons

            let visiblePages = getVisiblePages(currentPage, totalPages);

            // Previous button
            let prevButton = $('<button>')
                .html('<i class="ph ph-caret-left text-lg"></i>')
                .addClass('flex-shrink-0 flex-center w-[48px] h-[48px] rounded-full')
                .toggleClass('bg-purple-heart-500 text-white', currentPage > 1)
                .toggleClass('bg-shark-100 text-shark-400', currentPage === 1)
                .prop('disabled', currentPage === 1)
                .on('click', function () {
                    if (currentPage > 1) {
                        currentPage--;
                        renderItems(currentPage, itemsPerPage);
                        createPagination(itemsPerPage);
                    }
                });
            paginationElement.append(prevButton);

            // Page number buttons with ellipsis
            visiblePages.forEach(page => {
                if (page === '...') {
                    let ellipsis = $('<span>')
                        .text('...')
                        .addClass('flex-center w-[48px] h-[48px]');
                    paginationElement.append(ellipsis);
                } else {
                    let button = $('<button>')
                        .text(page)
                        .addClass('flex-center w-[48px] h-[48px] border border-shark-200 rounded-full')
                        .toggleClass('bg-purple-heart-500 text-white', page === currentPage)
                        .toggleClass('bg-white text-shark-400', page !== currentPage)
                        .on('click', function () {
                            currentPage = page;
                            renderItems(currentPage, itemsPerPage);
                            createPagination(itemsPerPage);
                        });
                    paginationElement.append(button);
                }
            });

            // Next button
            let nextButton = $('<button>')
                .html('<i class="ph ph-caret-right text-lg"></i>')
                .addClass('flex-shrink-0 flex-center w-[48px] h-[48px] rounded-full')
                .toggleClass('bg-purple-heart-500 text-white', currentPage < totalPages)
                .toggleClass('bg-shark-100 text-shark-400', currentPage === totalPages)
                .prop('disabled', currentPage === totalPages)
                .on('click', function () {
                    if (currentPage < totalPages) {
                        currentPage++;
                        renderItems(currentPage, itemsPerPage);
                        createPagination(itemsPerPage);
                    }
                });
            paginationElement.append(nextButton);
        }

        // Function to update the pagination info
        function updatePaginationInfo(page, perPage, total) {
            let start = (page - 1) * perPage + 1;
            let end = Math.min(start + perPage - 1, total);
            $container.find(paginationInfoSelector).text(`${start} to ${end} of ${total} items`);
        }

        // Handle changes in the "Items per page" dropdown
        $container.find(lengthSelectSelector).on('change', function () {
            itemsPerPage = parseInt($(this).val()); // Get the new items per page
            currentPage = 1; // Reset to the first page
            renderItems(currentPage, itemsPerPage);
            createPagination(itemsPerPage);
        });
    }

    // Function to get visible pages with ellipsis, limiting to 6 total elements
    function getVisiblePages(currentPage, totalPages) {
        const maxVisibleButtons = 6; // Maximum 6 visible elements including ellipses
        let visiblePages = [];

        // Always show the first and last page
        visiblePages.push(1);

        if (currentPage > 3) {
            visiblePages.push('...');
        }

        // Pages around the current page
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        for (let i = startPage; i <= endPage; i++) {
            visiblePages.push(i);
        }

        if (endPage < totalPages - 1) {
            visiblePages.push('...');
        }

        // Always show the last page if it's not already included
        if (totalPages > 1) {
            visiblePages.push(totalPages);
        }

        // Limit the visible pages to maxVisibleButtons (including ellipses)
        if (visiblePages.length > maxVisibleButtons) {
            const extraPages = visiblePages.length - maxVisibleButtons;
            visiblePages.splice(1, extraPages);
        }

        return visiblePages;
    }

    // Initialize the filtering and pagination with appropriate selectors
    initPaginationAndFiltering({
        containerSelector: '#notificationsContainer',
        itemSelector: '.notification-item',
        tabSelector: '.tab-filter',
        filterAttr: 'status',
        paginationInfoSelector: '#notificationPaginationInfo',
        paginationContainerSelector: '#notificationPagination',
        lengthSelectSelector: '#notificationLengthSelect'
    });
});