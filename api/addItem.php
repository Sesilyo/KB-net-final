<?php
// FILENAME: api/addItem.php

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

$lender_id        = $_SESSION['lender_id'];
$item_name        = trim($_POST['item_name']        ?? '');
$item_description = trim($_POST['item_description'] ?? '');
$item_status      = trim($_POST['item_status']      ?? 'Available');
$price_pr_hr      = trim($_POST['price_pr_hr']      ?? '');
$category_id      = trim($_POST['category_id']      ?? '');

if (!$item_name || !$price_pr_hr || !$category_id) {
    echo json_encode(['success' => false, 'message' => 'Item name, price, and category are required.']);
    exit;
}

if (!is_numeric($price_pr_hr) || (float)$price_pr_hr < 0) {
    echo json_encode(['success' => false, 'message' => 'Price must be a valid positive number.']);
    exit;
}

// ── Handle image upload ──────────────────────────────────────────────────────
$image_path = null;

if (!empty($_FILES['image']['name'])) {
    $allowed     = ['image/jpeg', 'image/png', 'image/webp'];
    $file_type   = $_FILES['image']['type'];
    $file_tmp    = $_FILES['image']['tmp_name'];
    $upload_dir  = __DIR__ . '/../uploads/items/';

    if (!in_array($file_type, $allowed)) {
        echo json_encode(['success' => false, 'message' => 'Only JPG, PNG, and WEBP images are allowed.']);
        exit;
    }

    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $ext        = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename   = uniqid('item_', true) . '.' . $ext;
    $dest       = $upload_dir . $filename;

    if (!move_uploaded_file($file_tmp, $dest)) {
        echo json_encode(['success' => false, 'message' => 'Image upload failed.']);
        exit;
    }

    $image_path = 'uploads/items/' . $filename;
}

// ── Insert item ──────────────────────────────────────────────────────────────
$stmt = $conn->prepare("INSERT INTO item
    (item_name, item_description, item_status, price_pr_hr, image_path, category_id, lender_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare error: ' . $conn->error]);
    exit;
}

$stmt->bind_param('sssdsis',
    $item_name, $item_description, $item_status,
    $price_pr_hr, $image_path, $category_id, $lender_id
);

try {
    $stmt->execute();
    echo json_encode([
        'success' => true,
        'message' => 'Item added successfully!',
        'item_id' => $conn->insert_id,
    ]);
} catch (mysqli_sql_exception $e) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
}

$stmt->close();
$conn->close();