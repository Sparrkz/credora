// assets/src/js/ajax-helpers.js

function getCsrfToken() {
    return $('meta[name="csrf-token"]').attr('content');
}

function verifyImtCode(code, successCallback, errorCallback) {
    $.ajax({
        url: '/verify-imt-code/',
        type: 'POST',
        headers: {
            'X-CSRFToken': getCsrfToken()
        },
        data: {
            'code': code,
            'csrfmiddlewaretoken': getCsrfToken()
        },
        success: function(response) {
            if (response.status === 'success') {
                if (successCallback) {
                    successCallback(response);
                }
            } else {
                if (errorCallback) {
                    errorCallback(response);
                }
            }
        },
        error: function(xhr) {
            let response = xhr.responseJSON || { message: 'An unexpected error occurred.' };
            if (errorCallback) {
                errorCallback(response);
            }
        }
    });
}
