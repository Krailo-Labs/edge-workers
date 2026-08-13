use clap::{Parser, Subcommand};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use rand::Rng;
use base64::{engine::general_purpose, Engine as _};

// --- СТРУКТУРА YAML МАНІФЕСТУ ---

#[derive(Debug, Serialize, Deserialize, Clone)]
struct EdgeVaultManifest {
    #[serde(rename = "apiVersion")]
    api_version: String,
    kind: String,
    metadata: Metadata,
    spec: Spec,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Metadata {
    name: String,
    namespace: String,
    annotations: Option<HashMap<String, String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Spec {
    target: Target,
    #[serde(default)]
    variables: HashMap<String, String>,
    #[serde(default)]
    secrets: HashMap<String, String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Target {
    provider: String,
    endpoint: String,
}

// --- СТРУКТУРА ЗАПИТУ ДО ВОРКЕРА ---

#[derive(Debug, Serialize)]
struct StoreRequest {
    value: String,
    is_secret: Option<bool>,
}

// --- НАЛАШТУВАННЯ АРГУМЕНТІВ CLAP ---

#[derive(Parser)]
#[command(name = "kvault")]
#[command(about = "Edge-native Vault CLI для екосистеми krailo-vault", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Зашифрувати секрети у вказаному YAML файлі локально (підготовка до Git)
    Encrypt {
        #[arg(short, long)]
        file: String,
    },
    /// Розшифрувати секрети у вказаному YAML файлі локально (для редагування)
    Decrypt {
        #[arg(short, long)]
        file: String,
    },
    /// Синхронізувати (apply) змінні та секрети з Cloudflare Worker API
    Apply {
        #[arg(short, long)]
        file: String,
    },
}

// --- КРИПТОГРАФІЧНІ ДОПОМІЖНІ ФУНКЦІЇ ---

fn derive_key_bytes(master_key: &str) -> [u8; 32] {
    let mut key_bytes = [0u8; 32];
    let raw_bytes = master_key.as_bytes();
    let len = raw_bytes.len().min(32);
    key_bytes[..len].copy_from_slice(&raw_bytes[..len]);
    key_bytes
}

fn encrypt_value(plain_text: &str, master_key: &str) -> Result<String, String> {
    let key_bytes = derive_key_bytes(master_key);
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    rand::thread_rng().fill(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plain_text.as_bytes())
        .map_err(|e| format!("Помилка шифрування: {}", e))?;

    let mut combined = nonce_bytes.to_vec();
    combined.extend(ciphertext);

    Ok(general_purpose::STANDARD.encode(&combined))
}

fn decrypt_value(base64_text: &str, master_key: &str) -> Result<String, String> {
    let decoded = general_purpose::STANDARD
        .decode(base64_text)
        .map_err(|e| format!("Помилка декодування Base64: {}", e))?;

    if decoded.len() < 12 {
        return Err("Зашифровані дані занадто короткі".to_string());
    }

    let (nonce_bytes, ciphertext) = decoded.split_at(12);
    let key_bytes = derive_key_bytes(master_key);
    let key = Key::<Aes256Gcm>::from_slice(&key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);

    let decrypted = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|e| format!("Помилка дешифрування: {}", e))?;

    String::from_utf8(decrypted).map_err(|e| format!("Помилка перетворення UTF-8: {}", e))
}

// --- ГОЛОВНА ФУНКЦІЯ ---

fn main() {
    let cli = Cli::parse();

    // Отримуємо майстер-ключ для авторизації та шифрування
    let master_key = match std::env::var("VAULT_MASTER_KEY") {
        Ok(key) => key,
        Err(_) => {
            eprintln!("❌ Помилка: Змінна середовища VAULT_MASTER_KEY не встановлена.");
            eprintln!("👉 Виконайте локально: export VAULT_MASTER_KEY=\"ваш_майстер_ключ\"");
            std::process::exit(1);
        }
    };

    match &cli.command {
        Commands::Encrypt { file } => {
            println!("🔒 Локальне шифрування файлу: '{}'", file);

            let yaml_content = match fs::read_to_string(file) {
                Ok(content) => content,
                Err(e) => {
                    eprintln!("❌ Не вдалося відкрити файл: {}", e);
                    std::process::exit(1);
                }
            };

            let mut manifest: EdgeVaultManifest = match serde_yaml::from_str(&yaml_content) {
                Ok(parsed) => parsed,
                Err(e) => {
                    eprintln!("❌ Помилка парсингу YAML: {}", e);
                    std::process::exit(1);
                }
            };

            // Перевіряємо поточний статус шифрування через анотацію
            let mut annotations = manifest.metadata.annotations.clone().unwrap_or_default();
            let is_encrypted = annotations.get("krailo.sh/encrypted").map(|v| v.as_str()) == Some("true");

            if is_encrypted {
                println!("⚠️  Попередження: Файл уже позначено як зашифрований. Пропускаємо.");
                std::process::exit(0);
            }

            if manifest.spec.secrets.is_empty() {
                println!("ℹ️  У блоці 'secrets' немає даних для шифрування.");
                std::process::exit(0);
            }

            // Шифруємо кожне значення в блоці secrets
            for (key, val) in manifest.spec.secrets.iter_mut() {
                match encrypt_value(val, &master_key) {
                    Ok(encrypted_val) => {
                        *val = encrypted_val;
                    }
                    Err(e) => {
                        eprintln!("❌ Помилка шифрування ключа '{}': {}", key, e);
                        std::process::exit(1);
                    }
                }
            }

            // Оновлюємо статус в анотаціях на "true"
            annotations.insert("krailo.sh/encrypted".to_string(), "true".to_string());
            manifest.metadata.annotations = Some(annotations);

            // Записуємо оновлений маніфест назад у файл
            let updated_yaml = serde_yaml::to_string(&manifest).unwrap();
            if let Err(e) = fs::write(file, updated_yaml) {
                eprintln!("❌ Не вдалося зберегти зашифрований файл: {}", e);
                std::process::exit(1);
            }

            println!("✅ Файл успішно зашифровано та збережено. Тепер його можна безпечно пушити в Git!");
        }

        Commands::Decrypt { file } => {
            println!("🔓 Локальне дешифрування файлу: '{}'", file);

            let yaml_content = match fs::read_to_string(file) {
                Ok(content) => content,
                Err(e) => {
                    eprintln!("❌ Не вдалося відкрити файл: {}", e);
                    std::process::exit(1);
                }
            };

            let mut manifest: EdgeVaultManifest = match serde_yaml::from_str(&yaml_content) {
                Ok(parsed) => parsed,
                Err(e) => {
                    eprintln!("❌ Помилка парсингу YAML: {}", e);
                    std::process::exit(1);
                }
            };

            // Перевіряємо статус шифрування
            let mut annotations = manifest.metadata.annotations.clone().unwrap_or_default();
            let is_encrypted = annotations.get("krailo.sh/encrypted").map(|v| v.as_str()) == Some("true");

            if !is_encrypted {
                println!("⚠️  Попередження: Файл уже розшифрований (або анотація відсутня). Пропускаємо.");
                std::process::exit(0);
            }

            // Розшифровуємо блок secrets
            for (key, val) in manifest.spec.secrets.iter_mut() {
                match decrypt_value(val, &master_key) {
                    Ok(decrypted_val) => {
                        *val = decrypted_val;
                    }
                    Err(e) => {
                        eprintln!("❌ Помилка дешифрування ключа '{}': {}", key, e);
                        std::process::exit(1);
                    }
                }
            }

            // Оновлюємо статус в анотаціях на "false"
            annotations.insert("krailo.sh/encrypted".to_string(), "false".to_string());
            manifest.metadata.annotations = Some(annotations);

            // Записуємо чистий маніфест назад у файл
            let updated_yaml = serde_yaml::to_string(&manifest).unwrap();
            if let Err(e) = fs::write(file, updated_yaml) {
                eprintln!("❌ Не вдалося зберегти розшифрований файл: {}", e);
                std::process::exit(1);
            }

            println!("✅ Файл успішно розшифровано та збережено у відкритому вигляді для редагування.");
        }

        Commands::Apply { file } => {
            println!("🚀 Початок синхронізації (Apply) для файлу: '{}'", file);

            let yaml_content = match fs::read_to_string(file) {
                Ok(content) => content,
                Err(e) => {
                    eprintln!("❌ Не вдалося відкрити файл: {}", e);
                    std::process::exit(1);
                }
            };

            let manifest: EdgeVaultManifest = match serde_yaml::from_str(&yaml_content) {
                Ok(parsed) => parsed,
                Err(e) => {
                    eprintln!("❌ Помилка парсингу YAML: {}", e);
                    std::process::exit(1);
                }
            };

            let annotations = manifest.metadata.annotations.clone().unwrap_or_default();
            let is_encrypted = annotations.get("krailo.sh/encrypted").map(|v| v.as_str()) == Some("true");

            println!("✅ Маніфест '{}' успішно верифіковано.", manifest.metadata.name);
            println!("👉 Хост призначення: {}", manifest.spec.target.endpoint);
            println!("👉 Режим передачі: {}", if is_encrypted { "GitOps (Авто-дешифрування в пам'яті)" } else { "Development (Чисті дані)" });

            let client = reqwest::blocking::Client::new();
            let base_url = manifest.spec.target.endpoint.trim_end_matches('/');
            let namespace = &manifest.metadata.namespace;

            // 1. Відправка звичайних конфігів (variables)
            if !manifest.spec.variables.is_empty() {
                println!("\n📦 Синхронізація відкритих змінних (variables):");
                for (key, val) in &manifest.spec.variables {
                    let url = format!("{}/v1/store/{}/{}", base_url, namespace, key);
                    let payload = StoreRequest {
                        value: val.to_string(),
                        is_secret: Some(false),
                    };

                    print!("   ⏱️ Відправка '{}'...", key);
                    let response = client.put(&url)
                        .header("Authorization", format!("Bearer {}", master_key))
                        .json(&payload)
                        .send();

                    match response {
                        Ok(res) if res.status().is_success() => println!(" OK ✅"),
                        Ok(res) => eprintln!(" Помилка ❌ (Статус: {}, {:?})", res.status(), res.text()),
                        Err(e) => eprintln!(" Помилка з'єднання ❌ ({})", e),
                    }
                }
            }

            // 2. Відправка секретів (secrets) з дешифруванням в пам'яті за потреби
            if !manifest.spec.secrets.is_empty() {
                println!("\n🔒 Синхронізація секретів (secrets):");
                for (key, val) in &manifest.spec.secrets {
                    let url = format!("{}/v1/store/{}/{}", base_url, namespace, key);

                    // Якщо файл зашифрований — розшифровуємо ОДНЕ значення суто в оперативку
                    let value_to_send = if is_encrypted {
                        match decrypt_value(val, &master_key) {
                            Ok(decrypted) => decrypted,
                            Err(e) => {
                                eprintln!(" Помилка локального дешифрування ключа '{}': ❌ ({})", key, e);
                                std::process::exit(1);
                            }
                        }
                    } else {
                        val.to_string()
                    };

                    let payload = StoreRequest {
                        value: value_to_send,
                        is_secret: Some(true),
                    };

                    print!("   ⏱️ Відправка '{}' (буде зашифровано на Edge воркером)...", key);
                    let response = client.put(&url)
                        .header("Authorization", format!("Bearer {}", master_key))
                        .json(&payload)
                        .send();

                    match response {
                        Ok(res) if res.status().is_success() => println!(" OK ✅"),
                        Ok(res) => eprintln!(" Помилка ❌ (Статус: {}, {:?})", res.status(), res.text()),
                        Err(e) => eprintln!(" Помилка з'єднання ❌ ({})", e),
                    }
                }
            }

            println!("\n🎉 Синхронізація маніфесту успішно завершена!");
        }
    }
}