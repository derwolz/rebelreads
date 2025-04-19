import { dbStorage } from "../storage";
import { verificationService, VERIFICATION_TYPES } from "./verification-service";
import { Request } from "express";
import crypto from "crypto";

/**
 * SecurityService - Handles device verification and security-related tasks
 */
class SecurityService {
  private static instance: SecurityService;
  
  // Private constructor to enforce the singleton pattern
  private constructor() {}
  
  /**
   * Get the singleton instance of SecurityService
   */
  public static getInstance(): SecurityService {
    if (!SecurityService.instance) {
      SecurityService.instance = new SecurityService();
    }
    return SecurityService.instance;
  }
  
  /**
   * Determines if it's a Google auth login
   * Google auth users are already verified through Google, so we don't need additional verification
   */
  public isGoogleAuthLogin(user: any): boolean {
    return user && user.provider === 'google';
  }
  
  /**
   * Checks if verification is needed for a login request
   * by comparing the current device/IP against trusted devices
   */
  public async isVerificationNeeded(userId: number, req: Request): Promise<boolean> {
    try {
      // First, check if this is a trusted device
      const ipAddress = this.getIpAddress(req);
      const userAgent = req.headers['user-agent'] || '';
      
      // Check if this device is already trusted for this user
      const isTrustedDevice = await this.isDeviceTrusted(userId, ipAddress, userAgent);
      
      // If the device is trusted, no verification is needed
      if (isTrustedDevice) {
        return false;
      }
      
      // Get the user to check if they're using Google auth
      const user = await dbStorage.getUser(userId);
      if (user && this.isGoogleAuthLogin(user)) {
        // Google auth users skip verification, but we'll add their device as trusted
        await this.trustDeviceForUser(userId, req);
        return false;
      }
      
      // For new devices/IPs with regular auth, verification is needed
      return true;
    } catch (error) {
      console.error("Error checking if verification is needed:", error);
      // Default to requiring verification if we can't determine trust status
      return true;
    }
  }
  
  /**
   * Verifies a login verification code
   */
  public async verifyLoginCode(userId: number, code: string): Promise<boolean> {
    try {
      // Use the verification service to check the code
      return await verificationService.verifyCode(
        userId,
        code,
        VERIFICATION_TYPES.LOGIN_VERIFICATION
      );
    } catch (error) {
      console.error("Error verifying login code:", error);
      return false;
    }
  }
  
  /**
   * Send a login verification code via email
   */
  public async sendLoginVerification(
    userId: number, 
    userEmail: string, 
    req: Request
  ): Promise<boolean> {
    try {
      // Get IP and user agent
      const ipAddress = this.getIpAddress(req);
      const userAgent = req.headers['user-agent'] || '';
      
      // Create and send a verification code
      const codeCreated = await verificationService.createAndSendVerificationCode(
        userId,
        userEmail,
        VERIFICATION_TYPES.LOGIN_VERIFICATION,
        { ipAddress, userAgent }
      );
      
      return codeCreated ? true : false;
    } catch (error) {
      console.error("Error sending login verification:", error);
      return false;
    }
  }
  
  /**
   * Adds a trusted device for a user
   */
  public async trustDeviceForUser(userId: number, req: Request): Promise<boolean> {
    try {
      const ipAddress = this.getIpAddress(req);
      const userAgent = req.headers['user-agent'] || '';
      
      // Generate a fingerprint for this device/IP combination
      const deviceFingerprint = this.generateDeviceFingerprint(ipAddress, userAgent);
      
      // Store the trusted device in the database
      await dbStorage.addTrustedDevice(userId, {
        userId,
        ipAddress,
        userAgent,
        fingerprint: deviceFingerprint,
        lastUsed: new Date()
      });
      
      return true;
    } catch (error) {
      console.error("Error adding trusted device:", error);
      return false;
    }
  }
  
  /**
   * Checks if a device is trusted for a user
   */
  private async isDeviceTrusted(
    userId: number, 
    ipAddress: string, 
    userAgent: string
  ): Promise<boolean> {
    try {
      // Get trusted devices for this user
      const trustedDevices = await dbStorage.getTrustedDevicesForUser(userId);
      
      if (!trustedDevices || trustedDevices.length === 0) {
        return false;
      }
      
      // Generate fingerprint for current device
      const deviceFingerprint = this.generateDeviceFingerprint(ipAddress, userAgent);
      
      // Check if the current fingerprint matches any trusted device
      const isTrusted = trustedDevices.some(device => {
        // Check for exact fingerprint match
        if (device.fingerprint === deviceFingerprint) {
          return true;
        }
        
        // If not an exact match, check for IP match within the same subnet
        // This helps when IP addresses change slightly but are in the same network
        if (this.isSameSubnet(device.ipAddress, ipAddress) && 
            this.isSimilarUserAgent(device.userAgent, userAgent)) {
          return true;
        }
        
        return false;
      });
      
      return isTrusted;
    } catch (error) {
      console.error("Error checking if device is trusted:", error);
      // Default to untrusted if there's an error
      return false;
    }
  }
  
  /**
   * Generate a fingerprint for a device based on IP and User-Agent
   */
  private generateDeviceFingerprint(ipAddress: string, userAgent: string): string {
    const data = `${ipAddress}|${userAgent}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  /**
   * Check if two IPs are in the same subnet (simplified)
   */
  private isSameSubnet(ip1: string, ip2: string): boolean {
    // Simple check for first three octets matching
    // This is a simplification; real implementation would be more sophisticated
    const parts1 = ip1.split('.');
    const parts2 = ip2.split('.');
    
    if (parts1.length !== 4 || parts2.length !== 4) {
      return false;
    }
    
    // Check if first two parts match (Class B network)
    return parts1[0] === parts2[0] && parts1[1] === parts2[1];
  }
  
  /**
   * Check if two user agents are similar
   */
  private isSimilarUserAgent(ua1: string, ua2: string): boolean {
    // Get the browser and OS info from user agents
    const getBrowserInfo = (ua: string) => {
      // Very simple extraction of major browser and OS identifiers
      const browserIdentifiers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'MSIE', 'Opera'];
      const osIdentifiers = ['Windows', 'Mac', 'iPhone', 'iPad', 'Android', 'Linux'];
      
      let browser = '';
      let os = '';
      
      for (const id of browserIdentifiers) {
        if (ua.includes(id)) {
          browser = id;
          break;
        }
      }
      
      for (const id of osIdentifiers) {
        if (ua.includes(id)) {
          os = id;
          break;
        }
      }
      
      return { browser, os };
    };
    
    const info1 = getBrowserInfo(ua1);
    const info2 = getBrowserInfo(ua2);
    
    // Consider similar if browser and OS match
    return info1.browser === info2.browser && info1.os === info2.os;
  }
  
  /**
   * Gets the client IP address from a request
   */
  private getIpAddress(req: Request): string {
    // Check various headers for the IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded ? 
      (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]) : 
      req.socket.remoteAddress;
    
    return ip || '0.0.0.0';
  }
}

// Export the singleton instance
export const securityService = SecurityService.getInstance();