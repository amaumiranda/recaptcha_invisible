# reCAPTCHA Invisible

## INTRODUCTION

The reCAPTCHA Invisible module adds Google reCAPTCHA v2 Invisible protection to your
Drupal webforms. It helps prevent spam submissions while providing a seamless user
experience, as the CAPTCHA verification happens in the background without user
interaction.

The module allows you to:
* Protect specific webforms by their IDs
* Configure reCAPTCHA visibility and behavior
* Enable development mode for testing
* Support for both English and Portuguese (Brazil) languages

## REQUIREMENTS

This module requires the following modules:
* Webform (https://www.drupal.org/project/webform)

You will also need:
* A Google reCAPTCHA v2 Invisible site key and secret key
  (https://www.google.com/recaptcha/admin)

## INSTALLATION

Install as you would normally install a contributed Drupal module:
1. Copy the module to your modules directory
2. Enable the module at `/admin/modules`
3. Configure your reCAPTCHA keys at `/admin/config/recaptcha_invisible`

## CONFIGURATION

1. Visit `/admin/config/recaptcha_invisible` to configure the module
2. Enter your reCAPTCHA site key and secret key
3. Configure which forms to protect by entering their IDs
4. Optionally enable development mode for testing
5. Choose whether to show or hide the reCAPTCHA badge

## TROUBLESHOOTING

* If the reCAPTCHA is not appearing, check that:
    * Your site key and secret key are correctly configured
    * The form ID matches exactly (including any prefixes)
    * JavaScript is enabled in the browser
    * The site is accessible by Google's servers

* For development and testing:
    * Enable development mode in the module settings
    * Check browser console for error messages
    * Verify form IDs in the page source

## FAQ

**Q: Which forms are protected by default?**
A: If no specific form IDs are configured, the module protects all webform
   submission forms (those with IDs starting with "webform-submission-").

**Q: Can I protect non-webform forms?**
A: Yes, you can protect any form by adding its ID to the module configuration.

**Q: Does it work with AJAX forms?**
A: Yes, the module handles Drupal's AJAX form submissions correctly.

## MAINTAINERS

Current maintainers:
* Amauri Miranda dos Santos Junior - https://amaurimrianda.com.br
* GitHub: https://github.com/amaumiranda

This project has been sponsored by:
* Your organization/company name could be here
