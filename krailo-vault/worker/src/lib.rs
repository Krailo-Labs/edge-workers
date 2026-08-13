mod config;
mod crypto;
mod storage;

use config::{derive_key_bytes, get_master_key};
use crypto::{decrypt_bytes, encrypt_bytes};
use storage::VaultStorage;

use serde::{Deserialize, Serialize};
use worker::*;

#[derive(Serialize, Deserialize)]
struct StoreRequest {
    value: String,
    is_secret: Option<bool>,
}

#[event(fetch)]
pub async fn main(req: Request, env: Env, _ctx: Context) -> Result<Response> {
    console_error_panic_hook::set_once();
    let router = Router::new();

    router
        .get_async("/v1/health", |_req, _ctx| async move {
            Response::ok("Vault is active (Rust/WASM)")
        })
        .put_async("/v1/store/:namespace/:key", |mut req, ctx| async move {
            let auth_header = match req.headers().get("Authorization")? {
                Some(h) => h,
                None => return Response::error("Unauthorized: Missing Header", 401),
            };

            let master_key = match get_master_key(&ctx.env) {
                Ok(k) => k,
                Err(_) => return Response::error("Server Error: Missing Master Key", 500),
            };

            if auth_header != format!("Bearer {}", master_key) {
                return Response::error("Forbidden: Invalid Master Key", 403);
            }

            let namespace = match ctx.param("namespace") {
                Some(n) => n,
                None => return Response::error("Bad Request: Missing namespace", 400),
            };
            let key = match ctx.param("key") {
                Some(k) => k,
                None => return Response::error("Bad Request: Missing key", 400),
            };

            let payload: StoreRequest = match req.json().await {
                Ok(p) => p,
                Err(_) => return Response::error("Bad Request: Invalid JSON", 400),
            };

            if payload.is_secret.unwrap_or(true) {
                let key_bytes = derive_key_bytes(&master_key);
                let encrypted = encrypt_bytes(payload.value.as_bytes(), &key_bytes)
                    .map_err(|e| Error::RustError(e))?;

                VaultStorage::put_raw(&ctx.env, namespace, key, &encrypted).await?;
            } else {
                VaultStorage::put_raw(&ctx.env, namespace, key, payload.value.as_bytes()).await?;
            }

            Response::ok(format!("Key '{}:{}' stored successfully", namespace, key))
        })
        // НОВИЙ РОУТ: Покаже сирі байти з бази, щоб ти переконався, що там лежить шифр
        .get_async("/v1/raw/:namespace/:key", |_req, ctx| async move {
            let namespace = ctx.param("namespace").unwrap();
            let key = ctx.param("key").unwrap();

            let bytes = match VaultStorage::get_raw(&ctx.env, namespace, key).await? {
                Some(b) => b,
                None => return Response::error("Key not found", 404),
            };

            // Перетворюємо байти у hex-формат для наглядності
            let hex_string: String = bytes.iter().map(|b| format!("{:02x}", b)).collect();
            Response::ok(format!("RAW ENCRYPTED BYTES IN KV:\n{}", hex_string))
        })
        // ОНОВЛЕНИЙ GET: Тепер вимагає Bearer токен!
        .get_async("/v1/store/:namespace/:key", |req, ctx| async move {
            // ТЕПЕР ТУТ Є АВТОРИЗАЦІЯ
            let auth_header = match req.headers().get("Authorization")? {
                Some(h) => h,
                None => return Response::error("Unauthorized: Missing Header", 401),
            };

            let master_key = match get_master_key(&ctx.env) {
                Ok(k) => k,
                Err(_) => return Response::error("Server Error: Missing Master Key", 500),
            };

            if auth_header != format!("Bearer {}", master_key) {
                return Response::error("Forbidden: Invalid Master Key", 403);
            }

            let namespace = ctx.param("namespace").unwrap();
            let key = ctx.param("key").unwrap();

            let bytes = match VaultStorage::get_raw(&ctx.env, namespace, key).await? {
                Some(b) => b,
                None => return Response::error("Key not found", 404),
            };

            let key_bytes = derive_key_bytes(&master_key);

            match decrypt_bytes(&bytes, &key_bytes) {
                Ok(decrypted_secret) => {
                    let text = String::from_utf8_lossy(&decrypted_secret.data).to_string();
                    Response::ok(text)
                }
                Err(e) => {
                    if bytes.len() < 12 {
                        let text = String::from_utf8_lossy(&bytes).to_string();
                        return Response::ok(text);
                    }
                    Response::error(format!("Decryption failed: {}", e), 500)
                }
            }
        })
        .run(req, env)
        .await
}