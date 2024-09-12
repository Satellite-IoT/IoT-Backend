import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CryptoService {
  generateKeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    return {
      publicKey: publicKey.export({ format: 'der', type: 'spki' }).toString('base64'),
      privateKey: privateKey.export({ format: 'der', type: 'pkcs8' }).toString('base64'),
    };
  }

  sign(privateKeyBase64: string, message: string): string {
    const privateKeyDer = Buffer.from(privateKeyBase64, 'base64');
    const key = crypto.createPrivateKey({
      key: privateKeyDer,
      format: 'der',
      type: 'pkcs8',
    });
    const signature = crypto.sign(null, Buffer.from(message), key);
    return signature.toString('base64');
  }

  verify(publicKeyBase64: string, signatureBase64: string, message: string): boolean {
    try {
      const publicKeyDer = Buffer.from(publicKeyBase64, 'base64');
      const key = crypto.createPublicKey({
        key: publicKeyDer,
        format: 'der',
        type: 'spki',
      });
      const signature = Buffer.from(signatureBase64, 'base64');
      return crypto.verify(null, Buffer.from(message), key, signature);
    } catch (error) {
      console.error('Verification error:', error);
      return false;
    }
  }
}
