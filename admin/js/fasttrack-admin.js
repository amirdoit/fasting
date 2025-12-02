/**
 * FastTrack Admin JS
 */
(function ($) {
    'use strict';

    $(document).ready(function () {
        // Tab switching logic (if tabs are present)
        $('.fasttrack-tab').on('click', function (e) {
            e.preventDefault();

            // Remove active class from all tabs and contents
            $('.fasttrack-tab').removeClass('active');
            $('.fasttrack-tab-content').hide();

            // Add active class to clicked tab
            $(this).addClass('active');

            // Show corresponding content
            var target = $(this).attr('href');
            $(target).show();
        });

        // Color picker initialization (if using WP Color Picker, though we used standard color input)
        // If we were using wp-color-picker, we would init it here.
        // Since we used <input type="color">, it works natively.

        // Confirm danger actions
        $('.fasttrack-danger-action').on('click', function (e) {
            if (!confirm('Are you sure you want to perform this action? This cannot be undone.')) {
                e.preventDefault();
            }
        });
    });

})(jQuery);
