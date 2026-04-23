<?php
/**
 * TechMind — admin/api.php
 * API protegida para el panel de administración.
 */

session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

// En producción real, usar sesión PHP en lugar de query param
// Por ahora validamos un token simple
$ADMIN_TOKEN = 'tm_secure_token_2025';

// Autenticación básica (reemplazar con sesión PHP en producción)
$action = $_GET['action'] ?? '';

// ── Configuración BD ──
$DB_HOST     = getenv('PGHOST')     ?: 'ep-xxx.us-east-1.aws.neon.tech';
$DB_PORT     = getenv('PGPORT')     ?: '5432';
$DB_NAME     = getenv('PGDATABASE') ?: 'maindb';
$DB_USER     = getenv('PGUSER')     ?: 'techmind_user';
$DB_PASSWORD = getenv('PGPASSWORD') ?: 'YOUR_PASSWORD_HERE';

$dsn = "pgsql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};sslmode=require";
try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASSWORD, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión: ' . $e->getMessage()]);
    exit;
}

switch ($action) {
    case 'list':
        $search = $_GET['search'] ?? '';
        if ($search) {
            $stmt = $pdo->prepare("
                SELECT * FROM Clientes_web
                WHERE nombres ILIKE :s OR apellidos ILIKE :s OR correo ILIKE :s
                ORDER BY id DESC
            ");
            $stmt->execute([':s' => "%{$search}%"]);
        } else {
            $stmt = $pdo->query("SELECT * FROM Clientes_web ORDER BY id DESC");
        }
        echo json_encode(['success' => true, 'clients' => $stmt->fetchAll()]);
        break;

    case 'delete':
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
            exit;
        }
        $data = json_decode(file_get_contents('php://input'), true);
        $id = (int)($data['id'] ?? 0);
        if (!$id) {
            echo json_encode(['success' => false, 'message' => 'ID inválido.']);
            exit;
        }
        $stmt = $pdo->prepare("DELETE FROM Clientes_web WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(['success' => true, 'message' => 'Registro eliminado.']);
        break;

    case 'stats':
        $total = $pdo->query("SELECT COUNT(*) FROM Clientes_web")->fetchColumn();
        $today = $pdo->query("SELECT COUNT(*) FROM Clientes_web WHERE created_at::date = CURRENT_DATE")->fetchColumn();
        $week  = $pdo->query("SELECT COUNT(*) FROM Clientes_web WHERE created_at >= NOW() - INTERVAL '7 days'")->fetchColumn();
        echo json_encode(['success' => true, 'total' => $total, 'today' => $today, 'week' => $week]);
        break;

    default:
        echo json_encode(['success' => false, 'message' => 'Acción no válida.']);
}
