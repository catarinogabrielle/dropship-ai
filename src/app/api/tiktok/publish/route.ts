import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { prisma, ensureSqliteTables } from '@/lib/prisma';
import { TikTokService } from '@/services/tiktok.service';
import {
  ensureCredentialsFromVault,
  ensureCreativeFromVault,
} from '@/lib/server-vault';

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await ensureSqliteTables();
    const {
      creativeId,
      publicVideoUrl,
      caption,
      privacyLevel,
      _vaultCredentials,
      _vaultCreative,
      _vaultProduct,
    } = await req.json();

    if (!creativeId) {
      return NextResponse.json({ error: 'creativeId obrigatorio.' }, { status: 400 });
    }

    await ensureCredentialsFromVault(_vaultCredentials);
    const creative = await ensureCreativeFromVault(creativeId, _vaultCreative, _vaultProduct);

    if (!creative) {
      return NextResponse.json({ error: 'Criativo nao encontrado no banco.' }, { status: 404 });
    }

    let localFilePath: string | undefined;
    if (creative.videoFilePath) {
      if (creative.videoFilePath.startsWith('data:video/mp4;base64,')) {
        const tmpDir = path.join(os.tmpdir(), 'generated', 'video');
        fs.mkdirSync(tmpDir, { recursive: true });
        localFilePath = path.join(tmpDir, `${creative.id}.mp4`);
        const b64 = creative.videoFilePath.replace('data:video/mp4;base64,', '');
        fs.writeFileSync(localFilePath, Buffer.from(b64, 'base64'));
      } else {
        localFilePath = path.join(
          process.cwd(),
          'public',
          creative.videoFilePath.replace(/^\//, '')
        );
      }
    }

    const tiktokService = new TikTokService();
    const postTitle =
      caption || `${creative.hookEn} ${creative.ctaEn} #tiktokmademebuyit #usa #viral`;

    const result = await tiktokService.publishDirectVideo({
      title: postTitle.slice(0, 150),
      videoUrl: publicVideoUrl || undefined,
      localFilePath,
      privacyLevel: privacyLevel || 'PUBLIC_TO_EVERYONE',
    });

    const publishId = result.publishId || `tiktok_pub_${Date.now()}`;

    const updated = await prisma.creative.update({
      where: { id: creative.id },
      data: {
        tiktokPublishId: publishId,
        status: 'PUBLISHED_TIKTOK',
      },
      include: { product: true },
    });

    await prisma.automationLog.create({
      data: {
        module: 'TIKTOK_PUBLISHER',
        action: 'VIDEO_PUBLISHED_US',
        targetId: creative.id,
        httpStatus: result.httpStatus,
        detailsJson: JSON.stringify({
          publishId,
          rawResponse: result.rawResponse,
        }),
      },
    });

    return NextResponse.json({
      creative: updated,
      publishId,
      tiktokResponse: result.rawResponse,
    });
  } catch (error: any) {
    const errDetails = error?.response?.data || { message: error.message };
    await prisma.automationLog.create({
      data: {
        module: 'TIKTOK_PUBLISHER',
        action: 'PUBLISH_ERROR',
        httpStatus: error?.response?.status || 400,
        detailsJson: JSON.stringify(errDetails),
      },
    });

    return NextResponse.json(
      {
        error:
          errDetails?.error?.message ||
          errDetails?.message ||
          error.message ||
          'Erro ao publicar no TikTok US',
        details: errDetails,
      },
      { status: 400 }
    );
  }
}
