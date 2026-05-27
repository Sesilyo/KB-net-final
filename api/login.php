<?php
// FILENAME: api/login.php

session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../DBConnector.php';

$email    = trim($_POST['email']    ?? '');
$password = trim($_POST['password'] ?? '');

// ── Query User ───────────────────────────────────────────────────────────────
$stmt = $conn->prepare('SELECT student_id, lender_id, borrower_id, first_name, last_name, email, password_hash FROM `user` WHERE email = ?');
$stmt->bind_param('s', $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Account does not exist.']);
    exit;
}

$user = $result->fetch_assoc();

// ── Verify Password ──────────────────────────────────────────────────────────
if (!password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials.']);
    exit;
}

// ── Set Session & Respond ────────────────────────────────────────────────────
$_SESSION['student_id']  = $user['student_id'];
$_SESSION['lender_id']   = $user['lender_id'];
$_SESSION['borrower_id'] = $user['borrower_id'];
$_SESSION['first_name']  = $user['first_name'];
$_SESSION['last_name']   = $user['last_name'];
$_SESSION['email']       = $user['email'];

echo json_encode([
    'success' => true,
    'message' => 'Login successful.',
    'user'    => [
        'student_id' => $user['student_id'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
        'email'      => $user['email'],
    ]
]);

$stmt->close();
$conn->close();
?>