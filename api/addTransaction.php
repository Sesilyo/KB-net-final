<?php 
// FILENAME: addTransaction.php
// creates a new transaction upon a new user borrow
// called by injectItemPopUp.js when user clicks "Confirm Borrow"

session_start();
require_once __DIR__ . '/../DBConnector.php';
header('Content-Type: application/json');

// guard block to check if user is logged in
if (!isset($_SESSION['borrower_id'])) {
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$borrower_id = $_SESSION['borrower_id'];

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

if (!$item) {
    echo json_encode(['error' => 'Item not found']);
    exit;
}

if ($item['item_status'] !== 'available') {
    echo json_encode(['error' => 'Item is no longer available']);
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
    echo json_encode(['error' => 'Failed to create transaction']);
    exit;
}

// mark item as borrowed
$update = $conn->prepare(
    "UPDATE SET item_status = 'borrowed' WHERE item_id = ?"
);

$update->bind_param('i', $item_id);
$update->execute();

echo json_encode(['success' => true]);

?>