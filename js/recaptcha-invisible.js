(function ($, Drupal, drupalSettings) {
  'use strict';

  // Static variables to track initialization and form state
  var recaptchaInitialized = false;
  var widgetId = null;
  var currentForm = null;
  var formSubmitHandler = null;
  var initializationError = false;

  function shouldProtectForm($form) {
    var formId = $form.attr('id');
    var protectedIds = drupalSettings.recaptchaInvisible?.formIds || [];
    
    // If no form IDs configured, protect all webform submission forms
    if (!protectedIds.length) {
      return formId && formId.indexOf('webform-submission-') === 0;
    }
    
    // Check if any protected ID matches the start of the form ID
    return protectedIds.some(function(protectedId) {
      return formId && formId.indexOf(protectedId) === 0;
    });
  }

  function showError(message) {
    // Remove any existing error messages
    $('.recaptcha-error').remove();
    
    // Add error message to messages area or create one
    var $messages = $('.messages--error');
    if (!$messages.length) {
      $messages = $('<div class="messages messages--error"></div>').prependTo('main');
    }
    
    $('<div class="recaptcha-error"></div>')
      .text(Drupal.t(message))
      .appendTo($messages);
  }

  function blockForm($form) {
    // Add an overlay to prevent interaction
    var $overlay = $('<div class="recaptcha-overlay"></div>').css({
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255, 255, 255, 0.7)',
      zIndex: 1000
    });
    
    // Position the form container relatively if it's not already
    $form.css('position', 'relative');
    
    // Add the overlay to the form
    $form.append($overlay);
    
    // Disable all form elements
    $form.find('input, select, textarea, button').prop('disabled', true);
  }

  function initializeRecaptcha($form, $container) {
    // If already initialized but form changed, we need to reset
    if (recaptchaInitialized && currentForm !== $form) {
      console.log('Form changed, resetting reCAPTCHA');
      recaptchaInitialized = false;
      widgetId = null;
      initializationError = false;
      // Reset the container
      $container.empty();
    }

    // If already initialized for this form, just attach handler
    if (recaptchaInitialized && currentForm === $form) {
      console.log('reCAPTCHA already initialized for this form');
      attachSubmitHandler($form);
      return;
    }

    currentForm = $form;
    
    // Create hidden input for reCAPTCHA response if not exists
    var $input = $form.find('input[name="g-recaptcha-response"]');
    if ($input.length === 0) {
      $input = $('<input>', {
        type: 'hidden',
        name: 'g-recaptcha-response',
        class: 'recaptcha-response'
      }).appendTo($form);
    }

    // Initialize reCAPTCHA
    try {
      console.log('Initializing reCAPTCHA for form:', $form.attr('id'));
      
      if (!drupalSettings.recaptchaInvisible || !drupalSettings.recaptchaInvisible.siteKey) {
        throw new Error(Drupal.t('Invalid or missing reCAPTCHA site key'));
      }

      grecaptcha.ready(function() {
        try {
          var options = {
            'sitekey': drupalSettings.recaptchaInvisible.siteKey,
            'size': 'invisible',
            'badge': drupalSettings.recaptchaInvisible.showBadge ? 'bottomright' : 'inline',
            'callback': function(token) {
              console.log('reCAPTCHA callback received token');
              if (currentForm) {
                var $currentInput = currentForm.find('input[name="g-recaptcha-response"]');
                $currentInput.val(token);
                console.log('Token set in input field');
                // Submit the form using native submit
                currentForm[0].submit();
              }
            },
            'expired-callback': function() {
              console.log('reCAPTCHA token expired');
              if (currentForm) {
                currentForm.find('input[name="g-recaptcha-response"]').val('');
              }
            },
            'error-callback': function() {
              console.error('reCAPTCHA error occurred');
              initializationError = true;
              if (currentForm) {
                currentForm.find('input[name="g-recaptcha-response"]').val('');
                blockForm(currentForm);
              }
              showError(Drupal.t('Error initializing reCAPTCHA. Please check the site key.'));
            }
          };

          widgetId = grecaptcha.render($container[0], options);
          
          recaptchaInitialized = true;
          initializationError = false;
          console.log('reCAPTCHA initialized with ID:', widgetId);
          attachSubmitHandler($form);
          
        } catch (error) {
          console.error('Error during reCAPTCHA initialization:', error);
          initializationError = true;
          blockForm($form);
          showError(Drupal.t('Error initializing reCAPTCHA. Please check the site key.'));
        }
      });
    } catch (error) {
      console.error('Error before reCAPTCHA initialization:', error);
      initializationError = true;
      blockForm($form);
      showError(Drupal.t('Error initializing reCAPTCHA. Please check the site key and refresh the page.'));
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Form submit event triggered');
    
    // If in dev mode, submit normally
    if (drupalSettings.recaptchaInvisible.devMode) {
      console.log('Dev mode enabled, submitting form');
      return true;
    }

    // If there was an initialization error, always block submission
    if (initializationError) {
      console.log('Preventing submission due to initialization error');
      showError(Drupal.t('Error initializing reCAPTCHA. Please check the site key and refresh the page.'));
      return false;
    }

    // Check for existing token
    var token = currentForm.find('input[name="g-recaptcha-response"]').val();
    console.log('Current token status:', token ? 'exists' : 'empty');
    
    if (token) {
      console.log('Token exists, allowing form submission');
      return true;
    }

    // Execute reCAPTCHA
    console.log('No token found, executing reCAPTCHA');
    try {
      grecaptcha.execute(widgetId);
    } catch (error) {
      console.error('Error executing reCAPTCHA:', error);
      showError(Drupal.t('Error executing reCAPTCHA. Please refresh the page and try again.'));
    }
    return false;
  }

  function attachSubmitHandler($form) {
    // Remove any existing handlers
    $form.off('.recaptcha');
    
    // Attach submit handler
    $form.on('submit.recaptcha', handleFormSubmit);
    
    // Handle all submit buttons in the form
    $form.find('[type="submit"]').each(function() {
      var $button = $(this);
      
      // Remove existing click handlers
      $button.off('.recaptcha');
      
      // Add our click handler
      $button.on('click.recaptcha', function(e) {
        if (initializationError) {
          e.preventDefault();
          e.stopPropagation();
          showError(Drupal.t('Error initializing reCAPTCHA. Please check the site key and refresh the page.'));
          return false;
        }
      });
    });
    
    console.log('Submit handlers attached to form:', $form.attr('id'));
  }

  Drupal.behaviors.recaptchaInvisible = {
    attach: function (context, settings) {
      // Only process each context once
      $(context).once('recaptcha-invisible').each(function() {
        if (typeof drupalSettings.recaptchaInvisible === 'undefined' || 
            typeof drupalSettings.recaptchaInvisible.siteKey === 'undefined') {
          console.log('Missing reCAPTCHA configuration');
          showError(Drupal.t('Missing reCAPTCHA configuration. Please configure the reCAPTCHA keys.'));
          return;
        }

        // Find all webform submission forms
        var $forms = $('form[id^="webform-submission-"]', this);
        
        if (!$forms.length) {
          if (context === document) {
            console.log('No webform submission forms found in document');
          }
          return;
        }

        $forms.each(function() {
          var $form = $(this);
          var formId = $form.attr('id');
          console.log('Processing form:', formId);

          if (!shouldProtectForm($form)) {
            console.log('Form is not protected by reCAPTCHA:', formId);
            return;
          }

          // Find reCAPTCHA container
          var $container = $form.find('.g-recaptcha');
          if (!$container.length) {
            console.log('reCAPTCHA container not found in form:', formId);
            return;
          }
          console.log('reCAPTCHA container found in form:', formId);

          // Initialize reCAPTCHA
          initializeRecaptcha($form, $container);
        });
      });
    }
  };
})(jQuery, Drupal, drupalSettings);
