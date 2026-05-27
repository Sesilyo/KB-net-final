<?php
// FILENAME: api/getProfile.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../DBConnector.php';

if (!isset($_SESSION['borrower_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$borrower_id = $_SESSION['borrower_id'];

$stmt = $conn->prepare("
    SELECT  u.first_name,
            u.last_name,
            u.student_id,
            u.email,
            u.lender_id,
            u.borrower_id
    FROM    user u
    WHERE   u.borrower_id = ?
    LIMIT 1
");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Prepare error: ' . $conn->error]);
    exit;
}

$stmt->bind_param('s', $borrower_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();

if (!$user) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
}

echo json_encode(['success' => true, 'user' => $user]);

$stmt->close();
$conn->close();