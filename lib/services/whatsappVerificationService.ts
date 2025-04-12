import { ObjectId } from "mongodb";
import clientPromise from "@/lib/utils/db";

type VerificationRecord = {
  phoneNumber: string;
  code: string;
  expiry: Date;
  userId?: string;
  verified?: boolean;
};

export class WhatsappVerificationService {
  private async getCollection() {
    const client = await clientPromise;
    const db = client.db("auth");
    return db.collection("whatsappVerifications");
  }


  async getExistingCodeIfValid(phoneNumber: string): Promise<string | null> {
    const verificationCollection = await this.getCollection();
  
    const verification = await verificationCollection.findOne({
      phoneNumber,
      expiry: { $gt: new Date() },
      verified: false
    });
  
    return verification?.code || null;
  }
  
  /**
   * Generate and store a new verification code for a phone number
   */
  async isPhoneDisponible(phoneNumber: string): Promise<boolean> {
    const client = await clientPromise;
    const db = client.db("auth");
    const userCollection = db.collection("users");
    const user = await userCollection.findOne({ 
      whatsappPhone: phoneNumber,
      whatsappVerified: true
    })

    if (user) {
      return false
    } else {
      return true
    }
  }

  async createVerificationCode(phoneNumber: string, userId?: string): Promise<string> {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    const verificationCollection = await this.getCollection();
    
    // Delete any existing codes for this phone number
    await verificationCollection.deleteMany({ phoneNumber });
    
    // Create a new verification record with 10-minute expiry
    await verificationCollection.insertOne({
      phoneNumber,
      code,
      expiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      userId: userId || null,
      verified: false
    });
    
    return code;
  }

  /**
   * Verify a code for a phone number
   */
  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const verificationCollection = await this.getCollection();
    
    // Find the verification record
    const verification = await verificationCollection.findOne({ 
      phoneNumber,
      code
    });
    
    if (!verification) {
      return false;
    }
    
    // Check if expired
    if (new Date() > verification.expiry) {
      // Remove expired code
      await verificationCollection.deleteOne({ _id: verification._id });
      return false;
    }
    
    // Mark as verified
    await verificationCollection.updateOne(
      { _id: verification._id },
      { $set: { verified: true, verifiedAt: new Date() } }
    );
    
    return true;
  }

  /**
   * Check if a phone number is verified for a user
   */
  async isPhoneVerified(userId: string, phoneNumber: string): Promise<boolean> {
    const verificationCollection = await this.getCollection();
    
    const verification = await verificationCollection.findOne({
      userId: new ObjectId(userId).toString(),
      phoneNumber,
      verified: true
    });
    
    return !!verification;
  }

  /**
   * Associate verified phone with user in the users collection
   */
  async associatePhoneWithUser(userId: string, phoneNumber: string): Promise<boolean> {
    try {
      const client = await clientPromise;
      const db = client.db("auth");
      const userCollection = db.collection("users");
      

      const response = await userCollection.updateOne(
        { _id: new ObjectId(userId) },
        { $set: { whatsappPhone: phoneNumber, whatsappVerified: true } }
      );
      

      return true;
    } catch (error) {
      console.error("Error associating phone with user:", error);
      return false;
    }
  }
}

// Export a singleton instance
export const whatsappVerificationService = new WhatsappVerificationService();