<?php
// FILENAME: api/editItem.php

ini_set('display_errors', 0);
error_reporting(0);

session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../DBConnector.php';  

if (!isset($_SESSION['lender_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$lender_id = $_SESSION['lender_id'];

// ── Input ─────────────────────────────────────────────────────────────────────
$item_id          = isset($_POST['item_id'])          ? intval($_POST['item_id'])        : 0;
$item_name        = isset($_POST['item_name'])        ? trim($_POST['item_name'])        : '';
$item_description = isset($_POST['item_description']) ? trim($_POST['item_description']) : '';
$item_status      = isset($_POST['item_status'])      ? trim($_POST['item_status'])      : 'Available';
$price_pr_hr      = isset($_POST['price_pr_hr'])      ? floatval($_POST['price_pr_hr'])  : null;
$category_id      = isset($_POST['category_id'])      ? intval($_POST['category_id'])    : 0;

// ── Validate ──────────────────────────────────────────────────────────────────
if ($item_id <= 0)      { echo json_encode(['success' => false, 'message' => 'Invalid item ID.']);       exit; }
if ($item_name === '')  { echo json_encode(['success' => false, 'message' => 'Item name is required.']); exit; }
if ($category_id <= 0) { echo json_encode(['success' => false, 'message' => 'Category is required.']);  exit; }
if ($price_pr_hr === null || $price_pr_hr < 0) {
    echo json_encode(['success' => false, 'message' => 'Valid price is required.']);
    exit;
}

$allowed_statuses = ['Available', 'Borrowed', 'Unavailable'];
if (!in_array($item_status, $allowed_statuses)) {
    echo json_encode(['success' => false, 'message' => 'Invalid status.']);
    exit;
}

// ── Ownership check ───────────────────────────────────────────────────────────
$check = $conn->prepare("SELECT item_id, image_path FROM item WHERE item_id = ? AND lender_id = ? LIMIT 1");
$check->bind_param('ii', $item_id, $lender_id);
$check->execute();
$result   = $check->get_result();
$existing = $result->fetch_assoc();
$check->close();

if (!$existing) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Item not found or access denied.']);
    exit;
}

// ── Handle image upload ───────────────────────────────────────────
$image_path = $existing['image_path']; // keep old image by default

if (!empty($_FILES['image']['name']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
    $allowed_types = ['image/jpeg', 'image/png', 'image/webp'];
    $file_type     = $_FILES['image']['type'];
    $file_tmp      = $_FILES['image']['tmp_name'];
    $upload_dir    = __DIR__ . '/../uploads/items/';

    if (!in_array($file_type, $allowed_types)) {
        echo json_encode(['success' => false, 'message' => 'Only JPG, PNG, and WEBP images are allowed.']);
        exit;
    }

    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $ext      = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename = 'item_' . $item_id . '_' . time() . '.' . $ext;
    $dest     = $upload_dir . $filename;

    if (!move_uploaded_file($file_tmp, $dest)) {
        echo json_encode(['success' => false, 'message' => 'Image upload failed.']);
        exit;
    }

    // Delete the old image if it exists
    if ($existing['image_path']) {
        $old_path = __DIR__ . '/../' . $existing['image_path'];
        if (file_exists($old_path)) {
            @unlink($old_path);
        }
    }

    $image_path = 'uploads/items/' . $filename;
}

// ── Update DB ─────────────────────────────────────────────────────────────────

$stmt = $conn->prepare("
    UPDATE item
    SET
        item_name        = ?,
        item_description = ?,
        item_status      = ?,
        price_pr_hr      = ?,
        category_id      = ?,
        image_path       = ?
    WHERE item_id   = ?
      AND lender_id  = ?
");

$stmt->bind_param(
    'sssdisii',
    $item_name, $item_description, $item_status,
    $price_pr_hr, $category_id, $image_path,
    $item_id, $lender_id
);

try {
    $stmt->execute();
    echo json_encode(['success' => true, 'message' => 'Item updated successfully.']);
} catch (mysqli_sql_exception $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}

$stmt->close();
$conn->close();