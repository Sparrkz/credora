$(document).ready(function () {
    // DataTable default configuration
    $.extend(true, DataTable.ext.classes, {
        table: 'table-auto min-w-full',  // Tailwind classes for the table

        thead: {
            row: 'bg-shark-50 !text-left ',  // Header row styles
            cell: '!break-words !whitespace-normal py-4 px-4 text-sm text-shark-950 uppercase tracking-wider',  // Header cell styles
        },

        tbody: {
            row: 'even:bg-shark-50 hover:bg-shark-100/40 ',  // even:bg-shark-50 Alternating row background and hover effect
            cell: 'py-4 px-4 whitespace-nowrap ',  // Body cell styles
        },

        tfoot: {
            row: 'bg-shark-50 text-left',  // Footer row styles
            cell: ' py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',  // Footer row styles
        },
        processing: 'text-gray-600 text-sm p-4 bg-gray-50',  // Processing state text styling
    });

    // Initialize Transaction Table with Tab Filtering if present
    if ($('#transactionTable').length) {
        initializeTable('transactionTable', 'transactionSearchBox', 'transactionLengthSelect', 'transactionPaginationInfo', 'transactionPagination', {
            pageLength: 10,
        });
        initializeTabFilter('.tab-filter', 'transactionTable', 3); // Tab filter for the second column (Transaction Type)
    }

    // Initialize Transaction Table with Tab Filtering if present
    if ($('#transactionTableDash').length) {
        initializeTable('transactionTableDash', 'transactionSearchBoxDash', 'transactionLengthSelectDash', 'transactionPaginationInfoDash', 'transactionPaginationDash', {
            pageLength: 4,
        });
    }

    // Initialize Customer Table without filtering but with search if present
    if ($('#depositTable').length) {
        initializeTable('depositTable', 'depositSearchBox', 'depositLengthSelect', 'depositPaginationInfo', 'depositPagination', {
            pageLength: 10,
        });
    }


    // Initialize Customer Table without filtering but with search if present
    if ($('#customerTable').length) {
        initializeTable('customerTable', 'customerSearchBox', 'customerLengthSelect', 'customerPaginationInfo', 'customerPagination', {
            pageLength: 10,
        });
    }

    // Initialize Loans Table without filtering but with search if present
    if ($('#loanTable').length) {
        initializeTable('loanTable', 'loanSearchBox', 'loanLengthSelect', 'loanPaginationInfo', 'loanPagination', {
            pageLength: 10,
        });
    }

    // Initialize Cashback Table without filtering but with search if present
    if ($('#cashbackTable').length) {
        initializeTable('cashbackTable', 'cashbackSearchBox', 'cashbackLengthSelect', 'cashbackPaginationInfo', 'cashbackPagination', {
            pageLength: 10,
        });
    }

    // Initialize Notification Table without filtering but with search if present
    if ($('#notificationTable').length) {
        initializeTable('notificationTable', null, 'notificationLengthSelect', 'notificationPaginationInfo', 'notificationPagination');
        initializeTabFilter('.tab-filter', 'transactionTable', 1);
    }
});

// General Table Initialization Function
function initializeTable(tableId, searchBoxId, lengthSelectId, paginationInfoId, paginationContainerId, options = {}) {
    let defaultOptions = {
        scrollX: true,
        paging: true,
        info: true,
        lengthChange: true,
        pageLength: 10,
        "columnDefs": [
            {
                "targets": 0,    // Target the first column (ID)
                "visible": false // Hide the ID column but keep it for ordering
            }
        ],
        "order": [[0, "desc"]],
        dom: 'rt',
        ...options // merge any additional options passed in
    };

    let table = $(`#${tableId}`).DataTable(defaultOptions);

    // Search functionality
    if (searchBoxId && $(`#${searchBoxId}`).length) {
        $(`#${searchBoxId}`).on('keyup', function () {
            table.search(this.value).draw();
        });
    }

    // Custom length dropdown handling
    if (lengthSelectId && $(`#${lengthSelectId}`).length) {
        let lengthOptions = [10, 25, 50, 100]; // Default length options
        let lengthSelect = $(`#${lengthSelectId}`);
        lengthOptions.forEach(function (value) {
            lengthSelect.append(`<option value="${value}">Show ${value}</option>`);
        });

        // Set initial value for length select
        lengthSelect.val(table.page.len());

        // Handle length select change event
        lengthSelect.on('change', function () {
            let selectedValue = $(this).val();
            table.page.len(selectedValue).draw();
        });
    }

    // Custom Pagination Handling
    function updatePagination() {
        let pageInfo = table.page.info();
        let paginationElement = $(`#${paginationContainerId}`);
        paginationElement.empty(); // Clear old pagination buttons

        const maxVisiblePages = 5; // Number of visible pages before adding ellipsis
        const currentPage = pageInfo.page + 1;
        const totalPages = pageInfo.pages;

        // Helper function to create page button
        function createPageButton(pageNumber, isActive = false) {
            return $('<button>')
                .text(pageNumber)
                .addClass('flex-center w-[48px] h-[48px] border border-shark-200 rounded-full')
                .toggleClass('bg-purple-heart-500 text-white', isActive)
                .toggleClass('bg-white text-shark-400', !isActive)
                .on('click', function () {
                    table.page(pageNumber - 1).draw('page');
                });
        }

        // Previous button
        let prevButton = $('<button>')
            .html('<i class="ph ph-caret-left text-lg"></i>')
            .addClass('flex-shrink-0 flex-center w-[48px] h-[48px] rounded-full')
            .toggleClass('bg-purple-heart-500 text-white', pageInfo.page > 0)
            .toggleClass('bg-shark-100 text-shark-400', pageInfo.page === 0)
            .prop('disabled', pageInfo.page === 0)
            .on('click', function () {
                if (pageInfo.page > 0) table.page('previous').draw('page');
            });
        paginationElement.append(prevButton);

        // Add page buttons with ellipsis
        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) {
                paginationElement.append(createPageButton(i, i === currentPage));
            }
        } else {
            // Show first page, ellipsis, middle range, ellipsis, last page
            if (currentPage > 2) {
                paginationElement.append(createPageButton(1));
                if (currentPage > 3) paginationElement.append($('<span>').text('...'));
            }

            let startPage = Math.max(1, currentPage - 1);
            let endPage = Math.min(totalPages, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                paginationElement.append(createPageButton(i, i === currentPage));
            }

            if (currentPage < totalPages - 1) {
                if (currentPage < totalPages - 2) paginationElement.append($('<span>').text('...'));
                paginationElement.append(createPageButton(totalPages));
            }
        }

        // Next button
        let nextButton = $('<button>')
            .html('<i class="ph ph-caret-right text-lg"></i>')
            .addClass('flex-shrink-0 flex-center w-[48px] h-[48px] rounded-full')
            .toggleClass('bg-purple-heart-500 text-white', pageInfo.page < totalPages - 1)
            .toggleClass('bg-shark-100 text-shark-400', pageInfo.page === totalPages - 1)
            .prop('disabled', pageInfo.page === totalPages - 1)
            .on('click', function () {
                if (pageInfo.page < totalPages - 1) table.page('next').draw('page');
            });
        paginationElement.append(nextButton);

        // Update pagination info
        $(`#${paginationInfoId}`).text(`${pageInfo.end} out of ${pageInfo.recordsTotal} records`);
    }


    // Initial pagination update
    updatePagination();

    // Update pagination when the page changes
    table.on('draw', function () {
        updatePagination();
    });

    return table; // return table instance for additional customization if needed
}

// Function for Tab-based Filtering
function initializeTabFilter(tabsSelector, tableId, filterColumnIndex = 1) {
    $(tabsSelector).on('click', function () {
        // Remove active class from all buttons and add it to the clicked button
        $(tabsSelector).removeClass('bg-shark-950 text-white').addClass('bg-shark-50 text-shark-950');
        $(this).removeClass('bg-shark-50 text-shark-950').addClass('bg-shark-950 text-white');

        // Get the clicked button's filter type
        let filterType = $(this).data('filter').toLowerCase().trim();

        // Get the table instance
        let table = $(`#${tableId}`).DataTable();

        // Apply filtering
        if (filterType === 'all') {
            table.column(filterColumnIndex).search('').draw(); // Reset search
        } else {
            table.column(filterColumnIndex).search(filterType).draw(); // Search for the filterType
        }
    });
}