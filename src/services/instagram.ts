// Instagram Graph API Integration

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID || "";
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET || "";

export class InstagramService {
  private static baseUrl = "https://graph.instagram.com";

  // Get user profile
  static async getUserProfile(accessToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/me?fields=id,username,account_type,media_count&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error("인스타그램 프로필 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("Instagram profile error:", error);
      throw error;
    }
  }

  // Get user media
  static async getUserMedia(accessToken: string, limit: number = 25) {
    try {
      const fields = "id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,like_count,comments_count";
      const response = await fetch(
        `${this.baseUrl}/me/media?fields=${fields}&limit=${limit}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error("인스타그램 미디어 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("Instagram media error:", error);
      throw error;
    }
  }

  // Get media insights
  static async getMediaInsights(mediaId: string, accessToken: string) {
    try {
      const metrics = "engagement,impressions,reach,saved";
      const response = await fetch(
        `${this.baseUrl}/${mediaId}/insights?metric=${metrics}&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error("인스타그램 인사이트 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("Instagram insights error:", error);
      throw error;
    }
  }

  // Get comments on media
  static async getMediaComments(mediaId: string, accessToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/${mediaId}/comments?fields=id,text,timestamp,username&access_token=${accessToken}`
      );

      if (!response.ok) {
        throw new Error("인스타그램 댓글 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("Instagram comments error:", error);
      throw error;
    }
  }

  // Sync user media
  static async syncUserMedia(userId: string, instagramId: string, accessToken: string) {
    try {
      const media = await this.getUserMedia(accessToken);
      
      return {
        synced: media.data?.length || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Instagram sync error:", error);
      throw error;
    }
  }

  // Exchange short-lived token for long-lived token
  static async exchangeToken(shortLivedToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/access_token?grant_type=ig_exchange_token&client_secret=${INSTAGRAM_CLIENT_SECRET}&access_token=${shortLivedToken}`
      );

      if (!response.ok) {
        throw new Error("토큰 교환 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("Token exchange error:", error);
      throw error;
    }
  }

  // Refresh long-lived token
  static async refreshToken(longLivedToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/refresh_access_token?grant_type=ig_refresh_token&access_token=${longLivedToken}`
      );

      if (!response.ok) {
        throw new Error("토큰 갱신 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("Token refresh error:", error);
      throw error;
    }
  }
}
