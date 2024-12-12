<?php

namespace Drupal\recaptcha_invisible\Form;

use Drupal\Core\Form\ConfigFormBase;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Url;
use Drupal\Core\Cache\Cache;

/**
 * Configure reCAPTCHA Invisible settings for this site.
 */
class RecaptchaInvisibleSettingsForm extends ConfigFormBase {

  /**
   * {@inheritdoc}
   */
  public function getFormId() {
    return 'recaptcha_invisible_settings';
  }

  /**
   * {@inheritdoc}
   */
  protected function getEditableConfigNames() {
    return ['recaptcha_invisible.settings'];
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state) {
    $config = $this->config('recaptcha_invisible.settings');

    $form['info'] = [
      '#type' => 'markup',
      '#markup' => $this->t('To use reCAPTCHA, you need to <a href="@url" target="_blank">register your domain</a> and get a site key and secret key.', [
        '@url' => 'https://www.google.com/recaptcha/admin',
      ]),
      '#weight' => -15,
    ];

    $form['site_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Site Key'),
      '#description' => $this->t('The site key provided by Google reCAPTCHA.'),
      '#default_value' => $config->get('site_key'),
      '#required' => TRUE,
    ];

    $form['secret_key'] = [
      '#type' => 'textfield',
      '#title' => $this->t('Secret Key'),
      '#description' => $this->t('The secret key provided by Google reCAPTCHA.'),
      '#default_value' => $config->get('secret_key'),
      '#required' => TRUE,
    ];

    $form['form_ids'] = [
      '#type' => 'textarea',
      '#title' => $this->t('Form IDs'),
      '#description' => $this->t('Enter one form ID per line. Leave empty to protect all webform submission forms.'),
      '#default_value' => $config->get('form_ids'),
    ];

    $form['dev_mode'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Development Mode'),
      '#description' => $this->t('Enable development mode to bypass reCAPTCHA validation.'),
      '#default_value' => $config->get('dev_mode'),
    ];

    $form['show_badge'] = [
      '#type' => 'checkbox',
      '#title' => $this->t('Show Badge'),
      '#description' => $this->t('Show the reCAPTCHA badge on the page.'),
      '#default_value' => $config->get('show_badge'),
    ];

    return parent::buildForm($form, $form_state);
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state) {
    parent::validateForm($form, $form_state);

    if (!$form_state->getValue('dev_mode')) {
      if (empty($form_state->getValue('site_key'))) {
        $form_state->setError($form['site_key'], $this->t('Site key is required when not in development mode.'));
      }
      if (empty($form_state->getValue('secret_key'))) {
        $form_state->setError($form['secret_key'], $this->t('Secret key is required when not in development mode.'));
      }
    }
  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {
    $this->config('recaptcha_invisible.settings')
      ->set('site_key', $form_state->getValue('site_key'))
      ->set('secret_key', $form_state->getValue('secret_key'))
      ->set('form_ids', $form_state->getValue('form_ids'))
      ->set('dev_mode', $form_state->getValue('dev_mode'))
      ->set('show_badge', $form_state->getValue('show_badge'))
      ->save();

    // Clear all necessary caches
    Cache::invalidateTags([
      'library_info',           // Clear library cache
      'config:recaptcha_invisible.settings', // Clear config cache
      'rendered',               // Clear render cache
    ]);

    // Clear page and block cache
    \Drupal::service('cache.page')->invalidateAll();
    \Drupal::service('cache.render')->invalidateAll();

    parent::submitForm($form, $form_state);
  }
}
