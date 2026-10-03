<?php
/**
 * Plugin Name: Sawargi mail
 * Description: Sends WordPress and WooCommerce email (order emails, bank details, new-order alerts)
 *              through the SMTP server set in deploy/.env. The WordPress container has no mail
 *              server, so without this wp_mail() fails silently.
 *
 * Settings come from the container environment (deploy/.env → docker-compose.yml):
 *   SMTP_HOST, SMTP_PORT, SMTP_SECURE (tls | ssl | none), SMTP_USER, SMTP_PASS,
 *   SMTP_FROM (defaults to SMTP_USER), SMTP_FROM_NAME.
 * Without SMTP_HOST nothing changes. Failures are logged to the container log (docker compose logs wordpress).
 */

defined( 'ABSPATH' ) || exit;

function sawargi_smtp_setting( string $name, string $fallback = '' ): string {
	$value = getenv( 'SMTP_' . $name );
	return false === $value || '' === trim( (string) $value ) ? $fallback : trim( (string) $value );
}

add_action(
	'phpmailer_init',
	static function ( $mailer ): void {
		$host = sawargi_smtp_setting( 'HOST' );
		if ( '' === $host ) {
			return;
		}
		$secure = strtolower( sawargi_smtp_setting( 'SECURE', 'tls' ) );
		$user   = sawargi_smtp_setting( 'USER' );

		$mailer->isSMTP();
		$mailer->Host        = $host;
		$mailer->Port        = (int) sawargi_smtp_setting( 'PORT', 'ssl' === $secure ? '465' : '587' );
		$mailer->SMTPSecure  = in_array( $secure, array( 'tls', 'ssl' ), true ) ? $secure : '';
		$mailer->SMTPAutoTLS = 'none' !== $secure;
		$mailer->SMTPAuth    = '' !== $user;
		$mailer->Username    = $user;
		$mailer->Password    = sawargi_smtp_setting( 'PASS' );
		$mailer->Timeout     = 15;

		// Most SMTP services only accept mail from the account (or domain) they authenticated, so
		// the From address is the SMTP sender, whatever WooCommerce's email settings say.
		$from = sawargi_smtp_setting( 'FROM', $user );
		if ( is_email( $from ) ) {
			$name = sawargi_smtp_setting( 'FROM_NAME', (string) $mailer->FromName );
			$mailer->setFrom( $from, $name, true );
		}
	}
);

add_action(
	'wp_mail_failed',
	static function ( $error ): void {
		// Never log the message body or credentials, only why it failed and to whom.
		$data = is_object( $error ) && method_exists( $error, 'get_error_data' ) ? (array) $error->get_error_data() : array();
		$to   = isset( $data['to'] ) ? implode( ', ', (array) $data['to'] ) : '?';
		error_log( 'sawargi-mail: sending to ' . $to . ' failed: ' . ( is_object( $error ) ? $error->get_error_message() : 'unknown error' ) );
	}
);
