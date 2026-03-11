import type { ProofOfIntegration } from '@/types';

interface ProductForProof {
  apiBaseUrl: string | null;
}

export function verifyProof(
  proof: ProofOfIntegration,
  product: ProductForProof
): { valid: boolean; reason?: string } {
  // 1. Timestamp validity
  const proofTime = new Date(proof.timestamp).getTime();
  const now = Date.now();
  if (isNaN(proofTime)) {
    return { valid: false, reason: 'invalid_timestamp' };
  }
  if (proofTime > now + 60_000) {
    return { valid: false, reason: 'future_timestamp' };
  }
  if (now - proofTime > 30 * 24 * 60 * 60 * 1000) {
    return { valid: false, reason: 'proof_expired' };
  }

  // 2. Status code must be 2xx
  if (proof.status_code < 200 || proof.status_code >= 300) {
    return { valid: false, reason: 'unsuccessful_call' };
  }

  // 3. Latency sanity check
  if (proof.latency_ms <= 0 || proof.latency_ms > 30000) {
    return { valid: false, reason: 'invalid_latency' };
  }

  // 4. Valid HTTP method
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  if (!validMethods.includes(proof.method.toUpperCase())) {
    return { valid: false, reason: 'invalid_method' };
  }

  // 5. Domain matching (if product has apiBaseUrl and proof has full URL)
  if (product.apiBaseUrl && proof.endpoint.startsWith('http')) {
    try {
      const proofDomain = new URL(proof.endpoint).hostname;
      const productDomain = new URL(product.apiBaseUrl).hostname;
      if (proofDomain !== productDomain) {
        return { valid: false, reason: 'domain_mismatch' };
      }
    } catch {
      return { valid: false, reason: 'invalid_endpoint_url' };
    }
  }

  // 6. trace_hash format check
  if (!proof.trace_hash || proof.trace_hash.length < 10) {
    return { valid: false, reason: 'invalid_trace_hash' };
  }

  return { valid: true };
}
