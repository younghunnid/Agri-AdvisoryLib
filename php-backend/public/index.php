<?php
declare(strict_types=1);

require_once __DIR__ . '/../vendor/autoload.php';

use AgriAdvisory\AiAdvisor;
use AgriAdvisory\Database;
use AgriAdvisory\Security;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = array_filter([getenv('APP_URL') ?: null, 'http://localhost:3000', 'http://localhost:5173']);
if ($origin !== '' && in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
    header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

Security::startHardenedSession();
Security::verifyCsrf();

$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$body = json_decode(file_get_contents('php://input') ?: '{}', true) ?: [];

try {
    $pdo = Database::connect();

    if ($uri === '/api/v1/health' && $method === 'GET') {
        $stmt = $pdo->query("SELECT COUNT(*) FROM agricultural_guides WHERE is_published = 1 AND review_status = 'approved'");
        echo json_encode([
            'status' => 'ok',
            'service' => 'agri-advisory-liberia-php-api',
            'phpVersion' => PHP_VERSION,
            'publishedGuides' => (int)$stmt->fetchColumn(),
        ]);
        exit;
    }

    if ($uri === '/api/v1/csrf-token' && $method === 'GET') {
        echo json_encode(['csrfToken' => $_SESSION['csrf_token']]);
        exit;
    }

    if ($uri === '/api/v1/crops' && $method === 'GET') {
        $rows = $pdo->query('SELECT id, slug, name, local_names, summary, season_note, image_url FROM crops ORDER BY display_order ASC')->fetchAll();
        echo json_encode(['crops' => $rows]);
        exit;
    }

    if ($uri === '/api/v1/guides' && $method === 'GET') {
        $stmt = $pdo->prepare(
            "SELECT g.id, g.slug, g.title, g.summary, g.image_url, g.version, g.is_sample_demo,
                    c.name AS crop_name, cat.name AS category_name
             FROM agricultural_guides g
             JOIN crops c ON c.id = g.crop_id
             JOIN guide_categories cat ON cat.id = g.category_id
             WHERE g.is_published = 1 AND g.review_status = 'approved'
             ORDER BY g.id ASC"
        );
        $stmt->execute();
        echo json_encode(['guides' => $stmt->fetchAll()]);
        exit;
    }

    if ($uri === '/api/v1/advisor/ask' && $method === 'POST') {
        $q = trim((string)($body['question'] ?? ''));
        if (strlen($q) < 5) {
            http_response_code(400);
            echo json_encode(['error' => ['code' => 'VALIDATION_ERROR', 'message' => 'Question must be at least 5 characters.']]);
            exit;
        }
        $advisor = AiAdvisor::ask($q, isset($body['cropSlug']) ? (string)$body['cropSlug'] : null);
        echo json_encode(['advisor' => $advisor]);
        exit;
    }

    if ($uri === '/api/v1/auth/login' && $method === 'POST') {
        $ident = trim((string)($body['identifier'] ?? ''));
        $pw = (string)($body['password'] ?? '');
        $stmt = $pdo->prepare('SELECT id, password_hash, status FROM users WHERE phone = ? OR lower(email) = ? LIMIT 1');
        $stmt->execute([$ident, strtolower($ident)]);
        $user = $stmt->fetch();
        if (!$user || !password_verify($pw, $user['password_hash'])) {
            http_response_code(401);
            echo json_encode(['error' => ['code' => 'INVALID_CREDENTIALS', 'message' => 'Invalid credentials.']]);
            exit;
        }
        session_regenerate_id(true);
        $_SESSION['user_id'] = (int)$user['id'];
        echo json_encode(['ok' => true, 'userId' => (int)$user['id']]);
        exit;
    }

    if ($uri === '/api/v1/admin/overview' && $method === 'GET') {
        Security::requireRole($pdo, ['admin']);
        $guides = (int)$pdo->query("SELECT COUNT(*) FROM agricultural_guides WHERE is_published = 1 AND review_status = 'approved'")->fetchColumn();
        echo json_encode(['metrics' => ['guidesPublished' => $guides]]);
        exit;
    }

    http_response_code(404);
    echo json_encode(['error' => ['code' => 'NOT_FOUND', 'message' => 'Endpoint not found.']]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => ['code' => 'SERVER_ERROR', 'message' => 'Unexpected server error.']]);
}
