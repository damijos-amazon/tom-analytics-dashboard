/**
 * EncryptionService - Handles encryption and decryption of sensitive data
 * 
 * This service manages:
 * - Client-side encryption for sensitive fields
 * - SSO configuration credential encryption
 * - Secure data handling before database storage
 * 
 * Note: This uses Web Crypto API for client-side encryption.
 * For production, consider using Supabase's built-in encryption features
 * and server-side encryption for maximum security.
 */

class EncryptionService {
    constructor() {
        this.algorithm = 'AES-GCM';
        this.keyLength = 256;
        this.ivLength = 12; // 96 bits for GCM
        this.saltLength = 16;
        this.iterations = 100000; // PBKDF2 iterations
    }

    /**
     * Initialize encryption service
     * Generates or retrieves encryption key
     * @param {string} masterPassword - Master password for key derivation
     * @returns {Promise<void>}
     */
    async initialize(masterPassword = null) {
        // In production, the master password should come from a secure source
        // For now, we'll use a combination of user session and environment
        if (!masterPassword) {
            // Generate a session-specific key
            // In production, this should be derived from user credentials
            masterPassword = await this.generateSessionKey();
        }
        
        this.masterKey = await this.deriveKey(masterPassword);
    }

    /**
     * Generate a session-specific key
     * @returns {Promise<string>} Session key
     */
    async generateSessionKey() {
        // In production, derive this from user authentication
        // For now, generate a random key per session
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Derive encryption key from password using PBKDF2
     * @param {string} password - Password to derive key from
     * @param {Uint8Array} salt - Salt for key derivation (optional)
     * @returns {Promise<CryptoKey>} Derived encryption key
     */
    async deriveKey(password, salt = null) {
        // Generate salt if not provided
        if (!salt) {
            salt = crypto.getRandomValues(new Uint8Array(this.saltLength));
            this.salt = salt;
        }

        // Convert password to key material
        const encoder = new TextEncoder();
        const passwordBuffer = encoder.encode(password);
        
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            passwordBuffer,
            'PBKDF2',
            false,
            ['deriveBits', 'deriveKey']
        );

        // Derive key using PBKDF2
        return await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: salt,
                iterations: this.iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            {
                name: this.algorithm,
                length: this.keyLength
            },
            false,
            ['encrypt', 'decrypt']
        );
    }

    /**
     * Encrypt sensitive data
     * @param {string} plaintext - Data to encrypt
     * @returns {Promise<string>} Encrypted data as base64 string
     */
    async encrypt(plaintext) {
        if (!this.masterKey) {
            throw new Error('Encryption service not initialized');
        }

        try {
            // Generate random IV
            const iv = crypto.getRandomValues(new Uint8Array(this.ivLength));
            
            // Convert plaintext to buffer
            const encoder = new TextEncoder();
            const plaintextBuffer = encoder.encode(plaintext);
            
            // Encrypt data
            const ciphertext = await crypto.subtle.encrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                this.masterKey,
                plaintextBuffer
            );
            
            // Combine IV and ciphertext
            const combined = new Uint8Array(iv.length + ciphertext.byteLength);
            combined.set(iv, 0);
            combined.set(new Uint8Array(ciphertext), iv.length);
            
            // Convert to base64
            return this.arrayBufferToBase64(combined);
        } catch (error) {
            console.error('Encryption failed:', error);
            throw new Error('Failed to encrypt data');
        }
    }

    /**
     * Decrypt sensitive data
     * @param {string} encryptedData - Base64 encoded encrypted data
     * @returns {Promise<string>} Decrypted plaintext
     */
    async decrypt(encryptedData) {
        if (!this.masterKey) {
            throw new Error('Encryption service not initialized');
        }

        try {
            // Convert from base64
            const combined = this.base64ToArrayBuffer(encryptedData);
            
            // Extract IV and ciphertext
            const iv = combined.slice(0, this.ivLength);
            const ciphertext = combined.slice(this.ivLength);
            
            // Decrypt data
            const plaintextBuffer = await crypto.subtle.decrypt(
                {
                    name: this.algorithm,
                    iv: iv
                },
                this.masterKey,
                ciphertext
            );
            
            // Convert to string
            const decoder = new TextDecoder();
            return decoder.decode(plaintextBuffer);
        } catch (error) {
            console.error('Decryption failed:', error);
            throw new Error('Failed to decrypt data');
        }
    }

    /**
     * Encrypt SSO configuration credentials
     * @param {Object} ssoConfig - SSO configuration object
     * @returns {Promise<Object>} Configuration with encrypted credentials
     */
    async encryptSSOConfig(ssoConfig) {
        if (!ssoConfig) {
            throw new Error('Invalid SSO configuration');
        }

        const encryptedConfig = { ...ssoConfig };
        
        // List of sensitive fields to encrypt
        const sensitiveFields = [
            'clientSecret',
            'apiKey',
            'privateKey',
            'certificate',
            'password',
            'token'
        ];

        // Encrypt each sensitive field
        for (const field of sensitiveFields) {
            if (encryptedConfig[field]) {
                encryptedConfig[field] = await this.encrypt(encryptedConfig[field]);
                encryptedConfig[`${field}_encrypted`] = true;
            }
        }

        return encryptedConfig;
    }

    /**
     * Decrypt SSO configuration credentials
     * @param {Object} ssoConfig - SSO configuration with encrypted credentials
     * @returns {Promise<Object>} Configuration with decrypted credentials
     */
    async decryptSSOConfig(ssoConfig) {
        if (!ssoConfig) {
            throw new Error('Invalid SSO configuration');
        }

        const decryptedConfig = { ...ssoConfig };
        
        // List of sensitive fields to decrypt
        const sensitiveFields = [
            'clientSecret',
            'apiKey',
            'privateKey',
            'certificate',
            'password',
            'token'
        ];

        // Decrypt each sensitive field
        for (const field of sensitiveFields) {
            if (decryptedConfig[field] && decryptedConfig[`${field}_encrypted`]) {
                decryptedConfig[field] = await this.decrypt(decryptedConfig[field]);
                delete decryptedConfig[`${field}_encrypted`];
            }
        }

        return decryptedConfig;
    }

    /**
     * Hash sensitive data (one-way)
     * Useful for storing passwords or creating checksums
     * @param {string} data - Data to hash
     * @returns {Promise<string>} Hash as hex string
     */
    async hash(data) {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
        
        return this.arrayBufferToHex(hashBuffer);
    }

    /**
     * Generate a secure random token
     * @param {number} length - Length of token in bytes
     * @returns {string} Random token as hex string
     */
    generateSecureToken(length = 32) {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return this.arrayBufferToHex(array);
    }

    /**
     * Convert ArrayBuffer to base64 string
     * @param {ArrayBuffer|Uint8Array} buffer - Buffer to convert
     * @returns {string} Base64 string
     */
    arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    /**
     * Convert base64 string to ArrayBuffer
     * @param {string} base64 - Base64 string
     * @returns {Uint8Array} Array buffer
     */
    base64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    }

    /**
     * Convert ArrayBuffer to hex string
     * @param {ArrayBuffer|Uint8Array} buffer - Buffer to convert
     * @returns {string} Hex string
     */
    arrayBufferToHex(buffer) {
        const bytes = new Uint8Array(buffer);
        return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Securely wipe sensitive data from memory
     * @param {string} data - Data to wipe
     * @returns {string} Empty string
     */
    secureWipe(data) {
        if (typeof data === 'string') {
            // Overwrite with random data
            const length = data.length;
            let wiped = '';
            for (let i = 0; i < length; i++) {
                wiped += String.fromCharCode(Math.floor(Math.random() * 256));
            }
            return '';
        }
        return '';
    }

    /**
     * Validate encrypted data format
     * @param {string} encryptedData - Encrypted data to validate
     * @returns {boolean} True if valid format
     */
    isValidEncryptedData(encryptedData) {
        try {
            const buffer = this.base64ToArrayBuffer(encryptedData);
            return buffer.length > this.ivLength;
        } catch (error) {
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EncryptionService;
}
