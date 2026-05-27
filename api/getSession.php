<!-- <
// FILENAME: api/getSession.php

if (session_status() === PHP_SESSION_NONE) session_start();

function getSession(): ?array {
    if (!isset($_SESSION['student_id'])) return null;
    return [
        'user_id'     => $_SESSION['user_id'],
        'student_id'  => $_SESSION['student_id'],
        'borrower_id' => $_SESSION['borrower_id'],
        'lender_id'   => $_SESSION['lender_id'],
        'first_name'  => $_SESSION['first_name'],
        'last_name'   => $_SESSION['last_name'],
        'email'       => $_SESSION['email'],
    ];
}

// Only output JSON if called directly (not included by another file)
if (basename(__FILE__) === basename($_SERVER['SCRIPT_FILENAME'])) {
    header('Content-Type: application/json');
    $data = getSession();
    echo json_encode($data ? ['success' => true, ...$data] : ['success' => false]);
    exit;
} -->