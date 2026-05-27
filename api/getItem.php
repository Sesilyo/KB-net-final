<?php
    // FILENAME: getItem.php
    // for single item data extraction
    // for transaction page

    require_once __DIR__ . '/../DBConnector.php';
    header('Content-Type: application/json');

    $item_id = $_GET['item_id'] ?? null;

    // guard block
    if (!$item_id) {
        echo json_encode(['error' => 'Missing item id']);
        exit;
    }

    // prepared statement to safely query DB
    // joined user and category for efficient query
    $statement = $conn->prepare (
        "SELECT i.*,
            c.category_name,
            u.first_name, u.last_name
        FROM item i
        JOIN category c ON i.category_id = c.category_id
        JOIN user u     ON i.lender_id   = u.lender_id
        WHERE i.item_id = ?"
    );
    $statement->bind_param('i', $item_id);  // binds item_id as integer in the query
    $statement->execute();
    $result     = $statement->get_result();
    $row        = $result->fetch_assoc();   // only expects one row

    // guard block when item doesn't exist in DB
    if (!$row) {
        echo json_encode(['error' => 'Item not found']);
        exit;
    }

    echo json_encode($row);
?>