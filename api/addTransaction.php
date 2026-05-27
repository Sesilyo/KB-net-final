<?php 
// FILENAME: addTransaction.php
// creates a new transaction upon a new user borrow
// called by injectItemPopUp.js when user clicks "Confirm Borrow"

ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
require_once __DIR__ . '/../DBConnector.php';
header('Content-Type: application/json');

// guard block to check if user is logged in
//if (!isset($_SESSION['borrower_id'])) {
//    http_response_code(401);
//    echo json_encode(['success' => 'false', 'message' => 'Unauthorized']);
//    exit;
//}

$borrower_id = 'B-0004'; //$_SESSION['borrower_id'];

// reading request body
$data       = json_decode(file_get_contents('php://input'), true);
$item_id    = $data['item_id']      ?? null;
$start_date = $data['start_date']   ?? null;
$end_date   = $data['end_date']     ?? null;

// guard block to check if all fields are filled out
if (!$item_id || !$start_date || !$end_date) {
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// recheck if item is still available
$check = $conn->prepare(
    "SELECT item_status, lender_id FROM item WHERE item_id = ?"
);
$check->bind_param('i', $item_id);
$check->execute();
$item = $check->get_result()->fetch_assoc();
$check->close();

if (!$item) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Item not found']);
    exit;
}

if ($item['item_status'] !== 'available') {
    http_response_code(409);    // 409 Conflict — resource state prevents the request
    echo json_encode(['success' => false, 'message' => 'Item is no longer available']);
    exit;
}

$lender_id = $item['lender_id'];

// insert transaction on the DB
$statement = $conn->prepare(
    "INSERT into transaction (item_id, lender_id, borrower_id, start_date, end_date)
    VALUES (?, ?, ?, ?, ?)"
);

$statement->bind_param('issss', 
                        $item_id,
                        $lender_id,
                        $borrower_id,
                        $start_date,
                        $end_date
);

$statement->execute();

// catches error in transaction creation
if ($statement->affected_rows === 0) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create transaction']);
    exit;
}

$statement->close();

// mark item as borrowed
$update = $conn->prepare(
    "UPDATE item SET item_status = 'borrowed' WHERE item_id = ?"
);

$update->bind_param('i', $item_id);
$update->execute();
$update->close();

echo json_encode(['success' => true, 'message' => 'Transaction created successfully']);

?>