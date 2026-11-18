import readline from 'node:readline/promises';
import {stdin as input, stdout as output} from 'node:process';
import {getDb, closeDb} from '../server/db.ts';
import {seedInitialData} from '../server/seed.ts';
import {hashPassword, normalizePhone, writeAuditLog} from '../server/security.ts';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx !== -1 && process.argv[idx + 1]) {
    return process.argv[idx + 1];
  }
  return undefined;
}

async function main() {
  getDb();
  seedInitialData();
  const db = getDb();

  let phone = getArg('--phone') || process.env.ADMIN_BOOTSTRAP_PHONE;
  let displayName = getArg('--name') || process.env.ADMIN_BOOTSTRAP_NAME || 'Platform Administrator';
  let password = getArg('--password') || process.env.ADMIN_BOOTSTRAP_PASSWORD;
  let email = getArg('--email') || process.env.ADMIN_BOOTSTRAP_EMAIL || null;

  if (!phone || !password) {
    const rl = readline.createInterface({input, output});
    try {
      if (!phone) {
        phone = await rl.question('Admin phone (e.g. +231770000900): ');
      }
      if (!getArg('--name') && !process.env.ADMIN_BOOTSTRAP_NAME) {
        const enteredName = await rl.question('Admin display name [Platform Administrator]: ');
        if (enteredName.trim()) displayName = enteredName.trim();
      }
      if (!password) {
        password = await rl.question('Admin password (min 10 chars): ');
      }
    } finally {
      rl.close();
    }
  }

  const normalizedPhone = normalizePhone(phone || '');
  if (!normalizedPhone || normalizedPhone.length < 7) {
    console.error('Error: Valid phone number is required.');
    process.exit(1);
  }
  if (!password || password.length < 10) {
    console.error('Error: Admin password must be at least 10 characters.');
    process.exit(1);
  }

  const adminRole = db.prepare("SELECT id FROM roles WHERE name = 'admin'").get() as {id: number} | undefined;
  if (!adminRole) {
    console.error('Error: Admin role not found in database.');
    process.exit(1);
  }

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(normalizedPhone) as
    | {id: number}
    | undefined;

  let userId: number;
  if (existing) {
    userId = existing.id;
    db.prepare("UPDATE users SET display_name = ?, password_hash = ?, status = 'active', updated_at = datetime('now') WHERE id = ?").run(
      displayName,
      hashPassword(password),
      userId
    );
  } else {
    const res = db
      .prepare("INSERT INTO users (display_name, phone, email, password_hash, status) VALUES (?, ?, ?, ?, 'active')")
      .run(displayName, normalizedPhone, email, hashPassword(password));
    userId = Number(res.lastInsertRowid);
    db.prepare("INSERT OR IGNORE INTO farmer_profiles (user_id, county, preferred_language) VALUES (?, 'Montserrado', 'en')").run(
      userId
    );
  }

  db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)').run(userId, adminRole.id);

  writeAuditLog({
    actorUserId: userId,
    actorRole: 'cli_bootstrap',
    action: 'admin_bootstrapped',
    targetType: 'user',
    targetId: userId,
    details: {phone: normalizedPhone, existing: Boolean(existing)},
  });

  console.log(`Administrator account ready for ${displayName} (${normalizedPhone}).`);
  closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
