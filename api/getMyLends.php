<?php
// FILENAME: api/getMyLends.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../DBConnector.php';   

// ── Auth guard ────────────────────────────────────────────────────────────────
//if (!isset($_SESSION['lender_id'])) {
//    http_response_code(401);
//    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
//    exit;
//}

$lenderId = 'L-0004'; //$_SESSION['lender_id'];

// ── Query ─────────────────────────────────────────────────────────────────────

$sql = "
    SELECT
        t.transaction_id,
        t.start_date,
        t.end_date,
        t.returned_date,
        t.notes,
        t.is_returned,
        t.penalty_fee,

        CASE
            WHEN t.is_returned = 1     THEN 'Returned'
            WHEN NOW() > t.end_date    THEN 'Overdue'
            ELSE                            'Active'
        END AS status,

        ROUND(
            TIMESTAMPDIFF(HOUR, t.start_date, t.end_date) * i.price_pr_hr, 2
        ) AS total_cost,

        i.item_id,
        i.item_name,
        i.price_pr_hr,
        i.image_path,
        i.item_status,

        c.category_name,

        CONCAT(u.first_name, ' ', u.last_name) AS borrower_name,
        t.borrower_id

    FROM   transaction  t
    JOIN   item        i ON i.item_id     = t.item_id
    JOIN   category    c ON c.category_id = i.category_id
    JOIN   user          u ON u.borrower_id = t.borrower_id

    WHERE  t.lender_id = ?

    ORDER BY t.start_date DESC
";

// ── Prepare ───────────────────────────────────────────────────────────────────
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare error: ' . $conn->error]);
    exit;
}

// ── Bind & execute ────────────────────────────────────────────────────────────
$stmt->bind_param('s', $lenderId);
$stmt->execute();
$result = $stmt->get_result();
$rows   = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode(['success' => true, 'data' => $rows]);

$stmt->close();
$conn->close();