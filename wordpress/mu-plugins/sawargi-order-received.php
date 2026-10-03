<?php
/**
 * Plugin Name: Sawargi Order Received
 * Description: Sends buyers back to the designed site after an offline-payment order (bank transfer and the like), and gives that page the order's details through a key-protected REST endpoint. Install as a must-use plugin.
 * Version: 1.0.0
 * Requires PHP: 8.1
 *
 * 1. GET /wp-json/sawargi/v1/order-received?order=<id>&key=<order key> returns one order's
 *    summary: number, date, status, items, totals, payment method and, for bank transfer, the
 *    shop's bank accounts and instructions. The order key (WooCommerce's own, in every
 *    order-received link) is the only credential, exactly as on WooCommerce's own page.
 * 2. WooCommerce's order-received page redirects to <SAWARGI_FRONTEND_URL>order-received?order&key
 *    for the payment methods in sawargi_order_received_methods (default: bacs, cheque, cod).
 *    Online gateways (Midtrans, Xendit…) often finish their work on WooCommerce's own page, so
 *    they keep it. ?sawargi_stay=1 also keeps it (the site links there as a fallback).
 */

defined( 'ABSPATH' ) || exit;

/** Payment methods whose buyers finish on the designed site. */
function sawargi_order_received_methods(): array {
	return (array) apply_filters( 'sawargi_order_received_methods', array( 'bacs', 'cheque', 'cod' ) );
}

/** The order, if the key matches it. Constant-time comparison of the key. */
function sawargi_order_for_key( int $order_id, string $key ) {
	if ( ! function_exists( 'wc_get_order' ) || $order_id <= 0 || '' === $key ) {
		return null;
	}
	$order = wc_get_order( $order_id );
	if ( ! $order || ! is_a( $order, 'WC_Order' ) ) {
		return null;
	}
	return hash_equals( (string) $order->get_order_key(), $key ) ? $order : null;
}

/** @return array<string, mixed> */
/**
 * Plain text for the site to render as text. WooCommerce stores settings run through kses, so
 * "Lainnya' > 'Transfer'" arrives as "&gt;"; line breaks are kept, they carry the steps' layout.
 */
function sawargi_plain_text( string $value ): string {
	return trim( html_entity_decode( wp_strip_all_tags( $value ), ENT_QUOTES | ENT_HTML5, 'UTF-8' ) );
}

function sawargi_order_summary( $order ): array {
	$items = array();
	foreach ( $order->get_items() as $item ) {
		$details = array();
		foreach ( $item->get_formatted_meta_data() as $meta ) {
			$details[] = array(
				'label' => wp_strip_all_tags( (string) $meta->display_key ),
				'value' => wp_strip_all_tags( (string) $meta->display_value ),
			);
		}
		$items[] = array(
			'name'     => wp_strip_all_tags( (string) $item->get_name() ),
			'quantity' => (int) $item->get_quantity(),
			'total'    => (float) $item->get_total(),
			'details'  => $details,
		);
	}

	$summary = array(
		'number'         => (string) $order->get_order_number(),
		'date'           => $order->get_date_created() ? $order->get_date_created()->date( 'c' ) : null,
		'status'         => (string) $order->get_status(),
		'status_label'   => function_exists( 'wc_get_order_status_name' ) ? (string) wc_get_order_status_name( $order->get_status() ) : (string) $order->get_status(),
		'items'          => $items,
		'currency'       => (string) $order->get_currency(),
		'subtotal'       => (float) $order->get_subtotal(),
		'shipping_total' => (float) $order->get_shipping_total(),
		'total'          => (float) $order->get_total(),
		'payment_method' => (string) $order->get_payment_method(),
		'payment_title'  => wp_strip_all_tags( (string) $order->get_payment_method_title() ),
		'needs_payment'  => (bool) $order->needs_payment() || in_array( $order->get_status(), array( 'on-hold', 'pending' ), true ),
		'bank_accounts'  => array(),
		'instructions'   => '',
	);

	if ( 'bacs' === $order->get_payment_method() ) {
		foreach ( (array) get_option( 'woocommerce_bacs_accounts', array() ) as $account ) {
			$summary['bank_accounts'][] = array(
				'bank_name'      => sawargi_plain_text( (string) ( $account['bank_name'] ?? '' ) ),
				'account_name'   => sawargi_plain_text( (string) ( $account['account_name'] ?? '' ) ),
				'account_number' => sawargi_plain_text( (string) ( $account['account_number'] ?? '' ) ),
				'sort_code'      => sawargi_plain_text( (string) ( $account['sort_code'] ?? '' ) ),
				'iban'           => sawargi_plain_text( (string) ( $account['iban'] ?? '' ) ),
				'bic'            => sawargi_plain_text( (string) ( $account['bic'] ?? '' ) ),
			);
		}
	}
	$settings = get_option( 'woocommerce_' . $order->get_payment_method() . '_settings', array() );
	if ( is_array( $settings ) && ! empty( $settings['instructions'] ) ) {
		$summary['instructions'] = sawargi_plain_text( (string) $settings['instructions'] );
	}

	return $summary;
}

add_action(
	'rest_api_init',
	static function (): void {
		register_rest_route(
			'sawargi/v1',
			'/order-received',
			array(
				'methods'             => 'GET',
				// The order key is the credential, as on WooCommerce's own order-received page.
				'permission_callback' => '__return_true',
				'args'                => array(
					'order' => array( 'required' => true, 'type' => 'integer', 'minimum' => 1 ),
					'key'   => array( 'required' => true, 'type' => 'string' ),
				),
				'callback'            => static function ( WP_REST_Request $request ) {
					$order = sawargi_order_for_key( (int) $request['order'], (string) $request['key'] );
					if ( ! $order ) {
						return new WP_Error( 'sawargi_order_not_found', 'Order not found.', array( 'status' => 404 ) );
					}
					$response = rest_ensure_response( sawargi_order_summary( $order ) );
					$response->header( 'Cache-Control', 'no-store' );
					return $response;
				},
			)
		);
	}
);

add_action(
	'template_redirect',
	static function (): void {
		if ( ! defined( 'SAWARGI_FRONTEND_URL' ) || '' === SAWARGI_FRONTEND_URL || ! function_exists( 'is_order_received_page' ) || ! is_order_received_page() ) {
			return;
		}
		if ( isset( $_GET['sawargi_stay'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification
			return;
		}
		$order_id = absint( get_query_var( 'order-received' ) );
		$key      = isset( $_GET['key'] ) ? sanitize_text_field( wp_unslash( $_GET['key'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$order    = sawargi_order_for_key( $order_id, $key );
		if ( ! $order || ! in_array( $order->get_payment_method(), sawargi_order_received_methods(), true ) ) {
			return;
		}
		$target = add_query_arg(
			array( 'order' => $order_id, 'key' => rawurlencode( $key ) ),
			trailingslashit( SAWARGI_FRONTEND_URL ) . 'order-received'
		);
		wp_safe_redirect( $target, 302 );
		exit;
	},
	5 // Before WooCommerce renders the page.
);
