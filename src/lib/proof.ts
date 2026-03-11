import type { ProofOfIntegration } from '@/types';

interface ProductForProof {
  apiBaseUrl: string | null;
}

export function verifyProof(
  proof: ProofOfIntegration,
  product: ProductForProof,
  signal: 'UPVOTE' | 'DOWNVOTE' = 'UPVOTE'
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

  // 2. Signal-aware status code validation
  if (signal === 'UPVOTE') {
    // Upvote requires a successful API call (2xx)
    if (proof.status_code < 200 || proof.status_code >= 300) {
      return { valid: false, reason: 'upvote_requires_success' };
    }
  } else {
    // Downvote requires a failed API call (4xx or 5xx)
    if (proof.status_code < 400) {
      return { valid: false, reason: 'downvote_requires_failure_proof' };
    }
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

  // 6. trace_hash must be valid SHA-256 hex (64 lowercase hex chars)
  if (!proof.trace_hash || !/^[a-f0-9]{64}$/.test(proof.trace_hash)) {
    return { valid: false, reason: 'invalid_hash_format' };
  }

  return { valid: true };
}
