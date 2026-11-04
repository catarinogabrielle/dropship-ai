import axios from 'axios';
import fs from 'fs';
import { prisma } from '@/lib/prisma';

export class TikTokService {
  private async getAccessToken(): Promise<string> {
    const cred = await prisma.apiCredential.findUnique({
      where: { provider: 'TIKTOK' },
    });
    const token = cred?.apiKey || process.env.TIKTOK_ACCESS_TOKEN;
    if (!token) {
      throw new Error('TIKTOK_ACCESS_TOKEN nao configurado. Conecte sua conta do TikTok na Aba 0.');
    }
    return token;
  }

  /**
   * Publica um video diretamente no TikTok US via Content Posting API (/v2/post/publish/video/init/)
   */
  async publishDirectVideo(params: {
    title: string;
    videoUrl?: string;
    localFilePath?: string;
    privacyLevel?: 'PUBLIC_TO_EVERYONE' | 'SELF_ONLY' | 'MUTUAL_FOLLOW_FRIENDS';
  }) {
    const accessToken = await this.getAccessToken();
    const endpoint = 'https://open.tiktokapis.com/v2/post/publish/video/init/';

    let sourceInfo: Record<string, string | number> = {};

    if (params.videoUrl && params.videoUrl.startsWith('http')) {
      sourceInfo = {
        source: 'PULL_FROM_URL',
        video_url: params.videoUrl,
      };
    } else if (params.localFilePath && fs.existsSync(params.localFilePath)) {
      const stats = fs.statSync(params.localFilePath);
      const videoSize = stats.size;
      sourceInfo = {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      };
    } else {
      throw new Error('Forneca uma URL publica valida ou um arquivo MP4 renderizado no servidor.');
    }

    const response = await axios.post(
      endpoint,
      {
        post_info: {
          title: params.title,
          privacy_level: params.privacyLevel || 'PUBLIC_TO_EVERYONE',
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
        },
        source_info: sourceInfo,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json; charset=UTF-8',
        },
      }
    );

    // Se for FILE_UPLOAD e a API do TikTok retornar upload_url, faz o upload binario real do arquivo MP4
    const uploadUrl = response.data?.data?.upload_url;
    if (uploadUrl && params.localFilePath && fs.existsSync(params.localFilePath)) {
      const videoBuffer = fs.readFileSync(params.localFilePath);
      await axios.put(uploadUrl, videoBuffer, {
        headers: {
          'Content-Type': 'video/mp4',
          'Content-Length': videoBuffer.length,
          'Content-Range': `bytes 0-${videoBuffer.length - 1}/${videoBuffer.length}`,
        },
      });
    }

    return {
      httpStatus: response.status,
      publishId: response.data?.data?.publish_id || null,
      rawResponse: response.data,
    };
  }
}
