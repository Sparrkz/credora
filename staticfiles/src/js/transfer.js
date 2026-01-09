$(document).ready(function () {
    // Initialize Transfer
    $(document).on('click', '.init-wire-transfer', function () {
        let form = $('#transfer');
        const el = $('.init-wire-transfer');


        if (!fullValidation("#transfer")) {
            if ($("#form-status").length !== 0) {
                // Scroll to the #form-status container
                scrollToForm($('#form-status'));
                alertMessage("#transfer", 'Oops! some fields are still empty please fill them up correctly!', 'danger')
            }
        } else {
            // Step 1: Show loading state on the button
            el.prop('disabled', true).html(buttonLoader());

            // Step 2: Delay before showing the confirmation modal (e.g., 1.5 seconds)
            setTimeout(function () {
                // Restore the original button state
                el.prop('disabled', false).html('Send');

                // Show the transfer confirmation modal with entrance animation
                $('#transfer-modal').removeClass('hidden');
                $('#transfer-modal-container').removeClass('hidden').addClass('animate__animated animate__pulse');

                // Remove entrance animation class after it finishes
                $('#transfer-modal-container').one('animationend', function () {
                    $('#transfer-modal-container').removeClass('animate__animated animate__pulse');
                });

            }, 2500);  // 1.5 seconds delay before showing the modal

            // Handle Cancel button click in the modal
            $('#transfer-modal .modal-cancel-btn').off('click').on('click', function () {
                // Animate the closing of the modal
                $('#transfer-modal-container').addClass('animate__animated animate__backOutUp');

                // Use `.one()` instead of `.on()` to ensure this handler only runs once
                $('#transfer-modal-container').one('animationend', function () {
                    // Remove the closing animation class and hide the modal
                    $('#transfer-modal-container').removeClass('animate__animated animate__backOutUp');
                    $('#transfer-modal').addClass('hidden');  // Hide modal on cancel
                });
            });

            // Handle Confirm button click in the modal
            $('#transfer-modal .modal-confirm-btn').off('click').on('click', function () {
                // Animate the closing of the modal
                $('#transfer-modal-container').addClass('animate__animated animate__backOutUp');

                // Use `.one()` instead of `.on()` to ensure this handler only runs once
                $('#transfer-modal-container').one('animationend', function () {
                    // Remove the closing animation class and hide the modal
                    $('#transfer-modal-container').removeClass('animate__animated animate__backOutUp');
                    $('#transfer-modal').addClass('hidden');  // Hide modal on cancel
                });

                // Create a new FormData object from the form
                let formData = new FormData(form[0]);
                formData.append('csrf-token', $('meta[name="csrf-token"]').attr('content')); // Add CSRF token to FormData
                formData.append('init-wire-transfer', 'init-wire-transfer');

                // Execute the AJAX request (you can use your transferAjax function here)
                transferAjax(el, formData, form.find('.server-url').data('server-url'));
            });
        }


    });

    $(document).on('click', '.confirm-wire-code', function () {
        let form = $('#transfer');
        let server_url = form.find('.server-url').data('server-url');
        const confirmCodeButton = $('.confirm-wire-code');
        const originalButtonText = confirmCodeButton.html();

        if (fullValidation('#transfer')) {
            // Create a new FormData object from the form
            let formData = new FormData(form[0]);
            formData.append('csrf-token', $('meta[name="csrf-token"]').attr('content')); // Add CSRF token
            formData.append('confirm-wire-code', 'confirm-wire-code');

            // Remove Animation
            form.removeClass('animate__animated animate__shakeX')

            // AJAX request to verify the code
            $.ajax({
                url: server_url,
                type: 'POST',
                data: formData,
                dataType: 'JSON',
                processData: false,
                contentType: false,
                beforeSend: function () {
                    // Show "Confirming Code..." on the button
                    confirmCodeButton.prop('disabled', true).html(buttonLoader('Please wait...'));
                },
                success: function (response) {
                    console.log(response);

                    setTimeout(function () {
                        // Restore button to original state
                        confirmCodeButton.prop('disabled', false).html(originalButtonText);

                        // Prioritize handling based on which response contains a valid message
                        if (response.success && Array.isArray(response.success.message) && response.success.message.length !== 0) {
                            confirmCodeButton.prop('disabled', true).html(buttonLoader('Processing...'));

                            // Update the progress bar dynamically
                            let progressBar = $('#progressBar');
                            let progressPercentage = response.success.progress_percentage;
                            let beforeProgressPercentage = response.success.before_progress_percentage;

                            // Animate progress bar update (to simulate processing)
                            progressBar.animate({width: beforeProgressPercentage + progressPercentage + '%'}, 3000);

                            // Show circular loader during processing
                            let spinnerLoader = $('#spinnerLoader');
                            spinnerLoader.removeClass('hidden');

                            // Animate Number Text
                            animateProgress(beforeProgressPercentage, progressPercentage);

                            setTimeout(function () {
                                confirmCodeButton.prop('disabled', false).html(originalButtonText);
                                spinnerLoader.addClass('hidden');

                                // Check for the specific success message
                                if (response.success.message.includes("Success")) {
                                    // Update code name and description
                                    $('.codeName').html(response.success.code_row.name);
                                    $('#shortDescription').text(response.success.code_row.short_description);
                                    $('#code').val(null).attr('placeholder', `Enter ${response.success.code_row.name}`);
                                    form.addClass('animate__animated animate__shakeX')

                                } else if (response.success.message.includes("Last Step")) {
                                    console.log("Last Step");

                                    // Show "Transaction Successful" modal
                                    $('#transaction-success-modal').removeClass('hidden');
                                    $('#transaction-success-modal-container').addClass('animate__animated animate__bounce');

                                    // Fill modal data from the response
                                    $('#main-amount').text(response.success.txn_data.main_amount);
                                    $('#amount-1').find('span').text(response.success.txn_data.amount);
                                    $('#receiver-name').find('span').text(response.success.txn_data.receiver_name);
                                    $('#bank-name').find('span').text(response.success.txn_data.bank_name);
                                    $('#transfer-status').find('span').text(response.success.txn_data.transfer_status);
                                    $('#account-no').find('span').text(response.success.txn_data.account_no);
                                    $('#transaction-link').attr('href', `receipt?txn-id=${response.success.txn_data.txn_id}`);
                                }
                            }, 3000);
                        } else if (response.error && Array.isArray(response.error.message) && response.error.message.length !== 0) {
                            let title = response.error.title || 'Invalid Code!';
                            let message = response.error.message.join("<br>");
                            let redirectUrl = response.error.redirect && response.error.redirect.length ? response.error.redirect[0].link : null;
                            let type = 'error';
                            let buttonText = response.error.buttonText || "Okay"; // Set dynamic button text for error

                            // Show modal with the appropriate content and style based on type
                            showModal(title, message, type, redirectUrl, buttonText);
                        }


                    }, 3000);
                },
                error: function (jqXHR, exception) {
                    // Restore button to original state
                    confirmCodeButton.prop('disabled', false).html(originalButtonText);
                    // Show Error Message to console & To User
                    responseError(form, jqXHR, exception);
                }
            });
        }

    });

    // Cancel Transaction
    $(document).on('click', '#cancel-transaction', function () {
        let el = $(this);
        let userId = $(this).data('user-id');
        let server_url = "../controllers/transaction-controller.php";
        let csrf = $('meta[name="csrf-token"]').attr('content');

        // Show the transfer confirmation modal with entrance animation
        $('#cancel-transfer-modal').removeClass('hidden');
        $('#cancel-transfer-modal-container').removeClass('hidden').addClass('animate__animated animate__rubberBand');

        // Handle Cancel button click in the modal
        $('#cancel-transfer-modal .modal-cancel-btn').off('click').on('click', function () {
            // Animate the closing of the modal
            $('#cancel-transfer-modal-container').addClass('animate__animated animate__backOutUp');

            // Use `.one()` instead of `.on()` to ensure this handler only runs once
            $('#cancel-transfer-modal-container').one('animationend', function () {
                // Remove the closing animation class and hide the modal
                $('#cancel-transfer-modal-container').removeClass('animate__animated animate__backOutUp');
                $('#cancel-transfer-modal').addClass('hidden');  // Hide modal on cancel
            });
        });

        // Handle Confirm button click
        $('#cancel-transfer-modal .modal-confirm-btn').off('click').on('click', function () {
            // Animate the closing of the modal
            $('#cancel-transfer-modal-container').addClass('animate__animated animate__backOutUp');

            $('#cancel-transfer-modal-container').one('animationend', function () {
                // Remove the closing animation class and hide the modal
                $('#cancel-transfer-modal-container').removeClass('animate__animated animate__backOutUp');
                $('#cancel-transfer-modal').addClass('hidden');  // Hide modal on cancel
            });

            // Prepare data for AJAX call
            let data = {
                'userId': userId,
                'cancel-transfer': 'cancel-transfer',
                'csrf-token': csrf,
            };

            // Execute the AJAX function
            cancelTransferAjax(el, data, server_url);
        });
    });


    // Initialize Local Transfer
    $(document).on('click', '.init-local-transfer', function () {
        let form = $('#transfer');
        const el = $('.init-local-transfer');

        // Step 1: Show loading state on the button
        el.prop('disabled', true).html(buttonLoader());

        // Step 2: Delay before showing the confirmation modal (e.g., 1.5 seconds)
        setTimeout(function () {
            // Restore the original button state
            el.prop('disabled', false).html('Send');

            // Show the transfer confirmation modal with entrance animation
            $('#transfer-modal').removeClass('hidden');
            $('#transfer-modal-container').removeClass('hidden').addClass('animate__animated animate__pulse');

            // Remove entrance animation class after it finishes
            $('#transfer-modal-container').one('animationend', function () {
                $('#transfer-modal-container').removeClass('animate__animated animate__pulse');
            });

        }, 2500);  // 1.5 seconds delay before showing the modal

        // Handle Cancel button click in the modal
        $('#transfer-modal .modal-cancel-btn').off('click').on('click', function () {
            // Animate the closing of the modal
            $('#transfer-modal-container').addClass('animate__animated animate__backOutUp');

            // Use `.one()` instead of `.on()` to ensure this handler only runs once
            $('#transfer-modal-container').one('animationend', function () {
                // Remove the closing animation class and hide the modal
                $('#transfer-modal-container').removeClass('animate__animated animate__backOutUp');
                $('#transfer-modal').addClass('hidden');  // Hide modal on cancel
            });
        });

        // Handle Confirm button click in the modal
        $('#transfer-modal .modal-confirm-btn').off('click').on('click', function () {
            // Animate the closing of the modal
            $('#transfer-modal-container').addClass('animate__animated animate__backOutUp');

            // Use `.one()` instead of `.on()` to ensure this handler only runs once
            $('#transfer-modal-container').one('animationend', function () {
                // Remove the closing animation class and hide the modal
                $('#transfer-modal-container').removeClass('animate__animated animate__backOutUp');
                $('#transfer-modal').addClass('hidden');  // Hide modal on cancel
            });

            // Create a new FormData object from the form
            let formData = new FormData(form[0]);
            formData.append('csrf-token', $('meta[name="csrf-token"]').attr('content')); // Add CSRF token to FormData
            formData.append('init-wire-transfer', 'init-wire-transfer');

            // Execute the AJAX request (you can use your transferAjax function here)
            transferAjax(el, formData, form.find('.server-url').data('server-url'));
        });
    });


    $(document).on('click', '.confirm-local-transfer', function () {
        let form = $('#local-transfer');
        let server_url = form.find('.server-url').data('server-url');
        const confirmTransferButton = $('.confirm-local-transfer');
        const originalButtonText = confirmTransferButton.html();

        if (!fullValidation('#local-transfer')) {
            // Scroll to the #form-status container
            scrollToForm($('#form-status'));
            alertMessage("#local-transfer", 'Oops! some fields are still empty please fill them up correctly!', 'danger')
        } else {


            // Step 1: Show loading state on the button
            confirmTransferButton.prop('disabled', true).html(buttonLoader());

            // Step 2: Delay before showing the confirmation modal (e.g., 1.5 seconds)
            setTimeout(function () {
                // Restore the original button state
                confirmTransferButton.prop('disabled', false).html('Send');

                // Show the transfer confirmation modal with entrance animation
                $('#transfer-modal').removeClass('hidden');
                $('#transfer-modal-container').removeClass('hidden').addClass('animate__animated animate__pulse');

                // Remove entrance animation class after it finishes
                $('#transfer-modal-container').one('animationend', function () {
                    $('#transfer-modal-container').removeClass('animate__animated animate__pulse');
                });

            }, 2500);  // 1.5 seconds delay before showing the modal

            // Handle Cancel button click in the modal
            $('#transfer-modal .modal-cancel-btn').off('click').on('click', function () {
                // Animate the closing of the modal
                $('#transfer-modal-container').addClass('animate__animated animate__backOutUp');

                // Use `.one()` instead of `.on()` to ensure this handler only runs once
                $('#transfer-modal-container').one('animationend', function () {
                    // Remove the closing animation class and hide the modal
                    $('#transfer-modal-container').removeClass('animate__animated animate__backOutUp');
                    $('#transfer-modal').addClass('hidden');  // Hide modal on cancel
                });
            });

            // Handle Confirm button click in the modal
            $('#transfer-modal .modal-confirm-btn').off('click').on('click', function () {
                // Animate the closing of the modal
                $('#transfer-modal-container').addClass('animate__animated animate__backOutUp');

                // Use `.one()` instead of `.on()` to ensure this handler only runs once
                $('#transfer-modal-container').one('animationend', function () {
                    // Remove the closing animation class and hide the modal
                    $('#transfer-modal-container').removeClass('animate__animated animate__backOutUp');
                    $('#transfer-modal').addClass('hidden');  // Hide modal on cancel
                });

                // Create a new FormData object from the form
                let formData = new FormData(form[0]);
                formData.append('csrf-token', $('meta[name="csrf-token"]').attr('content')); // Add CSRF token
                formData.append('confirm-local-transfer', 'confirm-local-transfer');


                // Execute the AJAX request (you can use your transferAjax function here)
                $.ajax({
                    url: server_url,
                    type: 'POST',
                    data: formData,
                    dataType: 'JSON',
                    processData: false,
                    contentType: false,
                    beforeSend: function () {
                        // Show "Confirming Transfer..." on the button
                        confirmTransferButton.prop('disabled', true).html(buttonLoader('Please wait...'));
                    },
                    success: function (response) {
                        console.log(response);

                        setTimeout(function () {
                            // Restore button to original state
                            confirmTransferButton.prop('disabled', false).html(originalButtonText);

                            // Prioritize handling based on which response contains a valid message
                            if (response.success && Array.isArray(response.success.message) && response.success.message.length !== 0) {
                                confirmTransferButton.prop('disabled', true).html(buttonLoader('Processing...'));

                                setTimeout(function () {
                                    confirmTransferButton.prop('disabled', false).html(originalButtonText);

                                    // Show "Transaction Successful" modal
                                    $('#transaction-success-modal').removeClass('hidden');
                                    $('#transaction-success-modal-container').addClass('animate__animated animate__bounce');

                                    // Fill modal data from the response
                                    $('#main-amount').text(response.success.txn_data.main_amount);
                                    $('#amount-1').find('span').text(response.success.txn_data.amount);
                                    $('#receiver-name').find('span').text(response.success.txn_data.receiver_name);
                                    $('#bank-name').find('span').text(response.success.txn_data.bank_name);
                                    $('#transfer-status').find('span').text(response.success.txn_data.transfer_status);
                                    $('#account-no').find('span').text(response.success.txn_data.account_no);
                                    $('#transaction-link').attr('href', `receipt?txn-id=${response.success.txn_data.txn_id}`);


                                }, 3000);
                            } else if (response.error && Array.isArray(response.error.message) && response.error.message.length !== 0) {
                                let title = response.error.title || 'Transfer Error!';
                                let message = response.error.message.join("<br>");
                                let redirectUrl = response.error.redirect && response.error.redirect.length ? response.error.redirect[0].link : null;
                                let type = 'error';
                                let buttonText = response.error.buttonText || "Okay"; // Set dynamic button text for error

                                // Show modal with the appropriate content and style based on type
                                showModal(title, message, type, redirectUrl, buttonText);
                            }


                        }, 3000);
                    },
                    error: function (jqXHR, exception) {
                        // Restore button to original state
                        confirmTransferButton.prop('disabled', false).html(originalButtonText);
                        // Show Error Message to console & To User
                        responseError(form, jqXHR, exception);
                    }
                });
            });


        }
    });

});

// Function to animate the percentage change
function animateProgress(beforePercentage = 0, newPercentage) {
    // Animate the progress bar from the beforePercentage to the newPercentage
    $({Counter: beforePercentage}).animate({Counter: newPercentage}, {
        duration: 3000, // animation duration (3 seconds)
        easing: 'swing', // easing function for smooth animation
        step: function (now) {
            // Update the progress bar width based on the current percentage
            $('#progressBar').css('width', now + '%');
            // Update the text with the current percentage
            $('#progressNumber').text(Math.ceil(now) + "% Finished");
        }
    });
}


function transferAjax(el, formData, url, timeout = 3000) {
    const transferButton = el;
    const originalButtonText = transferButton.html();

    $.ajax({
        url: url,
        type: 'POST',
        data: formData,
        contentType: false, // Required for FormData
        processData: false, // Required for FormData
        dataType: 'JSON',
        beforeSend: function () {
            // Disable the button and show the loader
            transferButton.prop('disabled', true).html(buttonLoader("Sending..."));
        },
        success: function (response) {
            console.log(response);

            setTimeout(function () {
                // Restore button to original state
                transferButton.prop('disabled', false).html(originalButtonText);

                let title = '';
                let message = '';
                let type = 'success'; // Default type
                let redirectUrl = null;
                let buttonText = 'Okay'; // Default button text

                // Prioritize handling based on which response contains a valid message
                if (response.success && Array.isArray(response.success.message) && response.success.message.length !== 0) {
                    title = response.success.title || 'Transfer Successful!';
                    message = response.success.message.join("<br>");
                    redirectUrl = response.success.redirect && response.success.redirect.length ? response.success.redirect[0].link : null;
                    type = 'success';
                    buttonText = response.success.buttonText || buttonText; // Set dynamic button text for success
                } else if (response.error && Array.isArray(response.error.message) && response.error.message.length !== 0) {
                    title = response.error.title || 'Transfer Failed!';
                    message = response.error.message.join("<br>");
                    redirectUrl = response.error.redirect && response.error.redirect.length ? response.error.redirect[0].link : null;
                    type = 'error';
                    buttonText = response.error.buttonText || buttonText; // Set dynamic button text for error
                } else if (response.warning && Array.isArray(response.warning.message) && response.warning.message.length !== 0) {
                    title = response.warning.title || 'Warning!';
                    message = response.warning.message.join("<br>");
                    redirectUrl = response.warning.redirect && response.warning.redirect.length ? response.warning.redirect[0].link : null;
                    type = 'warning';
                    buttonText = response.warning.buttonText || buttonText; // Set dynamic button text for warning
                }

                // Show modal with the appropriate content and style based on type
                showModal(title, message, type, redirectUrl, buttonText);

            }, timeout);
        },
        error: function (jqXHR, exception) {
            // Restore button to original state
            transferButton.prop('disabled', false).html(originalButtonText);
            // Show Error Message to console & To User
            responseError("#transfer", jqXHR, exception);
        }
    });
}


function cancelTransferAjax(el, data, url, timeout = 3000) {
    const originalButtonText = el.html();

    $.ajax({
        url: url,
        type: 'POST',
        data: data,
        dataType: 'JSON',
        beforeSend: function () {
            el.prop('disabled', true).html(buttonLoader("Cancelling...", "stroke-purple-heart-800"));
        },
        success: function (response) {
            console.log(response);

            setTimeout(function () {
                // Restore button to original state
                el.prop('disabled', false).html(originalButtonText);

                let title = '';
                let message = '';
                let type = 'success'; // Default type
                let redirectUrl = null;
                let buttonText = 'Okay'; // Default button text

                // Prioritize handling based on which response contains a valid message
                if (response.success && Array.isArray(response.success.message) && response.success.message.length !== 0) {
                    title = response.success.title || 'Success!';
                    message = response.success.message.join("<br>");
                    redirectUrl = response.success.redirect && response.success.redirect.length ? response.success.redirect[0].link : null;
                    type = 'success';
                    buttonText = response.success.buttonText || 'Okay'; // Set dynamic button text for success
                } else if (response.error && Array.isArray(response.error.message) && response.error.message.length !== 0) {
                    title = response.error.title || 'Error!';
                    message = response.error.message.join("<br>");
                    redirectUrl = response.error.redirect && response.error.redirect.length ? response.error.redirect[0].link : null;
                    type = 'error';
                    buttonText = response.error.buttonText || 'Try Again'; // Set dynamic button text for error
                }

                // Show modal with the appropriate content and style based on type
                showModal(title, message, type, redirectUrl, buttonText);

            }, timeout);
        },
        error: function (jqXHR, exception) {
            // Restore button to original state
            el.prop('disabled', false).html(originalButtonText);
            // Show Error Message to console & To User
            responseError(el, jqXHR, exception);
        }
    });
}


