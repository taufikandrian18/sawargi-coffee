<?php
/**
 * Plugin Name: Sawargi Checkout Look
 * Description: Dresses WooCommerce's checkout, cart, order-received and account pages in the Sawargi site's look (ink background, paper cards, cherry buttons, the site's three typefaces) and swaps the theme header for a Sawargi one that leads back to the site. Install as a must-use plugin.
 * Version: 1.0.0
 * Requires PHP: 8.1
 *
 * Theme-agnostic on purpose: it targets WooCommerce's own block class names (wc-block-*) and the
 * classic `woocommerce` markup, and hides the active theme's header/footer only on these pages.
 */

defined( 'ABSPATH' ) || exit;

/** The pages a buyer sees after "Continue to payment" on the designed site. */
function sawargi_is_shop_flow_page(): bool {
	if ( ! function_exists( 'is_checkout' ) ) {
		return false;
	}
	return is_checkout() || is_cart() || is_account_page()
		|| ( function_exists( 'is_order_received_page' ) && is_order_received_page() );
}

/** Where the designed site lives (SAWARGI_FRONTEND_URL, set in deploy/docker-compose.yml). */
function sawargi_frontend_url(): string {
	return defined( 'SAWARGI_FRONTEND_URL' ) && SAWARGI_FRONTEND_URL ? trailingslashit( SAWARGI_FRONTEND_URL ) : home_url( '/' );
}

function sawargi_shop_flow_label(): string {
	if ( function_exists( 'is_order_received_page' ) && is_order_received_page() ) {
		return 'Order received';
	}
	if ( is_checkout() ) {
		return 'Secure checkout';
	}
	return is_cart() ? 'Your bag' : 'Your account';
}

add_filter(
	'body_class',
	static function ( array $classes ): array {
		if ( sawargi_is_shop_flow_page() ) {
			$classes[] = 'sawargi-shop';
		}
		return $classes;
	}
);

add_action(
	'wp_enqueue_scripts',
	static function (): void {
		if ( ! sawargi_is_shop_flow_page() ) {
			return;
		}
		wp_enqueue_style(
			'sawargi-fonts',
			'https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800&family=IBM+Plex+Mono:wght@400;500&family=Readex+Pro:wght@300;400;500;600;700&display=swap',
			array(),
			null
		);
		wp_register_style( 'sawargi-checkout', false, array( 'sawargi-fonts' ), '1.0.0' );
		wp_enqueue_style( 'sawargi-checkout' );
		wp_add_inline_style( 'sawargi-checkout', sawargi_checkout_css() );
	},
	100 // After the theme and WooCommerce, so these rules win on equal specificity.
);

/** The Sawargi header, printed right after <body> (block and classic themes both call wp_body_open). */
add_action(
	'wp_body_open',
	static function (): void {
		if ( ! sawargi_is_shop_flow_page() ) {
			return;
		}
		$site = sawargi_frontend_url();
		?>
		<header class="sawargi-shop-header">
			<a class="sawargi-shop-header__brand" href="<?php echo esc_url( $site ); ?>" aria-label="Sawargi home">
				<img src="<?php echo esc_url( $site . 'brand/sawargi-mark-white-cropped.webp' ); ?>" alt="" width="24" height="32">
				<img src="<?php echo esc_url( $site . 'brand/sawargi-wordmark-white-cropped.webp' ); ?>" alt="" height="18">
			</a>
			<span class="sawargi-shop-header__label"><?php echo esc_html( sawargi_shop_flow_label() ); ?></span>
			<a class="sawargi-shop-header__back" href="<?php echo esc_url( $site . '#batch' ); ?>">&larr; Back to Sawargi</a>
		</header>
		<?php
	}
);

function sawargi_checkout_css(): string {
	return <<<'CSS'
body.sawargi-shop {
	--sw-ink: #0c0a08;
	--sw-char: #1b1714;
	--sw-paper: #ece6da;
	--sw-paper-mut: #8e877c;
	--sw-ink-mut: #5a544b;
	--sw-cherry: #b33f2d;
	--sw-cherry-dark: #8f3122;
	--sw-display: 'Big Shoulders Display', 'Arial Narrow', sans-serif;
	--sw-body: 'Readex Pro', system-ui, -apple-system, sans-serif;
	--sw-mono: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
	background: var(--sw-ink) !important;
	color: var(--sw-paper);
	font-family: var(--sw-body);
	accent-color: var(--sw-cherry);
}

/* The theme's own header and footer give way to the Sawargi header. */
body.sawargi-shop .wp-site-blocks > header,
body.sawargi-shop .wp-site-blocks > footer,
body.sawargi-shop header.wp-block-template-part,
body.sawargi-shop footer.wp-block-template-part,
body.sawargi-shop #masthead,
body.sawargi-shop .site-header,
body.sawargi-shop #colophon,
body.sawargi-shop .site-footer {
	display: none !important;
}

.sawargi-shop-header {
	display: flex;
	align-items: center;
	gap: 1rem;
	flex-wrap: wrap;
	padding: 1.25rem clamp(1rem, 4vw, 2.5rem);
	border-bottom: 1px solid rgb(236 230 218 / 0.12);
	font-family: var(--sw-body);
}
.sawargi-shop-header__brand {
	display: inline-flex;
	align-items: center;
	gap: 0.6rem;
	min-height: 44px;
}
.sawargi-shop-header__brand img { display: block; width: auto; }
.sawargi-shop-header__brand img:first-child { height: 28px; }
.sawargi-shop-header__brand img:last-child { height: 18px; }
.sawargi-shop-header__label {
	font-family: var(--sw-mono);
	font-size: 0.75rem;
	letter-spacing: 0.18em;
	text-transform: uppercase;
	color: var(--sw-paper-mut);
}
.sawargi-shop-header__back {
	margin-left: auto;
	color: var(--sw-paper) !important;
	font-size: 0.875rem;
	text-decoration: underline;
	text-decoration-color: var(--sw-cherry);
	text-underline-offset: 6px;
	min-height: 44px;
	display: inline-flex;
	align-items: center;
}
@media (max-width: 479px) {
	/* One line on phones: the brand and the way back matter more than the page label. */
	.sawargi-shop-header__label { display: none; }
}

/* Page width and title, like the site's checkout. */
body.sawargi-shop main,
body.sawargi-shop .wp-site-blocks > main {
	max-width: 1180px;
	margin-inline: auto !important;
	padding: clamp(1.5rem, 4vw, 3rem) clamp(1rem, 4vw, 2.5rem) 4rem !important;
}
body.sawargi-shop h1,
body.sawargi-shop .wp-block-post-title,
body.sawargi-shop .entry-title {
	font-family: var(--sw-display) !important;
	font-weight: 800 !important;
	text-transform: uppercase;
	letter-spacing: 0.01em;
	line-height: 0.95 !important;
	font-size: clamp(2.5rem, 7vw, 4.5rem) !important;
	color: var(--sw-paper) !important;
	margin: 0 0 2rem !important;
}

/* The checkout panels become paper cards with the site's hard shadow (the batch ticket look). */
body.sawargi-shop .wc-block-checkout__main,
body.sawargi-shop .wc-block-checkout__sidebar,
body.sawargi-shop .wc-block-cart__main,
body.sawargi-shop .wc-block-cart__sidebar,
body.sawargi-shop .wp-block-woocommerce-empty-cart-block,
body.sawargi-shop .woocommerce-order,
body.sawargi-shop .wc-block-order-confirmation-status,
body.sawargi-shop .wc-block-order-confirmation-summary,
body.sawargi-shop .wc-block-order-confirmation-totals-wrapper,
body.sawargi-shop .wc-block-order-confirmation-billing-wrapper,
body.sawargi-shop .wc-block-order-confirmation-shipping-wrapper,
body.sawargi-shop .woocommerce-MyAccount-content,
body.sawargi-shop .woocommerce-MyAccount-navigation,
body.sawargi-shop form.woocommerce-form-login {
	background: var(--sw-paper);
	color: var(--sw-char);
	border-radius: 24px;
	padding: clamp(1.25rem, 3vw, 2rem) !important;
	box-shadow: 8px 8px 0 var(--sw-cherry);
	margin-bottom: 2rem;
}
body.sawargi-shop .wc-block-checkout__sidebar,
body.sawargi-shop .wc-block-cart__sidebar {
	box-shadow: 8px 8px 0 var(--sw-char), 0 0 0 1px rgb(236 230 218 / 0.08);
	align-self: start;
}

/* Headings inside the cards. */
body.sawargi-shop .wc-block-components-title,
body.sawargi-shop .wc-block-components-checkout-step__title,
body.sawargi-shop .wc-block-cart__totals-title,
body.sawargi-shop .wc-block-components-order-summary__button-text,
body.sawargi-shop .woocommerce-order h2,
body.sawargi-shop .woocommerce-column__title,
body.sawargi-shop .wc-block-order-confirmation-status h1,
body.sawargi-shop .woocommerce-MyAccount-content h2 {
	font-family: var(--sw-display) !important;
	font-weight: 800 !important;
	text-transform: uppercase;
	letter-spacing: 0.02em;
	color: var(--sw-char) !important;
}
body.sawargi-shop .wc-block-components-checkout-step__title { font-size: 1.6rem !important; }
body.sawargi-shop .wc-block-order-confirmation-status h1 { font-size: clamp(2rem, 5vw, 3rem) !important; margin: 0 !important; }

/* Text, links and small print inside the cards. */
body.sawargi-shop .wc-block-checkout__main a,
body.sawargi-shop .wc-block-checkout__sidebar a,
body.sawargi-shop .woocommerce-order a,
body.sawargi-shop .woocommerce-MyAccount-content a {
	color: var(--sw-cherry);
	text-underline-offset: 3px;
}
body.sawargi-shop .wc-block-components-checkout-step__description,
body.sawargi-shop .wc-block-components-product-metadata,
body.sawargi-shop .wc-block-checkout__terms,
body.sawargi-shop .wc-block-components-checkbox__label {
	color: var(--sw-ink-mut) !important;
}

/* Prices and totals in the site's mono face, like the batch ticket. */
body.sawargi-shop .wc-block-components-totals-item__value,
body.sawargi-shop .wc-block-components-product-price,
body.sawargi-shop .wc-block-components-order-summary-item__total-price,
body.sawargi-shop .wc-block-formatted-money-amount,
body.sawargi-shop .woocommerce-Price-amount,
body.sawargi-shop .wc-block-components-order-summary-item__quantity,
body.sawargi-shop .wc-block-components-totals-item__label,
body.sawargi-shop .woocommerce-order-overview,
body.sawargi-shop .woocommerce-bacs-bank-details {
	font-family: var(--sw-mono) !important;
}
body.sawargi-shop .wc-block-components-totals-footer-item .wc-block-components-totals-item__value,
body.sawargi-shop .wc-block-components-totals-footer-item .wc-block-components-totals-item__label {
	font-size: 1.15rem;
	font-weight: 500;
}

/* Fields. */
body.sawargi-shop .wc-block-components-text-input input,
body.sawargi-shop .wc-block-components-textarea,
body.sawargi-shop .wc-blocks-components-select__select,
body.sawargi-shop .wc-block-components-combobox .wc-block-components-combobox-control input,
body.sawargi-shop .woocommerce form .input-text,
body.sawargi-shop .woocommerce form select {
	border-radius: 12px !important;
	border: 1px solid rgb(27 23 20 / 0.28) !important;
	background: #f6f2ea !important;
	color: var(--sw-char) !important;
	font-family: var(--sw-body) !important;
}
body.sawargi-shop .wc-block-components-text-input input:focus,
body.sawargi-shop .wc-block-components-textarea:focus,
body.sawargi-shop .wc-blocks-components-select__select:focus,
body.sawargi-shop .woocommerce form .input-text:focus {
	border-color: var(--sw-cherry) !important;
	box-shadow: 0 0 0 2px rgb(179 63 45 / 0.35) !important;
	outline: none !important;
}
body.sawargi-shop .wc-block-components-text-input label,
body.sawargi-shop .wc-blocks-components-select__label {
	color: var(--sw-ink-mut) !important;
}

/* Payment and shipping options: the chosen one gets the cherry edge. */
body.sawargi-shop .wc-block-components-radio-control__option,
body.sawargi-shop .wc-block-components-radio-control-accordion-option {
	border-radius: 14px;
}
body.sawargi-shop .wc-block-components-radio-control__option-checked,
body.sawargi-shop .wc-block-components-radio-control-accordion-option--checked-option-highlighted,
body.sawargi-shop .wc-block-components-radio-control--highlight-checked .wc-block-components-radio-control-accordion-option--checked-option-highlighted {
	box-shadow: inset 0 0 0 2px var(--sw-cherry) !important;
}
/* Payment options wrap a radio row inside the highlighted card: one cherry edge, not two. */
body.sawargi-shop .wc-block-components-radio-control-accordion-option .wc-block-components-radio-control__option-checked {
	box-shadow: none !important;
}
body.sawargi-shop .wc-block-components-radio-control__input:checked,
body.sawargi-shop .wc-block-components-checkbox__input:checked {
	background-color: var(--sw-cherry) !important;
	border-color: var(--sw-cherry) !important;
}

/* Buttons: the site's cherry pill. */
body.sawargi-shop .wc-block-components-button:not(.is-link),
body.sawargi-shop .wc-block-components-checkout-place-order-button,
body.sawargi-shop .wc-block-cart__submit-button,
body.sawargi-shop .wp-element-button,
body.sawargi-shop .woocommerce .button,
body.sawargi-shop .woocommerce button.button,
body.sawargi-shop .woocommerce a.button {
	background: var(--sw-cherry) !important;
	color: var(--sw-paper) !important;
	border: 0 !important;
	border-radius: 999px !important;
	font-family: var(--sw-body) !important;
	font-weight: 600 !important;
	text-transform: uppercase;
	letter-spacing: 0.14em;
	min-height: 52px;
	padding-inline: 2rem !important;
	transition: background-color 200ms ease, transform 200ms ease;
}
body.sawargi-shop .wc-block-components-button:not(.is-link):hover,
body.sawargi-shop .wp-element-button:hover,
body.sawargi-shop .woocommerce .button:hover {
	background: var(--sw-cherry-dark) !important;
}
body.sawargi-shop .wc-block-components-button:focus-visible,
body.sawargi-shop .wp-element-button:focus-visible,
body.sawargi-shop .woocommerce .button:focus-visible,
body.sawargi-shop .sawargi-shop-header a:focus-visible {
	outline: 3px solid var(--sw-paper) !important;
	outline-offset: 3px !important;
	box-shadow: 0 0 0 6px var(--sw-cherry) !important;
}
body.sawargi-shop .wc-block-components-checkout-return-to-cart-button {
	color: var(--sw-ink-mut) !important;
}

/* Notices (e.g. "Bank transfer: we hold your order until payment arrives"). */
body.sawargi-shop .wc-block-components-notice-banner {
	border-radius: 14px !important;
	font-family: var(--sw-body);
}

/* Bank-transfer details on the order-received page: easy to copy, easy to read. */
body.sawargi-shop .woocommerce-bacs-bank-details,
body.sawargi-shop .wc-bacs-bank-details {
	border-top: 1px dashed rgb(27 23 20 / 0.3);
	padding-top: 1rem;
}
body.sawargi-shop .woocommerce-order-overview {
	list-style: none;
	padding: 0 !important;
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
	gap: 0.75rem;
}

@media (prefers-reduced-motion: reduce) {
	body.sawargi-shop * { transition: none !important; }
}
CSS;
}
