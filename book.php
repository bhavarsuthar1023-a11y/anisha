<?php
header('Content-Type: application/json');

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['name'], $data['email'], $data['event_type'], $data['event_date'], $data['location'])) {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required']);
    exit;
}

try {
    // Connect to SQLite database
    $db = new PDO('sqlite:bookings.db');
    $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create table if not exists
    $db->exec("CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_date TEXT NOT NULL,
        location TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )");
    
    // Gracefully add location column if it's an old existing table
    try {
        $db->exec("ALTER TABLE bookings ADD COLUMN location TEXT");
    } catch(PDOException $e) {
        // Ignore if column already exists
    }

    // Insert data
    $stmt = $db->prepare('INSERT INTO bookings (name, email, event_type, event_date, location) VALUES (:name, :email, :event_type, :event_date, :location)');
    $stmt->execute([
        ':name' => $data['name'],
        ':email' => $data['email'],
        ':event_type' => $data['event_type'],
        ':event_date' => $data['event_date'],
        ':location' => $data['location']
    ]);

    http_response_code(201);
    echo json_encode(['message' => 'Booking successfully created! We will contact you shortly.', 'bookingId' => $db->lastInsertId()]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to create booking: ' . $e->getMessage()]);
}
?>
