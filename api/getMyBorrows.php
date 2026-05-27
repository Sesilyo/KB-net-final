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

// Supports filtering by derived status: 'active', 'overdue', 'returned', or '' for all
$statusFilter = strtolower(trim($_GET['status'] ?? ''));

if ($statusFilter === '' && isset($_GET['is_returned']) && $_GET['is_returned'] !== '') {
    $statusFilter = $_GET['is_returned'] === '1' ? 'returned' : 'not_returned';
}

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
            t.penalty_fee,

            CASE
                WHEN t.is_returned = 1     THEN 'Returned'
                WHEN NOW() > t.end_date    THEN 'Overdue'
                ELSE                            'Active'
            END AS status,

            CASE
                WHEN t.is_returned = 0 AND NOW() > t.end_date
                THEN ROUND(
                    TIMESTAMPDIFF(HOUR, t.end_date, NOW()) * i.price_pr_hr, 2
                )
                ELSE 0
            END AS overdue_penalty,

            ROUND(
                TIMESTAMPDIFF(HOUR, t.start_date, t.end_date) * i.price_pr_hr, 2
            ) AS total_cost,

            i.item_id,
            i.item_name,
            i.price_pr_hr,
            i.image_path,
            i.item_status,

            c.category_name,

            CONCAT(u.first_name, ' ', u.last_name) AS lender_name,
            t.lender_id

        FROM   transaction t
        JOIN   item        i ON i.item_id     = t.item_id
        JOIN   category    c ON c.category_id = i.category_id
        JOIN   user        u ON u.lender_id   = t.lender_id

        WHERE  t.borrower_id = ?
    ) AS tx
";

// ── Append status filter on the derived column ────────────────────────────────
if ($statusFilter === 'returned') {
    $sql .= " WHERE tx.status = 'Returned'";
} elseif ($statusFilter === 'overdue') {
    $sql .= " WHERE tx.status = 'Overdue'";
} elseif ($statusFilter === 'active') {
    $sql .= " WHERE tx.status = 'Active'";
} elseif ($statusFilter === 'not_returned') {
    $sql .= " WHERE tx.status IN ('Active', 'Overdue')";
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
$result = $stmt->get_result();
$rows   = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode(['success' => true, 'data' => $rows]);

$stmt->close();
$conn->close();