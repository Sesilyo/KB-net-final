<?php
// FILENAME: api/adduser.php

ini_set('display_errors', 0);
error_reporting(0);

header('Content-Type: application/json');
require_once __DIR__ . '/../DBConnector.php';

$student_id = trim($_POST['student_id'] ?? '');
$first_name = trim($_POST['first_name'] ?? '');
$last_name  = trim($_POST['last_name']  ?? '');
$email      = trim($_POST['email']      ?? '');
$password   = trim($_POST['password']   ?? '');

$res = $conn->query("SELECT MAX(CAST(SUBSTRING(lender_id, 3) AS UNSIGNED)) AS max_num
                     FROM `user` WHERE lender_id IS NOT NULL");

if (!$res) {
    echo json_encode(['success' => false, 'message' => 'DB error: ' . $conn->error]);
    exit;
}

$row         = $res->fetch_assoc();
$next_num    = (int)($row['max_num'] ?? 0) + 1;
$lender_id   = 'L-' . str_pad($next_num, 4, '0', STR_PAD_LEFT);
$borrower_id = 'B-' . str_pad($next_num, 4, '0', STR_PAD_LEFT);

$password_hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO `user`
    (student_id, lender_id, borrower_id, first_name, last_name, email, password_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Prepare error: ' . $conn->error]);
    exit;
}

$stmt->bind_param('sssssss',
    $student_id, $lender_id, $borrower_id,
    $first_name, $last_name, $email, $password_hash
);

try {
    $stmt->execute();
    echo json_encode([
        'success'     => true,
        'message'     => 'Account created successfully!',
        'student_id'  => $student_id,
        'lender_id'   => $lender_id,
        'borrower_id' => $borrower_id
    ]);
} catch (mysqli_sql_exception $e) {
    if ($e->getCode() === 1062) {
        echo json_encode(['success' => false, 'message' => 'Student ID or email already exists.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'DB error: ' . $e->getMessage()]);
    }
}

$stmt->close();
$conn->close();
?>