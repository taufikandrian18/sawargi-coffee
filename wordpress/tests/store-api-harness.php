<?php
// Contract harness: loads the plugin with minimal WordPress/WooCommerce stubs and prints what the Store API extension would return. Used by src/data/contract.test.ts.
// Minimal WordPress/WooCommerce stubs: just enough to load the plugin and call its data callback.
define('ABSPATH', __DIR__);
$GLOBALS['hooks'] = [];
function add_action($h, $cb, $p = 10) { $GLOBALS['hooks'][$h][] = $cb; }
function add_filter($h, $cb, $p = 10) { $GLOBALS['hooks'][$h][] = $cb; }
$GLOBALS['meta'] = [
  7 => ['_sawargi_roast_date' => '2026-10-02', '_sawargi_harvest' => '2026 main crop', '_sawargi_cup_score' => '86', '_sawargi_tasting_notes' => 'jackfruit, palm sugar ,, cacao nib', '_sawargi_bags_total' => '60'],
  8 => ['_sawargi_roast_date' => '2026-09-24', '_sawargi_bags_total' => ''],
];
function get_post_meta($id, $key, $single) { return $GLOBALS['meta'][$id][$key] ?? ''; }
class WC_Product {
  public function __construct(private int $id, private string $sku, private bool $manage, private ?int $qty, private array $attrs = []) {}
  public function get_id() { return $this->id; }
  public function get_sku() { return $this->sku; }
  public function managing_stock() { return $this->manage; }
  public function get_stock_quantity() { return $this->qty; }
  public function get_attribute($name) { return $this->attrs[$name] ?? ''; }
}
require __DIR__ . "/../mu-plugins/sawargi-headless.php";
$out = [
  sawargi_batch_data(new WC_Product(7, 'SWG-CN-015', true, 41, ['origin' => 'Ciwidey, West Java', 'process' => 'Natural (dried in the cherry)', 'size' => '1 kg'])),
  sawargi_batch_data(new WC_Product(8, 'SWG-CN-014', true, -2)),
  sawargi_batch_data(new WC_Product(9, 'NO-STOCK-MGMT', false, null)),
];
echo json_encode(['data' => $out, 'schemaKeys' => array_keys(sawargi_batch_schema()), 'hooks' => array_keys($GLOBALS['hooks'])], JSON_PRETTY_PRINT);
