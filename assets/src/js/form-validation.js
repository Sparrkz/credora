// el = element
// il = input element
// fl = form label
// fe = feedback element
// vev = validate element value
// pt = pattern

// for selector these are the abbreviation used
// fv = form validation
// t-fv = text-fv
// p-fv = phone-fv
// d-fv = digit-fv
// e-fv = email-fv
// u-fv = username-fv
// s-fv = select-fv
// pass-fv = password-fv
// np-fv = normal-password-fv
// cp-fv = confirm-password-fv
// c-fv = checkbox-fv
// tb-fv = toggle-button-fv


$(document).ready(function () {
    $('.f-fv').on('input', function () {
        checkFileFV(this);
    });

    $('.e-fv').on('input', function () {
        checkEmailFV(this);
    });

    $('.t-fv').on('input', function () {
        checkTextFV(this);
    });

    $('.u-fv').on('input', function () {
        checkUsernameFV(this);
    });

    $('.p-fv').on('input', function () {
        checkPhoneFV(this);
    });

    $('.d-fv').on('input', function () {
        checkDigitNumberFV(this);
    });

    $('.s-fv').on('input', function () {
        checkSelectFV(this);
    });

    $('.pass-fv').on('input', function () {
        checkPasswordFV(this);
    });

    $('.np-fv').on('input', function () {
        checkNormalPassFV(this);
    });

    $('.cp-fv').on('input', function () {
        checkConfirmPasswordFV(this);
    });

    $('.c-fv').on('click', function () {
        checkBoxFV(this);
    });

    $('.tb-fv').on('click', function () {
        checkToggleFV(this);
    });

    $('.see-fv').on('click', function () {
        seePasswordFV(this);
    });


});


function checkTextFV(el) {
    let il = $(el);
    let is_valid = [];
    let validated = false;

    il.each(function () {
        let fl = $(this).closest(".w-full").find("label").html();
        let fe = $(this).closest('.w-full').find('.feedback');
        let icon = $(this).siblings('span');

        if ($(this).val() === '' && il.is(":visible")) {
            $(this).removeClass("input-default").addClass('input-danger');
            fe.removeClass("text-shark-500").addClass('text-danger').html(`${fl} can't be empty`);
            icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
            is_valid.push("No");
        } else if ($(this).val().length < 2 && il.is(":visible")) {
            $(this).removeClass("input-default").addClass('input-danger');
            fe.removeClass("text-shark-500").addClass('text-danger').html(`${fl} must not be less than 3 characters `);
            icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
            is_valid.push("No");
        } else {
            $(this).removeClass('input-danger').addClass('input-default'); // Reset to default state
            fe.removeClass('text-danger').addClass('text-shark-500').html("");  // Reset feedback to default shark color
            icon.removeClass("text-danger").addClass("text-shark-500 focus:text-purple-heart-800");  // Default shark, purple on focus
            is_valid.push("Yes");
        }
    });

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}


function checkSelectFV(el) {
    let il = $(el)
    let is_valid = []
    let validated = false
    il.each(function () {
        let fl = $(this).closest(".w-full").find("label").html();
        let fe = $(this).closest('.w-full').find('.feedback');
        let icon = $(this).siblings('span');

        if ($(this).val() === '' && il.is(":visible")) {
            $(this).removeClass("input-default").addClass('input-danger');
            fe.removeClass("text-shark-500").addClass('text-danger').html(`Please Select ${fl}`);
            icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
            is_valid.push("No")
        } else {
            $(this).removeClass('input-danger').addClass('input-default'); // Reset to default state
            fe.removeClass('text-danger').addClass('text-shark-500').html("");  // Reset feedback to default shark color
            icon.removeClass("text-danger").addClass("text-shark-500 focus:text-purple-heart-800");  // Default shark, purple on focus
            is_valid.push("Yes");
        }
    })

    if (!is_valid.includes("No")) {
        validated = true
    }
    return validated
}

function checkBoxFV(el) {
    let il = $(el);
    let is_valid = [];
    let validated = false;

    il.each(function () {
        let fe = $(this).closest('.block').find('.feedback');
        let fl = $(this).siblings("label").first()

        // Toggle between square and check-square based on checkbox state
        let icon = $(this).siblings('label').find('i'); // Get the icon element
        if ($(this).prop('checked')) {
            icon.removeClass('ph-square').addClass('ph-check-square'); // Checked icon
        } else {
            icon.removeClass('ph-check-square').addClass('ph-square'); // Unchecked icon
        }

        // Check if the checkbox is not checked
        if (!$(this).prop('checked')) {
            // Add invalid state
            fl.removeClass("text-purple-heart-800").addClass('text-danger'); // Label turns red
            fe.removeClass("text-purple-heart-800").addClass('text-danger').html(`Please click on the checkbox to continue`);
            is_valid.push("No");
        } else {
            // Add valid state
            fl.removeClass('text-danger').addClass('text-purple-heart-800'); // Label turns valid purple
            fe.removeClass('text-danger').addClass('text-purple-heart-800').html(""); // Clear error feedback
            is_valid.push("Yes");
        }
    });

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}

function checkToggleFV(el) {
    let il = $(el);
    let is_valid = [];
    let validated = false;

    il.each(function () {
        let fe = $(this).closest('.block').find('.feedback'); // Feedback span
        let fl = $(this).siblings("label").first(); // The label wrapping the toggle

        // Check if the toggle is not enabled
        if (!$(this).prop('checked')) {
            // Add invalid state
            fl.removeClass("text-purple-heart-800").addClass('text-danger'); // Label turns red
            fe.removeClass("text-purple-heart-800").addClass('text-danger').html(`Please enable this option to continue`);
            is_valid.push("No");
        } else {
            // Add valid state
            fl.removeClass('text-danger').addClass('text-purple-heart-800'); // Label turns valid purple
            fe.removeClass('text-danger').addClass('text-purple-heart-800').html(""); // Clear error feedback
            is_valid.push("Yes");
        }
    });

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}


function checkFileFV(el) {
    let il = $(el);
    let is_valid = [];
    let validated = false;

    il.each(function () {
        let fl = il.closest('.block').find('label').first().text().trim();
        let fe = il.closest('.block').find('.feedback');

        if ($(this).val() === "") {
            // If the input is empty, show error styles
            $(this).closest('.flex').removeClass("border-shark-200").addClass('border-red-500'); // Add error border
            fe.addClass('text-danger').html(`Please upload a ${fl}`);
            is_valid.push("No");
        } else {
            // If the input is valid, show success styles
            $(this).closest('.flex').removeClass('border-red-500').addClass('border-shark-200'); // Change border to green
            fe.removeClass('text-danger').addClass('text-shark-500').html(""); // Clear error message
            is_valid.push("Yes");
        }

    });

    if (!is_valid.includes("No")) {
        validated = true;
    }
    return validated;
}


function checkEmailFV(el) {
    let il = $(el);
    let is_valid = [];
    let validated = false;
    let fl = il.closest(".w-full").find("label").html();  // Get label text
    let pt = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,}$/;  // Email regex pattern
    let validate_email = pt.test(il.val());  // Test if email matches the pattern
    let fe = il.closest('.w-full').find('.feedback');  // Get feedback element
    let icon = il.siblings('span');

    if (il.val() === "" && il.is(":visible")) {
        il.removeClass('input-default').addClass('input-danger');  // Switch to danger state
        fe.addClass('text-danger').html(`${fl} is required`);
        icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
        is_valid.push("No");
    } else if (!validate_email && il.is(":visible")) {
        il.removeClass('input-default').addClass('input-danger');  // Switch to danger state for invalid email
        fe.addClass('text-danger').html(`Invalid ${fl}`);
        icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
        is_valid.push("No");
    } else {
        il.removeClass('input-danger').addClass('input-default');  // Reset to default state
        fe.removeClass('text-danger').addClass('text-shark-500').html("");  // Reset feedback to default shark color
        icon.removeClass("text-danger").addClass("text-shark-500 focus:text-purple-heart-800");  // Default shark, purple on focus
        is_valid.push("Yes");
    }

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}


function checkUsernameFV(el) {
    let il = $(el)
    let fl = il.prev().html();
    let pt = /^[A-Za-z0-9]+$/;
    let vev = pt.test(il.val());
    let fe = il.next()

    if (il.val().length < 3 && il.is(":visible")) {
        il.addClass('is-invalid');
        fe.addClass('invalid-feedback').html(`${fl} length is too short`);
        return false;
    } else if (!vev && il.is(":visible")) {
        il.addClass('is-invalid');
        fe.addClass('invalid-feedback').html(`${fl} should be a-z ,A-Z only`);
        return false;
    } else {
        il.removeClass('is-invalid').addClass('is-valid');
        fe.removeClass('invalid-feedback').addClass('valid-feedback').html("");
        return true;
    }
}

const phone = document.querySelector("#phone");

// Check if the phone input element exists
let phoneInput = document.querySelector('#phone'); // or use getElementById if needed
let iti = null;
if (phoneInput) {
    iti = window.intlTelInput(phoneInput, {
        preferredCountries: ["ng", "us", "co", "in", "de"],
        initialCountry: "auto",
        geoIpLookup: getIp,
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
    });
}

// IP lookup function
function getIp(callback) {
    fetch('https://ipinfo.io/json?token=8a9178f0d9238c', {headers: {'Accept': 'application/json'}})
        .then((resp) => resp.json())
        .catch(() => {
            return {
                country: 'us',
            };
        })
        .then((resp) => callback(resp.country));
}


function checkPhoneFV(el) {
    let il = $(el)
    let pi = il.closest(".phone-input")
    let fl = il.closest(".phone-container").find("label").html()
    let fe = il.closest(".phone-container").find(".feedback")
    let icon = pi.siblings('span');
    let is_valid = [];
    let validated = false;


    if (il.val() === "") {
        pi.removeClass("input-default").addClass('input-danger');
        fe.addClass('text-danger').html(`${fl} cannot be empty!`);
        icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
        is_valid.push("No");
    } else if (!iti.isValidNumber()) {
        pi.removeClass("input-default").addClass('input-danger');
        fe.addClass('text-danger').html(`Invalid ${fl}`);
        is_valid.push("No");
    } else {
        pi.removeClass('input-danger').addClass('input-default');
        fe.removeClass('text-danger').addClass('text-shark-500').html("");
        icon.removeClass("text-danger").addClass("text-shark-500 focus:text-purple-heart-800");
        il.val(iti.getNumber())
        is_valid.push("Yes");
    }

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}


function checkPasswordFV(el) {
    let il = $(el);
    let fl = il.closest(".w-full").find("label").html();  // Get label text
    let pt = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;  // Password regex pattern
    let vev = pt.test(il.val());  // Test if password matches the pattern
    let fe = il.closest('.w-full').find('.feedback');  // Get feedback element
    let icon = il.siblings('span');
    let is_valid = [];
    let validated = false;

    if (il.val() === "" && il.is(":visible")) {
        il.removeClass('input-default').addClass('input-danger');  // Switch to danger state
        fe.addClass('text-danger').html(`${fl} cannot be empty!`);
        icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
        is_valid.push("No");
    } else if (!vev) {
        il.removeClass('input-default').addClass('input-danger');  // Switch to danger state for invalid password
        fe.addClass('text-danger').html(`${fl} must contain at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character`);
        icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
        is_valid.push("No");
    } else {
        il.removeClass('input-danger').addClass('input-default');  // Reset to default state
        fe.html("");  // Reset feedback to default shark color
        icon.removeClass("text-danger").addClass("text-shark-500 focus:text-purple-heart-800");
        is_valid.push("Yes");
    }

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}


function checkNormalPassFV(el) {
    let il = $(el);
    let fl = il.closest(".w-full").find("label").html();  // Get label text
    let fe = il.closest('.w-full').find('.feedback');  // Get feedback element
    let icon = il.siblings('span');
    let is_valid = [];
    let validated = false;

    if (il.val() === "" && il.is(":visible")) {
        il.removeClass('input-default').addClass('input-danger');  // Switch to danger state
        fe.addClass('text-danger').html(`${fl} cannot be empty!`);
        icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
        is_valid.push("No");
    } else {
        il.removeClass('input-danger').addClass('input-default');  // Reset to default state
        fe.html("");  // Reset feedback to default shark color
        icon.removeClass("text-danger").addClass("text-shark-500 focus:text-purple-heart-800");
        is_valid.push("Yes");
    }

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}

function checkConfirmPasswordFV(el) {
    let il = $(el);
    let is_valid = [];
    let validated = false;
    let fl = il.closest(".w-full").find("label").html();  // Get the label text
    let fe = il.closest('.w-full').find('.feedback');  // Get the feedback element
    let icon = il.siblings('span');


    // Get the password value to compare
    let passwordValue = $('.pass-fv').val();  // Get the original password value

    if (il.val() === "" && il.is(":visible")) {
        il.removeClass('input-default').addClass('input-danger');  // Switch to danger state
        fe.addClass('text-danger').html(`${fl} cannot be empty!`);
        icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
        is_valid.push("No");
    } else if (il.val() !== passwordValue && il.is(":visible")) {
        il.removeClass('input-default').addClass('input-danger');  // Switch to danger state
        fe.addClass('text-danger').html(`${fl} did not match!`);
        icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
        is_valid.push("No");
    } else {
        il.removeClass('input-danger').addClass('input-default');  // Reset to default state
        fe.removeClass('text-danger').addClass('text-shark-500').html("");  // Reset feedback to default shark color
        icon.removeClass("text-danger").addClass("text-shark-500 focus:text-purple-heart-800");  // Default shark, purple on focus
        is_valid.push("Yes");
    }

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}


function checkDigitNumberFV(el) {
    let il = $(el);
    let is_valid = [];
    let validated = false;

    il.each(function () {
        let fl = $(this).closest(".w-full").find("label").html(); // Get label text
        let fe = $(this).closest('.w-full').find('.feedback'); // Feedback element
        let icon = $(this).siblings('span'); // Icon element next to the input
        let pt = /^[0-9]+$/; // Regular expression to validate digits
        let vev = pt.test($(this).val());

        // Remove the word "Enter" from the label text (if present)
        let labelText = fl.replace(/Enter\s/i, '').trim();

        if ($(this).val() === '' && il.is(":visible")) {
            // Empty value handling
            $(this).removeClass("input-default").addClass('input-danger');
            fe.removeClass("text-shark-500").addClass('text-danger').html(`${labelText} can't be empty`);
            icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
            is_valid.push("No");
        } else if (!vev && il.is(":visible")) {
            // Non-digit input handling
            $(this).removeClass("input-default").addClass('input-danger');
            fe.removeClass("text-shark-500").addClass('text-danger').html(`${labelText} must be in digits`);
            icon.removeClass("text-shark-500 text-purple-heart-800").addClass("text-danger");
            is_valid.push("No");
        } else {
            // Valid input
            $(this).removeClass('input-danger').addClass('input-default'); // Reset to default state
            fe.removeClass('text-danger').addClass('text-shark-500').html("");  // Reset feedback to default shark color
            icon.removeClass("text-danger").addClass("text-shark-500 focus:text-purple-heart-800");  // Default shark, purple on focus
            is_valid.push("Yes");
        }
    });

    if (!is_valid.includes("No")) {
        validated = true;
    }

    return validated;
}


function seePasswordFV(el) {
    let eye_btn = $(el);
    let inputField = eye_btn.closest('.relative').find('input[type="password"], input[type="text"]'); // Find the input field within the same container

    if (eye_btn.hasClass('password-visible')) {
        eye_btn.removeClass('password-visible');
        eye_btn.html('<i class="ph ph-eye text-lg"></i>');
        inputField.attr('type', 'password');
    } else {
        eye_btn.addClass('password-visible');
        eye_btn.html('<i class="ph ph-eye-slash text-lg"></i>');
        inputField.attr('type', 'text');
    }
}


function fullValidation(el) {
    let form = $(`${el} :input`)
    let is_valid = []
    let validated = false

    if (form.hasClass("s-fv")) {
        if (checkSelectFV(`${el} .s-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("c-fv")) {
        if (checkBoxFV(`${el} .c-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("tb-fv")) {
        if (checkToggleFV(`${el} .tb-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("d-fv")) {
        if (checkDigitNumberFV(`${el} .d-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("f-fv")) {
        if (checkFileFV(`${el} .f-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("t-fv")) {
        if (checkTextFV(`${el} .t-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("e-fv")) {
        if (checkEmailFV(`${el} .e-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("u-fv")) {
        if (checkUsernameFV(`${el} .u-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("p-fv")) {
        if (checkPhoneFV(`${el} .p-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("pass-fv")) {
        if (checkPasswordFV(`${el} .pass-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("np-fv")) {
        if (checkNormalPassFV(`${el} .np-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (form.hasClass("cp-fv")) {
        if (checkConfirmPasswordFV(`${el} .cp-fv`)) {
            is_valid.push("Yes")
        } else {
            is_valid.push("No")
        }
    }

    if (!is_valid.includes("No")) {
        validated = true
    }

    return validated
}
