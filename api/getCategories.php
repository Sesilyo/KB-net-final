<?php
    require_once __DIR__ . '/../DBConnector.php';

    $result = $conn -> query("  SELECT category_id, category_name
                                FROM category");

    $categories = [];
    while ( $row = $result -> fetch_assoc() ) {
        $categories[] = $row;
    }

    header('Content-Type: application/json');
    echo json_encode($categories);
?>