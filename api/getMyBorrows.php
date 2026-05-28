<?php
// FILENAME: api/getMyBorrows.php

ini_set('display_errors', 1);
error_reporting(E_ALL);

session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../DBConnector.php'; 

if (!isset($_SESSION['borrower_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit;
}

$borrowerId = $_SESSION['borrower_id'];

// Supports filtering by derived status: 'active', 'returned', or '' for all
$statusFilter = strtolower(trim($_GET['status'] ?? ''));

// ── Build query ───────────────────────────────────────────────────────────────

$sql = "
    SELECT *
    FROM (
        SELECT
            t.transaction_id,
            t.start_date,
            t.end_date,
            t.returned_date,
            t.notes,
            t.is_returned,

            CASE
                WHEN t.is_returned = 1 THEN 'Returned'
                ELSE                        'Active'
            END AS status,

            ROUND(
                TIMESTAMPDIFF(HOUR, t.start_date, t.end_date) * i.price_pr_hr, 2
            ) AS total_cost,

            i.item_id,
            COALESCE(i.item_name,  '[Deleted Item]') AS item_name,
            i.price_pr_hr,
            i.image_path,
            i.item_status,

            COALESCE(c.category_name, '[Deleted]') AS category_name,

            CONCAT(u.first_name, ' ', u.last_name) AS lender_name,
            t.lender_id

        FROM   transaction t
        LEFT JOIN   item        i ON i.item_id     = t.item_id
        LEFT JOIN   category    c ON c.category_id = i.category_id
        JOIN        user        u ON u.lender_id   = t.lender_id

        WHERE  t.borrower_id = ?
    ) AS tx
";

// ── Append status filter on the derived column ────────────────────────────────
if ($statusFilter === 'returned') {
    $sql .= " WHERE tx.status = 'Returned'";
} elseif ($statusFilter === 'active') {
    $sql .= " WHERE tx.status = 'Active'";
}

$sql .= " ORDER BY tx.start_date DESC";

// ── Prepare ───────────────────────────────────────────────────────────────────
$stmt = $conn->prepare($sql);

if (!$stmt) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Prepare error: ' . $conn->error]);
    exit;
}

$stmt->bind_param('s', $borrowerId);
$stmt->execute();

if ($stmt->errno) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Execute error: ' . $stmt->error]);
    exit;
}

$result = $stmt->get_result();
$rows   = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode(['success' => true, 'data' => $rows]);

$stmt->close();
$conn->close();