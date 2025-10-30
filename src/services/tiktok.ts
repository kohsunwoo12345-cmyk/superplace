// TikTok API Integration

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY || "";
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET || "";

export class TikTokService {
  private static baseUrl = "https://open.tiktokapis.com/v2";

  // Get user info
  static async getUserInfo(accessToken: string) {
    try {
      const response = await fetch(`${this.baseUrl}/user/info/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("틱톡 사용자 정보 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("TikTok user info error:", error);
      throw error;
    }
  }

  // Get user videos
  static async getUserVideos(accessToken: string, maxCount: number = 20) {
    try {
      const response = await fetch(
        `${this.baseUrl}/video/list/?fields=id,title,video_description,duration,cover_image_url,share_url,view_count,like_count,comment_count,share_count,create_time&max_count=${maxCount}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("틱톡 비디오 목록 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("TikTok videos error:", error);
      throw error;
    }
  }

  // Get video comments
  static async getVideoComments(videoId: string, accessToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/video/comment/list/?video_id=${videoId}&fields=id,text,create_time,like_count`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("틱톡 댓글 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("TikTok comments error:", error);
      throw error;
    }
  }

  // Get video analytics
  static async getVideoAnalytics(videoId: string, accessToken: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/video/query/?video_id=${videoId}&fields=id,like_count,comment_count,share_count,view_count`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("틱톡 비디오 분석 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("TikTok analytics error:", error);
      throw error;
    }
  }

  // OAuth: Get authorization URL
  static getAuthorizationUrl(redirectUri: string, state: string) {
    const scopes = "user.info.basic,video.list,video.publish";
    const params = new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      scope: scopes,
      response_type: "code",
      redirect_uri: redirectUri,
      state: state,
    });

    return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
  }

  // OAuth: Exchange code for access token
  static async getAccessToken(code: string, redirectUri: string) {
    try {
      const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: TIKTOK_CLIENT_KEY,
          client_secret: TIKTOK_CLIENT_SECRET,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error("틱톡 토큰 발급 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("TikTok token error:", error);
      throw error;
    }
  }

  // Refresh access token
  static async refreshAccessToken(refreshToken: string) {
    try {
      const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_key: TIKTOK_CLIENT_KEY,
          client_secret: TIKTOK_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error("틱톡 토큰 갱신 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("TikTok refresh token error:", error);
      throw error;
    }
  }

  // Sync user videos
  static async syncUserVideos(userId: string, tiktokId: string, accessToken: string) {
    try {
      const videos = await this.getUserVideos(accessToken);

      return {
        synced: videos.data?.videos?.length || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("TikTok sync error:", error);
      throw error;
    }
  }
}
