<?php
// FILENAME: api/getMyItems.php

ini_set('display_errors', 0);
error_reporting(0);

session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../DBConnector.php';

if (!isset($_SESSION['lender_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$lender_id  = $_SESSION['lender_id'];
$conditions = ['i.lender_id = ?'];
$params     = [$lender_id];
$types      = 's';

if (!empty($_GET['categories'])) {
    $cats = array_filter(explode(',', $_GET['categories']), 'is_numeric');
    if ($cats) {
        $placeholders = implode(',', array_fill(0, count($cats), '?'));
        $conditions[] = "i.category_id IN ($placeholders)";

        foreach ($cats as $cat) {
            $params[] = intval($cat);
            $types   .= 'i';
        }
    }
}

if (!empty($_GET['statuses'])) {
    $statuses     = explode(',', $_GET['statuses']);
    $placeholders = implode(',', array_fill(0, count($statuses), '?'));
    $conditions[] = "i.item_status IN ($placeholders)";

    foreach ($statuses as $status) {
        $params[] = $status;
        $types   .= 's';
    }
}

$query = "SELECT   i.item_id, i.item_name, i.item_description, i.item_status,
                   i.price_pr_hr, i.image_path, c.category_name, c.category_id
          FROM item i
          JOIN category c ON i.category_id = c.category_id
          WHERE " . implode(' AND ', $conditions) . "
          ORDER BY i.item_id DESC";

$stmt = $conn->prepare($query);

if (!$stmt) {
    echo json_encode(['error' => 'Prepare error: ' . $conn->error]);
    exit;
}

$stmt->bind_param($types, ...$params);
$stmt->execute();
$items = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

echo json_encode($items);

$stmt->close();
$conn->close();