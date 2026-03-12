import type { ProofOfIntegration } from '@/types';

interface ProductForProof {
  apiBaseUrl: string | null;
  websiteUrl?: string | null;
}

function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Accept proof endpoint if its domain matches the product's apiBaseUrl OR websiteUrl.
 * Also accepts subdomains: api.stripe.com matches stripe.com and vice versa.
 */
function isValidProofDomain(proofEndpoint: string, product: ProductForProof): boolean {
  const proofDomain = extractHostname(proofEndpoint);
  if (!proofDomain) return false;

  const validDomains = [
    product.apiBaseUrl ? extractHostname(product.apiBaseUrl) : null,
    product.websiteUrl ? extractHostname(product.websiteUrl) : null,
  ].filter((d): d is string => d !== null);

  if (validDomains.length === 0) return true; // no domains to check against

  return validDomains.some(
    (d) =>
      proofDomain === d ||
      proofDomain.endsWith('.' + d) ||
      d.endsWith('.' + proofDomain),
  );
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

  // 5. Domain matching — accept if proof domain matches apiBaseUrl OR websiteUrl (incl. subdomains)
  if (proof.endpoint.startsWith('http')) {
    if (!isValidProofDomain(proof.endpoint, product)) {
      return { valid: false, reason: 'domain_mismatch' };
    }
  }

  // 6. trace_hash must be valid SHA-256 hex (64 lowercase hex chars)
  if (!proof.trace_hash || !/^[a-f0-9]{64}$/.test(proof.trace_hash)) {
    return { valid: false, reason: 'invalid_hash_format' };
  }

  return { valid: true };
}
