/**
 * URL validation utility to prevent SSRF attacks
 */

const ALLOWED_PROTOCOLS = ['http:', 'https:'];
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS metadata
  '10.0.0.0/8',
  '172.16.0.0/12', 
  '192.168.0.0/16'
];

export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const parsedUrl = new URL(url);
    
    if (!ALLOWED_PROTOCOLS.includes(parsedUrl.protocol)) {
      return { isValid: false, error: 'Invalid protocol. Only HTTP and HTTPS are allowed.' };
    }
    
    const hostname = parsedUrl.hostname.toLowerCase();
    for (const blockedHost of BLOCKED_HOSTS) {
      if (hostname === blockedHost || hostname.includes(blockedHost)) {
        return { isValid: false, error: 'Access to internal/private networks is not allowed.' };
      }
    }
    
    if (isPrivateIP(hostname)) {
      return { isValid: false, error: 'Access to private IP addresses is not allowed.' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format.' };
  }
}

function isPrivateIP(hostname: string): boolean {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (!ipRegex.test(hostname)) return false;
  
  const parts = hostname.split('.').map(Number);
  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}
