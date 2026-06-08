import { apiClient } from "@/services/apiClient";

interface SendEmailParams {
  type: "new_registration" | "contact_form";
  data: {
    email: string;
    fullName: string;
    role: string;
    organization?: string;
  };
}

export const emailService = {
  async sendNotification(params: SendEmailParams) {
    try {
      await apiClient.request("/email/send", {
        method: "POST",
        body: JSON.stringify(params),
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to send email:", error);
      return { success: false, error: String(error) };
    }
  },

  async notifyAdminNewRegistration(
    email: string,
    fullName: string,
    role: string,
    organization?: string
  ) {
    return this.sendNotification({
      type: "new_registration",
      data: { email, fullName, role, organization },
    });
  },
};

export const tempEmailService = {
  generateTempEmail(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `temp_${timestamp}_${random}@assurance-sante-connect.com`;
  },

  isTempEmail(email: string): boolean {
    return email.includes("temp_") && email.includes("@assurance-sante-connect.com");
  },

  async storeTempEmailMapping(realEmail: string, tempEmail: string, userId: string) {
    try {
      await apiClient.request("/email/temp-mapping", {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          real_email: realEmail,
          temp_email: tempEmail,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to store temp email:", error);
      return { success: false, error };
    }
  },

  async getRealEmail(tempEmail: string) {
    try {
      const data = await apiClient.request<any>(
        `/email/real-email?tempEmail=${encodeURIComponent(tempEmail)}`
      );
      return data?.real_email ?? null;
    } catch (error) {
      console.error("Failed to get real email:", error);
      return null;
    }
  },

  async confirmRealEmail(userId: string, realEmail: string) {
    try {
      await apiClient.request("/email/confirm", {
        method: "PUT",
        body: JSON.stringify({ user_id: userId, real_email: realEmail }),
      });
      return { success: true };
    } catch (error) {
      console.error("Failed to confirm email:", error);
      return { success: false, error };
    }
  },
};
