<?php
    require_once __DIR__ . '/../DBConnector.php';

    $conditions = [];
    $params = [];
    $types = "";


    // if no category checkboxes active
    if ( !empty($_GET['categories']) ) {
        $categories     = explode(',', $_GET['categories']);
        $placeholders   = implode(',', array_fill(0, count($categories), '?'));
        $conditions[]   = "i.category_id IN ($placeholders)";

        foreach ( $categories as $category ) {
            $params[] = intval($category);
            $types .= "i";
        }
    }


    // if no availability status checkboxes active
    if ( !empty($_GET['statuses']) ) {
        $statuses       = explode(',', $_GET['statuses']);
        $placeholders   = implode(',', array_fill(0, count($statuses), '?'));
        $conditions[]   = "i.item_status IN ($placeholders)";

        foreach ( $statuses as $status ) {
            $params[] = $status;
            $types .= "s";
        }
    }


    $query = "  SELECT  i.item_id, i.item_name, i.item_status, i.price_pr_hr, i.image_path,
                        c.category_name, u.first_name, u.last_name
                FROM item i
                JOIN category c ON i.category_id = c.category_id
                JOIN user u ON i.lender_id = u.lender_id";

    if ( !empty($conditions) ) {
        $query .= " WHERE " .implode("  AND ", $conditions);
    }

    $stmt = $conn -> prepare( $query );
    if ( !empty($params) ) {
        $stmt -> bind_param( $types, ...$params );
    }

    $stmt -> execute();
    $result = $stmt -> get_result();

    $items = [];
    while ( $row = $result -> fetch_assoc() ) {
        $items[] = $row;
    }

    header('Content-Type: application/json');
    echo json_encode($items);
?>