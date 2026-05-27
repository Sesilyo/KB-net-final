<?php 
    // FILENAME: updateTransaction.php
    // Updates transaction record
    // For lender

    require_once __DIR__ . '/../DBConnector.php';
    header('Content-Type: application/json');

    // fetch all transaction data from json input
    $data = json_decode(file_get_contents('php://input'), true);

    $transaction_id = $data['transaction_id'] ?? null;
    $start_date     = $data['start_date']     ?? null;
    $end_date       = $data['end_date']       ?? null;
    $returned_date  = $data['returned_date']  ?? null;
    $notes          = $data['notes']          ?? null;
    $penalty_fee    = $data['penalty_fee']    ?? null;
    $is_returned    = $data['is_returned']    ?? null;   // FIX 1: was never extracted from $data

    // guard block for missing transaction id
    if (!$transaction_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing transaction id']);
        exit;
    }

    // if item is marked as returned but no return date, set it to now
    if ($is_returned == 1 && !$returned_date) {
        $returned_date = date('Y-m-d H:i:s');
    }

    // FIX 2: was bare prepare() — must be $conn->prepare()
    $statement = $conn->prepare(
        "UPDATE transaction
            SET start_date    = ?,
                end_date      = ?,
                returned_date = ?,
                is_returned   = ?,
                notes         = ?,
                penalty_fee   = ?
        WHERE transaction_id = ?"
    );

    if (!$statement) {
        http_response_code(500);
        echo json_encode(['error' => 'Server error: ' . $conn->error]);
        exit;
    }

    // FIX 3: original type string 'ssissds' was missing is_returned entirely
    // Correct: s=start_date, s=end_date, s=returned_date, i=is_returned,
    //          s=notes, d=penalty_fee, s=transaction_id  →  'sssisds'
    $statement->bind_param('sssisds',
        $start_date,
        $end_date,
        $returned_date,
        $is_returned,
        $notes,
        $penalty_fee,
        $transaction_id
    );

    $statement->execute();

    echo json_encode([
        'success'       => $statement->affected_rows >= 0,
        'affected_rows' => $statement->affected_rows
    ]);

    $statement->close();
    $conn->close();
?>