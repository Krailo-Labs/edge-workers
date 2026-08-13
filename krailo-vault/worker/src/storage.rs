use worker::*;

pub struct VaultStorage;

impl VaultStorage {
    pub async fn put_raw(env: &Env, namespace: &str, key: &str, data: &[u8]) -> Result<()> {
        let kv = env.kv("VAULT_KV")?;
        let storage_key = format!("{}:{}", namespace, key);
        kv.put_bytes(&storage_key, data)?.execute().await?;
        Ok(())
    }

    pub async fn get_raw(env: &Env, namespace: &str, key: &str) -> Result<Option<Vec<u8>>> {
        let kv = env.kv("VAULT_KV")?;
        let storage_key = format!("{}:{}", namespace, key);
        let bytes = kv.get(&storage_key).bytes().await?;
        Ok(bytes)
    }
}