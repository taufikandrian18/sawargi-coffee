<?php
/**
 * Plugin Name: Sawargi Headless
 * Description: Batch fields for WooCommerce products, exposed to the Store API for the Sawargi site. Install as a must-use plugin.
 * Version: 1.0.0
 * Requires PHP: 8.1
 *
 * What it does
 * 1. Adds a "Sawargi batch" box to the product editor: roast date, harvest,
 *    cup score, tasting notes and bags total. Batch code = the product SKU.
 * 2. Adds those fields plus the live stock count to the public Store API
 *    (/wp-json/wc/store/v1/products) under `extensions.sawargi`, which the
 *    React site reads. No API keys are needed in the browser.
 * 3. Optional, via wp-config.php constants:
 *      SAWARGI_FRONTEND_ORIGIN  e.g. 'https://sawargi.com'  → only that origin gets CORS on the REST API.
 *      SAWARGI_FRONTEND_URL     e.g. 'https://sawargi.com'  → shop front / product pages redirect to the designed site.
 *
 * See docs/cms/WORDPRESS.md in the site repo.
 */

defined( 'ABSPATH' ) || exit;

const SAWARGI_META = array(
	'roast_date'    => '_sawargi_roast_date',
	'harvest'       => '_sawargi_harvest',
	'cup_score'     => '_sawargi_cup_score',
	'tasting_notes' => '_sawargi_tasting_notes',
	'bags_total'    => '_sawargi_bags_total',
);

/* -------------------------------------------------------------------------
 * 1. Admin: the "Sawargi batch" box on products.
 * ---------------------------------------------------------------------- */

add_action(
	'add_meta_boxes_product',
	static function () {
		add_meta_box( 'sawargi-batch', 'Sawargi batch', 'sawargi_render_batch_box', 'product', 'side', 'high' );
	}
);

function sawargi_render_batch_box( WP_Post $post ): void {
	wp_nonce_field( 'sawargi_batch_save', 'sawargi_batch_nonce' );
	$value = static fn( string $key ): string => (string) get_post_meta( $post->ID, SAWARGI_META[ $key ], true );
	?>
	<p style="margin-top:0">The batch code is the product <strong>SKU</strong> (e.g. SWG-CN-015). Put batches in the <strong>batch</strong> category. Stock is managed on the Inventory tab.</p>
	<p><label for="sawargi_roast_date"><strong>Roast date</strong></label><br>
		<input type="date" id="sawargi_roast_date" name="sawargi_roast_date" value="<?php echo esc_attr( $value( 'roast_date' ) ); ?>" required></p>
	<p><label for="sawargi_harvest"><strong>Harvest</strong></label><br>
		<input type="text" id="sawargi_harvest" name="sawargi_harvest" value="<?php echo esc_attr( $value( 'harvest' ) ); ?>" placeholder="2026 main crop" style="width:100%"></p>
	<p><label for="sawargi_cup_score"><strong>Cup score</strong></label><br>
		<input type="number" id="sawargi_cup_score" name="sawargi_cup_score" value="<?php echo esc_attr( $value( 'cup_score' ) ); ?>" min="0" max="100" step="0.25"></p>
	<p><label for="sawargi_tasting_notes"><strong>Tasting notes</strong> (comma-separated)</label><br>
		<input type="text" id="sawargi_tasting_notes" name="sawargi_tasting_notes" value="<?php echo esc_attr( $value( 'tasting_notes' ) ); ?>" placeholder="jackfruit, palm sugar, cacao nib" style="width:100%"></p>
	<p><label for="sawargi_bags_total"><strong>Bags in this batch</strong> (total roasted)</label><br>
		<input type="number" id="sawargi_bags_total" name="sawargi_bags_total" value="<?php echo esc_attr( $value( 'bags_total' ) ); ?>" min="0" step="1"></p>
	<?php
}

add_action(
	'save_post_product',
	static function ( int $post_id ): void {
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		$nonce = isset( $_POST['sawargi_batch_nonce'] ) ? sanitize_text_field( wp_unslash( $_POST['sawargi_batch_nonce'] ) ) : '';
		if ( ! wp_verify_nonce( $nonce, 'sawargi_batch_save' ) || ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$field = static fn( string $name ): string => isset( $_POST[ $name ] ) ? sanitize_text_field( wp_unslash( $_POST[ $name ] ) ) : '';

		$roast_date = $field( 'sawargi_roast_date' );
		update_post_meta( $post_id, SAWARGI_META['roast_date'], preg_match( '/^\d{4}-\d{2}-\d{2}$/', $roast_date ) ? $roast_date : '' );
		update_post_meta( $post_id, SAWARGI_META['harvest'], $field( 'sawargi_harvest' ) );

		$score = $field( 'sawargi_cup_score' );
		update_post_meta( $post_id, SAWARGI_META['cup_score'], '' === $score ? '' : (string) min( 100, max( 0, (float) $score ) ) );

		$notes = array_values( array_filter( array_map( 'trim', explode( ',', $field( 'sawargi_tasting_notes' ) ) ) ) );
		update_post_meta( $post_id, SAWARGI_META['tasting_notes'], implode( ', ', $notes ) );

		$total = $field( 'sawargi_bags_total' );
		update_post_meta( $post_id, SAWARGI_META['bags_total'], '' === $total ? '' : (string) max( 0, (int) $total ) );
	}
);

/* -------------------------------------------------------------------------
 * 2. Store API: expose batch fields + live stock under extensions.sawargi.
 * ---------------------------------------------------------------------- */

/**
 * @return array<string, mixed>
 */
function sawargi_batch_data( WC_Product $product ): array {
	$id    = $product->get_id();
	$meta  = static fn( string $key ): string => (string) get_post_meta( $id, SAWARGI_META[ $key ], true );
	$notes = array_values( array_filter( array_map( 'trim', explode( ',', $meta( 'tasting_notes' ) ) ) ) );

	// Stock lives on the parent product ("Manage stock" on the Inventory tab),
	// shared by all grind variations. Null when stock isn't managed.
	$bags_left = $product->managing_stock() ? max( 0, (int) $product->get_stock_quantity() ) : null;

	return array(
		'batch_code'    => (string) $product->get_sku(),
		'roast_date'    => $meta( 'roast_date' ),
		'harvest'       => $meta( 'harvest' ),
		'cup_score'     => '' === $meta( 'cup_score' ) ? null : (float) $meta( 'cup_score' ),
		'tasting_notes' => $notes,
		'bags_total'    => '' === $meta( 'bags_total' ) ? null : (int) $meta( 'bags_total' ),
		'bags_left'     => $bags_left,
		'origin'        => (string) $product->get_attribute( 'origin' ),
		'process'       => (string) $product->get_attribute( 'process' ),
		'size_label'    => (string) $product->get_attribute( 'size' ),
	);
}

/**
 * @return array<string, array<string, mixed>>
 */
function sawargi_batch_schema(): array {
	$field = static fn( array $type, string $description ): array => array(
		'description' => $description,
		'type'        => $type,
		'context'     => array( 'view', 'edit' ),
		'readonly'    => true,
	);
	return array(
		'batch_code'    => $field( array( 'string' ), 'Batch code (product SKU).' ),
		'roast_date'    => $field( array( 'string' ), 'Roast date, YYYY-MM-DD.' ),
		'harvest'       => $field( array( 'string' ), 'Harvest label.' ),
		'cup_score'     => $field( array( 'number', 'null' ), 'Cup score out of 100.' ),
		'tasting_notes' => $field( array( 'array' ), 'Tasting notes.' ),
		'bags_total'    => $field( array( 'integer', 'null' ), 'Bags roasted in this batch.' ),
		'bags_left'     => $field( array( 'integer', 'null' ), 'Bags in stock right now.' ),
		'origin'        => $field( array( 'string' ), 'Origin attribute, if set.' ),
		'process'       => $field( array( 'string' ), 'Process attribute, if set.' ),
		'size_label'    => $field( array( 'string' ), 'Size attribute, if set.' ),
	);
}

add_action(
	'woocommerce_blocks_loaded',
	static function (): void {
		if ( ! function_exists( 'woocommerce_store_api_register_endpoint_data' ) ) {
			return;
		}
		woocommerce_store_api_register_endpoint_data(
			array(
				'endpoint'        => \Automattic\WooCommerce\StoreApi\Schemas\V1\ProductSchema::IDENTIFIER,
				'namespace'       => 'sawargi',
				'data_callback'   => 'sawargi_batch_data',
				'schema_callback' => 'sawargi_batch_schema',
				'schema_type'     => ARRAY_A,
			)
		);
	}
);

/* -------------------------------------------------------------------------
 * 3a. CORS: only the Sawargi site may call the REST API from a browser.
 * ---------------------------------------------------------------------- */

add_action(
	'rest_api_init',
	static function (): void {
		if ( ! defined( 'SAWARGI_FRONTEND_ORIGIN' ) || '' === SAWARGI_FRONTEND_ORIGIN ) {
			return; // WordPress default CORS behaviour.
		}
		remove_filter( 'rest_pre_serve_request', 'rest_send_cors_headers' );
		add_filter(
			'rest_pre_serve_request',
			static function ( $served ) {
				$origin = get_http_origin();
				if ( $origin && untrailingslashit( $origin ) === untrailingslashit( SAWARGI_FRONTEND_ORIGIN ) ) {
					header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origin ) );
					header( 'Access-Control-Allow-Methods: GET, OPTIONS' );
					header( 'Access-Control-Allow-Headers: Content-Type, Accept' );
					header( 'Vary: Origin', false );
				}
				return $served;
			}
		);
	},
	15
);

/* -------------------------------------------------------------------------
 * 3b. Keep shoppers on the designed site: WooCommerce's own shop front and
 *     product pages redirect there. Cart, checkout, account and admin stay.
 * ---------------------------------------------------------------------- */

add_action(
	'template_redirect',
	static function (): void {
		if ( ! defined( 'SAWARGI_FRONTEND_URL' ) || '' === SAWARGI_FRONTEND_URL || is_admin() ) {
			return;
		}
		if ( function_exists( 'is_checkout' ) && ( is_checkout() || is_cart() || is_account_page() || is_wc_endpoint_url() ) ) {
			return;
		}
		if ( is_front_page() || ( function_exists( 'is_shop' ) && ( is_shop() || is_product() || is_product_category() ) ) ) {
			wp_safe_redirect( SAWARGI_FRONTEND_URL, 302 );
			exit;
		}
		// Posts are journal articles; the site renders them at /journal/<slug>.
		// Previews stay in WordPress so drafts can be checked before publishing.
		if ( is_preview() ) {
			return;
		}
		if ( is_singular( 'post' ) ) {
			$post = get_queried_object();
			if ( $post instanceof WP_Post && 'publish' === $post->post_status ) {
				wp_safe_redirect( trailingslashit( SAWARGI_FRONTEND_URL ) . 'journal/' . $post->post_name, 302 );
				exit;
			}
			return;
		}
		if ( is_home() || is_category() || is_tag() || is_author() || is_date() ) {
			wp_safe_redirect( trailingslashit( SAWARGI_FRONTEND_URL ) . 'journal', 302 );
			exit;
		}
	}
);

add_filter(
	'allowed_redirect_hosts',
	static function ( array $hosts ): array {
		if ( defined( 'SAWARGI_FRONTEND_URL' ) && SAWARGI_FRONTEND_URL ) {
			$host = wp_parse_url( SAWARGI_FRONTEND_URL, PHP_URL_HOST );
			if ( $host ) {
				$hosts[] = $host;
			}
		}
		return $hosts;
	}
);
