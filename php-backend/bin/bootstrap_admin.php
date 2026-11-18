<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    fwrite(STDERR, "This script must be run from CLI.\n");
    exit(1);
}

require_once __DIR__ . '/../vendor/autoload.php';

use AgriAdvisory\Database;
use AgriAdvisory\Security;

$phone = getenv('ADMIN_BOOTSTRAP_PHONE') ?: ($argv[1] ?? '');
$password = getenv('ADMIN_BOOTSTRAP_PASSWORD') ?: ($argv[2] ?? '');
$name = getenv('ADMIN_BOOTSTRAP_NAME') ?: 'Platform Administrator';

if ($phone === '' || strlen($password) < 10) {
    fwrite(STDERR, "Usage: php bin/bootstrap_admin.php <phone> <password_min_10_chars>\n");
    exit(1);
}

$pdo = Database::connect();
$hash = Security::hashPassword($password);

$pdo->beginTransaction();
$stmt = $pdo->prepare('INSERT INTO users (display_name, phone, password_hash, status) VALUES (?, ?, ?, "active") ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), status = "active"');
$stmt->execute([$name, $phone, $hash]);
$userId = (int)$pdo->lastInsertId();
if ($userId === 0) {
    $q = $pdo->prepare('SELECT id FROM users WHERE phone = ?');
    $q->execute([$phone]);
    $userId = (int)$q->fetchColumn();
}
$roleId = (int)$pdo->query("SELECT id FROM roles WHERE name = 'admin'")->fetchColumn();
$pdo->prepare('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)')->execute([$userId, $roleId]);
Security::audit($pdo, $userId, 'cli_bootstrap', 'admin_bootstrapped', 'user', (string)$userId);
$pdo->commit();

fwrite(STDOUT, "Admin account bootstrapped for {$name} ({$phone}).\n");
