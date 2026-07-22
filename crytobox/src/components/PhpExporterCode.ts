/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const PHP_CODE_FILES: Record<string, { filename: string; language: string; content: string }> = {
  schema: {
    filename: "schema.sql",
    language: "sql",
    content: `-- Crytobox Platform Database Schema
-- Compatible with shared hosting MySQL (InfinityFree, ProFreeHost, etc.)

CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` VARCHAR(50) NOT NULL,
  \`name\` VARCHAR(100) NOT NULL,
  \`slug\` VARCHAR(100) NOT NULL,
  \`icon\` VARCHAR(50) DEFAULT 'Coins',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`airdrops\` (
  \`id\` INT AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(100) NOT NULL,
  \`logo\` VARCHAR(50) DEFAULT '🐻',
  \`description\` TEXT NOT NULL,
  \`reward\` VARCHAR(50) NOT NULL,
  \`difficulty\` ENUM('Easy', 'Medium', 'Hard') DEFAULT 'Easy',
  \`time_remaining\` VARCHAR(100) NOT NULL,
  \`blockchain\` VARCHAR(50) NOT NULL,
  \`join_url\` VARCHAR(255) NOT NULL,
  \`category_id\` VARCHAR(50) NOT NULL,
  \`featured\` TINYINT(1) DEFAULT 0,
  \`popular\` TINYINT(1) DEFAULT 0,
  \`trending\` TINYINT(1) DEFAULT 0,
  \`status\` ENUM('active', 'completed', 'upcoming') DEFAULT 'active',
  \`detailed_steps\` TEXT NOT NULL, -- JSON array
  \`requirements\` TEXT NOT NULL, -- JSON array
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`users\` (
  \`wallet_address\` VARCHAR(42) NOT NULL,
  \`joined_airdrops\` TEXT, -- Comma-separated or JSON list of IDs
  \`pending_rewards\` VARCHAR(50) DEFAULT '$0',
  \`completed_rewards\` VARCHAR(50) DEFAULT '$0',
  \`status\` ENUM('active', 'blocked') DEFAULT 'active',
  \`joined_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`points\` INT DEFAULT 20,
  PRIMARY KEY (\`wallet_address\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`transactions\` (
  \`id\` VARCHAR(20) NOT NULL,
  \`wallet_address\` VARCHAR(42) NOT NULL,
  \`airdrop_id\` INT NOT NULL,
  \`airdrop_name\` VARCHAR(100) NOT NULL,
  \`amount\` DECIMAL(10,4) NOT NULL,
  \`tx_hash\` VARCHAR(66) NOT NULL,
  \`status\` ENUM('pending', 'success', 'failed') DEFAULT 'success',
  \`timestamp\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`favorites\` (
  \`wallet_address\` VARCHAR(42) NOT NULL,
  \`airdrop_id\` INT NOT NULL,
  PRIMARY KEY (\`wallet_address\`, \`airdrop_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS \`settings\` (
  \`id\` INT PRIMARY KEY DEFAULT 1,
  \`site_name\` VARCHAR(100) DEFAULT 'Crytobox',
  \`site_logo\` VARCHAR(50) DEFAULT '📦',
  \`hero_title\` VARCHAR(255) DEFAULT 'Discover Next-Gen Web3 Airdrops Securely',
  \`hero_subtitle\` TEXT,
  \`footer_text\` TEXT,
  \`announcement\` TEXT,
  \`join_fee\` DECIMAL(10,4) DEFAULT 0.003,
  \`is_maintenance\` TINYINT(1) DEFAULT 0,
  \`seo_title\` VARCHAR(255) DEFAULT 'Crytobox - Premium Web3 Airdrop Portal',
  \`seo_description\` TEXT,
  \`telegram_link\` VARCHAR(255),
  \`twitter_link\` VARCHAR(255),
  \`discord_link\` VARCHAR(255),
  \`admin_password\` VARCHAR(255) DEFAULT '$2y$10$Z3S3Y0iN.LgV8P260.6yXOH0VbB6b.5.vD84RizTIn9.t094vR5vW' -- default password hash for 'admin123'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed default categories
INSERT INTO \`categories\` (\`id\`, \`name\`, \`slug\`, \`icon\`) VALUES
('defi', 'DeFi Protocols', 'defi', 'Coins'),
('layer-2', 'Layer 2 & Rollups', 'layer-2', 'Layers'),
('nfts', 'NFTs & Gaming', 'nfts', 'Gamepad2'),
('socialfi', 'SocialFi & Web3', 'socialfi', 'Users')
ON DUPLICATE KEY UPDATE \`name\`=\`name\`;

-- Seed default settings
INSERT INTO \`settings\` (\`id\`, \`site_name\`, \`site_logo\`, \`hero_title\`, \`hero_subtitle\`, \`footer_text\`, \`announcement\`, \`join_fee\`, \`seo_title\`, \`seo_description\`) VALUES
(1, 'Crytobox', '📦', 'Discover Next-Gen Web3 Airdrops Securely', 'Explore, filter, and instantly join verified high-reward cryptocurrency airdrops.', 'Crytobox is the premier catalog for Web3 enthusiasts. We index verified projects.', '🚀 Solana Blinks Campaign is now live!', 0.003, 'Crytobox - Premium Web3 Airdrop Portal', 'Discover and secure active airdrops.')
ON DUPLICATE KEY UPDATE \`site_name\`=\`site_name\`;
`
  },
  db: {
    filename: "db.php",
    language: "php",
    content: `<?php
// db.php - Database connection utility
// Fully compatible with shared hosting (InfinityFree, ProFreeHost, local xampp/wamp)

$host = 'sql123.infinityfree.com'; // Change to your hosting database host
$db   = 'if0_3456789_crytobox';     // Change to your database name
$user = 'if0_3456789';             // Change to your database username
$pass = 'your_mysql_password';     // Change to your database password
$charset = 'utf8mb4';

// For local testing, you can uncomment these:
// $host = '127.0.0.1';
// $db   = 'crytobox';
// $user = 'root';
// $pass = '';

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\\PDOException $e) {
     die("Database connection failed. Please edit db.php with correct credentials. Error: " . $e->getMessage());
}

// Start secure session if not started
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Helper to sanitize inputs (XSS Protection)
function sanitize($data) {
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

// Helper to fetch global settings
function getSettings($pdo) {
    $stmt = $pdo->query("SELECT * FROM settings WHERE id = 1");
    return $stmt->fetch();
}
?>`
  },
  index: {
    filename: "index.php",
    language: "php",
    content: `<?php
require_once 'db.php';
$settings = getSettings($pdo);

// Handle Maintenance Mode
if ($settings['is_maintenance'] && !isset($_SESSION['admin_logged_in'])) {
    die("<h1>Website under maintenance</h1><p>We are updating the platform. Please check back shortly.</p>");
}

// Fetch Categories
$categories = $pdo->query("SELECT * FROM categories")->fetchAll();

// Filters
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';
$cat_filter = isset($_GET['category']) ? sanitize($_GET['category']) : '';
$chain_filter = isset($_GET['chain']) ? sanitize($_GET['chain']) : '';

// Build Query
$query = "SELECT * FROM airdrops WHERE status = 'active'";
$params = [];

if (!empty($search)) {
    $query .= " AND (name LIKE ? OR description LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
}
if (!empty($cat_filter)) {
    $query .= " AND category_id = ?";
    $params[] = $cat_filter;
}
if (!empty($chain_filter)) {
    $query .= " AND blockchain = ?";
    $params[] = $chain_filter;
}

$query .= " ORDER BY featured DESC, id DESC";
$stmt = $pdo->prepare($query);
$stmt->execute($params);
$airdrops = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $settings['seo_title']; ?></title>
    <meta name="description" content="<?php echo $settings['seo_description']; ?>">
    <!-- Bootstrap 5 CDN -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Google Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="grid-bg text-white">

    <!-- Announcement Bar -->
    <?php if (!empty($settings['announcement'])): ?>
    <div class="announcement-bar py-2 text-center text-dark font-weight-bold" style="background: #00FFA3;">
        <div class="container text-xs"><?php echo $settings['announcement']; ?></div>
    </div>
    <?php endif; ?>

    <!-- Navigation Header -->
    <nav class="navbar navbar-expand-lg navbar-dark glass-panel py-3 sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <span class="fs-3 me-2"><?php echo $settings['site_logo']; ?></span>
                <span class="fw-bold tracking-tight text-white"><?php echo $settings['site_name']; ?></span>
            </a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarContent">
                <ul class="navbar-nav ms-auto mb-2 mb-lg-0 align-items-center">
                    <li class="nav-item"><a class="nav-link active" href="index.php">Explore</a></li>
                    <li class="nav-item"><a class="nav-link" href="dashboard.php">My Wallet</a></li>
                    <li class="nav-item"><a class="nav-link" href="admin.php">Admin Panel</a></li>
                    <li class="nav-item ms-lg-3">
                        <button id="connectBtn" class="btn px-4 rounded-pill fw-bold" style="background: linear-gradient(135deg, #6C5CE7, #00D2FF); color: white; border: none;">
                            Connect Wallet
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Hero Section -->
    <header class="py-5 text-center position-relative overflow-hidden">
        <div class="container py-4 position-relative z-3">
            <h1 class="display-4 fw-extrabold tracking-tight mb-3" style="background: linear-gradient(135deg, #FFF, #00D2FF); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                <?php echo $settings['hero_title']; ?>
            </h1>
            <p class="lead text-secondary mx-auto mb-4" style="max-width: 700px;">
                <?php echo $settings['hero_subtitle']; ?>
            </p>
            
            <!-- Quick Search Form -->
            <form action="index.php" method="GET" class="mx-auto" style="max-width: 600px;">
                <div class="input-group glass-panel rounded-pill p-1">
                    <input type="text" name="search" class="form-control bg-transparent border-0 text-white px-4" placeholder="Search verified airdrops..." value="<?php echo $search; ?>">
                    <button class="btn btn-primary rounded-pill px-4" style="background: #6C5CE7; border: none;" type="submit">Search</button>
                </div>
            </form>
        </div>
    </header>

    <!-- Main Content Grid -->
    <main class="container py-5">
        <div class="row">
            <!-- Sidebar Filters -->
            <aside class="col-lg-3 mb-4">
                <div class="glass-panel rounded-4 p-4 sticky-top" style="top: 100px;">
                    <h5 class="fw-bold mb-3 text-secondary">Categories</h5>
                    <div class="d-flex flex-column gap-2 mb-4">
                        <a href="index.php" class="btn text-start text-white p-2 rounded-3 <?php echo empty($cat_filter) ? 'bg-primary' : 'bg-transparent'; ?>" style="border: none;">
                            📦 All Categories
                        </a>
                        <?php foreach($categories as $cat): ?>
                        <a href="index.php?category=<?php echo $cat['id']; ?>" class="btn text-start text-white p-2 rounded-3 <?php echo $cat_filter === $cat['id'] ? 'bg-primary' : 'bg-transparent'; ?>" style="border: none;">
                            ⚡ <?php echo $cat['name']; ?>
                        </a>
                        <?php endforeach; ?>
                    </div>

                    <h5 class="fw-bold mb-3 text-secondary">Blockchains</h5>
                    <div class="d-flex flex-wrap gap-2">
                        <?php 
                        $chains = ['Ethereum', 'Solana', 'BNB Chain', 'Polygon', 'Base', 'Arbitrum', 'Avalanche'];
                        foreach($chains as $c):
                        ?>
                        <a href="index.php?chain=<?php echo urlencode($c); ?>" class="btn btn-sm rounded-pill px-3 <?php echo $chain_filter === $c ? 'btn-info text-dark' : 'btn-outline-secondary text-white'; ?>">
                            <?php echo $c; ?>
                        </a>
                        <?php endforeach; ?>
                    </div>
                </div>
            </aside>

            <!-- Airdrops List -->
            <section class="col-lg-9">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="fw-bold m-0">Verified Airdrops <span class="badge bg-secondary fs-6 rounded-pill"><?php echo count($airdrops); ?></span></h3>
                </div>

                <div class="row g-4">
                    <?php if (empty($airdrops)): ?>
                    <div class="col-12 text-center py-5">
                        <p class="fs-4 text-secondary">No airdrops found matching your filter constraints.</p>
                        <a href="index.php" class="btn btn-outline-primary rounded-pill">Reset Filters</a>
                    </div>
                    <?php else: ?>
                        <?php foreach($airdrops as $air): ?>
                        <div class="col-md-6">
                            <div class="glass-panel glass-panel-hover rounded-4 p-4 h-100 d-flex flex-column justify-content-between position-relative overflow-hidden">
                                <?php if ($air['featured']): ?>
                                <span class="position-absolute badge bg-warning text-dark font-weight-bold" style="top: 15px; right: 15px; border-radius: 99px;">FEATURED</span>
                                <?php endif; ?>
                                
                                <div>
                                    <div class="d-flex align-items-center mb-3">
                                        <span class="fs-2 me-3 p-2 rounded-3 bg-dark" style="border: 1px solid rgba(255,255,255,0.05);"><?php echo $air['logo']; ?></span>
                                        <div>
                                            <h4 class="fw-bold m-0"><?php echo $air['name']; ?></h4>
                                            <span class="badge rounded-pill bg-dark text-cyan border border-info mt-1 text-xs"><?php echo $air['blockchain']; ?></span>
                                        </div>
                                    </div>
                                    <p class="text-secondary text-sm line-clamp-3 mb-4"><?php echo $air['description']; ?></p>
                                </div>

                                <div>
                                    <div class="row g-2 mb-4 text-center">
                                        <div class="col-4">
                                            <div class="bg-dark p-2 rounded-3 border border-dark">
                                                <small class="text-muted d-block text-xs">REWARD</small>
                                                <span class="fw-bold text-success text-xs"><?php echo $air['reward']; ?></span>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="bg-dark p-2 rounded-3 border border-dark">
                                                <small class="text-muted d-block text-xs">DIFFICULTY</small>
                                                <span class="fw-bold text-info text-xs"><?php echo $air['difficulty']; ?></span>
                                            </div>
                                        </div>
                                        <div class="col-4">
                                            <div class="bg-dark p-2 rounded-3 border border-dark">
                                                <small class="text-muted d-block text-xs">TIME</small>
                                                <span class="fw-bold text-warning text-xs"><?php echo $air['time_remaining']; ?></span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div class="d-flex gap-2">
                                        <a href="details.php?id=<?php echo $air['id']; ?>" class="btn btn-outline-secondary text-white w-50 rounded-pill py-2">Details</a>
                                        <a href="details.php?id=<?php echo $air['id']; ?>&join=1" class="btn btn-primary w-50 rounded-pill py-2" style="background: #6C5CE7; border: none;">Join Free</a>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </section>
        </div>
    </main>

    <!-- Footer -->
    <footer class="glass-panel py-5 mt-5">
        <div class="container text-center text-md-start">
            <div class="row g-4">
                <div class="col-md-6 mb-3">
                    <h4 class="fw-bold"><?php echo $settings['site_logo']; ?> <?php echo $settings['site_name']; ?></h4>
                    <p class="text-secondary text-sm mt-3" style="max-width: 450px;"><?php echo $settings['footer_text']; ?></p>
                </div>
                <div class="col-md-3 mb-3">
                    <h5 class="fw-bold text-secondary mb-3">Quick Links</h5>
                    <ul class="list-unstyled d-flex flex-column gap-2 text-sm">
                        <li><a href="index.php" class="text-secondary text-decoration-none">Explore Airdrops</a></li>
                        <li><a href="dashboard.php" class="text-secondary text-decoration-none">Connected Dashboard</a></li>
                        <li><a href="admin.php" class="text-secondary text-decoration-none">Admin Panel Setup</a></li>
                    </ul>
                </div>
                <div class="col-md-3 mb-3">
                    <h5 class="fw-bold text-secondary mb-3">Support & Social</h5>
                    <div class="d-flex gap-3 fs-4 mt-2">
                        <a href="<?php echo $settings['telegram_link']; ?>" class="text-white text-decoration-none" target="_blank">Telegram</a>
                        <a href="<?php echo $settings['twitter_link']; ?>" class="text-white text-decoration-none" target="_blank">Twitter</a>
                        <a href="<?php echo $settings['discord_link']; ?>" class="text-white text-decoration-none" target="_blank">Discord</a>
                    </div>
                </div>
            </div>
            <hr class="border-secondary my-4">
            <p class="text-center text-secondary m-0 text-xs">© 2026 <?php echo $settings['site_name']; ?>. Built for InfinityFree & Shared Hosting.</p>
        </div>
    </footer>

    <!-- Bootstrap JS CDN -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Simulated Web3 Wallet login for browser interface
        const connectBtn = document.getElementById('connectBtn');
        let connectedAddress = sessionStorage.getItem('walletAddress');

        function updateUI() {
            if (connectedAddress) {
                connectBtn.innerText = connectedAddress.substring(0,6) + '...' + connectedAddress.substring(38);
                connectBtn.style.background = '#00FFA3';
                connectBtn.style.color = '#000';
            } else {
                connectBtn.innerText = 'Connect Wallet';
                connectBtn.style.background = 'linear-gradient(135deg, #6C5CE7, #00D2FF)';
                connectBtn.style.color = '#fff';
            }
        }

        connectBtn.addEventListener('click', async () => {
            if (connectedAddress) {
                sessionStorage.removeItem('walletAddress');
                connectedAddress = null;
                updateUI();
                alert('Wallet disconnected');
                return;
            }

            // Simulate wallet request
            const mockAddresses = ['0x71C7656EC7ab88b098defB751B7401B5f6d8976F', '0x1A2b3C4d5E6f7G8h9I0j1K2l3M4n5O6p7Q8r9S0t'];
            const chosen = mockAddresses[Math.floor(Math.random() * mockAddresses.length)];
            
            // Signature simulation
            const confirmed = confirm("Sign wallet transaction to log into <?php echo $settings['site_name']; ?>?\\n\\nAddress: " + chosen);
            if (confirmed) {
                sessionStorage.setItem('walletAddress', chosen);
                connectedAddress = chosen;
                updateUI();
                
                // Submit to session via AJAX
                fetch('join.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'connect', address: chosen })
                }).then(() => {
                    window.location.reload();
                });
            }
        });

        updateUI();
    </script>
</body>
</html>`
  },
  details: {
    filename: "details.php",
    language: "php",
    content: `<?php
require_once 'db.php';
$settings = getSettings($pdo);

$id = isset($_GET['id']) ? intval($_GET['id']) : 0;
$stmt = $pdo->prepare("SELECT * FROM airdrops WHERE id = ?");
$stmt->execute([$id]);
$airdrop = $stmt->fetch();

if (!$airdrop) {
    header("Location: index.php");
    exit();
}

$steps = json_decode($airdrop['detailed_steps'], true) ?: [];
$reqs = json_decode($airdrop['requirements'], true) ?: [];
$auto_join = isset($_GET['join']) ? 1 : 0;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $airdrop['name']; ?> Airdrop - <?php echo $settings['site_name']; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="grid-bg text-white">

    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark glass-panel py-3 sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <span class="fs-3 me-2"><?php echo $settings['site_logo']; ?></span>
                <span class="fw-bold text-white"><?php echo $settings['site_name']; ?></span>
            </a>
            <div class="ms-auto">
                <a href="index.php" class="btn btn-outline-secondary text-white btn-sm rounded-pill px-4">← Back to Explorer</a>
            </div>
        </div>
    </nav>

    <!-- Details Main Grid -->
    <main class="container py-5">
        <div class="row g-5">
            <div class="col-lg-8">
                <!-- Header Card -->
                <div class="glass-panel rounded-4 p-5 mb-4 position-relative overflow-hidden">
                    <div class="d-flex align-items-center mb-4">
                        <span class="fs-1 me-4 bg-dark p-3 rounded-4 border border-dark"><?php echo $airdrop['logo']; ?></span>
                        <div>
                            <span class="badge bg-primary rounded-pill mb-2"><?php echo $airdrop['blockchain']; ?> Network</span>
                            <h1 class="fw-bold m-0"><?php echo $airdrop['name']; ?></h1>
                        </div>
                    </div>
                    <p class="text-secondary fs-5"><?php echo $airdrop['description']; ?></p>
                </div>

                <!-- Steps Card -->
                <div class="glass-panel rounded-4 p-5 mb-4">
                    <h3 class="fw-bold mb-4">Airdrop Tasks Step-by-Step</h3>
                    <div class="d-flex flex-column gap-3">
                        <?php if (empty($steps)): ?>
                        <p class="text-secondary m-0">This airdrop simply requires joining and completing on-chain actions directly.</p>
                        <?php else: ?>
                            <?php foreach($steps as $index => $step): ?>
                            <div class="d-flex align-items-start p-3 bg-dark rounded-3 border border-dark">
                                <span class="badge bg-info text-dark rounded-circle me-3 py-2 px-3 fw-bold fs-6"><?php echo $index + 1; ?></span>
                                <p class="m-0 pt-1 text-secondary"><?php echo $step; ?></p>
                            </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- Sidebar Widgets -->
            <div class="col-lg-4">
                <div class="glass-panel rounded-4 p-4 sticky-top mb-4" style="top: 100px;">
                    <h4 class="fw-bold mb-3 text-secondary">Airdrop Meta</h4>
                    
                    <div class="d-flex flex-column gap-3 mb-4">
                        <div class="d-flex justify-content-between border-bottom border-dark py-2">
                            <span class="text-secondary">Expected Reward</span>
                            <span class="fw-bold text-success"><?php echo $airdrop['reward']; ?></span>
                        </div>
                        <div class="d-flex justify-content-between border-bottom border-dark py-2">
                            <span class="text-secondary">Difficulty Level</span>
                            <span class="fw-bold text-info"><?php echo $airdrop['difficulty']; ?></span>
                        </div>
                        <div class="d-flex justify-content-between border-bottom border-dark py-2">
                            <span class="text-secondary">Gas Requirements</span>
                            <span class="fw-bold text-warning">Network gas only</span>
                        </div>
                        <div class="d-flex justify-content-between py-2">
                            <span class="text-secondary">Join Platform Fee</span>
                            <span class="fw-bold text-accent"><?php echo $settings['join_fee']; ?> ETH</span>
                        </div>
                    </div>

                    <!-- Join Button Core Trigger -->
                    <button id="joinAirdropBtn" class="btn btn-primary w-100 rounded-pill py-3 fw-bold fs-5 shadow-neon-purple" style="background: linear-gradient(135deg, #6C5CE7, #00FFA3); color: black; border: none;">
                        Join Now
                    </button>
                </div>

                <!-- Requirements -->
                <div class="glass-panel rounded-4 p-4">
                    <h5 class="fw-bold mb-3 text-secondary">Requirements</h5>
                    <ul class="m-0 ps-3 text-secondary d-flex flex-column gap-2 text-sm">
                        <?php foreach($reqs as $req): ?>
                        <li><?php echo $req; ?></li>
                        <?php endforeach; ?>
                        <li>Metamask or Trust connected with active gas</li>
                    </ul>
                </div>
            </div>
        </div>
    </main>

    <!-- Join Wallet Payment Modal -->
    <div class="modal fade" id="joinModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content glass-panel text-white rounded-4 border-0">
                <div class="modal-header border-bottom border-dark">
                    <h5 class="modal-title fw-bold">Sign Web3 Transaction</h5>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body p-4 text-center">
                    <span class="fs-1 d-block mb-3">🛡️</span>
                    <h4 class="fw-bold mb-2">Authorize Airdrop Sync</h4>
                    <p class="text-secondary text-sm mb-4">To join this verified campaign, you need to sign a secure metadata transaction and pay the verified catalog join fee.</p>
                    
                    <div class="bg-dark p-3 rounded-3 border border-dark text-start mb-4 text-sm">
                        <div class="d-flex justify-content-between mb-2">
                            <span>Catalog Join Fee:</span>
                            <strong class="text-accent"><?php echo $settings['join_fee']; ?> ETH</strong>
                        </div>
                        <div class="d-flex justify-content-between">
                            <span>Gas Fee (Estimated):</span>
                            <strong class="text-warning">0.00025 ETH</strong>
                        </div>
                    </div>

                    <button id="confirmPayBtn" class="btn btn-success w-100 rounded-pill py-3 fw-bold">
                        Confirm Transaction
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        const joinAirdropBtn = document.getElementById('joinAirdropBtn');
        const confirmPayBtn = document.getElementById('confirmPayBtn');
        const joinModal = new bootstrap.Modal(document.getElementById('joinModal'));

        joinAirdropBtn.addEventListener('click', () => {
            const connected = sessionStorage.getItem('walletAddress');
            if (!connected) {
                alert('Please connect your Web3 wallet first on the home page.');
                return;
            }
            // Show modal
            joinModal.show();
        });

        confirmPayBtn.addEventListener('click', () => {
            const address = sessionStorage.getItem('walletAddress');
            confirmPayBtn.disabled = true;
            confirmPayBtn.innerText = 'Verifying on-chain...';

            fetch('join.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'join',
                    walletAddress: address,
                    airdropId: '<?php echo $airdrop['id']; ?>',
                    airdropName: '<?php echo $airdrop['name']; ?>',
                    amount: '<?php echo $settings['join_fee']; ?>'
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    alert('Transaction approved successfully! Redirecting to official airdrop tasks page.');
                    window.location.href = '<?php echo $airdrop['join_url']; ?>';
                } else {
                    alert('Error verifying payment. Make sure you have enough gas.');
                    confirmPayBtn.disabled = false;
                    confirmPayBtn.innerText = 'Confirm Transaction';
                }
            });
        });

        // Trigger auto modal if URL requested direct joining
        <?php if($auto_join): ?>
        setTimeout(() => {
            joinAirdropBtn.click();
        }, 500);
        <?php endif; ?>
    </script>
</body>
</html>`
  },
  join: {
    filename: "join.php",
    language: "php",
    content: `<?php
require_once 'db.php';

// Disable direct viewing, expect JSON POST API requests
header('Content-Type: application/json');

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    echo json_encode(['error' => 'No request body found']);
    exit();
}

$action = isset($data['action']) ? sanitize($data['action']) : '';

if ($action === 'connect') {
    $address = sanitize($data['address']);
    
    // Create/fetch user row
    $stmt = $pdo->prepare("SELECT * FROM users WHERE wallet_address = ?");
    $stmt->execute([$address]);
    $user = $stmt->fetch();
    
    if (!$user) {
        $stmt = $pdo->prepare("INSERT INTO users (wallet_address, joined_airdrops, pending_rewards, completed_rewards, points) VALUES (?, '[]', '$0', '$0', 20)");
        $stmt->execute([$address]);
    }
    
    $_SESSION['wallet_address'] = $address;
    echo json_encode(['success' => true, 'address' => $address]);
    exit();
}

if ($action === 'join') {
    $wallet = sanitize($data['walletAddress']);
    $airdropId = intval($data['airdropId']);
    $name = sanitize($data['airdropName']);
    $fee = floatval($data['amount']);
    
    // Generate simple simulated transaction hash
    $txHash = '0x' . bin2hex(random_bytes(32));
    $txId = 'TX' . rand(100000, 999999);
    
    // Log transaction
    $stmt = $pdo->prepare("INSERT INTO transactions (id, wallet_address, airdrop_id, airdrop_name, amount, tx_hash, status) VALUES (?, ?, ?, ?, ?, ?, 'success')");
    $stmt->execute([$txId, $wallet, $airdropId, $name, $fee, $txHash]);
    
    // Update joined list of users
    $stmt = $pdo->prepare("SELECT * FROM users WHERE wallet_address = ?");
    $stmt->execute([$wallet]);
    $user = $stmt->fetch();
    
    if ($user) {
        $joined = json_decode($user['joined_airdrops'], true) ?: [];
        if (!in_array($airdropId, $joined)) {
            $joined[] = $airdropId;
            $updatedJoined = json_encode($joined);
            
            // Add points and estimate rewards
            $currentPoints = intval($user['points']) + 100;
            $currentPendingVal = intval(preg_replace('/[^0-9]/', '', $user['pending_rewards'])) + 500;
            $newPending = '$' . $currentPendingVal;
            
            $stmt = $pdo->prepare("UPDATE users SET joined_airdrops = ?, points = ?, pending_rewards = ? WHERE wallet_address = ?");
            $stmt->execute([$updatedJoined, $currentPoints, $newPending, $wallet]);
        }
    }
    
    echo json_encode(['success' => true, 'txHash' => $txHash]);
    exit();
}

echo json_encode(['error' => 'Action not supported']);
?>`
  },
  admin: {
    filename: "admin.php",
    language: "php",
    content: `<?php
require_once 'db.php';
$settings = getSettings($pdo);

$error = '';
$success = '';

// Handle Simple Login
if (isset($_POST['login'])) {
    $pass = $_POST['password'];
    // Default password is 'admin123'
    if (password_verify($pass, $settings['admin_password']) || $pass === 'admin123') {
        $_SESSION['admin_logged_in'] = true;
    } else {
        $error = 'Invalid administrative credentials!';
    }
}

// Handle Logout
if (isset($_GET['logout'])) {
    unset($_SESSION['admin_logged_in']);
    header("Location: admin.php");
    exit();
}

// Check logged-in status
$logged_in = isset($_SESSION['admin_logged_in']);

if ($logged_in) {
    // Stats calculation
    $user_count = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $tx_count = $pdo->query("SELECT COUNT(*) FROM transactions")->fetchColumn();
    $airdrop_count = $pdo->query("SELECT COUNT(*) FROM airdrops")->fetchColumn();
    $revenue = $pdo->query("SELECT SUM(amount) FROM transactions WHERE status = 'success'")->fetchColumn() ?: 0;
    
    // Fetch users, logs
    $users = $pdo->query("SELECT * FROM users ORDER BY joined_at DESC LIMIT 20")->fetchAll();
    $txs = $pdo->query("SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 20")->fetchAll();
    $airdrops = $pdo->query("SELECT * FROM airdrops ORDER BY id DESC")->fetchAll();

    // Handle Setting updates
    if (isset($_POST['update_settings'])) {
        $site_name = sanitize($_POST['site_name']);
        $site_logo = sanitize($_POST['site_logo']);
        $hero_title = sanitize($_POST['hero_title']);
        $hero_sub = sanitize($_POST['hero_subtitle']);
        $footer = sanitize($_POST['footer_text']);
        $announcement = sanitize($_POST['announcement']);
        $fee = floatval($_POST['join_fee']);
        $maintenance = isset($_POST['is_maintenance']) ? 1 : 0;
        
        $stmt = $pdo->prepare("UPDATE settings SET site_name=?, site_logo=?, hero_title=?, hero_subtitle=?, footer_text=?, announcement=?, join_fee=?, is_maintenance=? WHERE id=1");
        $stmt->execute([$site_name, $site_logo, $hero_title, $hero_sub, $footer, $announcement, $fee, $maintenance]);
        $success = 'Settings updated successfully!';
        $settings = getSettings($pdo); // refresh
    }

    // Handle Create Airdrop
    if (isset($_POST['create_airdrop'])) {
        $name = sanitize($_POST['name']);
        $logo = sanitize($_POST['logo']);
        $description = sanitize($_POST['description']);
        $reward = sanitize($_POST['reward']);
        $difficulty = sanitize($_POST['difficulty']);
        $time = sanitize($_POST['time_remaining']);
        $blockchain = sanitize($_POST['blockchain']);
        $url = sanitize($_POST['join_url']);
        $cat = sanitize($_POST['category_id']);
        $featured = isset($_POST['featured']) ? 1 : 0;
        
        // Mock steps
        $steps = json_encode(["Visit project website", "Connect Web3 Wallet", "Sign verified task board transaction"]);
        $reqs = json_encode(["Decentralized Wallet connected", "Native gas balance"]);
        
        $stmt = $pdo->prepare("INSERT INTO airdrops (name, logo, description, reward, difficulty, time_remaining, blockchain, join_url, category_id, featured, detailed_steps, requirements) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->execute([$name, $logo, $description, $reward, $difficulty, $time, $blockchain, $url, $cat, $featured, $steps, $reqs]);
        $success = 'New airdrop created successfully!';
        $airdrops = $pdo->query("SELECT * FROM airdrops ORDER BY id DESC")->fetchAll(); // refresh
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - Crytobox</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="grid-bg text-white">

    <nav class="navbar navbar-expand-lg navbar-dark glass-panel py-3 sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <span class="fs-3 me-2">⚙️</span>
                <span class="fw-bold text-white"><?php echo $settings['site_name']; ?> Admin</span>
            </a>
            <div class="ms-auto">
                <a href="index.php" class="btn btn-outline-secondary text-white btn-sm rounded-pill px-4">← Back to Site</a>
                <?php if ($logged_in): ?>
                <a href="admin.php?logout=1" class="btn btn-danger btn-sm rounded-pill px-3 ms-2">Logout</a>
                <?php endif; ?>
            </div>
        </div>
    </nav>

    <main class="container py-5">
        <?php if (!empty($error)): ?>
            <div class="alert alert-danger rounded-3"><?php echo $error; ?></div>
        <?php endif; ?>
        <?php if (!empty($success)): ?>
            <div class="alert alert-success rounded-3"><?php echo $success; ?></div>
        <?php endif; ?>

        <?php if (!$logged_in): ?>
        <!-- Login Form -->
        <div class="mx-auto" style="max-width: 450px; margin-top: 50px;">
            <div class="glass-panel rounded-4 p-5 text-center">
                <span class="fs-1 d-block mb-3">📦</span>
                <h3 class="fw-bold mb-4">Admin Authentication</h3>
                <form action="admin.php" method="POST">
                    <div class="mb-4 text-start">
                        <label class="text-secondary small mb-2">Security Password (default: admin123)</label>
                        <input type="password" name="password" class="form-control bg-dark border-secondary text-white p-3 rounded-3" placeholder="Enter administrative key" required>
                    </div>
                    <button type="submit" name="login" class="btn btn-primary w-100 rounded-pill py-3 fw-bold">Authenticate</button>
                </form>
            </div>
        </div>

        <?php else: ?>
        <!-- Dashboard Statistics -->
        <section class="row g-4 mb-5 text-center">
            <div class="col-6 col-lg-3">
                <div class="glass-panel rounded-4 p-4">
                    <small class="text-muted d-block mb-1">TOTAL USERS</small>
                    <span class="fs-2 fw-bold text-cyan"><?php echo $user_count; ?></span>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="glass-panel rounded-4 p-4">
                    <small class="text-muted d-block mb-1">TOTAL WALLETS</small>
                    <span class="fs-2 fw-bold text-info"><?php echo $user_count; ?></span>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="glass-panel rounded-4 p-4">
                    <small class="text-muted d-block mb-1">INDEXED AIRDROPS</small>
                    <span class="fs-2 fw-bold text-primary"><?php echo $airdrop_count; ?></span>
                </div>
            </div>
            <div class="col-6 col-lg-3">
                <div class="glass-panel rounded-4 p-4">
                    <small class="text-muted d-block mb-1">REVENUE COLLECTED</small>
                    <span class="fs-2 fw-bold text-success"><?php echo number_format($revenue, 4); ?> ETH</span>
                </div>
            </div>
        </section>

        <!-- Admin Configuration & Management Panel -->
        <div class="row g-5">
            <!-- Left Forms -->
            <div class="col-lg-7">
                <!-- Create Airdrop Form -->
                <div class="glass-panel rounded-4 p-4 mb-4">
                    <h4 class="fw-bold mb-4">Index New Airdrop</h4>
                    <form action="admin.php" method="POST">
                        <div class="row g-3">
                            <div class="col-md-6">
                                <label class="text-secondary small mb-1">Project Name</label>
                                <input type="text" name="name" class="form-control bg-dark border-dark text-white" placeholder="e.g. Scroll Roller" required>
                            </div>
                            <div class="col-md-6">
                                <label class="text-secondary small mb-1">Project Logo Emoji</label>
                                <input type="text" name="logo" class="form-control bg-dark border-dark text-white" placeholder="e.g. 🦊, 🟢, 🐨" required>
                            </div>
                            <div class="col-12">
                                <label class="text-secondary small mb-1">Brief Description</label>
                                <textarea name="description" class="form-control bg-dark border-dark text-white" rows="2" placeholder="Describe rewards, steps and network objectives..." required></textarea>
                            </div>
                            <div class="col-md-4">
                                <label class="text-secondary small mb-1">Estimated Reward</label>
                                <input type="text" name="reward" class="form-control bg-dark border-dark text-white" placeholder="e.g. $500-$1000" required>
                            </div>
                            <div class="col-md-4">
                                <label class="text-secondary small mb-1">Difficulty</label>
                                <select name="difficulty" class="form-control bg-dark border-dark text-white">
                                    <option value="Easy">Easy</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hard">Hard</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="text-secondary small mb-1">Time Remaining</label>
                                <input type="text" name="time_remaining" class="form-control bg-dark border-dark text-white" placeholder="e.g. 14 days left" required>
                            </div>
                            <div class="col-md-6">
                                <label class="text-secondary small mb-1">Blockchain Network</label>
                                <input type="text" name="blockchain" class="form-control bg-dark border-dark text-white" placeholder="e.g. Base, Ethereum, Solana" required>
                            </div>
                            <div class="col-md-6">
                                <label class="text-secondary small mb-1">Join Action URL</label>
                                <input type="url" name="join_url" class="form-control bg-dark border-dark text-white" placeholder="https://..." required>
                            </div>
                            <div class="col-md-6">
                                <label class="text-secondary small mb-1">Category</label>
                                <select name="category_id" class="form-control bg-dark border-dark text-white">
                                    <option value="defi">DeFi Protocols</option>
                                    <option value="layer-2">Layer 2 & Rollups</option>
                                    <option value="nfts">NFTs & Gaming</option>
                                    <option value="socialfi">SocialFi & Web3</option>
                                </select>
                            </div>
                            <div class="col-md-6 d-flex align-items-center">
                                <div class="form-check mt-3">
                                    <input type="checkbox" name="featured" class="form-check-input" id="featCheck">
                                    <label class="form-check-label text-secondary" for="featCheck">Featured on Portal Landing</label>
                                </div>
                            </div>
                        </div>
                        <button type="submit" name="create_airdrop" class="btn btn-primary w-100 rounded-pill py-3 fw-bold mt-4">Publish Airdrop</button>
                    </form>
                </div>

                <!-- Existing Airdrops Table -->
                <div class="glass-panel rounded-4 p-4">
                    <h4 class="fw-bold mb-4">Indexed Airdrops</h4>
                    <div class="table-responsive">
                        <table class="table table-dark table-striped m-0 text-sm">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Reward</th>
                                    <th>Chain</th>
                                    <th>Featured</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($airdrops as $a): ?>
                                <tr>
                                    <td><?php echo $a['logo']; ?> <?php echo $a['name']; ?></td>
                                    <td><?php echo $a['reward']; ?></td>
                                    <td><?php echo $a['blockchain']; ?></td>
                                    <td><?php echo $a['featured'] ? '✅ Yes' : '❌ No'; ?></td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Right settings panel -->
            <div class="col-lg-5">
                <!-- Settings Panel -->
                <div class="glass-panel rounded-4 p-4 mb-4">
                    <h4 class="fw-bold mb-4">Platform General Settings</h4>
                    <form action="admin.php" method="POST">
                        <div class="mb-3">
                            <label class="text-secondary small mb-1">Portal Name</label>
                            <input type="text" name="site_name" class="form-control bg-dark border-dark text-white" value="<?php echo $settings['site_name']; ?>">
                        </div>
                        <div class="mb-3">
                            <label class="text-secondary small mb-1">Portal Logo (Emoji)</label>
                            <input type="text" name="site_logo" class="form-control bg-dark border-dark text-white" value="<?php echo $settings['site_logo']; ?>">
                        </div>
                        <div class="mb-3">
                            <label class="text-secondary small mb-1">Hero Display Title</label>
                            <input type="text" name="hero_title" class="form-control bg-dark border-dark text-white" value="<?php echo $settings['hero_title']; ?>">
                        </div>
                        <div class="mb-3">
                            <label class="text-secondary small mb-1">Hero Subtitle</label>
                            <textarea name="hero_subtitle" class="form-control bg-dark border-dark text-white" rows="2"><?php echo $settings['hero_subtitle']; ?></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="text-secondary small mb-1">Footer Catalog Credit Text</label>
                            <textarea name="footer_text" class="form-control bg-dark border-dark text-white" rows="2"><?php echo $settings['footer_text']; ?></textarea>
                        </div>
                        <div class="mb-3">
                            <label class="text-secondary small mb-1">Announcement Banner Bar</label>
                            <input type="text" name="announcement" class="form-control bg-dark border-dark text-white" value="<?php echo $settings['announcement']; ?>">
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-6">
                                <label class="text-secondary small mb-1">Platform Join Fee (ETH)</label>
                                <input type="number" step="0.0001" name="join_fee" class="form-control bg-dark border-dark text-white" value="<?php echo $settings['join_fee']; ?>">
                            </div>
                            <div class="col-6 d-flex align-items-center">
                                <div class="form-check mt-3">
                                    <input type="checkbox" name="is_maintenance" class="form-check-input" id="maintCheck" <?php echo $settings['is_maintenance'] ? 'checked' : ''; ?>>
                                    <label class="form-check-label text-secondary" for="maintCheck">Maintenance Active</label>
                                </div>
                            </div>
                        </div>
                        <button type="submit" name="update_settings" class="btn btn-primary w-100 rounded-pill py-3 fw-bold">Save Configuration</button>
                    </form>
                </div>

                <!-- Wallet connections / users -->
                <div class="glass-panel rounded-4 p-4">
                    <h4 class="fw-bold mb-4">Connected Wallets</h4>
                    <div class="table-responsive">
                        <table class="table table-dark table-striped m-0 text-sm">
                            <thead>
                                <tr>
                                    <th>Address</th>
                                    <th>Joined</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($users as $u): ?>
                                <tr>
                                    <td><code><?php echo substr($u['wallet_address'], 0, 6) . '...' . substr($u['wallet_address'], 38); ?></code></td>
                                    <td><?php echo count(json_decode($u['joined_airdrops'], true) ?: []); ?> airdrops</td>
                                    <td>
                                        <span class="badge <?php echo $u['status'] === 'active' ? 'bg-success' : 'bg-danger'; ?>">
                                            <?php echo ucfirst($u['status']); ?>
                                        </span>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`
  },
  dashboard: {
    filename: "dashboard.php",
    language: "php",
    content: `<?php
require_once 'db.php';
$settings = getSettings($pdo);

$address = isset($_SESSION['wallet_address']) ? $_SESSION['wallet_address'] : '';

// Retrieve Connected User row
$user = null;
$joined_ids = [];
if (!empty($address)) {
    $stmt = $pdo->prepare("SELECT * FROM users WHERE wallet_address = ?");
    $stmt->execute([$address]);
    $user = $stmt->fetch();
    if ($user) {
        $joined_ids = json_decode($user['joined_airdrops'], true) ?: [];
    }
}

// Fetch joined airdrop info
$joined_airdrops = [];
if (!empty($joined_ids)) {
    $placeholders = implode(',', array_fill(0, count($joined_ids), '?'));
    $stmt = $pdo->prepare("SELECT * FROM airdrops WHERE id IN ($placeholders)");
    $stmt->execute($joined_ids);
    $joined_airdrops = $stmt->fetchAll();
}

// Fetch transactions logged by wallet
$txs = [];
if (!empty($address)) {
    $stmt = $pdo->prepare("SELECT * FROM transactions WHERE wallet_address = ? ORDER BY timestamp DESC");
    $stmt->execute([$address]);
    $txs = $stmt->fetchAll();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Dashboard - <?php echo $settings['site_name']; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="grid-bg text-white">

    <nav class="navbar navbar-expand-lg navbar-dark glass-panel py-3 sticky-top">
        <div class="container">
            <a class="navbar-brand d-flex align-items-center" href="index.php">
                <span class="fs-3 me-2"><?php echo $settings['site_logo']; ?></span>
                <span class="fw-bold text-white"><?php echo $settings['site_name']; ?></span>
            </a>
            <div class="ms-auto">
                <a href="index.php" class="btn btn-outline-secondary text-white btn-sm rounded-pill px-4">← Back to Explorer</a>
            </div>
        </div>
    </nav>

    <main class="container py-5">
        <?php if (empty($address)): ?>
        <div class="mx-auto text-center" style="max-width: 500px; margin-top: 100px;">
            <div class="glass-panel rounded-4 p-5">
                <span class="fs-1 d-block mb-3">🦊</span>
                <h3 class="fw-bold mb-3">Connect Your Web3 Wallet</h3>
                <p class="text-secondary mb-4">You need to log in with your decentralized MetaMask, Trust, or Phantom wallet on the home page before accessing your personal portfolio.</p>
                <a href="index.php" class="btn btn-primary rounded-pill px-4" style="background: #6C5CE7; border: none;">Connect Wallet</a>
            </div>
        </div>
        <?php else: ?>

        <!-- Welcome Panel -->
        <header class="glass-panel rounded-4 p-5 mb-5 d-flex flex-column flex-md-row justify-content-between align-items-md-center position-relative overflow-hidden">
            <div>
                <span class="badge bg-success rounded-pill px-3 mb-2">Connected Securely</span>
                <h2 class="fw-bold m-0">Account Dashboard</h2>
                <code class="text-secondary fs-5 d-block mt-1"><?php echo $address; ?></code>
            </div>
            <div class="text-center bg-dark p-3 rounded-4 border border-dark mt-4 mt-md-0">
                <small class="text-muted d-block mb-1">MY CATALOG SCORE</small>
                <span class="fs-3 fw-bold text-accent"><?php echo $user ? $user['points'] : 20; ?> pts</span>
            </div>
        </header>

        <!-- Stats Section -->
        <section class="row g-4 mb-5 text-center">
            <div class="col-md-4">
                <div class="glass-panel rounded-4 p-4">
                    <small class="text-muted d-block mb-1">JOINED CAMPAIGNS</small>
                    <span class="fs-2 fw-bold text-cyan"><?php echo count($joined_ids); ?></span>
                </div>
            </div>
            <div class="col-md-4">
                <div class="glass-panel rounded-4 p-4">
                    <small class="text-muted d-block mb-1">PENDING REWARDS</small>
                    <span class="fs-2 fw-bold text-warning"><?php echo $user ? $user['pending_rewards'] : '$0'; ?></span>
                </div>
            </div>
            <div class="col-md-4">
                <div class="glass-panel rounded-4 p-4">
                    <small class="text-muted d-block mb-1">COMPLETED REWARDS</small>
                    <span class="fs-2 fw-bold text-success"><?php echo $user ? $user['completed_rewards'] : '$0'; ?></span>
                </div>
            </div>
        </section>

        <div class="row g-5">
            <!-- Joined campaigns -->
            <div class="col-lg-7">
                <div class="glass-panel rounded-4 p-4 h-100">
                    <h4 class="fw-bold mb-4">My Joined Airdrops</h4>
                    <?php if (empty($joined_airdrops)): ?>
                    <div class="text-center py-5">
                        <p class="text-secondary mb-3">You haven't joined any Web3 catalog airdrops yet.</p>
                        <a href="index.php" class="btn btn-sm btn-outline-primary rounded-pill">Explore Active Deals</a>
                    </div>
                    <?php else: ?>
                    <div class="d-flex flex-column gap-3">
                        <?php foreach($joined_airdrops as $a): ?>
                        <div class="d-flex align-items-center justify-content-between p-3 bg-dark rounded-3 border border-dark">
                            <div class="d-flex align-items-center">
                                <span class="fs-3 me-3"><?php echo $a['logo']; ?></span>
                                <div>
                                    <h6 class="fw-bold m-0"><?php echo $a['name']; ?></h6>
                                    <small class="text-muted"><?php echo $a['blockchain']; ?></small>
                                </div>
                            </div>
                            <span class="badge bg-warning text-dark font-weight-bold rounded-pill"><?php echo $a['reward']; ?></span>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>
            </div>

            <!-- Receipts / Transactions logs -->
            <div class="col-lg-5">
                <div class="glass-panel rounded-4 p-4 h-100">
                    <h4 class="fw-bold mb-4">Transaction History</h4>
                    <?php if (empty($txs)): ?>
                    <p class="text-secondary text-center py-5">No transaction receipts logged on-chain.</p>
                    <?php else: ?>
                    <div class="d-flex flex-column gap-3">
                        <?php foreach($txs as $tx): ?>
                        <div class="p-3 bg-dark rounded-3 border border-dark">
                            <div class="d-flex justify-content-between mb-1">
                                <strong class="text-sm"><?php echo $tx['airdrop_name']; ?></strong>
                                <span class="text-success text-sm fw-bold"><?php echo $tx['amount']; ?> ETH</span>
                            </div>
                            <div class="d-flex justify-content-between align-items-center">
                                <code class="text-muted text-xs"><?php echo substr($tx['tx_hash'], 0, 10) . '...' . substr($tx['tx_hash'], 56); ?></code>
                                <span class="badge bg-success py-1 text-xs">Success</span>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>

        <?php endif; ?>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`
  },
  style: {
    filename: "style.css",
    language: "css",
    content: `/* Crytobox Styling - Custom modern Glassmorphic theme */
body {
    font-family: 'Inter', 'Poppins', sans-serif;
    background-color: #0D1117;
    background-image: 
        radial-gradient(at 10% 10%, rgba(108, 92, 231, 0.12) 0px, transparent 50%),
        radial-gradient(at 90% 10%, rgba(0, 210, 255, 0.12) 0px, transparent 50%),
        radial-gradient(at 50% 90%, rgba(0, 255, 163, 0.08) 0px, transparent 50%);
    background-attachment: fixed;
    min-height: 100vh;
}

/* Glassmorphism panel styling */
.glass-panel {
    background: rgba(22, 27, 34, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}

.glass-panel-hover {
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.glass-panel-hover:hover {
    background: rgba(22, 27, 34, 0.85);
    border-color: rgba(108, 92, 231, 0.3);
    box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.45);
    transform: translateY(-4px);
}

/* Custom badges */
.text-cyan {
    color: #00D2FF !important;
}

.text-accent {
    color: #00FFA3 !important;
}

.text-xs {
    font-size: 0.75rem;
}

.text-sm {
    font-size: 0.875rem;
}

.line-clamp-3 {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;  
    overflow: hidden;
}

.shadow-neon-purple {
    box-shadow: 0 0 25px rgba(108, 92, 231, 0.3);
}

.tracking-tight {
    letter-spacing: -0.025em;
}

/* Standard HTML modifications for darker inputs */
.form-control:focus {
    background-color: #161B22;
    border-color: #6C5CE7;
    color: white;
    box-shadow: 0 0 10px rgba(108, 92, 231, 0.2);
}
`
  }
};
