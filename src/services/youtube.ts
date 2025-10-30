// YouTube Data API Integration

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || "";

export class YouTubeService {
  private static baseUrl = "https://www.googleapis.com/youtube/v3";

  // Get channel details
  static async getChannelDetails(channelId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/channels?part=snippet,statistics,contentDetails&id=${channelId}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("유튜브 채널 조회 실패");
      }

      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error("YouTube channel error:", error);
      throw error;
    }
  }

  // Get channel videos
  static async getChannelVideos(channelId: string, maxResults: number = 25) {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("유튜브 비디오 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("YouTube videos error:", error);
      throw error;
    }
  }

  // Get video details
  static async getVideoDetails(videoId: string) {
    try {
      const response = await fetch(
        `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("유튜브 비디오 상세 조회 실패");
      }

      const data = await response.json();
      return data.items?.[0] || null;
    } catch (error) {
      console.error("YouTube video details error:", error);
      throw error;
    }
  }

  // Get video comments
  static async getVideoComments(videoId: string, maxResults: number = 100) {
    try {
      const response = await fetch(
        `${this.baseUrl}/commentThreads?part=snippet&videoId=${videoId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("유튜브 댓글 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("YouTube comments error:", error);
      throw error;
    }
  }

  // Get channel analytics (requires OAuth)
  static async getChannelAnalytics(
    channelId: string,
    accessToken: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const metrics = "views,estimatedMinutesWatched,averageViewDuration,subscribersGained";
      const dimensions = "day";
      
      const response = await fetch(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${channelId}&startDate=${startDate}&endDate=${endDate}&metrics=${metrics}&dimensions=${dimensions}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("유튜브 분석 조회 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("YouTube analytics error:", error);
      throw error;
    }
  }

  // Search videos
  static async searchVideos(query: string, maxResults: number = 10) {
    try {
      const response = await fetch(
        `${this.baseUrl}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("유튜브 검색 실패");
      }

      return await response.json();
    } catch (error) {
      console.error("YouTube search error:", error);
      throw error;
    }
  }

  // Sync channel data
  static async syncChannelData(userId: string, channelId: string) {
    try {
      const channel = await this.getChannelDetails(channelId);
      const videos = await this.getChannelVideos(channelId);

      return {
        channel,
        videos: videos.items || [],
        synced: videos.items?.length || 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("YouTube sync error:", error);
      throw error;
    }
  }

  // Format statistics
  static formatStatistics(stats: any) {
    return {
      viewCount: parseInt(stats.viewCount || "0"),
      subscriberCount: parseInt(stats.subscriberCount || "0"),
      videoCount: parseInt(stats.videoCount || "0"),
      likeCount: parseInt(stats.likeCount || "0"),
      commentCount: parseInt(stats.commentCount || "0"),
    };
  }
}
