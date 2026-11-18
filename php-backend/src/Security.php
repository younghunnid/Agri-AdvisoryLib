<?php
declare(strict_types=1);

namespace AgriAdvisory;

use PDO;

final class Security
{
    public static function startHardenedSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
        session_set_cookie_params([
            'lifetime' => 60 * 60 * 24 * 7,
            'path' => '/',
            'secure' => $isHttps,
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        session_name('agri_php_session');
        session_start();
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(24));
        }
    }

    public static function verifyCsrf(): void
    {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        if (in_array($method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return;
        }
        $header = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
        $expected = $_SESSION['csrf_token'] ?? '';
        if ($header === '' || $expected === '' || !hash_equals($expected, $header)) {
            http_response_code(403);
            echo json_encode(['error' => ['code' => 'CSRF_INVALID', 'message' => 'Invalid CSRF token.']]);
            exit;
        }
    }

    public static function hashPassword(string $password): string
    {
        $algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
        return password_hash($password, $algo);
    }

    public static function requireRole(PDO $pdo, array $allowedRoles): array
    {
        $userId = $_SESSION['user_id'] ?? null;
        if (!$userId) {
            http_response_code(401);
            echo json_encode(['error' => ['code' => 'UNAUTHORIZED', 'message' => 'Authentication required.']]);
            exit;
        }
        $stmt = $pdo->prepare(
            'SELECT r.name FROM roles r
             JOIN user_roles ur ON ur.role_id = r.id
             WHERE ur.user_id = ?'
        );
        $stmt->execute([$userId]);
        $roles = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!array_intersect($allowedRoles, $roles)) {
            http_response_code(403);
            echo json_encode(['error' => ['code' => 'FORBIDDEN', 'message' => 'Insufficient permissions.']]);
            exit;
        }
        return $roles;
    }

    public static function audit(PDO $pdo, ?int $actorId, string $role, string $action, string $targetType, string $targetId = '', array $details = []): void
    {
        $stmt = $pdo->prepare(
            'INSERT INTO audit_logs (actor_user_id, actor_role, action, target_type, target_id, details_json, ip_hash)
             VALUES (?, ?, ?, ?, ?, ?, ?)'
        );
        $ipHash = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'cli');
        $stmt->execute([$actorId, $role, $action, $targetType, $targetId, json_encode($details), substr($ipHash, 0, 24)]);
    }
}
