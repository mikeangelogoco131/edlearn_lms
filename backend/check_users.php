<?php
$db = new PDO('sqlite:database/database.sqlite');
$result = $db->query('SELECT id, email, name, password FROM users LIMIT 10');
foreach($result as $row) {
    echo $row['email'] . ' - ' . $row['name'] . PHP_EOL;
}
