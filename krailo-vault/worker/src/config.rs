use worker::*;

pub fn get_master_key(env: &Env) -> Result<String> {
    env.secret("VAULT_MASTER_KEY")
        .map(|k| k.to_string())
        .map_err(|_| Error::RustError("Missing VAULT_MASTER_KEY secret".into()))
}

pub fn derive_key_bytes(master_key: &str) -> [u8; 32] {
    let mut key_bytes = [0u8; 32];
    let raw_bytes = master_key.as_bytes();
    let len = raw_bytes.len().min(32);
    key_bytes[..len].copy_from_slice(&raw_bytes[..len]);
    key_bytes
}