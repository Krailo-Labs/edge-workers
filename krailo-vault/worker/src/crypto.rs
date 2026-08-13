use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use getrandom::getrandom;
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Zeroize, ZeroizeOnDrop)]
pub struct SecretBuffer {
    pub data: Vec<u8>,
}

pub fn encrypt_bytes(plain_text: &[u8], master_key_bytes: &[u8; 32]) -> Result<Vec<u8>, String> {
    let key = Key::<Aes256Gcm>::from_slice(master_key_bytes);
    let cipher = Aes256Gcm::new(key);

    let mut nonce_bytes = [0u8; 12];
    getrandom(&mut nonce_bytes).map_err(|e| format!("Random error: {}", e))?;
    let nonce = Nonce::from_slice(&nonce_bytes);

    let cipher_text = cipher
        .encrypt(nonce, plain_text)
        .map_err(|_| "Encryption failed".to_string())?;

    let mut result = nonce_bytes.to_vec();
    result.extend(cipher_text);
    Ok(result)
}

pub fn decrypt_bytes(encrypted_payload: &[u8], master_key_bytes: &[u8; 32]) -> Result<SecretBuffer, String> {
    if encrypted_payload.len() < 12 {
        return Err("Payload too short".to_string());
    }

    let (nonce_bytes, cipher_text) = encrypted_payload.split_at(12);
    let key = Key::<Aes256Gcm>::from_slice(master_key_bytes);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce_bytes);

    let decrypted_raw = cipher
        .decrypt(nonce, cipher_text)
        .map_err(|_| "Decryption failed or invalid token".to_string())?;

    Ok(SecretBuffer { data: decrypted_raw })
}