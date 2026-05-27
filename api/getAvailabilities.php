<?php
    // FILENAME: getAvailability.php
    require_once __DIR__ . '/../DBConnector.php';

    $result = $conn -> query (" SELECT DISTINCT item_status
                                FROM item");

    $availabilities = [];
    while ( $row = $result -> fetch_assoc() ) {
        $availabilities[] = $row;
    }

    header('Content-Type: application/json');
    echo json_encode($availabilities);
?>