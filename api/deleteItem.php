<?php
// FILENAME: api/deleteItem.php

header('Content-Type: application/json');

require_once '../DBConnector.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Decode JSON body
$data = json_decode(file_get_contents('php://input'), true);

$item_id = isset($data['item_id']) ? intval($data['item_id']) : 0;

if ($item_id <= 0) {
    echo json_encode(['success' => false, 'message' => 'Invalid or missing item_id.']);
    exit;
}

// Fetch image path before deleting so we can remove the file from disk
$stmt = $conn->prepare("SELECT image_path FROM item WHERE item_id = ?");
$stmt->bind_param("i", $item_id);
$stmt->execute();
$result = $stmt->get_result();
$item   = $result->fetch_assoc();
$stmt->close();

if (!$item) {
    echo json_encode(['success' => false, 'message' => 'Item not found.']);
    exit;
}

// Delete the item from the database
$stmt = $conn->prepare("DELETE FROM item WHERE item_id = ?");
$stmt->bind_param("i", $item_id);

if ($stmt->execute()) {
    // Remove the image file from disk if it exists
    $image_path = $item['image_path'];
    if ($image_path && file_exists("../$image_path")) {
        unlink("../$image_path");
    }

    echo json_encode(['success' => true, 'message' => 'Item deleted successfully.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete item: ' . $conn->error]);
}

$stmt->close();
$conn->close();