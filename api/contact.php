<?php
/**
 * TechMind — backend/contact.php
 * Recibe datos del formulario, valida, inserta en PostgreSQL (Neon/Vercel) y envía email.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
    exit;
}

// ── Configuración BD (Neon/Vercel PostgreSQL) ──
$DB_HOST     = getenv('PGHOST')     ?: 'ep-old-rain-anx76mf7-pooler.c-6.us-east-1.aws.neon.tech';
$DB_PORT     = getenv('PGPORT')     ?: '5432';
$DB_NAME     = getenv('PGDATABASE') ?: 'maindb';
$DB_USER     = getenv('PGUSER')     ?: 'neondb_owner';
$DB_PASSWORD = getenv('PGPASSWORD') ?: 'npg_5xpTMBZqg3s';
$DB_SSL      = 'require';

// Email de notificación
$NOTIFY_EMAIL = 'angel.clavijo@yahoo.es';

// ── Leer JSON del body ──
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['success' => false, 'message' => 'Datos inválidos.']);
    exit;
}

// ── Sanitizar y validar ──
$nombres   = strtoupper(trim($data['nombres']   ?? ''));
$apellidos = strtoupper(trim($data['apellidos'] ?? ''));
$correo    = trim($data['correo']    ?? '');
$telefono  = trim($data['telefono'] ?? '');
$mensaje   = trim($data['mensaje']  ?? '');

$errors = [];
if (empty($nombres))   $errors[] = 'El nombre es requerido.';
if (empty($apellidos)) $errors[] = 'El apellido es requerido.';
if (empty($correo) || !filter_var($correo, FILTER_VALIDATE_EMAIL)) $errors[] = 'Correo electrónico inválido.';
if (empty($telefono))  $errors[] = 'El teléfono es requerido.';
if (empty($mensaje))   $errors[] = 'El mensaje es requerido.';

if (!empty($errors)) {
    echo json_encode(['success' => false, 'message' => implode(' ', $errors)]);
    exit;
}

// ── Conectar a PostgreSQL ──
$dsn = "pgsql:host={$DB_HOST};port={$DB_PORT};dbname={$DB_NAME};sslmode={$DB_SSL}";
try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASSWORD, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión a la base de datos.']);
    exit;
}

// ── Crear tabla si no existe ──
try {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS Clientes_web (
            id        SERIAL PRIMARY KEY,
            nombres   VARCHAR(100) NOT NULL,
            apellidos VARCHAR(100) NOT NULL,
            correo    VARCHAR(150) NOT NULL,
            telefono  VARCHAR(30)  NOT NULL UNIQUE,
            mensaje   TEXT         NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    ");
} catch (PDOException $e) {
    // Tabla ya existe o sin permisos — continuar
}

// ── Verificar duplicado de teléfono ──
$check = $pdo->prepare("SELECT id FROM Clientes_web WHERE telefono = :telefono");
$check->execute([':telefono' => $telefono]);
if ($check->fetch()) {
    echo json_encode(['success' => false, 'message' => 'Ya existe un registro con ese número de teléfono.']);
    exit;
}

// ── Insertar registro ──
try {
    $stmt = $pdo->prepare("
        INSERT INTO Clientes_web (nombres, apellidos, correo, telefono, mensaje)
        VALUES (:nombres, :apellidos, :correo, :telefono, :mensaje)
    ");
    $stmt->execute([
        ':nombres'   => $nombres,
        ':apellidos' => $apellidos,
        ':correo'    => $correo,
        ':telefono'  => $telefono,
        ':mensaje'   => $mensaje,
    ]);
} catch (PDOException $e) {
    if (str_contains($e->getMessage(), 'unique') || str_contains($e->getMessage(), 'duplicate')) {
        echo json_encode(['success' => false, 'message' => 'Ya existe un registro con ese número de teléfono.']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error al guardar el registro.']);
    }
    exit;
}

// ── Enviar email de notificación ──
$subject = "Nuevo contacto de TechMind: {$nombres} {$apellidos}";
$body = "
Nueva solicitud de contacto recibida en TechMind.

Nombres:   {$nombres}
Apellidos: {$apellidos}
Correo:    {$correo}
Teléfono:  {$telefono}

Mensaje:
{$mensaje}

---
TechMind — Sistema automático de notificaciones
";

$headers = "From: noreply@techmind.co\r\n";
$headers .= "Reply-To: {$correo}\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

@mail($NOTIFY_EMAIL, $subject, $body, $headers);

// ── Respuesta exitosa ──
echo json_encode([
    'success' => true,
    'message' => '¡Gracias! Tu mensaje fue enviado correctamente. Te contactaremos pronto.'
]);
