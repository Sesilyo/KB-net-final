<?php
// FILENAME: api/editProfile.php

ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');
require_once __DIR__ . '/getSession.php';
require_once __DIR__ . '/../DBConnector.php';

$session = getSession();
if (!$session) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true);

if (!$body || !isset($body['field'], $body['value'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing field or value.']);
    exit;
}

$borrower_id = $session['borrower_id'];
$field       = $body['field'];
$value       = trim($body['value']);

$allowed = [
    'firstname' => 'first_name',
    'lastname'  => 'last_name',
    'studentid' => 'student_id',
    'email'     => 'email',
];

if (!array_key_exists($field, $allowed)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Field not editable.']);
    exit;
}

if ($value === '') {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Value cannot be empty.']);
    exit;
}

if ($field === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'error' => 'Invalid email address.']);
    exit;
}

$column = $allowed[$field];

// Get user_id
$check = $conn->prepare('SELECT user_id FROM user WHERE borrower_id = ? LIMIT 1');
$check->bind_param('s', $borrower_id);
$check->execute();
$row = $check->get_result()->fetch_assoc();
$check->close();

if (!$row) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'User not found.']);
    exit;
}

$user_id = $row['user_id'];

// Check for duplicates
if ($field === 'email' || $field === 'studentid') {
    $dup = $conn->prepare("SELECT user_id FROM user WHERE $column = ? AND user_id != ?");
    $dup->bind_param('si', $value, $user_id);
    $dup->execute();
    if ($dup->get_result()->num_rows > 0) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => ucfirst($field) . ' already in use.']);
        exit;
    }
    $dup->close();
}

$stmt = $conn->prepare("UPDATE user SET $column = ? WHERE user_id = ?");
$stmt->bind_param('si', $value, $user_id);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Update failed.']);
    exit;
}

// Sync session
$_SESSION[$column] = $value;

$stmt->close();
$conn->close();

echo json_encode(['success' => true, 'field' => $field, 'value' => $value]);