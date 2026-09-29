<?php
/**
 * Creates one Sawargi batch in WooCommerce: a variable product (SKU = batch code) in the
 * "batch" category, stock managed on the product, one variation per grind sharing that
 * stock, and the batch fields the site reads (see wordpress/mu-plugins/sawargi-headless.php).
 *
 * Run it through deploy/add-batch.sh, which passes the batch file's values as
 * SAWARGI_* environment variables to `wp eval-file`.
 */

defined( 'ABSPATH' ) || exit( 1 );

if ( ! class_exists( 'WC_Product_Variable' ) ) {
	WP_CLI::error( 'WooCommerce is not active.' );
}
if ( ! defined( 'SAWARGI_META' ) ) {
	WP_CLI::error( 'The sawargi-headless must-use plugin is not loaded.' );
}

$input = static fn( string $key ): string => trim( (string) getenv( 'SAWARGI_' . $key ) );

$code    = strtoupper( $input( 'CODE' ) );
$roast   = $input( 'ROAST_DATE' );
$harvest = $input( 'HARVEST' );
$score   = $input( 'CUP_SCORE' );
$notes   = array_values( array_filter( array_map( 'trim', explode( ',', $input( 'NOTES' ) ) ) ) );
$bags    = $input( 'BAGS' );
$price   = $input( 'PRICE_IDR' );
$grinds  = array_values( array_filter( array_map( 'trim', explode( ',', $input( 'GRINDS' ) ) ) ) );
$status  = $input( 'STATUS' ) ?: 'publish';

// Refuse anything incomplete: every value here is shown to customers as fact.
$problems = array();
if ( ! preg_match( '/^[A-Z0-9][A-Z0-9-]{2,30}$/', $code ) ) {
	$problems[] = 'CODE must look like SWG-CN-015';
}
if ( ! preg_match( '/^\d{4}-\d{2}-\d{2}$/', $roast ) || ! strtotime( $roast ) ) {
	$problems[] = 'ROAST_DATE must be YYYY-MM-DD';
}
if ( '' === $harvest ) {
	$problems[] = 'HARVEST is empty';
}
if ( '' !== $score && ( ! is_numeric( $score ) || (float) $score < 0 || (float) $score > 100 ) ) {
	$problems[] = 'CUP_SCORE must be a number from 0 to 100, or left empty';
}
if ( ! $notes ) {
	$problems[] = 'NOTES is empty';
}
if ( ! ctype_digit( $bags ) || (int) $bags < 1 ) {
	$problems[] = 'BAGS must be a whole number of bags, at least 1';
}
if ( ! ctype_digit( $price ) || (int) $price < 1000 ) {
	$problems[] = 'PRICE_IDR must be whole rupiah, e.g. 150000';
}
if ( ! $grinds ) {
	$problems[] = 'GRINDS is empty';
}
if ( ! in_array( $status, array( 'publish', 'draft' ), true ) ) {
	$problems[] = 'STATUS must be publish or draft';
}
if ( $problems ) {
	WP_CLI::error( "The batch file isn't ready:\n  - " . implode( "\n  - ", $problems ) );
}

$existing = wc_get_product_id_by_sku( $code );
if ( $existing ) {
	WP_CLI::error( "Batch {$code} already exists (product #{$existing}). Change it in WP admin → Products." );
}

$category = get_term_by( 'slug', 'batch', 'product_cat' );
if ( ! $category ) {
	WP_CLI::error( 'The "batch" product category is missing. Run ./deploy/bootstrap-wordpress.sh first.' );
}
$attribute_id = wc_attribute_taxonomy_id_by_name( 'grind' );
$taxonomy     = 'pa_grind';
if ( ! $attribute_id || ! taxonomy_exists( $taxonomy ) ) {
	WP_CLI::error( 'The Grind attribute is missing. Run ./deploy/bootstrap-wordpress.sh first.' );
}

// Grind terms (Whole bean, Coarse, …): reuse existing ones, create any that are missing.
$terms = array();
foreach ( $grinds as $name ) {
	$term = get_term_by( 'name', $name, $taxonomy );
	if ( ! $term ) {
		$created = wp_insert_term( $name, $taxonomy );
		if ( is_wp_error( $created ) ) {
			WP_CLI::error( "Couldn't create the grind \"{$name}\": " . $created->get_error_message() );
		}
		$term = get_term( $created['term_id'], $taxonomy );
	}
	$terms[ $name ] = $term;
}

$attribute = new WC_Product_Attribute();
$attribute->set_id( $attribute_id );
$attribute->set_name( $taxonomy );
$attribute->set_options( array_map( static fn( WP_Term $t ): int => $t->term_id, array_values( $terms ) ) );
$attribute->set_visible( true );
$attribute->set_variation( true );

$product = new WC_Product_Variable();
$product->set_name( "Ciwidey Natural · {$code}" );
$product->set_sku( $code );
$product->set_status( $status );
$product->set_category_ids( array( $category->term_id ) );
$product->set_attributes( array( $attribute ) );
// Stock lives on the batch, shared by every grind.
$product->set_manage_stock( true );
$product->set_stock_quantity( (int) $bags );
$product->set_backorders( 'no' );
$product->update_meta_data( SAWARGI_META['roast_date'], $roast );
$product->update_meta_data( SAWARGI_META['harvest'], $harvest );
$product->update_meta_data( SAWARGI_META['cup_score'], '' === $score ? '' : (string) (float) $score );
$product->update_meta_data( SAWARGI_META['tasting_notes'], implode( ', ', $notes ) );
$product->update_meta_data( SAWARGI_META['bags_total'], (string) (int) $bags );
$product_id = $product->save();

foreach ( $terms as $name => $term ) {
	$variation = new WC_Product_Variation();
	$variation->set_parent_id( $product_id );
	$variation->set_attributes( array( $taxonomy => $term->slug ) );
	$variation->set_regular_price( (string) (int) $price );
	$variation->set_manage_stock( false ); // Uses the batch's stock.
	$variation->set_status( 'publish' );
	$variation->save();
}

WC_Product_Variable::sync( $product_id );
wc_delete_product_transients( $product_id );

WP_CLI::success(
	sprintf(
		'Batch %s created as product #%d (%s): %d bags at Rp %s, grinds: %s.',
		$code,
		$product_id,
		$status,
		(int) $bags,
		number_format( (int) $price, 0, ',', '.' ),
		implode( ', ', array_keys( $terms ) )
	)
);
