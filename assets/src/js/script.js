window.onload = function () {
  removeScrollBar();

  $("#preloader-container").fadeOut("slow", function () {
    addScrollBar();

    // Initialize AOS after the preloader has completely faded out
    AOS.init({
      offset: 20, // Adjust this value to control when animations trigger globally
      duration: 1000, // Duration of the animation
      easing: "ease-in-out", // Easing function for the animation
      once: true, // Whether animation should happen only once or every time you scroll up and down
    });
  });
};

$(document).ready(function () {
  // deleting function
  $(document).on("click", ".delete", function () {
    let el = $(this);
    let id = $(this).data("id");
    let post_id = $(this).data("post-id");
    let name = $(this).data("name");
    let desc = $(this).data("desc");
    let title = $(this).data("title");
    let server_url = $(this).data("server-url");
    let csrf = $('meta[name="csrf-token"]').attr("content");

    // Set up modal content using class selectors
    $("#delete-modal .modal-icon").html(`
             <div class="flex items-center justify-center mb-2 h-[60px] w-[60px] bg-purple-heart-100 rounded-full">
                <i class="ph-fill ph-trash text-3xl text-purple-heart-800"></i>
            </div>`);
    $("#delete-modal .modal-title").text(title || "Confirm Deletion");
    if (desc) {
      $("#delete-modal .modal-body").html(desc);
    } else {
      $("#delete-modal .modal-body").html(
        `Are you sure you want to delete <strong>${name}</strong>?`
      );
    }

    // Show the modal
    $("#delete-modal").removeClass("hidden");

    // Handle Cancel button click
    $("#delete-modal .modal-cancel-btn")
      .off("click")
      .on("click", function () {
        $("#delete-modal").addClass("hidden"); // Hide modal
      });

    // Handle Confirm button click
    $("#delete-modal .modal-confirm-btn")
      .off("click")
      .on("click", function () {
        $("#delete-modal").addClass("hidden"); // Hide modal

        // Prepare data for AJAX call
        let data = {
          id: id,
          "post-id": post_id,
          name: name,
          "csrf-token": csrf,
        };

        // Execute the AJAX function
        deleteAjax(el, data, server_url);
      });
  });

  // Function to handle tab switching for all tab containers
  $(".tab-container").each(function () {
    const $container = $(this);
    const containerID = $container.attr("id");

    // Handle click event for tab buttons within this container
    $container.find(".tab-btn").on("click", function () {
      const target = $(this).data("target");

      // Remove 'active' class from all buttons and contents within the current container
      $container.find(".tab-btn").removeClass("active");
      $container
        .find(".tab-content")
        .removeClass("active animate__animated animate__fadeIn")
        .hide();

      // Add 'active' class to the clicked button
      $(this).addClass("active");

      // Add 'active' and animate.css classes to the target content
      $container
        .find("#" + target)
        .addClass("active animate__animated animate__fadeIn")
        .fadeIn();
    });
  });

  $(".print-receipt").on("click", function (event) {
    event.preventDefault(); // Prevent the default link behavior
    $("#receipt-content").printThis({
      // Optional configuration
      importCSS: true, // Import parent page CSS
      loadCSS: "/src/css/print.css", // Path to additional CSS for the print
      printContainer: true, // Print outer container/$.selector
      pageTitle: "Transaction - Receipt", // Title for the print window
      removeInline: false, // Remove inline styles
      header: null,
      footer:
        '<div id="receipt-footer" class="flex justify-center items-center bg-white rounded-md border border-shark-200 mx-auto max-w-xl w-full p-4 mt-6">\n' +
        '    <img src="/src/images/logo.png" alt="Corion Logo" class="h-8">\n' +
        "</div>\n", // Add custom footer to print
    });
  });

  // form submission functionalities
  $("form").submit(function (e) {
    if ($(this).hasClass("no-ajax")) {
      // This form should submit in the traditional way
      // So, just return and let the browser handle it
      let csrf = $('meta[name="csrf-token"]').attr("content");
      $("form").prepend(
        '<input type="hidden" name="csrf-token" value="' + csrf + '">'
      );

      return;
    }

    e.preventDefault();
    resetResponse();

    let form = $(this);
    let id = form.attr("id");
    let _id = `#${id}`;
    let server_url = $(`${_id} .server-url`);
    let _server_url = server_url.data("server-url");
    let btn_id = $('button[type="submit"]:focus').data("id");

    if (!fullValidation(_id)) {
      if ($("#form-status").length !== 0) {
        // Scroll to the #form-status container
        scrollToForm($("#form-status"));
        alertMessage(
          _id,
          "Oops! some fields are still empty please fill them up correctly!",
          "danger"
        );
      }
    } else {
      let data = new FormData(form[0]);
      data.append(id, id);
      data.append("btn-id", btn_id);

      // send all checkbox input to server
      $(`${_id} input:checkbox`).each(function () {
        let _name = $(this).attr("name");
        data.append(_name, $(`#${_name}`).prop("checked"));
      });

      // send all image input to server
      $(`${_id} input:file`).each(function () {
        let _name = $(this).attr("name");
        data.append(_name, $(`#${_name}`).prop("files")[0]);
      });

      // send all hidden input to server
      $(`${_id} input:hidden`).each(function () {
        let _name = $(this).attr("name");
        data.append(_name, $(`#${_name}`).val());
      });

      // append recaptcha response
      if (typeof grecaptcha !== "undefined" && document.querySelector(".g-recaptcha")) {
        const recaptchaToken = grecaptcha.getResponse();
        data.append("g-recaptcha-response", recaptchaToken);
      }

      // check if server code is in another page/file
      if (server_url.val()) {
        ajaxCode(_server_url, data, 3000, _id);
      } else {
        ajaxCode($(location).attr("href"), data, 3000, _id);
      }

      // reset the recaptcha widget
      grecaptcha.reset();
    }
  });

  $(document).on("click", ".notification-item", function () {
    let el = $(this);
    let notification_id = $(this).data("id");
    let server_url = "../controllers/notification-controller.php";
    let csrf = $('meta[name="csrf-token"]').attr("content");
    let markAsReadBtn = el.find(".mark-as-read");
    let indicator = el.find(".indicator");
    const originalButtonText = markAsReadBtn.html();

    // Prepare data for AJAX call
    let data = {
      id: notification_id,
      "csrf-token": csrf,
      "mark-as-read": "mark-as-read",
    };

    // AJAX request to verify the code
    $.ajax({
      url: server_url,
      type: "POST",
      data: data,
      dataType: "JSON",
      beforeSend: function () {
        markAsReadBtn
          .prop("disabled", true)
          .html(buttonLoader("", "stroke-purple-heart-800"));
      },
      success: function (response) {
        console.log(response);

        setTimeout(function () {
          // Prioritize handling based on which response contains a valid message
          if (
            response.success &&
            Array.isArray(response.success.message) &&
            response.success.message.length !== 0
          ) {
            markAsReadBtn
              .prop("disabled", false)
              .html('<i class="ph ph-checks text-lg text-shark-300"></i>');
            indicator.addClass("hidden");
            let redirectUrl =
              response.success.redirect && response.success.redirect.length
                ? response.success.redirect[0].link
                : null;

            if (redirectUrl) {
              window.location.href = redirectUrl;
            }
          } else if (
            response.error &&
            Array.isArray(response.error.message) &&
            response.error.message.length !== 0
          ) {
            let title =
              response.error.title || "Error Processing Notification!";
            let message = response.error.message.join("<br>");
            let redirectUrl =
              response.error.redirect && response.error.redirect.length
                ? response.error.redirect[0].link
                : null;
            let type = "error";
            let buttonText = response.error.buttonText || "Okay"; // Set dynamic button text for error

            // Restore button to original state
            markAsReadBtn.prop("disabled", false).html(originalButtonText);

            // Show modal with the appropriate content and style based on type
            showModal(title, message, type, redirectUrl, buttonText);
          }
        }, 3000);
      },
      error: function (jqXHR, exception) {
        // Restore button to original state
        markAsReadBtn.prop("disabled", false).html(originalButtonText);
        // Show Error Message to console & To User
        responseError(el, jqXHR, exception);
      },
    });
  });

  $(document).on("click", ".mark-all-as-read", function () {
    let el = $(this);
    let user_id = $(this).data("user-id");
    let server_url = "../controllers/notification-controller.php";
    let csrf = $('meta[name="csrf-token"]').attr("content");
    let markAsReadBtn = el;
    const originalButtonText = markAsReadBtn.html();

    // Prepare data for AJAX call
    let data = {
      "user-id": user_id,
      "csrf-token": csrf,
      "mark-all-as-read": "mark-all-as-read",
    };

    // AJAX request to verify the code
    $.ajax({
      url: server_url,
      type: "POST",
      data: data,
      dataType: "JSON",
      beforeSend: function () {
        markAsReadBtn
          .prop("disabled", true)
          .html(buttonLoader("", "stroke-purple-heart-800"));
      },
      success: function (response) {
        console.log(response);

        setTimeout(function () {
          // Prioritize handling based on which response contains a valid message
          if (
            response.success &&
            Array.isArray(response.success.message) &&
            response.success.message.length !== 0
          ) {
            markAsReadBtn
              .prop("disabled", false)
              .html('<i class="ph ph-checks text-lg text-shark-300"></i>');
            let redirectUrl =
              response.success.redirect && response.success.redirect.length
                ? response.success.redirect[0].link
                : null;

            if (redirectUrl) {
              window.location.href = redirectUrl;
            }
          } else if (
            response.error &&
            Array.isArray(response.error.message) &&
            response.error.message.length !== 0
          ) {
            let title =
              response.error.title || "Error Processing Notification!";
            let message = response.error.message.join("<br>");
            let redirectUrl =
              response.error.redirect && response.error.redirect.length
                ? response.error.redirect[0].link
                : null;
            let type = "error";
            let buttonText = response.error.buttonText || "Okay"; // Set dynamic button text for error

            // Restore button to original state
            markAsReadBtn.prop("disabled", false).html(originalButtonText);

            // Show modal with the appropriate content and style based on type
            showModal(title, message, type, redirectUrl, buttonText);
          }
        }, 3000);
      },
      error: function (jqXHR, exception) {
        // Restore button to original state
        markAsReadBtn.prop("disabled", false).html(originalButtonText);
        // Show Error Message to console & To User
        responseError(el, jqXHR, exception);
      },
    });
  });

  // Floating Label
  $("select").on("change", function () {
    let selectedValue = $(this).val();
    let labelSpan = $(this).siblings("span");

    if (selectedValue === "") {
      labelSpan.removeClass("-translate-y-1/2").addClass("translate-y-1/2");
    } else {
      labelSpan
        .removeClass("translate-y-1/2 ")
        .addClass("-translate-y-1/2 text-[14px]");
    }
  });

  // Profile Upload
  $("#profilePicture").on("change", function (event) {
    let reader = new FileReader();
    reader.onload = function (e) {
      $('img[alt="User Avatar"]').attr("src", e.target.result);
    };
    reader.readAsDataURL(event.target.files[0]);
  });

  // Image Upload Input Field
  // $(document).on('change', '.file-upload-input', function (event) {
  //     let inputElement = $(this);
  //     let reader = new FileReader();
  //     reader.onload = function (e) {
  //         // Find the corresponding image within the same container as the file input
  //         inputElement.closest('.block').find('img').attr('src', e.target.result);
  //     };
  //     reader.readAsDataURL(event.target.files[0]);
  // });

  // File Upload handling for any file input with .file-upload-input class
  $(".file-upload-input").on("change", function (event) {
    let inputElement = $(this); // Store the specific input element that triggered the change
    let reader = new FileReader();
    reader.onload = function (e) {
      // Find the nearest image element related to the input and update its src
      inputElement.closest(".block").find("img").attr("src", e.target.result);
      // Reset the hidden delete input when a new image is uploaded
      inputElement.closest(".block").find(".file-deleted-input").val("0");
    };
    reader.readAsDataURL(event.target.files[0]);
  });

  // Delete button functionality to reset the image and clear the input
  $(".delete-file-upload").on("click", function () {
    let blockElement = $(this).closest(".block"); // Find the related block
    let placeholderImg = blockElement.find("img").data("placeholder-src");
    blockElement.find(".file-upload-input").val(""); // Clear the input value
    blockElement.find("img").attr("src", placeholderImg); // Reset to placeholder
    // Mark the hidden input as deleted
    blockElement.find(".file-deleted-input").val("1");
  });

  // Dropdown Functionalities
  $(".dropdown-item").on("click", function () {
    let dropdown_content = $(this).parent().find(".dropdown-content");
    let dropdown_icon = $(this).find(".dropdown-icon");
    if (dropdown_content.hasClass("hidden")) {
      dropdown_content.removeClass("hidden").addClass("flex  animate__fadeIn");
      dropdown_icon.html('<i class="ph ph-caret-up"></i>');
    } else {
      dropdown_content.removeClass("flex").addClass("hidden");
      dropdown_icon.html('<i class="ph ph-caret-down"></i>');
    }
  });

  // Open Sidebar Functionalities
  $(".toggle-sidebar").on("click", function () {
    let sidebar = $("#sidebar");

    if (sidebar.hasClass("sm:-translate-x-full")) {
      sidebar.removeClass("sm:-translate-x-full").addClass("sm:translate-x-0");
    } else {
      sidebar.removeClass("sm:translate-x-0").addClass("sm:-translate-x-full");
    }
  });

  // Open Navbar Functionalities
  $("#openNavbar").on("click", function () {
    $("#navbar")
      .removeClass("hidden animate__slideOutUp") // Remove any previous closing animation
      .addClass("animate__animated animate__slideInDown animate__faster");
  });

  $("#closeNavbar")
    .off("click")
    .on("click", function () {
      let navbar = "#navbar";
      $(navbar)
        .removeClass("animate__slideInDown") // Remove the opening animation
        .addClass("animate__animated animate__slideOutUp animate__faster");

      $(navbar).one("animationend", function () {
        $(navbar)
          .removeClass("animate__animated animate__slideOutUp") // Clean up classes
          .addClass("hidden"); // Hide navbar
      });
    });

  // Copy Clipboard
  $(".copy-btn").on("click", function () {
    const accountNumber = $("#accountNumber").text().trim();
    let el = $(this);
    let originalContent = el.html();

    // Create a hidden input field
    let tempInput = $("<input>");
    $("body").append(tempInput);
    tempInput.val(accountNumber).select();

    try {
      // Attempt to copy the text
      document.execCommand("copy");

      // Success: change the button content to "Copied!"
      el.html(
        '<i class="ph-fill ph-check-circle text-xl text-purple-heart-200"></i>'
      );

      // Reset the button after 2 seconds
      setTimeout(function () {
        el.html(originalContent);
      }, 2000);
    } catch (err) {
      // If copy fails, provide a fallback message or action
      alert("Unable to copy. Please manually select and copy the text.");
    }

    // Remove the temporary input
    tempInput.remove();
  });

  // Trigger Complete Profile Modal
  if ($("#complete-profile-modal").length > 0) {
    let el = $("#complete-profile-modal");
    let user_id = el.data("user-id");
    let server_url = "../controllers/user-controller.php";
    let csrf = $('meta[name="csrf-token"]').attr("content");

    // Prepare data for AJAX call
    let data = {
      "user-id": user_id,
      "csrf-token": csrf,
      "show-complete-modal": "show-complete-modal",
    };

    // AJAX request to verify the code
    setTimeout(function () {
      $.ajax({
        url: server_url,
        type: "POST",
        data: data,
        dataType: "JSON",
        success: function (response) {
          console.log(response);
          // Prioritize handling based on which response contains a valid message
          if (
            response.success &&
            Array.isArray(response.success.message) &&
            response.success.message.length !== 0
          ) {
            if (response.success.message.includes("Not Completed")) {
              // Show Complete Profile modal
              $("#complete-profile-modal").removeClass("hidden");
              $("#complete-profile-modal-container").addClass(
                "animate__animated animate__zoomIn"
              );
            } else {
              console.log("Profile is completed!");
            }
          } else if (
            response.error &&
            Array.isArray(response.error.message) &&
            response.error.message.length !== 0
          ) {
            console.log("Error completing profile");
          }
        },
        error: function (jqXHR, exception) {
          // Show Error Message to console & To User
          responseError(el, jqXHR, exception);
        },
      });
    }, 1000);

    // Copy to clipboard functionality
    // $('.copy-btn').on('click', function () {
    //     // Get the target address
    //     var target = $(this).data('copy-target');
    //     var address = $(target).text().trim(); // Trim to remove any leading/trailing spaces
    //
    //     // Create a temporary input element to copy the text
    //     var tempInput = $('<input>');
    //     $('body').append(tempInput);
    //     tempInput.val(address).select();
    //     document.execCommand('copy');
    //     tempInput.remove();
    //
    //     // Alert or show a message that the address is copied
    //     alert('Address copied to clipboard: ' + address);
    // });
  }

  // Process complete profile
  $(document).on("click", ".save-profile-completion", function () {
    let form = $("#complete-profile-form");
    let server_url = form.find(".server-url").data("server-url");
    const saveProfileButton = $(".save-profile-completion");
    const originalButtonText = saveProfileButton.html();

    if (fullValidation("#complete-profile-form")) {
      // Create a new FormData object from the form
      let formData = new FormData(form[0]);
      formData.append(
        "csrf-token",
        $('meta[name="csrf-token"]').attr("content")
      ); // Add CSRF token
      formData.append("save-profile-completion", "save-profile-completion");

      // Remove Animation
      form.removeClass("animate__animated animate__shakeX");

      // AJAX request to complete profile
      $.ajax({
        url: server_url,
        type: "POST",
        data: formData,
        dataType: "JSON",
        processData: false,
        contentType: false,
        beforeSend: function () {
          // Show "Confirming Code..." on the button
          saveProfileButton
            .prop("disabled", true)
            .html(buttonLoader("Please wait..."));
        },
        success: function (response) {
          console.log(response);

          setTimeout(function () {
            // Restore button to original state
            saveProfileButton.prop("disabled", false).html(originalButtonText);

            // Prioritize handling based on which response contains a valid message
            if (
              response.success &&
              Array.isArray(response.success.message) &&
              response.success.message.length !== 0
            ) {
              saveProfileButton
                .prop("disabled", true)
                .html(buttonLoader("Profile Saved"));

              // Animate the closing of the modal
              $("#complete-profile-modal-container").addClass(
                "animate__animated animate__zoomOut"
              );

              // Use `.one()` instead of `.on()` to ensure this handler only runs once
              $("#complete-profile-modal-container").one(
                "animationend",
                function () {
                  $("#complete-profile-modal").addClass("hidden");
                }
              );
            } else if (
              response.error &&
              Array.isArray(response.error.message) &&
              response.error.message.length !== 0
            ) {
              let title = response.error.title || "Error Saving Profile!";
              let message = response.error.message.join("<br>");
              let redirectUrl =
                response.error.redirect && response.error.redirect.length
                  ? response.error.redirect[0].link
                  : null;
              let type = "error";
              let buttonText = response.error.buttonText || "Okay"; // Set dynamic button text for error

              // Show modal with the appropriate content and style based on type
              showModal(title, message, type, redirectUrl, buttonText);
            }
          }, 3000);
        },
        error: function (jqXHR, exception) {
          // Restore button to original state
          saveProfileButton.prop("disabled", false).html(originalButtonText);
          // Show Error Message to console & To User
          responseError(form, jqXHR, exception);
        },
      });
    }
  });

  // Close user complete profile
  $(".cancel-profile-completion").on("click", function () {
    // Animate the closing of the modal
    $("#complete-profile-modal-container").addClass(
      "animate__animated animate__zoomOut"
    );

    // Use `.one()` instead of `.on()` to ensure this handler only runs once
    $("#complete-profile-modal-container").one("animationend", function () {
      $("#complete-profile-modal").addClass("hidden");
    });
  });

  // Function to handle button clicks and update content via POST
  function loadPaymentMethod(method) {
    $.ajax({
      url: "deposit-funds.php", // Backend endpoint to fetch wallet data
      method: "POST",
      data: { method: method }, // Sending data using POST
      success: function (data) {
        // Assuming the backend returns data in JSON format
        $("#walletAddressText").text(data.walletAddress);
        $("#paymentBarcode").attr("src", data.barcodeSrc);
        $("#methodIcon").attr("src", data.methodIcon);
        $("#methodName").text(data.methodName);
        $("#warningText").text(data.warningText);

        // Reset the payment proof image
        $("#paymentProofImg").attr("src", data.paymentProofPlaceholder);

        // Update Payment Method
        $("#paymentMethod").val(method);

        // Update active state of the buttons
        $(".payment-method-btn").removeClass("payment-method-btn-active");
        $(`[data-method="${method}"]`).addClass("payment-method-btn-active");
      },
      error: function (error) {
        console.error("Error fetching data:", error);
      },
    });
  }

  // Handle click events for the payment method buttons
  $(document).on("click", ".payment-method-btn", function () {
    let method = $(this).data("method");
    loadPaymentMethod(method);
  });

  // Copy Clipboard
  $(".copy-wallet-address").on("click", function () {
    const walletAddressText = $("#walletAddressText").text().trim();
    let el = $(this);
    let originalContent = el.html();

    // Create a hidden input field
    let tempInput = $("<input>");
    $("body").append(tempInput);
    tempInput.val(walletAddressText).select();

    try {
      // Attempt to copy the text
      document.execCommand("copy");

      // Success: change the button content to "Copied!"
      el.html(
        '<div class="flex items-center gap-2"><i class="ph-fill ph-check-circle text-xl text-purple-heart-800"></i> Copied!</div>'
      );

      // Reset the button after 2 seconds
      setTimeout(function () {
        el.html(originalContent);
      }, 2000);
    } catch (err) {
      // If copy fails, provide a fallback message or action
      alert("Unable to copy. Please manually select and copy the text.");
    }

    // Remove the temporary input
    tempInput.remove();
  });

  $("#repaymentPeriod").on("change", function () {
    let repaymentPeriod = $(this).val(); // Get the selected repayment period
    let loanType = $("#loanType").val(); // Get the selected loan type

    $.ajax({
      url: "apply-for-loan.php", // Backend endpoint to fetch interest rate
      method: "POST",
      dataType: "JSON",
      data: {
        action: "getInterestRate", // Define an action for the request
        repaymentPeriod: repaymentPeriod,
        loanType: loanType,
      },
      success: function (data) {
        // Assuming the backend returns interest rate in JSON format
        $("#interestRate").val(data.interestRate); // Update the interest rate field
      },
      error: function (error) {
        console.error("Error fetching interest rate:", error);
      },
    });
  });

  $('#transferFrom').on('change', function () {
    let transferFrom = $(this).val();

    $.ajax({
      url: "wire-transfer.php",
      method: 'POST',
      dataType: 'JSON',
      data: {
        action: 'getBalance',
        transferFrom: transferFrom
      },
      success: function (data) {
        if (data.balance) {
          // Update the account balance in the UI
          $('#balance').text(data.balance);
        }
      },
      error: function (error) {
        console.error('Error fetching account balance:', error);
      }
    });
  });
});

function ajaxCode(url, data, timeout = 3000, form_el = "") {
  let csrf = $('meta[name="csrf-token"]').attr("content");
  data.append("csrf-token", csrf);

  const submitButton = $(form_el).find('button[type="submit"]');
  const originalButtonText = submitButton.html();

  return $.ajax({
    type: "POST",
    url: url,
    data: data,
    dataType: "JSON",
    processData: false,
    contentType: false,
    cache: false,
    async: true,
    beforeSend: function () {
      // Disable the submit button and show the loading icon
      submitButton.prop("disabled", true).html(buttonLoader());
    },
    success: function (response) {
      console.log(response);

      setTimeout(function () {
        // Restore button to original state
        submitButton.prop("disabled", false).html(originalButtonText);

        let title = "";
        let message = "";
        let type = "success"; // Default type
        let redirectUrl = null;
        let buttonText = "Okay"; // Default button text

        // Prioritize handling based on which response contains a valid message
        if (
          response.success &&
          Array.isArray(response.success.message) &&
          response.success.message.length !== 0
        ) {
          title = response.success.title || "Success!";
          message = response.success.message.join("<br>");
          redirectUrl =
            response.success.redirect && response.success.redirect.length
              ? response.success.redirect[0].link
              : null;
          type = "success";
          buttonText = response.success.buttonText || buttonText; // Set dynamic button text for success
        } else if (
          response.error &&
          Array.isArray(response.error.message) &&
          response.error.message.length !== 0
        ) {
          title = response.error.title || "Error!";
          message = response.error.message.join("<br>");
          redirectUrl =
            response.error.redirect && response.error.redirect.length
              ? response.error.redirect[0].link
              : null;
          type = "error";
          buttonText = response.error.buttonText || buttonText; // Set dynamic button text for error
        } else if (
          response.warning &&
          Array.isArray(response.warning.message) &&
          response.warning.message.length !== 0
        ) {
          title = response.warning.title || "Warning!";
          message = response.warning.message.join("<br>");
          redirectUrl =
            response.warning.redirect && response.warning.redirect.length
              ? response.warning.redirect[0].link
              : null;
          type = "warning";
          buttonText = response.warning.buttonText || buttonText; // Set dynamic button text for warning
        }

        // Show modal with the appropriate content and style based on type
        showModal(title, message, type, redirectUrl, buttonText);
      }, timeout);
    },
    error: function (jqXHR, exception) {
      // Scroll to the #form-status container
      scrollToForm($("#form-status"));
      // Restore button to original state in case of failure
      submitButton.prop("disabled", false).html(originalButtonText);
      // Show Error Message to console & To User
      responseError(form_el, jqXHR, exception);
    },
  });
}

function confirmDelete() {
  return confirm("Are you sure you want to delete this data?");
}

function alertMessage(form_el, message, type) {
  // Ensure the #form-status container is inside the form or element
  let statusContainer = $(form_el).find("#form-status");

  // Replace the existing content in the #form-status container with the new alert message
  statusContainer.html(`<div class="relative flex gap-2 items-center rounded p-4 bg-danger/10 border-2 border-danger/50 mb-4">
            <i class="ph-fill ph-x-circle text-danger text-3xl"></i>
            <div>
                <span class="block text-danger text-base">${message}</span>
            </div>
            <button class="absolute -top-2 -right-2 close-alert">
                <i class="ph-fill ph-x-circle text-purple-heart-800 text-2xl bg-white rounded-full"></i>
            </button>
        </div>`);

  // Add click event listener to the close button to remove the alert
  statusContainer.find(".close-alert").on("click", function () {
    $(this).parent().remove(); // Removes the alert container when close button is clicked
  });
}

function deleteLoader() {
  return `<div class="flex items-center justify-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-live="polite" aria-busy="true" aria-labelledby="title-01a desc-01a" class="w-4 h-4 animate animate-spin">
          <title id="title-01a">Icon title</title>
          <desc id="desc-01a">Some desc</desc>
          <circle cx="12" cy="12" r="10" class="stroke-slate-200" stroke-width="4" />
          <path d="M12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12C22 9.34784 20.9464 6.8043 19.0711 4.92893C17.1957 3.05357 14.6522 2 12 2" class="stroke-purple-heart-800" stroke-width="4" />
        </svg>
</div>`;
}

function buttonLoader(
  text = "Processing...",
  loaderColor = "stroke-emerald-500"
) {
  return `<div class="flex items-center justify-center gap-2">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-live="polite" aria-busy="true" aria-labelledby="title-01a desc-01a" class="w-4 h-4 animate animate-spin">
          <title id="title-01a">Icon title</title>
          <desc id="desc-01a">Some desc</desc>
          <circle cx="12" cy="12" r="10" class="stroke-slate-200" stroke-width="4" />
          <path d="M12 22C14.6522 22 17.1957 20.9464 19.0711 19.0711C20.9464 17.1957 22 14.6522 22 12C22 9.34784 20.9464 6.8043 19.0711 4.92893C17.1957 3.05357 14.6522 2 12 2" class="${loaderColor}" stroke-width="4" />
        </svg>
        <span>${text}</span>
    </div>`;
}

function responseError(form_el, jqXHR, exception) {
  let msg_text = "";

  // Check the HTTP status code to determine the error type
  if (jqXHR.status === 0) {
    msg_text = "Not connect.\n Verify Network.";
  } else if (jqXHR.status === 404) {
    msg_text = "Requested page not found. [404]";
  } else if (jqXHR.status === 500) {
    msg_text = "Internal Server Error [500].";
  } else if (exception === "parsererror") {
    msg_text = "Requested JSON parse failed.";
  } else if (exception === "timeout") {
    msg_text = "Time out error.";
  } else if (exception === "abort") {
    msg_text = "Ajax request aborted.";
  } else {
    msg_text = "Uncaught Error.\n" + jqXHR.responseText;
  }

  // Show the error in alert to the user
  alertMessage(form_el, msg_text, "error");
  // Log the error message to the console
  console.error("Error details:", jqXHR.responseText);
}

function resetResponse() {
  $("#form-status").html("");
}

function deleteAjax(el, data, url, timeout = 3000) {
  const originalButtonText = el.html();
  const delete_container = el.closest(".delete-container");

  console.log(data);
  $.ajax({
    url: url,
    type: "POST",
    data: data,
    dataType: "JSON",
    beforeSend: function () {
      el.prop("disabled", true).html(deleteLoader());
    },
    success: function (response) {
      console.log(response);

      setTimeout(function () {
        // Restore button to original state
        el.prop("disabled", false).html(originalButtonText);

        let title = "";
        let message = "";
        let type = "success"; // Default type
        let redirectUrl = null;
        let buttonText = "Okay"; // Default button text

        // Prioritize handling based on which response contains a valid message
        if (
          response.success &&
          Array.isArray(response.success.message) &&
          response.success.message.length !== 0
        ) {
          title = response.success.title || "Success!";
          message = response.success.message.join("<br>");
          redirectUrl =
            response.success.redirect && response.success.redirect.length
              ? response.success.redirect[0].link
              : null;
          type = "success";
          buttonText = response.success.buttonText || "Okay"; // Set dynamic button text for success

          // Apply fade-out effect to the container
          delete_container
            .css("background-color", "tomato")
            .fadeOut(1500, function () {
              $(this).remove(); // Remove container from DOM after fade-out
            });
        } else if (
          response.error &&
          Array.isArray(response.error.message) &&
          response.error.message.length !== 0
        ) {
          title = response.error.title || "Error!";
          message = response.error.message.join("<br>");
          redirectUrl =
            response.error.redirect && response.error.redirect.length
              ? response.error.redirect[0].link
              : null;
          type = "error";
          buttonText = response.error.buttonText || "Try Again"; // Set dynamic button text for error
        } else if (
          response.warning &&
          Array.isArray(response.warning.message) &&
          response.warning.message.length !== 0
        ) {
          title = response.warning.title || "Warning!";
          message = response.warning.message.join("<br>");
          redirectUrl =
            response.warning.redirect && response.warning.redirect.length
              ? response.warning.redirect[0].link
              : null;
          type = "warning";
          buttonText = response.warning.buttonText || "Check"; // Set dynamic button text for warning
        }

        // Show modal with the appropriate content and style based on type
        showModal(title, message, type, redirectUrl, buttonText);
      }, timeout);
    },
    error: function (jqXHR, exception) {
      el.prop("disabled", false).html(originalButtonText);
      // Show Error Message to console & To User
      responseError(el, jqXHR, exception);
    },
  });
}

// Show Modal Function
function showModal(
  title,
  content,
  type = "success",
  redirectUrl = null,
  buttonText = "Okay"
) {
  const resetAnimation = (element, animationClass) => {
    element.removeClass(animationClass); // Remove animation class after it finishes
    element.off("animationend"); // Remove the event listener
  };

  switch (type) {
    case "success":
      $("#success-modal-title").text(title);
      $("#success-modal-content").html(content);
      $("#success-confirm-btn").text(buttonText); // Set button text dynamically

      // Add entrance animation and show modal
      $("#success-modal-container").addClass(
        "animate__animated animate__rubberBand"
      );
      $("#success-modal").removeClass("hidden").addClass("flex");

      // Reset animation class after entrance animation finishes
      $("#success-modal-container").on("animationend", function () {
        resetAnimation($(this), "animate__rubberBand");
      });

      // Close modal on button click
      $("#success-confirm-btn")
        .off("click")
        .on("click", function () {
          $("#success-modal-container").addClass(
            "animate__animated animate__backOutUp"
          );

          // Wait for the exit animation to finish before hiding the modal
          $("#success-modal-container").on("animationend", function () {
            resetAnimation($(this), "animate__backOutUp");
            $("#success-modal").addClass("hidden"); // Hide modal
            if (redirectUrl) {
              window.location.href = redirectUrl; // Redirect after modal hides
            }
          });
        });
      break;

    case "warning":
      $("#warning-modal-title").text(title);
      $("#warning-modal-content").html(content);
      $("#warning-confirm-btn").text(buttonText); // Set button text dynamically

      // Add entrance animation and show modal
      $("#warning-modal-container").addClass(
        "animate__animated animate__fadeInDown"
      );
      $("#warning-modal").removeClass("hidden").addClass("flex");

      // Reset animation class after entrance animation finishes
      $("#warning-modal-container").on("animationend", function () {
        resetAnimation($(this), "animate__fadeInDown");
      });

      // Close modal on button click
      $("#warning-confirm-btn")
        .off("click")
        .on("click", function () {
          $("#warning-modal-container").addClass(
            "animate__animated animate__backOutUp"
          );

          // Wait for the exit animation to finish before hiding the modal
          $("#warning-modal-container").on("animationend", function () {
            resetAnimation($(this), "animate__backOutUp");
            $("#warning-modal").addClass("hidden"); // Hide modal
            if (redirectUrl) {
              window.location.href = redirectUrl; // Redirect after modal hides
            }
          });
        });
      break;

    case "error":
      $("#error-modal-title").text(title);
      $("#error-modal-content").html(content);
      $("#error-confirm-btn").text(buttonText); // Set button text dynamically

      // Add entrance animation and show modal
      $("#error-modal-container").addClass(
        "animate__animated animate__rubberBand"
      );
      $("#error-modal").removeClass("hidden").addClass("flex");

      // Reset animation class after entrance animation finishes
      $("#error-modal-container").on("animationend", function () {
        resetAnimation($(this), "animate__rubberBand");
      });

      // Close modal on button click
      $("#error-confirm-btn")
        .off("click")
        .on("click", function () {
          $("#error-modal-container").addClass(
            "animate__animated animate__backOutUp"
          );

          // Wait for the exit animation to finish before hiding the modal
          $("#error-modal-container").on("animationend", function () {
            resetAnimation($(this), "animate__backOutUp");
            $("#error-modal").addClass("hidden"); // Hide modal
            if (redirectUrl) {
              window.location.href = redirectUrl; // Redirect after modal hides
            }
          });
        });
      break;
  }
}

// Show Complete Profile Modal
function showCompleteProfileModal() {
  let el = $("#complete-profile-modal");
  let is_completed = el.data("isCompleted");

  if (!is_completed) {
    // Show Complete Profile modal
    $("#complete-profile-modal").removeClass("hidden");
    $("#complete-profile-modal-container").addClass(
      "animate__animated animate__zoomIn"
    );
  }
}

function removeScrollBar() {
  $("body").css({
    overflow: "hidden",
  });
}

function addScrollBar() {
  $("body").css({
    overflow: "auto",
  });
}

function scrollToForm(formContainer) {
  formContainer[0].scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  });
}

// setting timezone dynamically
let offset = new Date().getTimezoneOffset();
document.cookie = "timezoneoffset=" + offset;
